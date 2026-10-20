<?php
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle browser preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

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
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid BA ID provided."]);
}
?>