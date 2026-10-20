<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM products ORDER BY id DESC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "products" => $products));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => $e->getMessage()));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($data->action) ? $data->action : 'add';

    if ($action === 'add') {
        if (!empty($data->name) && !empty($data->price)) {
            try {
                $sku = !empty($data->sku) ? $data->sku : 'BE-' . strtoupper(substr(md5(time()), 0, 6));
                $stmt = $conn->prepare("INSERT INTO products (name, sku, price) VALUES (:name, :sku, :price)");
                $stmt->bindParam(":name", $data->name);
                $stmt->bindParam(":sku", $sku);
                $stmt->bindParam(":price", $data->price);
                $stmt->execute();
                echo json_encode(array("status" => "success", "message" => "Product added successfully!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Failed to add product: " . $e->getMessage()));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Product name and price are required."));
        }
    } elseif ($action === 'update') {
        if (!empty($data->id) && !empty($data->name) && !empty($data->price)) {
            try {
                $stmt = $conn->prepare("UPDATE products SET name = :name, sku = :sku, price = :price WHERE id = :id");
                $stmt->bindParam(":name", $data->name);
                $stmt->bindParam(":sku", $data->sku);
                $stmt->bindParam(":price", $data->price);
                $stmt->bindParam(":id", $data->id);
                $stmt->execute();
                echo json_encode(array("status" => "success", "message" => "Product updated successfully!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Failed to update product."));
            }
        } else {
            echo json_encode(array("status" => "error", "message" => "Invalid product details."));
        }
    } elseif ($action === 'delete') {
        if (!empty($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
                $stmt->bindParam(":id", $data->id);
                $stmt->execute();
                echo json_encode(array("status" => "success", "message" => "Product deleted successfully!"));
            } catch (PDOException $e) {
                echo json_encode(array("status" => "error", "message" => "Cannot delete product referenced in sales or inventory."));
            }
        }
    }
}
?>