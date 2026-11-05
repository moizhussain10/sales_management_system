<?php
include 'db.php';

requireAuth(['admin', 'ba']);

if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), false);
if (!is_object($data)) {
    $data = (object) [];
}

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("submit_sale.php: JSON decode error - " . json_last_error_msg());
}

$product_id = isset($data->product_id) ? intval($data->product_id) : (isset($data->deal_product_id) ? intval($data->deal_product_id) : 0);
$ba_id = isset($data->ba_id) ? intval($data->ba_id) : 0;
$location_id = isset($data->location_id) ? intval($data->location_id) : 0;
$quantity = isset($data->quantity) ? intval($data->quantity) : (isset($data->required_quantity) ? intval($data->required_quantity) : 0);
$free_quantity = isset($data->free_quantity) ? intval($data->free_quantity) : (isset($data->free_product_qty) ? intval($data->free_product_qty) : 0);
$free_product_id = (isset($data->free_product_id) && !empty($data->free_product_id)) ? intval($data->free_product_id) : 0;

$sessionRole = $_SESSION['user']['role'] ?? '';
if ($sessionRole === 'ba') {
    $ba_id = intval($_SESSION['user']['id']);
    $sessionLocationId = intval($_SESSION['user']['location_id'] ?? 0);
    if ($sessionLocationId <= 0 || ($location_id > 0 && $location_id !== $sessionLocationId)) {
        http_response_code(403);
        echo json_encode(array("status" => "error", "message" => "Sales may only be recorded for your assigned location."));
        exit;
    }
    $location_id = $sessionLocationId;
}

if ($product_id <= 0 && isset($data->product_id) && $data->product_id === null && !empty($data->deal_title)) {
    $product_id = 0;
}

if ($free_quantity > 0 && $free_product_id <= 0 && $product_id > 0) {
    $free_product_id = $product_id;
}

$data->product_id = $product_id;
$data->ba_id = $ba_id;
$data->location_id = $location_id;
$data->quantity = $quantity;
$data->free_quantity = $free_quantity;
$data->free_product_id = $free_product_id;

$missingFields = [];
if (empty($data->product_id)) { $missingFields[] = 'product_id'; }
if (empty($data->ba_id)) { $missingFields[] = 'ba_id'; }
if (empty($data->location_id)) { $missingFields[] = 'location_id'; }
if (!isset($data->quantity) || intval($data->quantity) <= 0) { $missingFields[] = 'quantity'; }

