<?php
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->product_id) && !empty($data->location_id) && isset($data->quantity)) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO inventory (product_id, location_id, quantity) 
            VALUES (:product_id, :location_id, :quantity)
            ON DUPLICATE KEY UPDATE quantity = :quantity
        ");

        $stmt->execute([
            ':product_id' => $data->product_id,
            ':location_id' => $data->location_id,
            ':quantity' => $data->quantity
        ]);

        echo json_encode(array("status" => "success", "message" => "Stock updated successfully!"));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Database error: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Incomplete parameters provided."));
}
?>