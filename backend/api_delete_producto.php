<?php
header('Content-Type: application/json');
require 'db_connection.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? 0;

    if (empty($id)) {
        echo json_encode(['success' => false, 'message' => 'No se proporcionó un ID.']);
        exit;
    }

    $sql = "DELETE FROM productos WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Producto eliminado con éxito.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se encontró el producto a eliminar.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el producto: ' . $stmt->error]);
    }
    $stmt->close();
    $conn->close();
}
?>