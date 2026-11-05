<?php
// CORS Headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
header("Content-Type: application/json");

// Handle browser preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

requireAuth(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

// 1. Fetch Active BAs list (GET)
if ($method === 'GET') {
    try {
        $stmt = $conn->query("
            SELECT u.id, u.name, u.username, l.name AS location_name 
            FROM users u 
            LEFT JOIN locations l ON u.location_id = l.id 
            WHERE LOWER(u.role) = 'ba'
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "users" => $users));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
    exit;
}

// 2. POST requests (Create BA or Delete BA)
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // Check if delete action is requested (Supports both action flag & direct delete ID)
    if ((isset($data->action) && $data->action === 'delete') || !empty($data->id) || !empty($data->ba_id)) {
        $targetId = !empty($data->id) ? $data->id : (!empty($data->ba_id) ? $data->ba_id : null);

        if (!empty($targetId)) {
            try {
                $stmt = $conn->prepare("DELETE FROM users WHERE id = :id AND role = 'ba'");
                $stmt->execute([':id' => $targetId]);
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(array("status" => "success", "message" => "BA deleted successfully!"));
                } else {
                    echo json_encode(array("status" => "error", "message" => "BA not found or already deleted."));
                }
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Database error: " . apiExceptionMessage($e)));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Invalid BA ID provided."));
        }
        exit;
    }

    // Normal Create BA logic
    if (!empty($data->name) && !empty($data->username) && !empty($data->password) && !empty($data->location_id)) {
        try {
            $stmt = $conn->prepare("INSERT INTO users (name, username, password, role, location_id) VALUES (:name, :username, :password, 'ba', :location_id)");
            $stmt->execute([
                ':name' => $data->name, 
                ':username' => $data->username, 
                ':password' => password_hash((string) $data->password, PASSWORD_DEFAULT),
                ':location_id' => $data->location_id
            ]);
            echo json_encode(array("status" => "success", "message" => "BA account created successfully!"));
        } catch (PDOException $e) {
            echo json_encode(array("status" => "error", "message" => "Database error: " . apiExceptionMessage($e)));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Incomplete parameters provided."));
    }
    exit;
}
?>