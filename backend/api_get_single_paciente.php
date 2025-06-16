<?php
// backend/api_get_single_paciente.php

require 'db_connection.php';

header('Content-Type: application/json');

$id_paciente = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id_paciente <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de paciente no válido.']);
    exit;
}

$sql = "SELECT 
            p.id AS paciente_id, 
            p.nombre AS nombre_paciente, 
            p.especie, p.raza, p.sexo, p.fecha_nacimiento, p.color,
            pr.id as propietario_id,
            pr.nombre AS nombre_propietario, 
            pr.apellido AS apellido_propietario, 
            pr.telefono, pr.email, pr.direccion
        FROM pacientes p
        JOIN propietarios pr ON p.id_propietario = pr.id
        WHERE p.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_paciente);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $data = $result->fetch_assoc();
    echo json_encode($data);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Paciente no encontrado.']);
}

$stmt->close();
$conn->close();
?>
