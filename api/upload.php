<?php
// api/upload.php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    try {
        if (!isset($_FILES['file'])) {
            throw new Exception('Файл не получен');
        }
        
        $file = $_FILES['file'];
        
        // Проверка расширения
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXTENSIONS)) {
            throw new Exception('Разрешены только файлы DXF');
        }
        
        // Проверка размера
        if ($file['size'] > MAX_FILE_SIZE) {
            throw new Exception('Файл слишком большой');
        }
        
        // Генерируем уникальное имя файла
        $filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9\._-]/', '_', $file['name']);
        $filepath = UPLOAD_PATH . $filename;
        
        // Сохраняем файл
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $_SESSION['uploaded_file'] = $filename;
            
            echo json_encode([
                'success' => true,
                'filename' => $filename,
                'original_name' => $file['name'],
                'size' => $file['size']
            ]);
        } else {
            throw new Exception('Ошибка при сохранении файла');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    
    exit;
}

// Если не POST запрос
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);