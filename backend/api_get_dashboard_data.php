<?php
// backend/api_get_dashboard_data.php

header('Content-Type: application/json');
require 'db_connection.php'; // Reutilizamos la conexión a la BD
session_start();

// 1. Verificación de seguridad: Asegurarnos de que el usuario ha iniciado sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // No autorizado
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

// 2. Array principal que contendrá todos los datos del dashboard
$dashboard_data = [
    'kpis' => [],
    'charts' => [],
    'lists' => []
];

try {
    // --- MÉTRICAS CLAVE (KPIs) ---

    // Total de Pacientes
    $kpi_total_pacientes = $conn->query("SELECT COUNT(id) as total FROM pacientes")->fetch_assoc()['total'];
    $dashboard_data['kpis']['total_pacientes'] = $kpi_total_pacientes;

    // Visitas del Mes Actual
    $kpi_visitas_mes = $conn->query("SELECT COUNT(id) as total FROM historial_clinico WHERE MONTH(fecha_visita) = MONTH(CURDATE()) AND YEAR(fecha_visita) = YEAR(CURDATE())")->fetch_assoc()['total'];
    $dashboard_data['kpis']['visitas_mes'] = $kpi_visitas_mes;

    // Productos con Bajo Stock (consideramos 5 o menos unidades)
    $kpi_productos_bajos = $conn->query("SELECT COUNT(id) as total FROM productos WHERE stock_actual <= 5")->fetch_assoc()['total'];
    $dashboard_data['kpis']['productos_bajos_stock'] = $kpi_productos_bajos;

    // Nuevos Pacientes en los últimos 30 días (asumiendo que los IDs más altos son los más nuevos)
    // NOTA: Una columna `fecha_registro` en `pacientes` sería ideal para el futuro.
    $thirty_days_ago_id_approx = $conn->query("SELECT MAX(id) as max_id FROM pacientes")->fetch_assoc()['max_id'] - 50; // Es una aproximación
    $kpi_nuevos_pacientes = $conn->query("SELECT COUNT(id) as total FROM pacientes WHERE id > $thirty_days_ago_id_approx")->fetch_assoc()['total'];
    $dashboard_data['kpis']['nuevos_pacientes_mes'] = $kpi_nuevos_pacientes;


    // --- DATOS PARA GRÁFICOS ---

    // Distribución de Tipos de Visita
    $chart_tipos_visita_result = $conn->query("SELECT tipo_visita, COUNT(id) as total FROM historial_clinico GROUP BY tipo_visita ORDER BY total DESC");
    $dashboard_data['charts']['tipos_visita'] = $chart_tipos_visita_result->fetch_all(MYSQLI_ASSOC);

    // Visitas por Doctor
    $chart_visitas_doctor_result = $conn->query("SELECT doctor_encargado, COUNT(id) as total FROM historial_clinico WHERE doctor_encargado IS NOT NULL AND doctor_encargado != '' GROUP BY doctor_encargado ORDER BY total DESC");
    $dashboard_data['charts']['visitas_doctor'] = $chart_visitas_doctor_result->fetch_all(MYSQLI_ASSOC);
    
    // Productos más utilizados
    $chart_productos_usados_result = $conn->query("
        SELECT p.nombre, SUM(vp.cantidad_usada) as total_usado
        FROM visita_productos vp
        JOIN productos p ON vp.id_producto = p.id
        GROUP BY vp.id_producto
        ORDER BY total_usado DESC
        LIMIT 5
    ");
    $dashboard_data['charts']['productos_mas_usados'] = $chart_productos_usados_result->fetch_all(MYSQLI_ASSOC);


    // --- LISTAS DE ACCESO RÁPIDO ---

    // Últimas 5 visitas
    $list_ultimas_visitas_result = $conn->query("
        SELECT hc.fecha_visita, p.nombre as nombre_paciente, hc.motivo_consulta
        FROM historial_clinico hc
        JOIN pacientes p ON hc.id_paciente = p.id
        ORDER BY hc.id DESC
        LIMIT 5
    ");
    $dashboard_data['lists']['ultimas_visitas'] = $list_ultimas_visitas_result->fetch_all(MYSQLI_ASSOC);

    // Lista de productos por agotarse
    $list_productos_bajos_result = $conn->query("SELECT id, nombre, stock_actual FROM productos WHERE stock_actual <= 5 ORDER BY stock_actual ASC");
    $dashboard_data['lists']['lista_productos_bajos'] = $list_productos_bajos_result->fetch_all(MYSQLI_ASSOC);


    // 3. Enviar la respuesta
    echo json_encode(['success' => true, 'data' => $dashboard_data]);

} catch (Exception $e) {
    http_response_code(500); // Error del servidor
    echo json_encode(['success' => false, 'message' => 'Error al obtener los datos para el dashboard: ' . $e->getMessage()]);
}

$conn->close();

?>