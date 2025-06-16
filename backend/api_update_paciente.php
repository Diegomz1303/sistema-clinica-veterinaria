<?php
// backend/api_update_paciente.php

require 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['paciente_id']) || !isset($data['propietario']) || !isset($data['paciente'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos.']);
        exit;
    }

    $paciente_id = intval($data['paciente_id']);
    $propietario_data = $data['propietario'];
    $paciente_data = $data['paciente'];

    $conn->begin_transaction();

    try {
        // 1. Obtener el ID del propietario para actualizarlo
        $stmt_get_owner = $conn->prepare("SELECT id_propietario FROM pacientes WHERE id = ?");
        $stmt_get_owner->bind_param("i", $paciente_id);
        $stmt_get_owner->execute();
        $result = $stmt_get_owner->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("Paciente no encontrado.");
        }
        $propietario_id = $result->fetch_assoc()['id_propietario'];
        $stmt_get_owner->close();

        // 2. Actualizar datos del propietario
        $sql_propietario = "UPDATE propietarios SET nombre = ?, apellido = ?, telefono = ?, email = ?, direccion = ? WHERE id = ?";
        $stmt_propietario = $conn->prepare($sql_propietario);
        $stmt_propietario->bind_param("sssssi",
            $propietario_data['nombre'], $propietario_data['apellido'], $propietario_data['telefono'],
            $propietario_data['email'], $propietario_data['direccion'], $propietario_id
        );
        $stmt_propietario->execute();
        $stmt_propietario->close();

        // 3. Actualizar datos del paciente
        $sql_paciente = "UPDATE pacientes SET nombre = ?, especie = ?, raza = ?, sexo = ?, fecha_nacimiento = ?, color = ? WHERE id = ?";
        $stmt_paciente = $conn->prepare($sql_paciente);
        $stmt_paciente->bind_param("ssssssi",
            $paciente_data['nombre'], $paciente_data['especie'], $paciente_data['raza'],
            $paciente_data['sexo'], $paciente_data['fecha_nacimiento'], $paciente_data['color'], $paciente_id
        );
        $stmt_paciente->execute();
        $stmt_paciente->close();

        $conn->commit();
        echo json_encode(['mensaje' => 'Datos actualizados con éxito.']);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar los datos: ' . $e->getMessage()]);
    }

    $conn->close();
}
?>
