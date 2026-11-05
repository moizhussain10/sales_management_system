<?php
include 'db.php';

requireAuth(['admin']);

try {
    // 1. Stats calculation
    $today = date('Y-m-d');
    
    // Total Sales Amount Today
    $salesTodayStmt = $conn->prepare("SELECT SUM(total_amount) as total_sales, SUM(quantity) as total_units FROM sales WHERE DATE(created_at) = :today");
    $salesTodayStmt->bindParam(':today', $today);
    $salesTodayStmt->execute();
    $salesTodayData = $salesTodayStmt->fetch(PDO::FETCH_ASSOC);

    // Active BAs Count
    $baCountStmt = $conn->query("SELECT COUNT(*) as active_bas FROM users WHERE role = 'ba'");
    $baCountData = $baCountStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Fetch Stock/Inventory Data joined with inventory table
    $stockStmt = $conn->query("
        SELECT 
            p.id,
            p.name as product_name,
            p.sku,
            l.name as location_name,
            COALESCE(i.quantity, 0) as quantity
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN locations l ON i.location_id = l.id
        ORDER BY p.name ASC
    ");
    $stockData = $stockStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Sales Logs Data
    $salesStmt = $conn->query("
        SELECT 
            s.id,
            s.created_at,
            p.name as product_name,
            u.name as ba_name,
            l.name as location_name,
            s.quantity,
            s.free_quantity,
            s.deal_type,
            s.discount_type,
            s.discount_value,
            s.total_amount
        FROM sales s
        JOIN products p ON s.product_id = p.id
        JOIN users u ON s.ba_id = u.id
        JOIN locations l ON s.location_id = l.id
        ORDER BY s.created_at DESC
    ");
    $salesData = $salesStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "status" => "success",
        "stats" => array(
            "sales_today" => $salesTodayData['total_sales'] ? floatval($salesTodayData['total_sales']) : 0,
            "units_today" => $salesTodayData['total_units'] ? intval($salesTodayData['total_units']) : 0,
            "active_bas" => intval($baCountData['active_bas'])
        ),
        "stock" => $stockData,
        "sales" => $salesData
    ));

} catch (PDOException $e) {
    echo json_encode(array("status" => "error", "message" => apiExceptionMessage($e)));
}
?>