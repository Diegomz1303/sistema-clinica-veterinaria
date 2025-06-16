<?php
// backend/api_get_paciente_detalle.php

require 'db_connection.php';

$id_paciente = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id_paciente <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de paciente no válido.']);
    exit;
}

// --- PASO 1: OBTENER DATOS DEL PACIENTE, PROPIETARIO Y TODAS SUS VISITAS ---
$sql_principal = "SELECT 
            p.id AS paciente_id, p.nombre AS paciente_nombre, p.especie, p.raza, p.sexo, p.fecha_nacimiento, p.color,
            pr.nombre AS propietario_nombre, pr.apellido, pr.telefono, pr.email, pr.direccion,
            hc.id AS historial_id, hc.fecha_visita, hc.tipo_visita, hc.motivo_consulta, hc.diagnostico, hc.tratamiento, hc.peso_kg,
            hc.temperatura, hc.frecuencia_cardiaca, hc.frecuencia_respiratoria, hc.proxima_cita
        FROM pacientes p
        JOIN propietarios pr ON p.id_propietario = pr.id
        LEFT JOIN historial_clinico hc ON p.id = hc.id_paciente
        WHERE p.id = ?
        ORDER BY hc.fecha_visita DESC";

$stmt_principal = $conn->prepare($sql_principal);
$stmt_principal->bind_param("i", $id_paciente);
$stmt_principal->execute();
$result_principal = $stmt_principal->get_result();

$datos_paciente = null;
$historial_clinico = [];
$ids_visitas = []; // Guardaremos los IDs de las visitas para buscar sus archivos

while ($row = $result_principal->fetch_assoc()) {
    if ($datos_paciente === null) {
        $datos_paciente = [
            'id' => $row['paciente_id'], 'nombre' => $row['paciente_nombre'], 'especie' => $row['especie'],
            'raza' => $row['raza'], 'sexo' => $row['sexo'], 'fecha_nacimiento' => $row['fecha_nacimiento'], 'color' => $row['color'],
            'propietario' => [
                'nombre' => $row['propietario_nombre'], 'apellido' => $row['apellido'], 'telefono' => $row['telefono'],
                'email' => $row['email'], 'direccion' => $row['direccion']
            ]
        ];
    }

    if ($row['historial_id'] !== null) {
        $id_visita = $row['historial_id'];
        // Usamos el ID como clave para evitar duplicados y facilitar la asignación de archivos
        if (!isset($historial_clinico[$id_visita])) {
            $ids_visitas[] = $id_visita;
            $historial_clinico[$id_visita] = [
                'id' => $id_visita, 'fecha_visita' => $row['fecha_visita'], 'tipo_visita' => $row['tipo_visita'],
                'motivo_consulta' => $row['motivo_consulta'], 'diagnostico' => $row['diagnostico'], 'tratamiento' => $row['tratamiento'],
                'peso_kg' => $row['peso_kg'], 'temperatura' => $row['temperatura'], 'frecuencia_cardiaca' => $row['frecuencia_cardiaca'],
                'frecuencia_respiratoria' => $row['frecuencia_respiratoria'], 'proxima_cita' => $row['proxima_cita'],
                'archivos' => [] // Inicializamos el array de archivos
            ];
        }
    }
}
$stmt_principal->close();

// --- PASO 2: OBTENER TODOS LOS ARCHIVOS DE ESAS VISITAS EN UNA SOLA CONSULTA ---
if (!empty($ids_visitas)) {
    // Creamos una cadena de '?' para la consulta IN, ej: (?, ?, ?)
    $placeholders = implode(',', array_fill(0, count($ids_visitas), '?'));
    $sql_archivos = "SELECT id, id_visita, nombre_original, ruta_archivo FROM archivos_adjuntos WHERE id_visita IN ($placeholders)";
    
    $stmt_archivos = $conn->prepare($sql_archivos);
    // Vinculamos los IDs de visita a la consulta
    $stmt_archivos->bind_param(str_repeat('i', count($ids_visitas)), ...$ids_visitas);
    $stmt_archivos->execute();
    $result_archivos = $stmt_archivos->get_result();

    while ($archivo_row = $result_archivos->fetch_assoc()) {
        $id_visita_archivo = $archivo_row['id_visita'];
        // Asignamos el archivo a su visita correspondiente en el array
        if (isset($historial_clinico[$id_visita_archivo])) {
            $historial_clinico[$id_visita_archivo]['archivos'][] = $archivo_row;
        }
    }
    $stmt_archivos->close();
}


// --- PASO 3: DEVOLVER LA RESPUESTA COMPLETA ---
if ($datos_paciente === null) {
    http_response_code(404);
    echo json_encode(['error' => 'Paciente no encontrado.']);
} else {
    // Re-indexamos el array para que no tenga claves numéricas en el JSON final
    $datos_paciente['historial'] = array_values($historial_clinico);
    echo json_encode($datos_paciente);
}

$conn->close();
?>
