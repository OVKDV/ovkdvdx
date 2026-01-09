<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DXF → SVG/3D Конвертер</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="css/fonts.css">
    <link rel="stylesheet" href="css/style.css">
    
    <!-- Three.js -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>
</head>
<body>
    <?php include 'components/header.php'; ?>
    
    <div class="container">
        <div class="content">
            <!-- Левая панель -->
            <div class="panel left-panel">
                <div class="tab-buttons" id="tabButtons">
                    <button class="tab-btn active" data-tab="upload">📁 Загрузка</button>
                    <button class="tab-btn" data-tab="settings">⚙️ Настройки</button>
                    <button class="tab-btn" data-tab="info">ℹ️ Информация</button>
                </div>
                
                <div class="tab-content" id="tabContent">
                    <!-- Контент будет загружен через AJAX -->
                </div>
            </div>
            
            <!-- Правая панель -->
            <div class="panel right-panel">
                <div class="view-buttons" id="viewButtons">
                    <button class="view-btn active" data-view="svg">2D SVG</button>
                    <button class="view-btn" data-view="3d">3D Модель</button>
                </div>
                
                <div class="preview-container active" id="svg-preview">
                    <div id="svgOutput"></div>
                    <div id="placeholder" class="placeholder">
                        <div class="placeholder-icon">📐</div>
                        <p>Здесь будет отображен результат конвертации</p>
                    </div>
                    
                    <div class="stats" id="stats" style="display: none;">
                        <div class="stat-card">
                            <div class="stat-value" id="statArcs">0</div>
                            <div class="stat-label">Всего дуг</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="statLargeArcs">0</div>
                            <div class="stat-label">Больших дуг</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="statLines">0</div>
                            <div class="stat-label">Линий</div>
                        </div>
                    </div>
                </div>
                
                <div class="preview-container" id="3d-preview">
                    <canvas id="canvas3d"></canvas>
                    <div id="placeholder3d" class="placeholder">
                        <div class="placeholder-icon">📊</div>
                        <p>Конвертируйте DXF файл для 3D просмотра</p>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn" id="downloadBtn" disabled>
                        <span class="btn-icon">📥</span> Скачать SVG
                    </button>
                    <button class="btn" id="copyBtn" disabled>
                        <span class="btn-icon">📋</span> Копировать код
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <?php include 'components/footer.php'; ?>
    
    <!-- Loading overlay -->
    <?php include 'components/loading.php'; ?>
    
    <!-- JavaScript -->
    <script src="js/converter.js"></script>
    <script src="js/3d-viewer.js"></script>
    <script src="js/upload-handler.js"></script>
    <script src="js/main.js"></script>
</body>
</html>