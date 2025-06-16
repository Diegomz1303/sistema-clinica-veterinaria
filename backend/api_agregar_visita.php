<?php
// backend/api_agregar_visita.php

require 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    $paciente_id = isset($_POST['paciente_id']) ? intval($_POST['paciente_id']) : 0;
    
    if ($paciente_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de paciente no válido.']);
        exit;
    }

    $conn->begin_transaction();

    try {
        $sql_visita = "INSERT INTO historial_clinico 
            (id_paciente, fecha_visita, tipo_visita, motivo_consulta, diagnostico, tratamiento, peso_kg, temperatura, frecuencia_cardiaca, frecuencia_respiratoria, proxima_cita) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt_visita = $conn->prepare($sql_visita);

        $fecha_visita = date('Y-m-d H:i:s');
        $tipo_visita = $_POST['tipo_visita'] ?? 'Consulta General';
        $motivo_consulta = $_POST['motivo_consulta'] ?? '';
        $diagnostico = $_POST['diagnostico'] ?? '';
        $tratamiento = $_POST['tratamiento'] ?? null;
        $peso_kg = !empty($_POST['peso']) ? floatval($_POST['peso']) : null;
        $temperatura = !empty($_POST['temperatura']) ? floatval($_POST['temperatura']) : null;
        $frec_cardiaca = !empty($_POST['frecuencia_cardiaca']) ? intval($_POST['frecuencia_cardiaca']) : null;
        $frec_respiratoria = !empty($_POST['frecuencia_respiratoria']) ? intval($_POST['frecuencia_respiratoria']) : null;
        $proxima_cita = !empty($_POST['proxima_cita']) ? $_POST['proxima_cita'] : null;

        $stmt_visita->bind_param("issssdiiiis", 
            $paciente_id, $fecha_visita, $tipo_visita, $motivo_consulta, $diagnostico, $tratamiento, $peso_kg,
            $temperatura, $frec_cardiaca, $frec_respiratoria, $proxima_cita
        );

        $stmt_visita->execute();
        
        $id_visita = $conn->insert_id;
        $stmt_visita->close();

        if (isset($_FILES['archivos'])) {
            $archivos = $_FILES['archivos'];
            $upload_dir = __DIR__ . '/uploads/';

            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }

            $sql_archivo = "INSERT INTO archivos_adjuntos (id_visita, nombre_original, nombre_guardado, ruta_archivo) VALUES (?, ?, ?, ?)";
            $stmt_archivo = $conn->prepare($sql_archivo);

            for ($i = 0; $i < count($archivos['name']); $i++) {
                if ($archivos['error'][$i] === UPLOAD_ERR_OK) {
                    $nombre_original = basename($archivos['name'][$i]);
                    $tmp_name = $archivos['tmp_name'][$i];
                    
                    $extension = pathinfo($nombre_original, PATHINFO_EXTENSION);
                    $nombre_guardado = uniqid('file_', true) . '.' . $extension;
                    $ruta_archivo = $upload_dir . $nombre_guardado;

                    if (move_uploaded_file($tmp_name, $ruta_archivo)) {
                        $ruta_relativa_para_db = 'uploads/' . $nombre_guardado;
                        $stmt_archivo->bind_param("isss", $id_visita, $nombre_original, $nombre_guardado, $ruta_relativa_para_db);
                        $stmt_archivo->execute();
                    } else {
                        throw new Exception("Error al mover el archivo subido: " . $nombre_original);
                    }
                }
            }
            $stmt_archivo->close();
        }

        $conn->commit();
        http_response_code(201);
        echo json_encode(['mensaje' => 'Visita y archivos guardados con éxito.']);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Ocurrió un error en el servidor: ' . $e->getMessage()]);
    }

    $conn->close();
}
?>
