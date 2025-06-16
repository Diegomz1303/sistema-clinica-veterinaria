<?php
// backend/api_check_session.php

session_start();

header('Content-Type: application/json');

// Verificamos si la variable de sesión 'user_id' existe
if (isset($_SESSION['user_id'])) {
    // El usuario ha iniciado sesión
    echo json_encode([
        'loggedIn' => true,
        'username' => $_SESSION['username']
    ]);
} else {
    // El usuario NO ha iniciado sesión
    echo json_encode(['loggedIn' => false]);
}
?>