// js/3d-viewer.js
class DXFto3DViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            extrusionHeight: options.extrusionHeight || 10,
            color: options.color || 0x0077ff,
            wireframe: options.wireframe || false,
            showGrid: options.showGrid !== undefined ? options.showGrid : true,
            showAxes: options.showAxes !== undefined ? options.showAxes : true,
            ...options
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.gridHelper = null;
        this.axesHelper = null;
        
        this.init();
    }
    
    init() {
        // Создаем сцену
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Создаем камеру
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(100, 100, 100);
        
        // Создаем рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.container,
            antialias: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Элементы управления
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        // Сетка для ориентира
        this.gridHelper = new THREE.GridHelper(200, 20);
        this.gridHelper.visible = this.options.showGrid;
        this.scene.add(this.gridHelper);
        
        // Оси координат
        this.axesHelper = new THREE.AxesHelper(50);
        this.axesHelper.visible = this.options.showAxes;
        this.scene.add(this.axesHelper);
        
        // Обработка изменения размера
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Анимация
        this.animate();
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    createFromSVGPaths(svgPaths) {
        // Очищаем предыдущие объекты (кроме помощников и света)
        this.scene.children = this.scene.children.filter(child => 
            child instanceof THREE.GridHelper || 
            child instanceof THREE.AxesHelper ||
            child instanceof THREE.AmbientLight ||
            child instanceof THREE.DirectionalLight ||
            child instanceof THREE.DirectionalLight
        );
        
        if (svgPaths.length === 0) return;
        
        // Материал
        const material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            side: THREE.DoubleSide,
            wireframe: this.options.wireframe
        });
        
        let hasValidPaths = false;
        
        // Для каждого пути создаем экструдированную форму
        svgPaths.forEach((path, index) => {
            if (path.d && path.d.trim()) {
                try {
                    const shape = this.createShapeFromPath(path.d);
                    if (shape && shape.getPoints().length > 0) {
                        const geometry = new THREE.ExtrudeGeometry(shape, {
                            depth: this.options.extrusionHeight,
                            bevelEnabled: false
                        });
                        
                        const mesh = new THREE.Mesh(geometry, material);
                        
                        // Центрируем по Z
                        mesh.position.z = -this.options.extrusionHeight / 2;
                        
                        // Для разных полилиний немного смещаем
                        mesh.position.z += index * 0.05;
                        
                        this.scene.add(mesh);
                        hasValidPaths = true;
                    }
                } catch (error) {
                    console.warn(`Ошибка при создании формы для пути ${index}:`, error);
                }
            }
        });
        
        if (hasValidPaths) {
            this.fitCameraToObject();
        }
    }
    
    createShapeFromPath(pathData) {
        const shape = new THREE.Shape();
        const commands = pathData.match(/[A-Z][^A-Z]*/g) || [];
        
        let firstPoint = null;
        let currentPoint = { x: 0, y: 0 };
        let isFirstCommand = true;
        
        commands.forEach(command => {
            const type = command[0];
            const coords = command.substring(1).trim().split(/[\s,]+/).filter(c => c !== '').map(Number);
            
            switch(type) {
                case 'M': // Move to
                    if (coords.length >= 2) {
                        currentPoint.x = coords[0];
                        currentPoint.y = -coords[1]; // Инвертируем Y для Three.js
                        if (isFirstCommand) {
                            shape.moveTo(currentPoint.x, currentPoint.y);
                            firstPoint = { ...currentPoint };
                            isFirstCommand = false;
                        }
                    }
                    break;
                    
                case 'L': // Line to
                    if (coords.length >= 2) {
                        currentPoint.x = coords[0];
                        currentPoint.y = -coords[1];
                        shape.lineTo(currentPoint.x, currentPoint.y);
                    }
                    break;
                    
                case 'C': // Curve to (Безье)
                case 'Q': // Quadratic curve
                case 'A': // Arc
                    // Для упрощения, преобразуем в линии (первые 2 точки)
                    if (coords.length >= 2) {
                        currentPoint.x = coords[coords.length - 2];
                        currentPoint.y = -coords[coords.length - 1];
                        shape.lineTo(currentPoint.x, currentPoint.y);
                    }
                    break;
                    
                case 'Z': // Close path
                    if (firstPoint) {
                        shape.lineTo(firstPoint.x, firstPoint.y);
                    }
                    break;
            }
        });
        
        return shape;
    }
    
    fitCameraToObject() {
        // Собираем все меши (кроме помощников и света)
        const objects = this.scene.children.filter(child => 
            !(child instanceof THREE.GridHelper || 
              child instanceof THREE.AxesHelper ||
              child instanceof THREE.AmbientLight ||
              child instanceof THREE.DirectionalLight)
        );
        
        if (objects.length === 0) return;
        
        const box = new THREE.Box3();
        objects.forEach(obj => {
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                box.expandByPoint(obj.geometry.boundingBox.min);
                box.expandByPoint(obj.geometry.boundingBox.max);
            }
        });
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Вычисляем расстояние для камеры
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
        
        // Добавляем отступ
        cameraZ *= 1.2;
        
        this.camera.position.set(center.x, center.y + cameraZ * 0.7, center.z + cameraZ * 0.7);
        this.camera.lookAt(center);
        
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    updateOptions(options) {
        Object.assign(this.options, options);
        
        // Обновляем видимость помощников
        if (this.gridHelper) this.gridHelper.visible = this.options.showGrid;
        if (this.axesHelper) this.axesHelper.visible = this.options.showAxes;
        
        // Обновляем материал для всех мешей
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat instanceof THREE.MeshPhongMaterial) {
                            mat.color.setHex(this.options.color);
                            mat.wireframe = this.options.wireframe;
                        }
                    });
                } else if (child.material instanceof THREE.MeshPhongMaterial) {
                    child.material.color.setHex(this.options.color);
                    child.material.wireframe = this.options.wireframe;
                }
            }
        });
    }
    
    clearScene() {
        this.scene.children = this.scene.children.filter(child => 
            child instanceof THREE.GridHelper || 
            child instanceof THREE.AxesHelper ||
            child instanceof THREE.AmbientLight ||
            child instanceof THREE.DirectionalLight
        );
    }
}

// Экспорт для использования в браузере
if (typeof window !== 'undefined') {
    window.DXFto3DViewer = DXFto3DViewer;
}