<?php
// backend/api_agregar_paciente.php

// ESTA LÍNEA ES CRÍTICA. Trae los encabezados CORS y la conexión.
require 'db_connection.php';

// Verificamos que el método de la petición sea POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    // Obtenemos el cuerpo de la petición (que es un JSON)
    $json = file_get_contents('php://input');
    // Decodificamos el JSON a un array asociativo de PHP
    $data = json_decode($json, true);

    // Verificamos que los datos necesarios existan
    if (!isset($data['propietario']) || !isset($data['paciente'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Datos incompletos.']);
        exit;
    }

    $propietario = $data['propietario'];
    $paciente = $data['paciente'];

    // Iniciar una transacción
    $conn->begin_transaction();

    try {
        // --- 1. Insertar el Propietario ---
        $stmt_propietario = $conn->prepare("INSERT INTO propietarios (nombre, apellido, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)");
        $stmt_propietario->bind_param("sssss", 
            $propietario['nombre'], 
            $propietario['apellido'], 
            $propietario['telefono'], 
            $propietario['email'], 
            $propietario['direccion']
        );
        $stmt_propietario->execute();
        $id_propietario = $conn->insert_id;
        $stmt_propietario->close();

        // --- 2. Insertar el Paciente ---
        $stmt_paciente = $conn->prepare("INSERT INTO pacientes (id_propietario, nombre, especie, raza, sexo, fecha_nacimiento, color) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt_paciente->bind_param("issssss", 
            $id_propietario, 
            $paciente['nombre'], 
            $paciente['especie'], 
            $paciente['raza'], 
            $paciente['sexo'], 
            $paciente['fecha_nacimiento'], 
            $paciente['color']
        );
        $stmt_paciente->execute();
        $stmt_paciente->close();

        // Si ambas inserciones fueron exitosas, confirmamos la transacción
        $conn->commit();

        http_response_code(201); // Created
        echo json_encode(['mensaje' => 'Paciente y propietario agregados con éxito.']);

    } catch (Exception $e) {
        // Si algo falló, revertimos la transacción
        $conn->rollback();
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Error al guardar en la base de datos: ' . $e->getMessage()]);
    }

    $conn->close();
} else {
    // Si alguien intenta acceder al script con un método que no sea POST
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método no permitido.']);
}
?>