<?php
// config.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Настройки приложения
define('APP_NAME', 'DXF to SVG/3D Converter');
define('APP_VERSION', '3.0');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_EXTENSIONS', ['dxf']);

// Пути
define('BASE_PATH', __DIR__);
define('UPLOAD_PATH', BASE_PATH . '/uploads/');
define('TEMP_PATH', BASE_PATH . '/temp/');

// Создаем необходимые директории
if (!file_exists(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0777, true);
}

if (!file_exists(TEMP_PATH)) {
    mkdir(TEMP_PATH, 0777, true);
}

// Настройки безопасности
session_start();

// Включаем CORS для AJAX запросов
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');