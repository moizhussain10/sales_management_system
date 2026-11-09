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
        $stmt = $conn->query(
            "SELECT l.id, l.name,
                COUNT(DISTINCT u.id) AS assigned_ba_count,
                COUNT(DISTINCT i.id) AS inventory_item_count,
                COUNT(DISTINCT s.id) AS sales_count
             FROM locations l
             LEFT JOIN users u ON u.location_id = l.id AND LOWER(u.role) = 'ba'
             LEFT JOIN inventory i ON i.location_id = l.id
             LEFT JOIN sales s ON s.location_id = l.id
             GROUP BY l.id, l.name
             ORDER BY l.name ASC"
        );
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "locations" => $locations));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($data->action) ? $data->action : 'add';

    if ($action === 'add') {
        $name = trim((string) ($data->name ?? ''));
        $baId = !empty($data->ba_id) ? filter_var($data->ba_id, FILTER_VALIDATE_INT) : null;
        if ($name === '' || mb_strlen($name) > 100) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "Enter a location name up to 100 characters."));
            exit;
        }
        if (!empty($data->ba_id) && (!$baId || $baId <= 0)) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "Select a valid BA."));
            exit;
        }

        try {
            $conn->beginTransaction();
            if ($baId !== null) {
                $baStmt = $conn->prepare("SELECT id FROM users WHERE id = :id AND LOWER(role) = 'ba' FOR UPDATE");
                $baStmt->execute([':id' => $baId]);
                if (!$baStmt->fetch(PDO::FETCH_ASSOC)) {
                    $conn->rollBack();
                    http_response_code(404);
                    echo json_encode(array("status" => "error", "message" => "Selected BA was not found."));
                    exit;
                }
            }

            $stmt = $conn->prepare("INSERT INTO locations (name) VALUES (:name)");
            $stmt->execute([':name' => $name]);
            $locationId = intval($conn->lastInsertId());

            if ($baId !== null) {
                $assignStmt = $conn->prepare("UPDATE users SET location_id = :location_id WHERE id = :ba_id");
                $assignStmt->execute([':location_id' => $locationId, ':ba_id' => $baId]);
            }

            $conn->commit();
            echo json_encode(array(
                "status" => "success",
                "message" => $baId === null ? "Location added successfully." : "Location added and BA assigned successfully.",
                "location_id" => $locationId
            ));
        } catch (PDOException $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            http_response_code(500);
            echo json_encode(array("status" => "error", "message" => "Failed to add location: " . apiExceptionMessage($e)));
        }
    } elseif ($action === 'delete') {
        $locationId = filter_var($data->id ?? null, FILTER_VALIDATE_INT);
        if (!$locationId || $locationId <= 0) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "Location ID is required."));
            exit;
        }

        try {
            $conn->beginTransaction();
            $locationStmt = $conn->prepare("SELECT id FROM locations WHERE id = :id FOR UPDATE");
            $locationStmt->execute([':id' => $locationId]);
            if (!$locationStmt->fetch(PDO::FETCH_ASSOC)) {
                $conn->rollBack();
                http_response_code(404);
                echo json_encode(array("status" => "error", "message" => "Location not found."));
                exit;
            }

            $usageStmt = $conn->prepare(
                "SELECT
                    (SELECT COUNT(*) FROM users WHERE location_id = :ba_location_id AND LOWER(role) = 'ba') AS assigned_ba_count,
                    (SELECT COUNT(*) FROM inventory WHERE location_id = :inventory_location_id) AS inventory_item_count,
                    (SELECT COUNT(*) FROM sales WHERE location_id = :sales_location_id) AS sales_count"
            );
            $usageStmt->execute([
                ':ba_location_id' => $locationId,
                ':inventory_location_id' => $locationId,
                ':sales_location_id' => $locationId
            ]);
            $usage = $usageStmt->fetch(PDO::FETCH_ASSOC);
            if (intval($usage['assigned_ba_count']) > 0 || intval($usage['inventory_item_count']) > 0 || intval($usage['sales_count']) > 0) {
                $conn->rollBack();
                http_response_code(409);
                echo json_encode(array(
                    "status" => "error",
                    "message" => "This location is still in use. Reassign BAs and remove stock; locations with sales history cannot be deleted.",
                    "usage" => $usage
                ));
                exit;
            }

            $deleteStmt = $conn->prepare("DELETE FROM locations WHERE id = :id");
            $deleteStmt->execute([':id' => $locationId]);
            $conn->commit();
            echo json_encode(array("status" => "success", "message" => "Location deleted successfully."));
        } catch (PDOException $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            http_response_code(500);
            echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
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