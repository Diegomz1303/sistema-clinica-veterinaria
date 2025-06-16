<?php
// backend/api_pacientes.php

require 'db_connection.php';

// Obtener parámetros de búsqueda de la URL
$id_busqueda = isset($_GET['id']) ? trim($_GET['id']) : '';
$nombre_busqueda = isset($_GET['nombre']) ? trim($_GET['nombre']) : '';

// --- Construcción de la consulta SQL dinámica y segura ---

// Consulta base que une las tablas de pacientes y propietarios
$sql = "SELECT 
            p.id, 
            p.nombre AS nombre_paciente, 
            p.especie, 
            p.raza, 
            pr.nombre AS nombre_propietario, 
            pr.apellido AS apellido_propietario 
        FROM pacientes p
        JOIN propietarios pr ON p.id_propietario = pr.id";

$condiciones = [];
$tipos_parametros = '';
$valores_parametros = [];

if (!empty($id_busqueda)) {
    $condiciones[] = "p.id = ?";
    $tipos_parametros .= 'i'; // i para integer
    $valores_parametros[] = $id_busqueda;
}

if (!empty($nombre_busqueda)) {
    $condiciones[] = "p.nombre LIKE ?";
    $tipos_parametros .= 's'; // s para string
    $valores_parametros[] = "%" . $nombre_busqueda . "%";
}

// Si hay condiciones de búsqueda, las añadimos a la consulta
if (!empty($condiciones)) {
    $sql .= " WHERE " . implode(" AND ", $condiciones);
}

$sql .= " ORDER BY p.id DESC"; // Ordenar para ver los más nuevos primero

// --- Preparación y ejecución de la consulta ---
$stmt = $conn->prepare($sql);

// Si hay parámetros, los vinculamos a la consulta preparada
if (!empty($tipos_parametros)) {
    $stmt->bind_param($tipos_parametros, ...$valores_parametros);
}

$stmt->execute();
$result = $stmt->get_result();

$pacientes = array();

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $pacientes[] = $row;
    }
}

// Devolver resultados en formato JSON
echo json_encode($pacientes);

$stmt->close();
$conn->close();
?>