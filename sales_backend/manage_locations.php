<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch all locations
    try {
        $stmt = $conn->query("SELECT * FROM locations ORDER BY name ASC");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "locations" => $locations));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => $e->getMessage()));
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
    }
}
?>