<?php
header('Content-Type: application/json');
require 'db_connection.php';
session_start();

// --- INICIO DE LA CORRECCIÓN DEFINITIVA DE ZONA HORARIA ---
// Establecemos la zona horaria directamente en PHP para Perú.
date_default_timezone_set('America/Lima');
// --- FIN DE LA CORRECCIÓN ---

// 1. Verificación de seguridad de la sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado. Por favor, inicie sesión de nuevo.']);
    exit;
}

// 2. Solo aceptar peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// 3. Iniciar la transacción para asegurar la integridad de los datos
$conn->begin_transaction();

try {
    // --- OBTENER DATOS DEL FORMULARIO ---
    $id_paciente = $_POST['id_paciente'] ?? 0;
    if ($id_paciente <= 0) {
        throw new Exception("ID de paciente no válido.");
    }
    
    // Generamos la fecha y hora actual de Perú en el formato correcto para MySQL
    $fecha_visita_actual = date('Y-m-d H:i:s');

    $tipo_visita = $_POST['tipo_visita'] ?? 'Consulta General';
    $motivo_consulta = $_POST['motivo_consulta'] ?? '';
    $examenes_complementarios = $_POST['examenes_complementarios'] ?? null;
    $diagnostico = $_POST['diagnostico'] ?? '';
    $tratamiento_notas = $_POST['tratamiento'] ?? null;
    $proxima_cita = empty($_POST['proxima_cita']) ? null : $_POST['proxima_cita'];
    $doctor_encargado = $_POST['doctor_encargado'] ?? null;
    
    // Signos vitales
    $peso_kg = empty($_POST['peso']) ? null : floatval($_POST['peso']);
    $temperatura = empty($_POST['temperatura']) ? null : floatval($_POST['temperatura']);
    $frec_cardiaca = empty($_POST['frecuencia_cardiaca']) ? null : intval($_POST['frecuencia_cardiaca']);
    $frec_respiratoria = empty($_POST['frecuencia_respiratoria']) ? null : intval($_POST['frecuencia_respiratoria']);

    // --- 4. INSERTAR LA VISITA PRINCIPAL (SQL CORREGIDO) ---
    // Reemplazamos NOW() con un marcador de posición (?)
    $sql_visita = "INSERT INTO historial_clinico 
        (id_paciente, fecha_visita, tipo_visita, motivo_consulta, diagnostico, tratamiento, proxima_cita, examenes_complementarios, peso_kg, temperatura, frecuencia_cardiaca, frecuencia_respiratoria, doctor_encargado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt_visita = $conn->prepare($sql_visita);
    // Añadimos la fecha de PHP como el primer parámetro de tipo string (s)
    $stmt_visita->bind_param("isssssssddiss", 
        $id_paciente, 
        $fecha_visita_actual, // Pasamos la fecha calculada en PHP
        $tipo_visita, 
        $motivo_consulta, 
        $diagnostico, 
        $tratamiento_notas, 
        $proxima_cita, 
        $examenes_complementarios, 
        $peso_kg, 
        $temperatura, 
        $frec_cardiaca, 
        $frec_respiratoria, 
        $doctor_encargado
    );
    
    $stmt_visita->execute();
    
    $id_visita_nueva = $conn->insert_id;
    if ($id_visita_nueva === 0) {
        throw new Exception("No se pudo crear el registro de la visita.");
    }
    $stmt_visita->close();

    // --- 5. PROCESAR PRODUCTOS UTILIZADOS ---
    $productos_usados = json_decode($_POST['productos_usados'] ?? '[]', true);

    if (!empty($productos_usados)) {
        $sql_producto_visita = "INSERT INTO visita_productos (id_visita, id_producto, cantidad_usada, precio_en_visita) VALUES (?, ?, ?, ?)";
        $stmt_producto_visita = $conn->prepare($sql_producto_visita);
        
        $sql_update_stock = "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ? AND stock_actual >= ?";
        $stmt_update_stock = $conn->prepare($sql_update_stock);

        foreach ($productos_usados as $producto) {
            $id_producto = $producto['id'];
            $cantidad = $producto['cantidad'];
            $precio = $producto['precio'];

            $stmt_producto_visita->bind_param("iiid", $id_visita_nueva, $id_producto, $cantidad, $precio);
            $stmt_producto_visita->execute();

            $stmt_update_stock->bind_param("iii", $cantidad, $id_producto, $cantidad);
            $stmt_update_stock->execute();
            
            if ($stmt_update_stock->affected_rows === 0) {
                throw new Exception("Stock insuficiente para uno de los productos seleccionados.");
            }
        }
        $stmt_producto_visita->close();
        $stmt_update_stock->close();
    }
    
    // --- 6. CONFIRMAR CAMBIOS ---
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Visita registrada y stock actualizado con éxito.']);

} catch (Exception $e) {
    // --- 7. REVERTIR TODO SI ALGO FALLÓ ---
    $conn->rollback();
    http_response_code(500); // Error del servidor
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
