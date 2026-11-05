<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$_SERVER['REQUEST_METHOD'] = 'CLI';
include 'db.php';

try {
    $conn->beginTransaction();
    $users = $conn->query("SELECT id, password FROM users FOR UPDATE")->fetchAll(PDO::FETCH_ASSOC);
    $update = $conn->prepare("UPDATE users SET password = :password WHERE id = :id");
    $hashedCount = 0;
    $emptyCount = 0;

    foreach ($users as $user) {
        $password = (string) ($user['password'] ?? '');
        if ($password === '') {
            $emptyCount++;
            continue;
        }

        if (password_get_info($password)['algo'] !== null) {
            continue;
        }

        $update->execute([
            ':password' => password_hash($password, PASSWORD_DEFAULT),
            ':id' => $user['id']
        ]);
        $hashedCount++;
    }

    $conn->commit();
    echo "Hashed legacy passwords: {$hashedCount}" . PHP_EOL;
    echo "Empty passwords requiring manual reset: {$emptyCount}" . PHP_EOL;
} catch (Throwable $exception) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    fwrite(STDERR, "Password migration failed. No changes were committed." . PHP_EOL);
    error_log($exception->getMessage());
    exit(1);
}