<?php
// api/convert.php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['dxf_content'])) {
            throw new Exception('Отсутствует DXF контент');
        }
        
        $dxfContent = $input['dxf_content'];
        
        // Здесь можно добавить серверную обработку DXF
        // Пока просто возвращаем успех
        echo json_encode([
            'success' => true,
            'message' => 'Конвертация выполнена успешно (серверная часть)',
            'timestamp' => time()
        ]);
        
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