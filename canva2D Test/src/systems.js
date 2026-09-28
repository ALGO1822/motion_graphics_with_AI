import { Vec2, random, noise2D, Easing } from './math.js';

export class Node {
    constructor(id, type, total) {
        this.id = id;
        this.type = type; // 0 = Student (mobile/fragment), 1 = Room/Slot (backend/structure)
        
        // Initial random positions
        this.pos = new Vec2(random.range(100, 1820), random.range(100, 980));
        this.vel = new Vec2(0, 0);
        
        // Colors
        if (this.type === 0) {
            this.baseColor = `hsla(${random.range(190, 220)}, 90%, 70%, 1)`; // Cyan/Blue
            this.size = random.range(1.5, 3);
        } else {
            this.baseColor = `hsla(${random.range(30, 50)}, 90%, 60%, 1)`; // Orange/Gold
            this.size = random.range(3, 5);
        }
        
        // Target positions for COMPLEXITY (Isometric grid)
        const gridCols = this.type === 0 ? 40 : 20;
        const index = this.type === 0 ? id : id - (total * 0.7);
        const gx = (index % gridCols);
        const gy = Math.floor(index / gridCols);
        
        // Iso math
        const isoX = (gx - gy) * 30 + 960;
        const isoY = (gx + gy) * 15 + (this.type === 0 ? 200 : 600);
        this.gridPos = new Vec2(isoX, isoY);
        
        // Target positions for SYNTHESIS (Unified sphere/ring)
        const phi = Math.acos(-1 + (2 * id) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        const r = 350;
        
        // Project 3D sphere to 2D
        const sx = r * Math.cos(theta) * Math.sin(phi);
        const sy = r * Math.sin(theta) * Math.sin(phi);
        const sz = r * Math.cos(phi);
        
        const scale = 800 / (800 + sz);
        this.synthPos = new Vec2(960 + sx * scale, 540 + sy * scale);
        
        // Which node is this connected to in the "solution"
        this.targetNodeId = -1; 
    }
    
    update(time, phase, phaseProgress) {
        let target = null;
        let force = 0;
        let friction = 0.9;
        
        if (phase === 'FRAGMENTATION') {
            // Wander aimlessly
            const nx = noise2D(this.pos.x * 0.002, time * 0.2 + this.id) * 2 - 1;
            const ny = noise2D(this.pos.y * 0.002, time * 0.2 - this.id) * 2 - 1;
            this.vel = this.vel.add(new Vec2(nx, ny).mult(0.5));
            friction = 0.95;
            
        } else if (phase === 'DISCOVERY') {
            // Flow towards the center, beginning to organize
            const angle = noise2D(this.pos.x * 0.003, this.pos.y * 0.003 + time * 0.5) * Math.PI * 4;
            let dir = new Vec2(Math.cos(angle), Math.sin(angle)).mult(1.5);
            
            // Gentle pull to center
            const centerPull = new Vec2(960, 540).sub(this.pos).normalize().mult(0.2 * phaseProgress);
            this.vel = this.vel.add(dir).add(centerPull);
            friction = 0.92;
            
        } else if (phase === 'COMPLEXITY') {
            // Move into the rigid isometric backend structure
            target = this.gridPos;
            force = 0.1 * Easing.easeInOutCubic(phaseProgress);
            friction = 0.85;
            
        } else if (phase === 'INSTABILITY') {
            // The optimization constraint solver struggles - violent noise applied to the grid
            const warpX = noise2D(this.gridPos.x * 0.015 + time * 3, this.gridPos.y * 0.015) * 300 * Easing.easeInQuad(phaseProgress);
            const warpY = noise2D(this.gridPos.x * 0.015, this.gridPos.y * 0.015 + time * 3) * 300 * Easing.easeInQuad(phaseProgress);
            target = new Vec2(this.gridPos.x + warpX, this.gridPos.y + warpY);
            force = 0.2;
            friction = 0.7;
            
        } else if (phase === 'SYNTHESIS') {
            // Resolves into the final unified geometry
            target = this.synthPos;
            force = 0.15 * Easing.easeOutExpo(phaseProgress);
            friction = 0.8;
            
            // Add a slow rotation to the synthesis pos based on time
            const cx = 960, cy = 540;
            const dx = this.synthPos.x - cx;
            const dy = this.synthPos.y - cy;
            const angle = time * 0.2;
            const rotX = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
            const rotY = cy + dx * Math.sin(angle) + dy * Math.cos(angle);
            target = new Vec2(rotX, rotY);
        }
        
        if (target) {
            const diff = target.sub(this.pos);
            this.vel = this.vel.add(diff.mult(force));
        }
        
        this.vel = this.vel.mult(friction);
        this.pos = this.pos.add(this.vel);
        
        // Wrap only in early phases
        if (phase === 'FRAGMENTATION') {
            if (this.pos.x < -50) this.pos.x = 1970;
            if (this.pos.x > 1970) this.pos.x = -50;
            if (this.pos.y < -50) this.pos.y = 1130;
            if (this.pos.y > 1130) this.pos.y = -50;
        }
    }
    
    draw(ctx, time, phase, phaseProgress) {
        ctx.fillStyle = this.baseColor;
        
        let currentSize = this.size;
        if (phase === 'INSTABILITY') {
            currentSize *= 1.0 + Math.random() * 0.5 * phaseProgress;
        } else if (phase === 'SYNTHESIS') {
            currentSize = this.size * 0.8;
        }
        
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class SystemManager {
    constructor() {
        this.nodes = [];
        const TOTAL = 800; // Increased for better visual density
        const NUM_STUDENTS = Math.floor(TOTAL * 0.7);
        
        for (let i = 0; i < TOTAL; i++) {
            const type = i < NUM_STUDENTS ? 0 : 1;
            const node = new Node(i, type, TOTAL);
            this.nodes.push(node);
        }
        
        // Pre-calculate synthetic connections to represent the "solved" state
        // Each student connects to 1 room, rooms connect to each other.
        this.connections = [];
        for (let i = 0; i < NUM_STUDENTS; i++) {
            const roomIndex = NUM_STUDENTS + (i % (TOTAL - NUM_STUDENTS));
            this.nodes[i].targetNodeId = roomIndex;
            this.connections.push([i, roomIndex]);
        }
        
        // Room interconnections for structure
        for (let i = NUM_STUDENTS; i < TOTAL; i++) {
            if (i < TOTAL - 1) this.connections.push([i, i + 1]);
            if (i < TOTAL - 10) this.connections.push([i, i + 10]);
        }
    }
    
    update(time, phase, phaseProgress) {
        for (const node of this.nodes) {
            node.update(time, phase, phaseProgress);
        }
    }
    
    draw(ctx, time, phase, phaseProgress) {
        // Draw lines
        ctx.lineWidth = 1.0;
        
        if (phase === 'FRAGMENTATION') {
            // Draw random short proximity lines to show isolated fragments
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, 0.1)`;
            for(let i=0; i<this.nodes.length; i+=3) {
                for(let j=i+1; j<i+4 && j<this.nodes.length; j++) {
                    if (this.nodes[i].pos.dist(this.nodes[j].pos) < 100) {
                        ctx.moveTo(this.nodes[i].pos.x, this.nodes[i].pos.y);
                        ctx.lineTo(this.nodes[j].pos.x, this.nodes[j].pos.y);
                    }
                }
            }
            ctx.stroke();
            
        } else if (phase === 'DISCOVERY') {
            // Lines start searching for targets
            ctx.beginPath();
            const opacity = 0.2 * phaseProgress;
            ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
            for(let i=0; i<this.nodes.length; i+=2) {
                const n1 = this.nodes[i];
                // Project a line along velocity
                const dest = n1.pos.add(n1.vel.mult(15));
                ctx.moveTo(n1.pos.x, n1.pos.y);
                ctx.lineTo(dest.x, dest.y);
            }
            ctx.stroke();
            
        } else if (phase === 'COMPLEXITY') {
            // Drawing the structured connections
            const opacity = 0.15 + 0.2 * phaseProgress;
            
            ctx.beginPath();
            for (const [i, j] of this.connections) {
                // Only draw a subset of connections based on progress to simulate "building"
                if ((i * 13) % 100 < phaseProgress * 100) {
                    const n1 = this.nodes[i];
                    const n2 = this.nodes[j];
                    
                    // Color based on type
                    if (n1.type === 1 && n2.type === 1) {
                        ctx.strokeStyle = `rgba(255, 150, 50, ${opacity * 1.5})`;
                    } else {
                        ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
                    }
                    
                    ctx.moveTo(n1.pos.x, n1.pos.y);
                    ctx.lineTo(n2.pos.x, n2.pos.y);
                }
            }
            ctx.stroke();
            
        } else if (phase === 'INSTABILITY') {
            // Chaotic testing of connections
            ctx.beginPath();
            for (let k = 0; k < 400; k++) {
                const i = Math.floor(random.range(0, this.nodes.length));
                const j = Math.floor(random.range(0, this.nodes.length));
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];
                
                // Red/Orange flashes
                ctx.strokeStyle = `rgba(255, ${random.range(50, 150)}, 50, ${random.range(0.1, 0.4)})`;
                ctx.moveTo(n1.pos.x, n1.pos.y);
                
                // Jagged line
                const mid = n1.pos.lerp(n2.pos, 0.5);
                mid.x += (Math.random() - 0.5) * 100;
                mid.y += (Math.random() - 0.5) * 100;
                
                ctx.lineTo(mid.x, mid.y);
                ctx.lineTo(n2.pos.x, n2.pos.y);
            }
            ctx.stroke();
            
            // Also draw the base structure weakly
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 200, 255, 0.1)`;
            for (const [i, j] of this.connections) {
                ctx.moveTo(this.nodes[i].pos.x, this.nodes[i].pos.y);
                ctx.lineTo(this.nodes[j].pos.x, this.nodes[j].pos.y);
            }
            ctx.stroke();
            
        } else if (phase === 'SYNTHESIS') {
            // The perfect solution
            const opacity = 0.3 * (1 - Easing.easeOutQuad(phaseProgress)) + 0.1;
            
            ctx.beginPath();
            for (const [i, j] of this.connections) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];
                
                const dist = n1.pos.dist(n2.pos);
                if (dist < 400) { // Culling long lines in the sphere projection
                    const alpha = (1 - dist / 400) * opacity;
                    ctx.strokeStyle = `rgba(150, 220, 255, ${alpha})`;
                    ctx.moveTo(n1.pos.x, n1.pos.y);
                    ctx.lineTo(n2.pos.x, n2.pos.y);
                }
            }
            ctx.stroke();
        }
        
        // Draw nodes
        for (const node of this.nodes) {
            node.draw(ctx, time, phase, phaseProgress);
        }
    }
}
