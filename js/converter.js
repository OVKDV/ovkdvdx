// js/converter.js
class DXFtoSVGConverter {
    constructor(options = {}) {
        this.options = {
            strokeWidth: options.strokeWidth || 0.1,
            strokeColor: options.strokeColor || '#000000',
            fillColor: options.fillColor || 'none',
            precision: options.precision || 6,
            ...options
        };
    }

    parseDXF(dxfText) {
        const lines = dxfText.split('\n');
        const entities = [];
        let currentEntity = null;
        let inEntity = false;
        
        for (let i = 0; i < lines.length; i++) {
            const code = lines[i].trim();
            const value = lines[i + 1] ? lines[i + 1].trim() : '';
            
            if (code === '0' && value === 'SECTION') {
                // Начало секции
            } 
            else if (code === '2' && value === 'ENTITIES') {
                // Начало секции entities
            }
            else if (code === '0' && (value === 'LWPOLYLINE' || value === 'POLYLINE')) {
                if (currentEntity) entities.push(currentEntity);
                currentEntity = {
                    type: value,
                    vertices: []
                };
                inEntity = true;
            }
            else if (code === '0' && inEntity && value === 'ENDSEC') {
                if (currentEntity) entities.push(currentEntity);
                currentEntity = null;
                inEntity = false;
            }
            else if (inEntity && currentEntity) {
                if (code === '10') { // X координата
                    const x = parseFloat(value);
                    const y = parseFloat(lines[i + 3] ? lines[i + 3].trim() : '0');
                    const bulge = parseFloat(lines[i + 5] ? lines[i + 5].trim() : '0');
                    
                    currentEntity.vertices.push({
                        x: x,
                        y: y,
                        bulge: bulge
                    });
                }
                else if (code === '90') { // Количество вершин
                    // Игнорируем, будем использовать фактические вершины
                }
            }
            
            i++; // Пропускаем значение
        }
        
        if (currentEntity) entities.push(currentEntity);
        return { entities };
    }

    processBulge(start, end, bulge) {
        if (bulge === 0) return null;
        
        const includedAngleRad = 4 * Math.atan(Math.abs(bulge));
        const includedAngleDeg = includedAngleRad * 180 / Math.PI;
        
        let actualAngleRad, useLargeArc;
        
        if (includedAngleDeg > 180) {
            actualAngleRad = 2 * Math.PI - includedAngleRad;
            useLargeArc = true;
        } else {
            actualAngleRad = includedAngleRad;
            useLargeArc = false;
        }
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const chord = Math.sqrt(dx * dx + dy * dy);
        
        if (chord === 0) return null;
        
        const radius = chord / (2 * Math.sin(actualAngleRad / 2));
        const distance = Math.sqrt(Math.max(0, radius * radius - (chord / 2) * (chord / 2)));
        
        const chordMidX = (start.x + end.x) / 2;
        const chordMidY = (start.y + end.y) / 2;
        const chordAngle = Math.atan2(dy, dx);
        const perpendicularAngle = chordAngle + Math.PI / 2;
        const direction = bulge > 0 ? 1 : -1;
        
        let centerX, centerY;
        if (useLargeArc) {
            centerX = chordMidX - distance * Math.cos(perpendicularAngle) * direction;
            centerY = chordMidY - distance * Math.sin(perpendicularAngle) * direction;
        } else {
            centerX = chordMidX + distance * Math.cos(perpendicularAngle) * direction;
            centerY = chordMidY + distance * Math.sin(perpendicularAngle) * direction;
        }
        
        return {
            center: { x: centerX, y: centerY },
            radius,
            startAngle: Math.atan2(start.y - centerY, start.x - centerX),
            endAngle: Math.atan2(end.y - centerY, end.x - centerX),
            direction: direction > 0 ? 'CCW' : 'CW',
            useLargeArc,
            includedAngleDeg
        };
    }

