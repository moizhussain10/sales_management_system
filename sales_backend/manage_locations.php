<?php
// CORS Headers - Must be at the absolute top
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

include 'db.php';

requireAuth(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM locations ORDER BY name ASC");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "locations" => $locations));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($data->action) ? $data->action : 'add';

    if ($action === 'add') {
        if (!empty($data->name)) {
            try {
                $stmt = $conn->prepare("INSERT INTO locations (name) VALUES (:name)");
                $stmt->bindParam(":name", $data->name);
                $stmt->execute();
                echo json_encode(array("status" => "success", "message" => "Location added successfully!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Failed to add location."));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Location name is required."));
        }
    } elseif ($action === 'delete') {
        if (!empty($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM locations WHERE id = :id");
                $stmt->bindParam(":id", $data->id);
                $stmt->execute();
                echo json_encode(array("status" => "success", "message" => "Location deleted successfully!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Cannot delete location with active BAs or inventory."));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Location ID is required."));
        }
    } elseif ($action === 'update_ba_location') {
        if (!empty($data->ba_id) && !empty($data->location_id)) {
            try {
                $stmt = $conn->prepare("UPDATE users SET location_id = :location_id WHERE id = :ba_id");
                $stmt->bindParam(":location_id", $data->location_id);
                $stmt->bindParam(":ba_id", $data->ba_id);
                $stmt->execute();

                echo json_encode(array("status" => "success", "message" => "Location successfully updated!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Failed to update BA location: " . apiExceptionMessage($e)));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "BA ID and Location ID both are required."));
        }
    }
}
?>