if (empty($missingFields)) {
    try {
        $conn->beginTransaction();

        $paid_qty = intval($data->quantity);
        $deal_type = 'Normal';
        $discount_type = 'None';
        $discount_value = 0;
        $free_qty = 0;
        $free_product_id = intval($data->product_id);
        $deal_id = isset($data->deal_id) ? intval($data->deal_id) : 0;

        if ($deal_id > 0) {
            $stmtDeal = $conn->prepare("SELECT * FROM deals WHERE id = :id FOR UPDATE");
            $stmtDeal->execute([':id' => $deal_id]);
            $deal = $stmtDeal->fetch(PDO::FETCH_ASSOC);

            if (!$deal) {
                throw new Exception("The selected deal is no longer available.");
            }

            $dealProductId = intval($deal['product_id'] ?? 0);
            if ($dealProductId > 0 && $dealProductId !== intval($data->product_id)) {
                throw new Exception("The selected deal does not apply to this product.");
            }

            $deal_type = trim((string) ($deal['deal_title'] ?? '')) ?: 'Promotion';
            $discount_type = trim((string) ($deal['discount_type'] ?? 'None')) ?: 'None';
            $discount_value = floatval($deal['discount_value'] ?? 0);
            $free_product_id = intval($deal['free_product_id'] ?? 0) ?: intval($data->product_id);

            if (in_array($discount_type, ['BOGO', 'Bundle'], true)) {
                $requiredQuantity = max(1, intval($deal['required_quantity'] ?? 1));
                $freePerOffer = max(0, intval($deal['free_quantity'] ?? $deal['free_product_qty'] ?? 0));
                $free_qty = intdiv($paid_qty, $requiredQuantity) * $freePerOffer;

                if ($discount_type === 'Bundle' && $free_qty > 0 && empty($deal['free_product_id'])) {
                    throw new Exception("The selected bundle is missing its free gift product.");
                }
            }
        }

        // Total units to deduct for main product
        $main_deduct_qty = ($free_product_id == intval($data->product_id)) ? ($paid_qty + $free_qty) : $paid_qty;

        // 1. Check & Deduct Inventory for Main Product
        $stmtStock = $conn->prepare("SELECT quantity FROM inventory WHERE product_id = :p_id AND location_id = :l_id FOR UPDATE");
        $stmtStock->execute([':p_id' => $data->product_id, ':l_id' => $data->location_id]);
        $stock = $stmtStock->fetch(PDO::FETCH_ASSOC);

        if (!$stock || intval($stock['quantity']) < $main_deduct_qty) {
            $conn->rollBack();
            echo json_encode(array("status" => "error", "message" => "Insufficient stock available for main product!"));
            exit;
        }

        $stmtDeductMain = $conn->prepare("UPDATE inventory SET quantity = quantity - :deduct_qty WHERE product_id = :p_id AND location_id = :l_id");
        $stmtDeductMain->execute([
            ':deduct_qty' => $main_deduct_qty,
            ':p_id' => $data->product_id,
            ':l_id' => $data->location_id
        ]);

        // 2. If Free Product is a different item (Bundle offer)
        if ($free_product_id != intval($data->product_id) && $free_qty > 0) {
            $stmtFreeStock = $conn->prepare("SELECT quantity FROM inventory WHERE product_id = :p_id AND location_id = :l_id FOR UPDATE");
            $stmtFreeStock->execute([':p_id' => $free_product_id, ':l_id' => $data->location_id]);
            $freeStock = $stmtFreeStock->fetch(PDO::FETCH_ASSOC);

            if (!$freeStock || intval($freeStock['quantity']) < $free_qty) {
                $conn->rollBack();
                echo json_encode(array("status" => "error", "message" => "Insufficient stock for free gift product!"));
                exit;
            }

            $stmtDeductFree = $conn->prepare("UPDATE inventory SET quantity = quantity - :free_qty WHERE product_id = :p_id AND location_id = :l_id");
            $stmtDeductFree->execute([
                ':free_qty' => $free_qty,
                ':p_id' => $free_product_id,
                ':l_id' => $data->location_id
            ]);
        }

        // 3. Fetch product price to calculate total amount
        $stmtPrice = $conn->prepare("SELECT price FROM products WHERE id = :p_id");
        $stmtPrice->execute([':p_id' => $data->product_id]);
        $product = $stmtPrice->fetch(PDO::FETCH_ASSOC);
        
        $unit_price = floatval($product['price']);
        $subtotal = $unit_price * $paid_qty;
        $total_amount = $subtotal;

        if ($discount_type === 'Percentage' && $discount_value > 0) {
            $total_amount = max(0, $subtotal - (($subtotal * $discount_value) / 100));
        } elseif ($discount_type === 'Fixed' && $discount_value > 0) {
            $total_amount = max(0, $subtotal - $discount_value);
        }

        // 4. Insert Sale Record with deal_type and free_quantity
        $stmtSale = $conn->prepare("INSERT INTO sales (product_id, ba_id, location_id, quantity, free_quantity, deal_type, discount_type, discount_value, total_amount, created_at) VALUES (:p_id, :ba_id, :loc_id, :qty, :free_qty, :d_type, :disc_type, :disc_val, :tot, NOW())");
        $stmtSale->execute([
            ':p_id' => $data->product_id,
            ':ba_id' => $data->ba_id,
            ':loc_id' => $data->location_id,
            ':qty' => $paid_qty,
            ':free_qty' => $free_qty,
            ':d_type' => $deal_type,
            ':disc_type' => $discount_type,
            ':disc_val' => $discount_value,
            ':tot' => $total_amount
        ]);

        $conn->commit();
        echo json_encode(array("status" => "success", "message" => "Sale recorded successfully with deal and inventory updated!"));

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
} else {
    $looksLikeDealPayload = !empty($data->deal_title) || !empty($data->discount_type) || isset($data->required_quantity) || isset($data->free_product_qty);

    if ($looksLikeDealPayload) {
        echo json_encode(array(
            "status" => "error",
            "message" => "This looks like a deal payload, not a sale payload. Please send product_id, ba_id, location_id, and quantity in the request."
        ));
    } else {
        echo json_encode(array("status" => "error", "message" => "Incomplete sales parameters."));
    }
}
?>