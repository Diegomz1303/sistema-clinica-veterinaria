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
    $nombre = $_POST['nombre'] ?? '';
    $descripcion = $_POST['descripcion'] ?? null;
    $tipo = $_POST['tipo'] ?? '';
    $stock_actual = $_POST['stock_actual'] ?? 0;
    $precio_venta = empty($_POST['precio_venta']) ? null : $_POST['precio_venta'];
    $lote = empty($_POST['lote']) ? null : $_POST['lote'];
    $fecha_caducidad = empty($_POST['fecha_caducidad']) ? null : $_POST['fecha_caducidad'];

    if (empty($nombre) || empty($tipo)) {
        echo json_encode(['success' => false, 'message' => 'El nombre y el tipo son obligatorios.']);
        exit;
    }

    $sql = "INSERT INTO productos (nombre, descripcion, tipo, stock_actual, precio_venta, lote, fecha_caducidad) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssisss", $nombre, $descripcion, $tipo, $stock_actual, $precio_venta, $lote, $fecha_caducidad);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Producto añadido con éxito.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al añadir el producto: ' . $stmt->error]);
    }
    $stmt->close();
    $conn->close();
}
?>