    convert(dxfText) {
        try {
            const parsed = this.parseDXF(dxfText);
            let allPaths = [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let stats = { totalArcs: 0, largeArcs: 0, lines: 0 };
            
            parsed.entities.forEach((entity) => {
                if ((entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') && 
                    entity.vertices && entity.vertices.length >= 2) {
                    
                    let pathData = '';
                    let firstPoint = true;
                    
                    for (let i = 0; i < entity.vertices.length - 1; i++) {
                        const start = entity.vertices[i];
                        const end = entity.vertices[i + 1];
                        const bulge = start.bulge || 0;
                        
                        if (firstPoint) {
                            pathData = `M ${this.formatNumber(start.x)} ${this.formatNumber(-start.y)}`;
                            firstPoint = false;
                        }
                        
                        if (bulge === 0) {
                            pathData += ` L ${this.formatNumber(end.x)} ${this.formatNumber(-end.y)}`;
                            stats.lines++;
                        } else {
                            stats.totalArcs++;
                            const arcInfo = this.processBulge(start, end, bulge);
                            
                            if (arcInfo) {
                                if (arcInfo.useLargeArc) stats.largeArcs++;
                                
                                let startAngle = arcInfo.startAngle;
                                let endAngle = arcInfo.endAngle;
                                
                                if (arcInfo.direction === 'CCW' && endAngle < startAngle) {
                                    endAngle += 2 * Math.PI;
                                } else if (arcInfo.direction === 'CW' && startAngle < endAngle) {
                                    startAngle += 2 * Math.PI;
                                }
                                
                                const angleDiff = Math.abs(endAngle - startAngle);
                                let steps;
                                
                                if (arcInfo.useLargeArc) {
                                    steps = Math.max(40, Math.ceil(angleDiff * 180 / Math.PI));
                                } else if (arcInfo.includedAngleDeg > 90) {
                                    steps = Math.max(20, Math.ceil(arcInfo.includedAngleDeg / 10));
                                } else {
                                    steps = Math.max(12, Math.ceil(arcInfo.includedAngleDeg / 15));
                                }
                                
                                const angleStep = (endAngle - startAngle) / steps;
                                
                                for (let s = 1; s <= steps; s++) {
                                    const angle = startAngle + angleStep * s;
                                    const x = arcInfo.center.x + arcInfo.radius * Math.cos(angle);
                                    const y = arcInfo.center.y + arcInfo.radius * Math.sin(angle);
                                    pathData += ` L ${this.formatNumber(x)} ${this.formatNumber(-y)}`;
                                    
                                    minX = Math.min(minX, x);
                                    minY = Math.min(minY, -y);
                                    maxX = Math.max(maxX, x);
                                    maxY = Math.max(maxY, -y);
                                }
                            }
                        }
                        
                        minX = Math.min(minX, start.x, end.x);
                        minY = Math.min(minY, -start.y, -end.y);
                        maxX = Math.max(maxX, start.x, end.x);
                        maxY = Math.max(maxY, -start.y, -end.y);
                    }
                    
                    if (pathData) {
                        allPaths.push({
                            d: pathData,
                            entityType: entity.type
                        });
                    }
                }
            });
            
            const width = maxX - minX || 100;
            const height = maxY - minY || 100;
            const padding = Math.max(width, height) * 0.05;
            
            const svg = this.generateSVG(allPaths, minX, minY, width, height, padding, stats);
            
            return {
                success: true,
                svg: svg,
                stats: stats,
                bounds: { minX, minY, maxX, maxY, width, height },
                paths: allPaths
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateSVG(paths, minX, minY, width, height, padding, stats) {
        const viewBox = `${this.formatNumber(minX - padding)} ${this.formatNumber(minY - padding)} ${this.formatNumber(width + 2 * padding)} ${this.formatNumber(height + 2 * padding)}`;
        
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
    <title>DXF to SVG Conversion</title>
    <style>
        path { 
            stroke: ${this.options.strokeColor}; 
            stroke-width: ${this.options.strokeWidth}; 
            fill: ${this.options.fillColor};
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .info-text {
            font-size: ${Math.max(width, height) * 0.02}px;
            fill: #666;
            font-family: Arial, sans-serif;
        }
    </style>\n`;
        
        paths.forEach((path, index) => {
            svg += `    <path id="path-${index}" d="${path.d}"/>\n`;
        });
        
        svg += `    <text class="info-text" x="${this.formatNumber(minX)}" y="${this.formatNumber(minY - padding/2)}">
        DXF → SVG | Дуги: ${stats.totalArcs} (больших: ${stats.largeArcs}) | Линий: ${stats.lines}
    </text>
</svg>`;
        
        return svg;
    }

    formatNumber(num) {
        return num.toFixed(this.options.precision);
    }

    downloadSVG(svgContent, filename = 'converted.svg') {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Экспорт для использования в браузере
if (typeof window !== 'undefined') {
    window.DXFtoSVGConverter = DXFtoSVGConverter;
}