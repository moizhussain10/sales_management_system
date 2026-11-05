<?php
include 'db.php';

requireAuth(['admin']);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $id = $data->id;

    try {
        $stmt = $conn->prepare("DELETE FROM inventory WHERE id = :id");
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            echo json_encode(array("status" => "success", "message" => "Stock record deleted successfully!"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Failed to delete stock."));
        }
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Database Error: " . apiExceptionMessage($e)));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Stock ID not provided."));
}
?>