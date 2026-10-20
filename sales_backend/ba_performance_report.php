<?php
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

try {
    $query = "
        SELECT 
            u.id AS ba_id,
            u.username AS ba_username,
            COALESCE(u.full_name, u.username) AS ba_name,
            COALESCE(l.name, 'Unassigned') AS location_name,
            COUNT(s.id) AS total_transactions,
            COALESCE(SUM(s.quantity), 0) AS total_units_sold,
            COALESCE(SUM(s.total_amount), 0) AS total_revenue_generated
        FROM users u
        LEFT JOIN locations l ON u.location_id = l.id
        LEFT JOIN sales s ON u.id = s.ba_id
        WHERE LOWER(u.role) = 'ba'
        GROUP BY u.id, u.username, u.full_name, l.name
        ORDER BY total_revenue_generated DESC
    ";

    $stmt = $conn->query($query);
    $baReports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array("status" => "success", "reports" => $baReports));

} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => $e->getMessage()));
}
?>