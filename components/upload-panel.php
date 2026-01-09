<!-- components/upload-panel.php -->
<div class="tab-panel upload-panel active" id="uploadPanel">
    <div class="upload-area" id="uploadArea">
        <div class="upload-icon">📁</div>
        <h3>Перетащите DXF файл сюда</h3>
        <p>или нажмите для выбора файла</p>
        <input type="file" id="fileInput" accept=".dxf" style="display: none;">
        <button class="btn" id="selectFileBtn">
            <span class="btn-icon">📂</span> Выбрать файл
        </button>
        <p class="file-size-info">
            Поддерживаются файлы DXF размером до <?php echo floor(MAX_FILE_SIZE / 1024 / 1024); ?> MB
        </p>
    </div>
    
    <div class="file-info" id="fileInfo">
        <h3>Выбранный файл:</h3>
        <p><strong id="fileName"></strong> (<span id="fileSize"></span>)</p>
        <button class="btn" id="convertBtn">
            <span class="btn-icon">🔄</span> Конвертировать в SVG/3D
        </button>
    </div>
</div>