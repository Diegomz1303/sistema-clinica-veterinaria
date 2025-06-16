<?php
// backend/api_logout.php

session_start();

// Desasigna todas las variables de sesión
$_SESSION = array();

// Destruye la sesión.
if (session_destroy()) {
    // Si se destruyó correctamente, envía una respuesta de éxito.
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo cerrar la sesión.']);
}
?>