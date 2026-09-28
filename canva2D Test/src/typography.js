export class TypographySystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
    }

    // Draw some stylized text to an offscreen canvas
    renderText(text, x, y, size, alpha, tracking = 0) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.font = `bold ${size}px "Courier New", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Custom tracking (letter-spacing)
        if (tracking > 0) {
            let currentX = x - ((text.length - 1) * tracking + this.ctx.measureText(text).width) / 2;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                this.ctx.fillText(char, currentX + this.ctx.measureText(char).width / 2, y);
                currentX += this.ctx.measureText(char).width + tracking;
            }
        } else {
            this.ctx.fillText(text, x, y);
        }
        
        return this.canvas;
    }
    
    // Abstract grid of words for background
    renderBackgroundCode(time, alpha) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
        this.ctx.font = '12px monospace';
        
        const words = ['FLUTTER', 'GO', 'NODE', 'OPTIMIZATION', 'STATE', 'POSTGRES', 'SYS', 'ALLOCATE', 'RESOLVE', 'COMPUTE', 'CONSTRAINT', 'GRAPH', 'DATA', 'ROUTING'];
        
        for (let i = 0; i < 80; i++) {
            const x = (i * 137 + time * 20) % this.width;
            const y = (i * 93 + time * 10) % this.height;
            const word = words[i % words.length];
            this.ctx.fillText(word, x, y);
        }
        return this.canvas;
    }
}
