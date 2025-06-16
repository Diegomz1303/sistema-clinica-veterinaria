<?php
// backend/api_login.php

// session_start() debe ser lo primero para poder usar las sesiones.
session_start();

require 'db_connection.php';

// Solo procesamos si la petición es POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Usuario y contraseña requeridos.']);
        exit;
    }

    $username = $data['username'];
    $password_plano = $data['password'];

    // 1. Buscar al usuario en la base de datos
    $stmt = $conn->prepare("SELECT id, username, password_hash FROM usuarios WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $usuario = $result->fetch_assoc();

        // 2. Verificar la contraseña encriptada
        if (password_verify($password_plano, $usuario['password_hash'])) {
            // ¡Contraseña correcta!
            // 3. Guardar datos en la sesión
            $_SESSION['user_id'] = $usuario['id'];
            $_SESSION['username'] = $usuario['username'];

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Inicio de sesión exitoso.']);
        } else {
            // Contraseña incorrecta
            http_response_code(401); // Unauthorized
            echo json_encode(['success' => false, 'error' => 'Contraseña incorrecta.']);
        }
    } else {
        // Usuario no encontrado
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado.']);
    }

    $stmt->close();
    $conn->close();
}
?>