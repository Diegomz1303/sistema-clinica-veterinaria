<?php
// backend/api_get_productos.php
header('Content-Type: application/json');
require 'db_connection.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 15; // 15 productos por página
$offset = ($page - 1) * $limit;
$searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';
$likeTerm = "%{$searchTerm}%";

// Contar total de registros
$countSql = "SELECT COUNT(id) as total FROM productos WHERE nombre LIKE ? OR lote LIKE ?";
$stmtCount = $conn->prepare($countSql);
$stmtCount->bind_param("ss", $likeTerm, $likeTerm);
$stmtCount->execute();
$totalRecords = $stmtCount->get_result()->fetch_assoc()['total'];
$totalPages = ceil($totalRecords / $limit);
$stmtCount->close();

// Obtener registros de la página
$sql = "SELECT * FROM productos WHERE nombre LIKE ? OR lote LIKE ? ORDER BY nombre ASC LIMIT ? OFFSET ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssii", $likeTerm, $likeTerm, $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();
$productos = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();

echo json_encode([
    'data' => $productos,
    'pagination' => [
        'currentPage' => $page,
        'totalPages' => $totalPages,
    ]
]);
?>