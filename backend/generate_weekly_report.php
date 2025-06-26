<?php
// backend/generate_weekly_report.php

require('db_connection.php');
require('fpdf/fpdf.php'); // Incluimos la librería FPDF

// 1. OBTENER LOS DATOS DE LA SEMANA (mismas consultas que antes)
$report_data = [];

// Total de visitas
$sql_visitas_semana = "SELECT COUNT(id) as total FROM historial_clinico WHERE fecha_visita >= CURDATE() - INTERVAL 7 DAY";
$report_data['total_visitas'] = $conn->query($sql_visitas_semana)->fetch_assoc()['total'] ?? 0;

// Pacientes nuevos
$sql_nuevos_pacientes = "SELECT COUNT(DISTINCT id_paciente) as total FROM historial_clinico WHERE id_paciente NOT IN (SELECT id_paciente FROM historial_clinico WHERE fecha_visita < CURDATE() - INTERVAL 7 DAY) AND fecha_visita >= CURDATE() - INTERVAL 7 DAY";
$report_data['nuevos_pacientes'] = $conn->query($sql_nuevos_pacientes)->fetch_assoc()['total'] ?? 0;

// Productos usados
$sql_productos_semana = "SELECT p.nombre, SUM(vp.cantidad_usada) as total_usado FROM visita_productos vp JOIN productos p ON vp.id_producto = p.id JOIN historial_clinico hc ON vp.id_visita = hc.id WHERE hc.fecha_visita >= CURDATE() - INTERVAL 7 DAY GROUP BY vp.id_producto ORDER BY total_usado DESC LIMIT 10";
$report_data['productos_usados'] = $conn->query($sql_productos_semana)->fetch_all(MYSQLI_ASSOC);


// 2. CREAR EL PDF CON FPDF
class PDF extends FPDF {
    // Cabecera de página
    function Header() {
        // Logo
        $this->Image('../frontend/img/logo_veterinaria.jpg', 10, 6, 30);
        // Título
        $this->SetFont('Arial','B',15);
        $this->Cell(80); // Mover a la derecha
        $this->Cell(30,10,'Informe Semanal',1,0,'C');
        // Fecha
        $this->SetFont('Arial','',10);
        $this->Cell(50,10,date('d/m/Y'),0,1,'R');
        // Salto de línea
        $this->Ln(20);
    }

    // Pie de página
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial','I',8);
        $this->Cell(0,10,utf8_decode('Página ').$this->PageNo().'/{nb}',0,0,'C');
    }
}

// Inicialización del PDF
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

// Título del reporte
$pdf->SetFont('Arial','B',16);
$pdf->Cell(0,10,utf8_decode('Resumen de Actividad de la Semana'),0,1,'C');
$pdf->Ln(5);

// Resumen de KPIs
$pdf->SetFont('Arial','',12);
$pdf->Cell(0, 10, utf8_decode("Total de Consultas y Visitas: " . $report_data['total_visitas']), 0, 1);
$pdf->Cell(0, 10, utf8_decode("Pacientes Nuevos Registrados: " . $report_data['nuevos_pacientes']), 0, 1);
$pdf->Ln(10);

// Tabla de productos utilizados
$pdf->SetFont('Arial','B',14);
$pdf->Cell(0,10,utf8_decode('Productos Más Utilizados'),0,1);
$pdf->SetFont('Arial','B',12);
$pdf->Cell(130,10,'Producto',1,0,'C');
$pdf->Cell(60,10,'Cantidad Usada',1,1,'C');

$pdf->SetFont('Arial','',12);
if (!empty($report_data['productos_usados'])) {
    foreach($report_data['productos_usados'] as $producto) {
        $pdf->Cell(130, 10, utf8_decode($producto['nombre']), 1, 0);
        $pdf->Cell(60, 10, $producto['total_usado'] . ' uds.', 1, 1, 'C');
    }
} else {
    $pdf->Cell(190, 10, 'No se utilizaron productos esta semana.', 1, 1, 'C');
}

// 3. ENVIAR EL PDF AL NAVEGADOR PARA DESCARGA
$pdf->Output('D', 'Informe_Semanal_'.date('Y-m-d').'.pdf');
$conn->close();

?>