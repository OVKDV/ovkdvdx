// js/main.js
class DXFConverterApp {
    constructor() {
        this.converter = null;
        this.viewer3d = null;
        this.conversionResult = null;
        this.uploadHandler = null;
        
        this.currentFile = null;
        this.currentTab = 'upload';
        this.currentView = 'svg';
        
        this.init();
    }
    
    async init() {
        await this.bindGlobalEvents();
        this.initConverter();
        await this.loadTabContent('upload');
        
        console.log('DXF Converter App initialized');
    }
    
    async bindGlobalEvents() {
        // Переключение табов - делегирование событий
        document.addEventListener('click', (e) => {
            // Переключение табов
            if (e.target.matches('.tab-btn')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
            
            // Переключение видов (2D/3D)
            if (e.target.matches('.view-btn')) {
                const viewName = e.target.dataset.view;
                this.switchView(viewName);
            }
            
            // Кнопка применения настроек
            if (e.target.matches('#applySettingsBtn')) {
                this.applySettings();
            }
            
            // Кнопка скачивания
            if (e.target.matches('#downloadBtn')) {
                this.downloadSVG();
            }
            
            // Кнопка копирования
            if (e.target.matches('#copyBtn')) {
                this.copySVGCode();
            }
        });
        
        // Обновление цвета в превью
        document.addEventListener('input', (e) => {
            if (e.target.matches('#modelColor')) {
                const preview = document.getElementById('colorPreview');
                if (preview) {
                    preview.style.backgroundColor = e.target.value;
                }
            }
        });
    }
    
    initConverter() {
        const strokeWidthInput = document.getElementById('strokeWidth');
        const strokeColorInput = document.getElementById('strokeColor');
        const fillColorInput = document.getElementById('fillColor');
        const precisionInput = document.getElementById('precision');
        
        this.converter = new DXFtoSVGConverter({
            strokeWidth: strokeWidthInput ? parseFloat(strokeWidthInput.value) : 0.1,
            strokeColor: strokeColorInput ? strokeColorInput.value : '#000000',
            fillColor: fillColorInput ? fillColorInput.value : 'none',
            precision: precisionInput ? parseInt(precisionInput.value) : 6
        });
    }
    
    init3DViewer() {
        if (!this.viewer3d) {
            const extrusionHeightInput = document.getElementById('extrusionHeight');
            const modelColorInput = document.getElementById('modelColor');
            const wireframeInput = document.getElementById('wireframe');
            const showGridInput = document.getElementById('showGrid');
            const showAxesInput = document.getElementById('showAxes');
            
            this.viewer3d = new DXFto3DViewer('canvas3d', {
                extrusionHeight: extrusionHeightInput ? parseFloat(extrusionHeightInput.value) : 10,
                color: modelColorInput ? parseInt(modelColorInput.value.replace('#', '0x')) : 0x0077ff,
                wireframe: wireframeInput ? wireframeInput.checked : false,
                showGrid: showGridInput ? showGridInput.checked : true,
                showAxes: showAxesInput ? showAxesInput.checked : true
            });
            
            const placeholder3d = document.getElementById('placeholder3d');
            if (placeholder3d) {
                placeholder3d.style.display = 'none';
            }
        }
    }
    
    async loadTabContent(tabName) {
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;
        
        try {
            // Показываем индикатор загрузки
            tabContent.innerHTML = '<div class="loading-indicator">Загрузка...</div>';
            
            // Загружаем контент таба
            const response = await fetch(`components/${tabName}-panel.php`);
            const content = await response.text();
            
            tabContent.innerHTML = content;
            
            // Обновляем активный таб
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            
            // Реинициализируем компоненты таба
            await this.reinitializeTabComponents(tabName);
            
        } catch (error) {
            console.error('Ошибка загрузки таба:', error);
            tabContent.innerHTML = '<div class="error-message">Ошибка загрузки контента</div>';
        }
    }
    
    async reinitializeTabComponents(tabName) {
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;
        
        switch(tabName) {
            case 'upload':
                // Переинициализация обработчика загрузки
                this.uploadHandler = new UploadHandler(tabContent);
                break;
            case 'settings':
                // Привязка событий для настроек уже сделана через делегирование
                break;
        }
    }
    
    async switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        this.currentTab = tabName;
        await this.loadTabContent(tabName);
    }
    
