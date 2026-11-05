<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
header("Content-Type: application/json");
include 'db.php';

requireAuth($method === 'GET' ? ['admin', 'ba'] : ['admin']);

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM deals ORDER BY id DESC");
        $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "deals" => $deals));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($data->action) ? $data->action : '';

    if ($action === 'add') {
        if (!empty($data->deal_title) && !empty($data->discount_type)) {
            try {
                $discountType = trim($data->discount_type);
                $isQuantityDeal = in_array($discountType, ['BOGO', 'Bundle'], true);
                $productId = !empty($data->product_id) ? intval($data->product_id) : null;
                $requiredQuantity = $isQuantityDeal ? max(1, intval($data->required_quantity ?? 1)) : 1;
                $freeQuantity = $isQuantityDeal ? max(1, intval($data->free_quantity ?? $data->free_product_qty ?? 1)) : 0;
                $freeProductId = !empty($data->free_product_id)
                    ? intval($data->free_product_id)
                    : ($discountType === 'BOGO' ? $productId : null);

                if ($productId === null) {
                    echo json_encode(array("status" => "error", "message" => "A target product is required."));
                    exit;
                }

                if ($discountType === 'Bundle' && $freeProductId === null) {
                    echo json_encode(array("status" => "error", "message" => "A free gift product is required for a bundle."));
                    exit;
                }

                $stmt = $conn->prepare(
                    "INSERT INTO deals
                        (deal_title, discount_type, discount_value, product_id, required_quantity, free_quantity, free_product_qty, free_product_id)
                     VALUES
                        (:title, :dtype, :dval, :product_id, :required_quantity, :free_quantity, :free_product_qty, :free_product_id)"
                );
                $stmt->execute([
                    ':title' => $data->deal_title,
                    ':dtype' => $discountType,
                    ':dval' => isset($data->discount_value) ? $data->discount_value : 0,
                    ':product_id' => $productId,
                    ':required_quantity' => $requiredQuantity,
                    ':free_quantity' => $freeQuantity,
                    ':free_product_qty' => $freeQuantity,
                    ':free_product_id' => $freeProductId
                ]);
                echo json_encode(array("status" => "success", "message" => "Deal successfully create ho gayi!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Deal title aur type lazmi hain."));
        }
    } elseif ($action === 'delete') {
        if (!empty($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM deals WHERE id = :id");
                $stmt->execute([':id' => $data->id]);
                echo json_encode(array("status" => "success", "message" => "Deal delete ho gayi!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
            }
        }
    }
}
?>