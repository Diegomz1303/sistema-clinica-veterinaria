<?php
// db_connection.php

$host = '127.0.0.1';
$dbname = 'veterinaria_db';
$username = 'root';
$password = ''; // Por defecto, la contraseña de XAMPP es vacía

// Crear la conexión
$conn = new mysqli($host, $username, $password, $dbname);

// Verificar si hay errores de conexión
if ($conn->connect_error) {
  die("Error de Conexión: " . $conn->connect_error);
}

// Establecer el juego de caracteres a UTF-8 para soportar acentos y ñ
$conn->set_charset("utf8mb4");

// Opcional: Configurar encabezados para permitir el acceso desde cualquier origen (CORS)
// Esto es útil para el desarrollo, ya que el frontend y el backend están separados.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

?>