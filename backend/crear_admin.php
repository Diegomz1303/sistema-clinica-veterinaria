<?php
// backend/crear_admin.php

// Incluimos la conexión a la base de datos
require 'db_connection.php';

echo "<h1>Creando Usuario Administrador...</h1>";

// --- Define aquí los datos de tu admin ---
$username = 'admin';
$password_plano = 'admin123'; // ¡Cambia esto por una contraseña segura!
$nombre_completo = 'Administrador del Sistema';

// --- Encriptación de la contraseña ---
// Usamos el algoritmo BCRYPT, que es el estándar y muy seguro.
$password_hash = password_hash($password_plano, PASSWORD_BCRYPT);

if ($password_hash === false) {
    die("<p style='color:red;'>Error al generar el hash de la contraseña.</p>");
}

echo "<p>Usuario: " . htmlspecialchars($username) . "</p>";
echo "<p>Contraseña en texto plano: " . htmlspecialchars($password_plano) . "</p>";
echo "<p>Hash de la contraseña (esto es lo que se guarda): " . htmlspecialchars($password_hash) . "</p>";

// --- Insertar en la Base de Datos ---
try {
    // Preparamos la sentencia para evitar inyección SQL
    $stmt = $conn->prepare("INSERT INTO usuarios (username, password_hash, nombre_completo) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $password_hash, $nombre_completo);

    if ($stmt->execute()) {
        echo "<p style='color:green; font-weight:bold;'>¡Usuario administrador creado con éxito!</p>";
    } else {
        echo "<p style='color:red;'>Error al crear el usuario: " . $stmt->error . "</p>";
    }

    $stmt->close();

} catch (Exception $e) {
    // mysqli_sql_exception puede ocurrir si el usuario ya existe (por la clave UNIQUE)
    echo "<p style='color:red;'>Error: " . $e->getMessage() . "</p>";
    echo "<p>Es posible que el usuario 'admin' ya exista en la base de datos.</p>";
}

$conn->close();

echo "<h2>¡IMPORTANTE!</h2>";
echo "<p>Por seguridad, borra este archivo (crear_admin.php) del servidor ahora que ya lo has usado.</p>";

?>