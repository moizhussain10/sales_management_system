<?php
include 'db.php';
$data = json_decode(file_get_contents("php://input"));

if (!is_object($data)) {
    $data = (object) [];
}

if(!empty($data->username) && !empty($data->password)) {
    $username = trim((string) $data->username);
    $password = (string) $data->password;

    if (strlen($username) > 120 || strlen($password) > 1024) {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Invalid username or password."));
        exit;
    }

    $usernameHash = hash('sha256', strtolower($username));
    $ipHash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');

    $usernameAttempts = $conn->prepare(
        "SELECT COUNT(*) FROM login_attempts
         WHERE username_hash = :username_hash AND attempted_at >= NOW() - INTERVAL 15 MINUTE"
    );
    $usernameAttempts->execute([':username_hash' => $usernameHash]);
    $ipAttempts = $conn->prepare(
        "SELECT COUNT(*) FROM login_attempts
         WHERE ip_hash = :ip_hash AND attempted_at >= NOW() - INTERVAL 15 MINUTE"
    );
    $ipAttempts->execute([':ip_hash' => $ipHash]);

    if ((int) $usernameAttempts->fetchColumn() >= 5 || (int) $ipAttempts->fetchColumn() >= 20) {
        http_response_code(429);
        header('Retry-After: 900');
        echo json_encode(array("status" => "error", "message" => "Too many login attempts. Please try again later."));
        exit;
    }

    $query = "SELECT id, name, username, password, role, location_id FROM users WHERE username = :username LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $storedPassword = (string) ($row['password'] ?? '');
        $passwordInfo = password_get_info($storedPassword);
        $passwordIsHashed = $passwordInfo['algo'] !== null;
        $isValidPassword = $passwordIsHashed
            ? password_verify($password, $storedPassword)
            : (!isProductionEnvironment() && hash_equals($storedPassword, $password));

        if ($isValidPassword) {
            if (!$passwordIsHashed) {
                $newHash = password_hash($password, PASSWORD_BCRYPT);
                $updateStmt = $conn->prepare("UPDATE users SET password = :hash WHERE id = :id");
                $updateStmt->execute([':hash' => $newHash, ':id' => $row['id']]);
            }

            if ($passwordIsHashed && password_needs_rehash($storedPassword, PASSWORD_DEFAULT)) {
                $updateStmt = $conn->prepare("UPDATE users SET password = :hash WHERE id = :id");
                $updateStmt->execute([
                    ':hash' => password_hash($password, PASSWORD_DEFAULT),
                    ':id' => $row['id']
                ]);
            }

            session_regenerate_id(true);
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            $_SESSION['user'] = sanitizeUserSession([
                'id' => $row['id'],
                'name' => $row['name'],
                'username' => $row['username'],
                'role' => $row['role'],
                'location_id' => $row['location_id']
            ]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Login successful",
                "user" => array(
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "role" => $row['role'],
                    "location_id" => $row['location_id'],
                    "csrf_token" => $_SESSION['csrf_token']
                )
            ));
        } else {
            $attempt = $conn->prepare(
                "INSERT INTO login_attempts (username_hash, ip_hash) VALUES (:username_hash, :ip_hash)"
            );
            $attempt->execute([':username_hash' => $usernameHash, ':ip_hash' => $ipHash]);
            http_response_code(401);
            echo json_encode(array("status" => "error", "message" => "Invalid username or password."));
        }
    } else {
        password_verify($password, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        $attempt = $conn->prepare(
            "INSERT INTO login_attempts (username_hash, ip_hash) VALUES (:username_hash, :ip_hash)"
        );
        $attempt->execute([':username_hash' => $usernameHash, ':ip_hash' => $ipHash]);
        http_response_code(401);
        echo json_encode(array("status" => "error", "message" => "Invalid username or password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("status" => "error", "message" => "Incomplete data provided!"));
}
?>