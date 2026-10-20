<?php
include 'db.php';
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->username) && !empty($data->password)) {
    $query = "SELECT id, name, username, password, role, location_id FROM users WHERE username = :username";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($data->password === $row['password']) {
            echo json_encode(array(
                "status" => "success",
                "message" => "Login successful",
                "user" => array(
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "role" => $row['role'],
                    "location_id" => $row['location_id']
                )
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Invalid password!"));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "User not found!"));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Incomplete data provided!"));
}
?>