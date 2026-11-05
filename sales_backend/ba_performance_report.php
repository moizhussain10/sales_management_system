<?php
include 'db.php';

requireAuth(['admin', 'ba']);

if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173')));
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }
}

header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json");

try {
    $baFilter = ($_SESSION['user']['role'] ?? '') === 'ba' ? ' AND u.id = :ba_id' : '';
    $query = "
        SELECT 
            u.id AS ba_id,
            u.username AS ba_username,
            COALESCE(u.name, u.username) AS ba_name,
            COALESCE(l.name, 'Unassigned') AS location_name,
            COUNT(s.id) AS total_transactions,
            COALESCE(SUM(s.quantity), 0) AS total_units_sold,
            COALESCE(SUM(s.total_amount), 0) AS total_revenue_generated
        FROM users u
        LEFT JOIN locations l ON u.location_id = l.id
        LEFT JOIN sales s ON u.id = s.ba_id
        WHERE LOWER(u.role) = 'ba'{$baFilter}
        GROUP BY u.id, u.username, u.name, l.name
        ORDER BY total_revenue_generated DESC
    ";

    $stmt = $conn->prepare($query);
    $params = $baFilter !== '' ? [':ba_id' => intval($_SESSION['user']['id'])] : [];
    $stmt->execute($params);
    $baReports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array("status" => "success", "reports" => $baReports));

} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
}
?>