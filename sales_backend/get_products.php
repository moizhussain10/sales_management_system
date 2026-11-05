<?php
include 'db.php';

requireAuth(['admin', 'ba']);
$stmt = $conn->query("SELECT id, name, price FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (($_SESSION['user']['role'] ?? '') === 'ba') {
    $locStmt = $conn->prepare("SELECT id, name FROM locations WHERE id = :location_id");
    $locStmt->execute([':location_id' => intval($_SESSION['user']['location_id'] ?? 0)]);
} else {
    $locStmt = $conn->query("SELECT id, name FROM locations");
}
$locations = $locStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
    "status" => "success",
    "products" => $products,
    "locations" => $locations
));
?>