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

header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json");

try {
    $locationFilter = ($_SESSION['user']['role'] ?? '') === 'ba'
        ? 'WHERE i.location_id = :location_id'
        : '';
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
        {$locationFilter}
        ORDER BY i.id DESC
    ";
    $stmt = $conn->prepare($query);
    $params = $locationFilter !== ''
        ? [':location_id' => intval($_SESSION['user']['location_id'] ?? 0)]
        : [];
    $stmt->execute($params);
    $stock = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array("status" => "success", "stock" => $stock));
} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
}
?>