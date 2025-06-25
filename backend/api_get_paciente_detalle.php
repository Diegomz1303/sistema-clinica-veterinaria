<?php
header('Content-Type: application/json');
require 'db_connection.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

$paciente_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($paciente_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de paciente no válido.']);
    exit;
}

$response = ['success' => true];

// 1. Obtener datos del paciente y propietario
$sql_paciente = "SELECT p.*, pr.nombre as nombre_propietario, pr.apellido, pr.telefono, pr.email, pr.direccion 
                 FROM pacientes p 
                 JOIN propietarios pr ON p.id_propietario = pr.id 
                 WHERE p.id = ?";
$stmt_paciente = $conn->prepare($sql_paciente);
$stmt_paciente->bind_param("i", $paciente_id);
$stmt_paciente->execute();
$result_paciente = $stmt_paciente->get_result();
if ($result_paciente->num_rows > 0) {
    $response['paciente'] = $result_paciente->fetch_assoc();
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Paciente no encontrado.']);
    exit;
}
$stmt_paciente->close();

// 2. Obtener historial clínico del paciente
$sql_historial = "SELECT hc.*, GROUP_CONCAT(vp.id_producto, ':', p.nombre, ':', vp.cantidad_usada SEPARATOR ';') as productos_utilizados
                  FROM historial_clinico hc
                  LEFT JOIN visita_productos vp ON hc.id = vp.id_visita
                  LEFT JOIN productos p ON vp.id_producto = p.id
                  WHERE hc.id_paciente = ?
                  GROUP BY hc.id
                  ORDER BY hc.fecha_visita DESC";
$stmt_historial = $conn->prepare($sql_historial);
$stmt_historial->bind_param("i", $paciente_id);
$stmt_historial->execute();
$result_historial = $stmt_historial->get_result();
$response['historial'] = $result_historial->fetch_all(MYSQLI_ASSOC);
$stmt_historial->close();


$conn->close();
echo json_encode($response);
?>