<!-- components/settings-panel.php -->
<div class="tab-panel settings-panel" id="settingsPanel">
    <h3>Настройки конвертации</h3>
    <div class="settings-grid">
        <div class="form-group">
            <label for="strokeWidth">Толщина линии (2D):</label>
            <input type="number" id="strokeWidth" value="0.1" step="0.05" min="0.01">
        </div>
        <div class="form-group">
            <label for="strokeColor">Цвет линии (2D):</label>
            <input type="color" id="strokeColor" value="#000000">
        </div>
        <div class="form-group">
            <label for="fillColor">Цвет заливки (2D):</label>
            <select id="fillColor">
                <option value="none">Без заливки</option>
                <option value="#f8fafc">Светло-серый</option>
                <option value="#ebf8ff">Светло-синий</option>
                <option value="#f0fff4">Светло-зеленый</option>
            </select>
        </div>
        <div class="form-group">
            <label for="precision">Точность:</label>
            <input type="number" id="precision" value="6" min="1" max="10">
        </div>
        <div class="form-group">
            <label for="extrusionHeight">Высота 3D:</label>
            <input type="number" id="extrusionHeight" value="10" step="1" min="0.1" max="100">
        </div>
        <div class="form-group">
            <label for="modelColor">Цвет 3D модели:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="color" id="modelColor" value="#0077ff">
                <div class="color-preview" id="colorPreview" style="background-color: #0077ff;"></div>
            </div>
        </div>
        <div class="form-group">
            <label for="wireframe" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="wireframe">
                Каркасный режим
            </label>
        </div>
        <div class="form-group">
            <label for="showGrid" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="showGrid" checked>
                Показывать сетку
            </label>
        </div>
        <div class="form-group">
            <label for="showAxes" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="showAxes" checked>
                Показывать оси
            </label>
        </div>
    </div>
    <button class="btn" id="applySettingsBtn" style="margin-top: 20px; width: 100%;">
        <span class="btn-icon">💾</span> Применить настройки
    </button>
</div>