<?php
include 'db.php';

requireAuth(['admin']);

if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}

header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->product_id) && !empty($data->location_id) && isset($data->quantity)) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO inventory (product_id, location_id, quantity) 
            VALUES (:product_id, :location_id, :insert_quantity)
            ON DUPLICATE KEY UPDATE quantity = :update_quantity
        ");

        $stmt->execute([
            ':product_id' => $data->product_id,
            ':location_id' => $data->location_id,
            ':insert_quantity' => $data->quantity,
            ':update_quantity' => $data->quantity
        ]);

        echo json_encode(array("status" => "success", "message" => "Stock updated successfully!"));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Database error: " . apiExceptionMessage($e)));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Incomplete parameters provided."));
}
?>