<?php
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->product_id) && !empty($data->ba_id) && !empty($data->location_id) && !empty($data->quantity)) {
    try {
        $conn->beginTransaction();

        // 1. Check current inventory stock
        $stmtStock = $conn->prepare("SELECT quantity FROM inventory WHERE product_id = :p_id AND location_id = :l_id");
        $stmtStock->execute([
            ':p_id' => $data->product_id,
            ':l_id' => $data->location_id
        ]);
        $stock = $stmtStock->fetch(PDO::FETCH_ASSOC);

        if (!$stock || $stock['quantity'] < $data->quantity) {
            $conn->rollBack();
            echo json_encode(array("status" => "error", "message" => "Insufficient stock available at this location!"));
            exit;
        }

        // 2. Fetch product price to calculate total
        $stmtPrice = $conn->prepare("SELECT price FROM products WHERE id = :p_id");
        $stmtPrice->execute([':p_id' => $data->product_id]);
        $product = $stmtPrice->fetch(PDO::FETCH_ASSOC);
        $total_amount = $product['price'] * $data->quantity;

        // 3. Insert sale record (MySQL Trigger 'reduce_inventory_after_sale' automatically deducts stock)
        $stmtSale = $conn->prepare("INSERT INTO sales (product_id, ba_id, location_id, quantity, total_amount, created_at) VALUES (:p_id, :ba_id, :loc_id, :qty, :tot, NOW())");
        $stmtSale->execute([
            ':p_id' => $data->product_id,
            ':ba_id' => $data->ba_id,
            ':loc_id' => $data->location_id,
            ':qty' => $data->quantity,
            ':tot' => $total_amount
        ]);

        $conn->commit();
        echo json_encode(array("status" => "success", "message" => "Sale recorded and inventory updated successfully!"));

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(array("status" => "error", "message" => $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Incomplete sales parameters."));
}
?>