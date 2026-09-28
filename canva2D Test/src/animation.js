// Simple deterministic Pseudo-Random Number Generator (LCG)
class PRNG {
    constructor(seed) {
        this.seed = seed;
    }
    
    // Returns a float between 0 and 1
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    // Range between min and max
    range(min, max) {
        return min + this.next() * (max - min);
    }
}

const config = {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInSeconds: 2 // Short duration for testing
};

// Expose configuration so Playwright can read it
window.animationConfig = config;

// Setup Canvas
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

canvas.width = config.width;
canvas.height = config.height;

/**
 * Called by Playwright to render a specific frame
 * @param {number} frame - Current frame number (0 to totalFrames - 1)
 */
window.renderFrame = function(frame) {
    const time = frame / config.fps;
    
    // Create a new PRNG instance seeded by the frame number 
    // to ensure deterministic randomness per frame if needed,
    // or seed by a global seed if we want continuous randomness over time.
    // For motion graphics, usually we derive animations directly from time.
    const rng = new PRNG(42 + frame);

    // Clear background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, config.width, config.height);

    // Calculate animation properties
    // Let's do a simple rotating and oscillating square
    const cx = config.width / 2;
    const cy = config.height / 2;
    
    // 1 cycle per second
    const phase = (time % 1) * Math.PI * 2;
    
    const xOffset = Math.sin(phase) * 400;
    const yOffset = Math.cos(phase * 2) * 200;
    
    const size = 200 + Math.sin(time * Math.PI * 2) * 50;
    const rotation = time * Math.PI * 0.5;

    // Draw
    ctx.save();
    ctx.translate(cx + xOffset, cy + yOffset);
    ctx.rotate(rotation);
    
    // Deterministic random color based on frame
    const r = Math.floor(rng.range(100, 255));
    const g = Math.floor(rng.range(100, 255));
    const b = Math.floor(rng.range(100, 255));
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    
    ctx.restore();
    
    // Draw frame counter
    ctx.fillStyle = '#fff';
    ctx.font = '48px monospace';
    ctx.fillText(`Frame: ${frame}`, 50, 80);
    ctx.fillText(`Time:  ${time.toFixed(3)}s`, 50, 140);
};

// For local testing (optional, not used by final renderer)
window.testPreview = function() {
    let frame = 0;
    setInterval(() => {
        window.renderFrame(frame);
        frame = (frame + 1) % (config.fps * config.durationInSeconds);
    }, 1000 / config.fps);
};

// window.testPreview();
