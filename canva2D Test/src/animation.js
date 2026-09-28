import { SystemManager } from './systems.js';
import { TypographySystem } from './typography.js';
import { Easing, noise2D } from './math.js';

const config = {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInSeconds: 10
};
window.animationConfig = config;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false }); // Better performance if no transparency needed for the main canvas

canvas.width = config.width;
canvas.height = config.height;

// Global state
let systemManager = null;
let typoSystem = null;

function init() {
    systemManager = new SystemManager();
    typoSystem = new TypographySystem(config.width, config.height);
}

// Map time to phase
function getPhase(time) {
    if (time < 2.0) return { name: 'FRAGMENTATION', progress: time / 2.0 };
    if (time < 4.0) return { name: 'DISCOVERY', progress: (time - 2.0) / 2.0 };
    if (time < 6.0) return { name: 'COMPLEXITY', progress: (time - 4.0) / 2.0 };
    if (time < 8.0) return { name: 'INSTABILITY', progress: (time - 6.0) / 2.0 };
    return { name: 'SYNTHESIS', progress: Math.min((time - 8.0) / 2.0, 1.0) };
}

window.renderFrame = function(frame) {
    if (frame === 0 || !systemManager) {
        init();
    }
    
    const time = frame / config.fps;
    const { name: phaseName, progress: phaseProgress } = getPhase(time);
    
    // Update logic
    systemManager.update(time, phaseName, phaseProgress);
    
    // Trail effect using an offscreen canvas or just semi-transparent black rect
    // We will use a trailing rect for simple glow and persistence
    ctx.globalCompositeOperation = 'source-over';
    
    // During INSTABILITY, trails get longer (less fade)
    let alpha = 0.2;
    if (phaseName === 'INSTABILITY') alpha = 0.05 + 0.15 * (1 - phaseProgress);
    if (phaseName === 'SYNTHESIS') alpha = 0.3; // Clean up the mess faster
    
    ctx.fillStyle = `rgba(10, 12, 16, ${alpha})`;
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Draw background text layer
    ctx.globalCompositeOperation = 'screen';
    let textAlpha = 0;
    if (phaseName === 'COMPLEXITY') textAlpha = 0.1 * Easing.easeInQuad(phaseProgress);
    if (phaseName === 'INSTABILITY') textAlpha = 0.1 + noise2D(time*5, 0) * 0.1;
    if (phaseName === 'SYNTHESIS') textAlpha = 0.05 * (1 - Easing.easeOutQuad(phaseProgress));
    
    if (textAlpha > 0) {
        const bgCanvas = typoSystem.renderBackgroundCode(time, textAlpha);
        ctx.drawImage(bgCanvas, 0, 0);
    }
    
    // Draw systems
    ctx.globalCompositeOperation = 'screen';
    systemManager.draw(ctx, time, phaseName, phaseProgress);
    
    // Draw foreground typography to emphasize the story
    ctx.globalCompositeOperation = 'source-over';
    if (phaseName === 'SYNTHESIS') {
        const typoAlpha = Easing.easeOutQuad(phaseProgress);
        // A single, strong resolution message
        const typoCanvas = typoSystem.renderText("COHERENCE", config.width / 2, config.height / 2, 100, typoAlpha, 40);
        ctx.drawImage(typoCanvas, 0, 0);
    } else if (phaseName === 'FRAGMENTATION') {
        const typoAlpha = 0.3 * (1 - phaseProgress);
        const typoCanvas = typoSystem.renderText("FRAGMENTS", config.width / 2, config.height / 2, 40, typoAlpha, 20 + phaseProgress * 50);
        ctx.drawImage(typoCanvas, 0, 0);
    }
    
    // Subtle vignette or noise could go here as post-processing
};