    switchView(viewName) {
        if (this.currentView === viewName) return;
        
        this.currentView = viewName;
        
        // Обновляем активные кнопки
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        // Переключаем контейнеры
        const svgPreview = document.getElementById('svg-preview');
        const threePreview = document.getElementById('3d-preview');
        
        if (svgPreview) svgPreview.classList.toggle('active', viewName === 'svg');
        if (threePreview) threePreview.classList.toggle('active', viewName === '3d');
        
        // Инициализируем 3D вьювер если нужно
        if (viewName === '3d') {
            this.init3DViewer();
        }
    }
    
    async convertFile() {
        let file;
        
        if (this.uploadHandler) {
            file = this.uploadHandler.getCurrentFile();
        }
        
        if (!file) {
            this.showNotification('Пожалуйста, выберите DXF файл', 'error');
            return;
        }
        
        try {
            // Показываем индикатор загрузки
            this.showLoading('Конвертация DXF в SVG...');
            
            // Читаем файл
            const fileContent = await this.readFileAsText(file);
            
            // Инициализируем конвертер с текущими настройками
            this.initConverter();
            
            // Конвертируем
            const startTime = performance.now();
            this.conversionResult = this.converter.convert(fileContent);
            const endTime = performance.now();
            
            if (this.conversionResult.success) {
                // Показываем 2D результат
                this.showSVGResult(this.conversionResult.svg);
                
                // Обновляем статистику
                this.updateStats(this.conversionResult.stats);
                
                // Активируем кнопки
                const downloadBtn = document.getElementById('downloadBtn');
                const copyBtn = document.getElementById('copyBtn');
                
                if (downloadBtn) downloadBtn.disabled = false;
                if (copyBtn) copyBtn.disabled = false;
                
                // Обновляем 3D вид, если он активен
                if (this.currentView === '3d') {
                    this.init3DViewer();
                }
                
                if (this.viewer3d && this.conversionResult.paths && this.conversionResult.paths.length > 0) {
                    this.viewer3d.createFromSVGPaths(this.conversionResult.paths);
                    const placeholder3d = document.getElementById('placeholder3d');
                    if (placeholder3d) {
                        placeholder3d.style.display = 'none';
                    }
                }
                
                console.log('Конвертация успешна!', {
                    время: `${(endTime - startTime).toFixed(2)} мс`,
                    дуги: this.conversionResult.stats.totalArcs,
                    большиеДуги: this.conversionResult.stats.largeArcs,
                    линии: this.conversionResult.stats.lines,
                    пути: this.conversionResult.paths.length
                });
                
                this.showNotification('Файл успешно сконвертирован!', 'info');
                
            } else {
                throw new Error(this.conversionResult.error);
            }
            
        } catch (error) {
            console.error('Ошибка конвертации:', error);
            this.showNotification('Ошибка конвертации: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    applySettings() {
        this.initConverter();
        
        // Обновляем цвет в превью
        const colorPreview = document.getElementById('colorPreview');
        const modelColor = document.getElementById('modelColor');
        if (colorPreview && modelColor) {
            colorPreview.style.backgroundColor = modelColor.value;
        }
        
        // Обновляем 3D вьювер
        if (this.viewer3d) {
            const extrusionHeightInput = document.getElementById('extrusionHeight');
            const modelColorInput = document.getElementById('modelColor');
            const wireframeInput = document.getElementById('wireframe');
            const showGridInput = document.getElementById('showGrid');
            const showAxesInput = document.getElementById('showAxes');
            
            this.viewer3d.updateOptions({
                extrusionHeight: extrusionHeightInput ? parseFloat(extrusionHeightInput.value) : 10,
                color: modelColorInput ? parseInt(modelColorInput.value.replace('#', '0x')) : 0x0077ff,
                wireframe: wireframeInput ? wireframeInput.checked : false,
                showGrid: showGridInput ? showGridInput.checked : true,
                showAxes: showAxesInput ? showAxesInput.checked : true
            });
            
            // Если есть конвертированные пути, пересоздаем с новыми настройками
            if (this.conversionResult && this.conversionResult.paths) {
                this.viewer3d.createFromSVGPaths(this.conversionResult.paths);
            }
        }
        
        this.showNotification('Настройки применены!', 'info');
    }
    
    showSVGResult(svgContent) {
        const svgOutput = document.getElementById('svgOutput');
        const placeholder = document.getElementById('placeholder');
        const stats = document.getElementById('stats');
        
        if (placeholder) placeholder.style.display = 'none';
        if (svgOutput) svgOutput.innerHTML = svgContent;
        if (stats) stats.style.display = 'grid';
        
        // Масштабируем SVG для превью
        const svgElement = svgOutput?.querySelector('svg');
        if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
        }
    }
    
    updateStats(stats) {
        const statArcs = document.getElementById('statArcs');
        const statLargeArcs = document.getElementById('statLargeArcs');
        const statLines = document.getElementById('statLines');
        
        if (statArcs) statArcs.textContent = stats.totalArcs;
        if (statLargeArcs) statLargeArcs.textContent = stats.largeArcs;
        if (statLines) statLines.textContent = stats.lines;
    }
    
    downloadSVG() {
        if (!this.conversionResult || !this.conversionResult.svg) {
            this.showNotification('Сначала сконвертируйте файл', 'error');
            return;
        }
        
        let filename = 'converted.svg';
        
        if (this.uploadHandler && this.uploadHandler.currentFile) {
            filename = this.uploadHandler.currentFile.name.replace('.dxf', '.svg');
        }
        
        this.converter.downloadSVG(this.conversionResult.svg, filename);
    }
    
    async copySVGCode() {
        if (!this.conversionResult || !this.conversionResult.svg) {
            this.showNotification('Сначала сконвертируйте файл', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.conversionResult.svg);
            
            const copyBtn = document.getElementById('copyBtn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="btn-icon">✅</span> Скопировано!';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
            
        } catch (err) {
            console.error('Ошибка копирования:', err);
            this.showNotification('Не удалось скопировать код', 'error');
        }
    }
    
    resetPreview() {
        const placeholder = document.getElementById('placeholder');
        const svgOutput = document.getElementById('svgOutput');
        const stats = document.getElementById('stats');
        const downloadBtn = document.getElementById('downloadBtn');
        const copyBtn = document.getElementById('copyBtn');
        const placeholder3d = document.getElementById('placeholder3d');
        
        if (placeholder) placeholder.style.display = 'flex';
        if (svgOutput) svgOutput.innerHTML = '';
        if (stats) stats.style.display = 'none';
        if (downloadBtn) downloadBtn.disabled = true;
        if (copyBtn) copyBtn.disabled = true;
        if (placeholder3d) placeholder3d.style.display = 'flex';
        
        if (this.viewer3d) {
            this.viewer3d.clearScene();
        }
        
        this.conversionResult = null;
    }
    
    showLoading(text = 'Загрузка...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = text;
            loadingOverlay.classList.add('active');
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type, 'show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    async loadAjaxContent(url, targetId) {
        try {
            const response = await fetch(url);
            const content = await response.text();
            
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = content;
            }
        } catch (error) {
            console.error('Ошибка загрузки AJAX:', error);
            this.showNotification('Ошибка загрузки контента', 'error');
        }
    }
}

// Инициализация при полной загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.app = new DXFConverterApp();
    
    // Глобальная функция для сброса превью
    window.resetPreview = () => {
        if (window.app) {
            window.app.resetPreview();
        }
    };
});