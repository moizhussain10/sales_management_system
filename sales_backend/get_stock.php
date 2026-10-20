<?php
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

try {
    $query = "
        SELECT 
            i.id,
            i.product_id,
            i.location_id,
            i.quantity,
            p.name AS product_name,
            p.sku,
            l.name AS location_name
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN locations l ON i.location_id = l.id
        ORDER BY i.id DESC
    ";
    $stmt = $conn->query($query);
    $stock = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array("status" => "success", "stock" => $stock));
} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => $e->getMessage()));
}
?>