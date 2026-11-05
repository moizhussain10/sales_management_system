<?php
// CORS Headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json; charset=UTF-8");

// Handle browser preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

requireAuth(['admin']);

// Raw input read karein
$data = json_decode(file_get_contents("php://input"));

$id = null;
if (!empty($data->id)) {
    $id = $data->id;
} elseif (!empty($data->ba_id)) {
    $id = $data->ba_id;
}

if ($id) {
    try {
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id AND role = 'ba'");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "BA deleted successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "BA user not found in database."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . apiExceptionMessage($e)]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid BA ID provided."]);
}
?>