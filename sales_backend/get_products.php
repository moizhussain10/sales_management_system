<?php
include 'db.php';
$stmt = $conn->query("SELECT id, name, price FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

$locStmt = $conn->query("SELECT id, name FROM locations");
$locations = $locStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
    "status" => "success",
    "products" => $products,
    "locations" => $locations
));
?>