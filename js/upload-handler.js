// js/upload-handler.js
class UploadHandler {
    constructor(container) {
        this.container = container;
        this.uploadArea = null;
        this.fileInput = null;
        this.selectFileBtn = null;
        this.fileInfo = null;
        this.fileName = null;
        this.fileSize = null;
        this.convertBtn = null;
        
        this.currentFile = null;
        
        this.init();
    }
    
    init() {
        this.findElements();
        this.bindEvents();
    }
    
    findElements() {
        this.uploadArea = this.container.querySelector('#uploadArea');
        this.fileInput = this.container.querySelector('#fileInput');
        this.selectFileBtn = this.container.querySelector('#selectFileBtn');
        this.fileInfo = this.container.querySelector('#fileInfo');
        this.fileName = this.container.querySelector('#fileName');
        this.fileSize = this.container.querySelector('#fileSize');
        this.convertBtn = this.container.querySelector('#convertBtn');
    }
    
    bindEvents() {
        if (!this.selectFileBtn) return;
        
        // Клик по кнопке выбора файла
        this.selectFileBtn.addEventListener('click', () => {
            if (this.fileInput) {
                this.fileInput.click();
            }
        });
        
        // Выбор файла через input
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }
        
        // Drag and drop
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            });
            
            this.uploadArea.addEventListener('dragleave', () => {
                this.uploadArea.classList.remove('dragover');
            });
            
            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileSelect(e.dataTransfer.files[0]);
                }
            });
            
            // Клик по области загрузки
            this.uploadArea.addEventListener('click', (e) => {
                if (e.target === this.uploadArea && this.fileInput) {
                    this.fileInput.click();
                }
            });
        }
        
        // Кнопка конвертации
        if (this.convertBtn) {
            this.convertBtn.addEventListener('click', () => {
                if (window.app && typeof window.app.convertFile === 'function') {
                    window.app.convertFile();
                }
            });
        }
    }
    
    handleFileSelect(file) {
        // Проверка расширения
        if (!file.name.toLowerCase().endsWith('.dxf')) {
            this.showNotification('Пожалуйста, выберите файл с расширением .dxf', 'error');
            return;
        }
        
        // Проверка размера
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showNotification(`Файл слишком большой. Максимальный размер: ${Math.floor(maxSize / 1024 / 1024)} MB`, 'error');
            return;
        }
        
        this.currentFile = file;
        
        // Показываем информацию о файле
        if (this.fileName) {
            this.fileName.textContent = file.name;
        }
        if (this.fileSize) {
            this.fileSize.textContent = this.formatBytes(file.size);
        }
        if (this.fileInfo) {
            this.fileInfo.classList.add('active');
        }
        
        // Сбрасываем предыдущие результаты
        this.resetPreview();
        
        console.log('Файл выбран:', file.name);
    }
    
    resetPreview() {
        if (window.app && typeof window.app.resetPreview === 'function') {
            window.app.resetPreview();
        }
    }
    
    getCurrentFile() {
        return this.currentFile;
    }
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
}