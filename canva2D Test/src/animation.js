import { Easing, track, keyframes, drawRect, drawLine, drawText, Colors } from './math.js';

const config = {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInSeconds: 10
};
window.animationConfig = config;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = config.width;
canvas.height = config.height;

// Preload/setup font if needed. We'll use system fonts.
const FONT = 'bold 200px "Helvetica Neue", Helvetica, Arial, sans-serif';

window.renderFrame = function(frame) {
    const time = frame / config.fps;
    
    // Clear background
    ctx.fillStyle = Colors.bg;
    ctx.fillRect(0, 0, config.width, config.height);
    
// Add background continuous motion (grid moving slowly)
    const globalGridOffset = track(time, 0, 10, 0, 100, Easing.linear);
    
    // ==========================================
    // SCENE 1 & 2: Origin -> Formation (0 - 3.5s)
    // ==========================================
    
    // Thin line entry
    const lineX = track(time, 0.5, 1.0, 1920, 0, Easing.easeOutExpo);
    const lineY = track(time, 1.5, 1.0, 800, 200, Easing.easeInOutCubic);
    const lineRot = track(time, 2.0, 1.0, 0, -Math.PI / 2, Easing.easeInOutExpo);
    
    ctx.save();
    ctx.translate(1400, 800);
    ctx.rotate(lineRot);
    ctx.translate(-1400, -800);
    drawLine(ctx, lineX, lineY, 1920, lineY, Colors.warmGray, 2);
    ctx.restore();
    
    // Orange Block (The 'Fragment' finding structure)
    const obX = keyframes(time, [
        {t: 0, v: 1450},
        {t: 1.5, v: 1450, e: Easing.easeInOutExpo},
        {t: 2.5, v: 200, e: Easing.easeInOutExpo},
        {t: 3.5, v: 200}
    ]);
    const obY = keyframes(time, [
        {t: 0, v: 1200},
        {t: 0.5, v: 1200, e: Easing.easeOutExpo},
        {t: 1.2, v: 750, e: Easing.easeInOutCubic},
        {t: 2.5, v: 750, e: Easing.easeInOutExpo},
        {t: 3.5, v: 200}
    ]);
    const obW = keyframes(time, [
        {t: 0, v: 40},
        {t: 1.5, v: 40, e: Easing.easeInOutExpo},
        {t: 2.0, v: 1200, e: Easing.easeInOutExpo},
        {t: 2.5, v: 40}
    ]);
    const obH = keyframes(time, [
        {t: 0, v: 40},
        {t: 3.0, v: 40, e: Easing.easeOutExpo},
        {t: 3.5, v: 1000}
    ]);
    
    if (time < 5.0) {
        drawRect(ctx, obX, obY, obW, obH, Colors.orange);
    }
    
    // BUILD Text
    const buildY = track(time, 0.8, 1.0, 950, 780, Easing.easeOutExpo);
    const buildClipY = track(time, 1.8, 0.8, 0, -200, Easing.easeInOutCubic);
    
    if (time < 2.5) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 1920, 800 + buildClipY); // Clip mask above the line
        ctx.clip();
        drawText(ctx, "BUILD", 1380, buildY, '900 120px "Helvetica Neue", Helvetica, sans-serif', Colors.offWhite, 'right', 'bottom');
        ctx.restore();
    }
    
    // SYSTEMS Text
    const sysX = track(time, 2.2, 1.0, -800, 260, Easing.easeOutExpo);
    const sysOpacity = track(time, 3.2, 0.8, 1, 0, Easing.easeInOutCubic);
    if (time > 2.0 && time < 4.0) {
        ctx.save();
        ctx.globalAlpha = sysOpacity;
        ctx.beginPath();
        ctx.rect(260, 0, 1660, 1080);
        ctx.clip();
        drawText(ctx, "SYSTEMS", sysX, 850, '900 240px "Helvetica Neue", Helvetica, sans-serif', Colors.lightWarmGray, 'left', 'bottom', 10);
        ctx.restore();
    }
    
    // Grid (appears in phase 3, expands in phase 4)
    const gridScale = track(time, 2.8, 1.2, 0.01, 1, Easing.easeInOutExpo);
    if (gridScale > 0 && time < 7.5) {
        ctx.save();
        ctx.translate(960, 540);
        ctx.scale(gridScale, gridScale);
        ctx.translate(-960, -540);
        
        ctx.strokeStyle = `rgba(196, 194, 192, 0.15)`; // lightWarmGray with opacity
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i = -1000; i <= 2920; i += 80) {
            ctx.moveTo(i + globalGridOffset, -1000);
            ctx.lineTo(i + globalGridOffset, 2080);
            ctx.moveTo(-1000, i + globalGridOffset);
            ctx.lineTo(2920, i + globalGridOffset);
        }
        ctx.stroke();
        ctx.restore();
    }
    
    // ==========================================
    // SCENE 3: System (3.0 - 5.0s)
    // ==========================================
    
    // Geometric circle representing bounding constraint
    const circScale = track(time, 3.2, 1.5, 0, 1, Easing.easeOutExpo);
    const circOpacity = track(time, 4.5, 0.5, 1, 0, Easing.linear);
    if (time > 3.0 && time < 5.0) {
        ctx.save();
        ctx.globalAlpha = circOpacity;
        ctx.translate(960, 540);
        ctx.scale(circScale, circScale);
        ctx.beginPath();
        ctx.arc(0, 0, 400, 0, Math.PI * 2);
        ctx.strokeStyle = Colors.warmGray;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
    
    // ITERATE
    const itScale = track(time, 3.5, 1.2, 0.5, 1, Easing.easeOutExpo);
    const itTracking = track(time, 3.5, 1.5, 300, 20, Easing.easeOutExpo);
    const itY = track(time, 4.5, 0.8, 540, -300, Easing.easeInOutCubic);
    if (time > 3.0 && time < 5.5) {
        ctx.save();
        ctx.translate(960, itY);
        ctx.scale(itScale, itScale);
        drawText(ctx, "ITERATE", 0, 0, '900 220px "Helvetica Neue", Helvetica, sans-serif', Colors.offWhite, 'center', 'middle', itTracking);
        ctx.restore();
    }
    
    // ==========================================
    // SCENE 4: Complexity (5.0 - 7.0s)
    // ==========================================
    
    // Sliding panels that subdivide the screen
    const p1Y = track(time, 5.0, 1.0, 1080, 0, Easing.easeInOutExpo);
    const p2Y = track(time, 5.1, 1.0, -1080, 0, Easing.easeInOutExpo);
    const p3Y = track(time, 5.2, 1.0, 1080, 0, Easing.easeInOutExpo);
    
    if (time > 5.0 && time < 8.5) {
        drawRect(ctx, 0, p1Y, 640, 1080, Colors.bg);
        drawRect(ctx, 640, p2Y, 640, 1080, Colors.black); // Center contrast
        drawRect(ctx, 1280, p3Y, 640, 1080, Colors.bg);
        
        // Multi-orange block duplication representing routing/complexity
        const blockSplit = track(time, 5.5, 1.0, 0, 450, Easing.easeInOutExpo);
        const blockRot = track(time, 5.5, 1.5, 0, Math.PI, Easing.easeInOutCubic);
        const blockSize = track(time, 6.5, 0.5, 60, 0, Easing.easeInQuad);
        
        if (blockSize > 0) {
            drawRect(ctx, 960 - blockSplit, 540 - blockSplit, blockSize, blockSize, Colors.orange, blockRot, blockSize/2, blockSize/2);
            drawRect(ctx, 960 + blockSplit, 540 - blockSplit, blockSize, blockSize, Colors.orange, -blockRot, blockSize/2, blockSize/2);
            drawRect(ctx, 960 - blockSplit, 540 + blockSplit, blockSize, blockSize, Colors.orange, -blockRot, blockSize/2, blockSize/2);
            drawRect(ctx, 960 + blockSplit, 540 + blockSplit, blockSize, blockSize, Colors.orange, blockRot, blockSize/2, blockSize/2);
        }
        
        // Fast sliding connecting lines
        const clX = track(time, 5.8, 1.0, -1920, 1920, Easing.easeInOutExpo);
        drawLine(ctx, clX, 540, clX + 1920, 540, Colors.orange, 4);
        
        const clY = track(time, 6.0, 1.0, 1080, -1080, Easing.easeInOutExpo);
        drawLine(ctx, 960, clY, 960, clY + 1080, Colors.lightWarmGray, 2);
    }
    
    // CREATE (5.5 - 7.5s)
    const crRot = track(time, 5.5, 1.5, Math.PI/2, 0, Easing.easeInOutExpo);
    const crScale = track(time, 6.5, 1.0, 1, 30, Easing.easeInQuad); // Scales up massively into chaos phase acting as a mask
    const crOpacity = track(time, 7.3, 0.2, 1, 0, Easing.linear);
    
    if (time > 5.3 && time < 7.5) {
        ctx.save();
        ctx.globalAlpha = crOpacity;
        ctx.translate(960, 540);
        ctx.scale(crScale, crScale);
        ctx.rotate(crRot);
        drawText(ctx, "CREATE", 0, 0, '900 200px "Helvetica Neue", Helvetica, sans-serif', Colors.offWhite, 'center', 'middle', 30);
        ctx.restore();
    }
    
    // ==========================================
    // SCENE 5: Controlled Chaos (7.0 - 8.5s)
    // ==========================================
    
    // The giant 'CREATE' scaling up leaves the screen white, then geometric wipes restore order.
    if (time > 7.3 && time < 8.5) {
        // Flash of offWhite from the text scale
        drawRect(ctx, 0, 0, 1920, 1080, Colors.offWhite);
    }
    
    const wipeX1 = track(time, 7.5, 0.8, -1920, 0, Easing.easeInOutExpo);
    if (time > 7.5) drawRect(ctx, wipeX1, 0, 1920, 1080, Colors.black);
    
    const wipeX2 = track(time, 7.7, 0.8, 1920, 0, Easing.easeInOutExpo);
    if (time > 7.7) drawRect(ctx, wipeX2, 0, 1920, 1080, Colors.bg);
    
    const wipeY1 = track(time, 7.9, 0.8, -1080, 0, Easing.easeInOutExpo);
    if (time > 7.9) drawRect(ctx, 0, wipeY1, 1920, 1080, Colors.warmGray);
    
    const wipeY2 = track(time, 8.1, 0.8, 1080, 0, Easing.easeInOutExpo);
    if (time > 8.1) drawRect(ctx, 0, wipeY2, 1920, 1080, Colors.bg); // Restores to bg
    
    // ==========================================
    // SCENE 6: Synthesis (8.5 - 10.0s)
    // ==========================================
    if (time > 8.0) {
        // FAVOUR assembles with precision
        const fY = track(time, 8.5, 1.2, 800, 540, Easing.easeOutExpo);
        const fTracking = track(time, 8.5, 1.2, 150, 40, Easing.easeOutExpo);
        
        // Clipping mask expands from center
        const maskH = track(time, 8.4, 1.0, 0, 1080, Easing.easeInOutExpo);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 540 - maskH/2, 1920, maskH);
        ctx.clip();
        
        // Draw the text
        drawText(ctx, "FAVOUR", 960, fY, '900 280px "Helvetica Neue", Helvetica, sans-serif', Colors.offWhite, 'center', 'middle', fTracking);
        ctx.restore();
        
        // A single beautiful orange square anchors the final frame
        const sqScale = track(time, 8.8, 0.8, 0, 1, Easing.easeOutBack);
        const sqRot = track(time, 8.8, 1.2, Math.PI, 0, Easing.easeOutExpo);
        if (sqScale > 0) {
            drawRect(ctx, 960, 260, 40 * sqScale, 40 * sqScale, Colors.orange, sqRot, 20 * sqScale, 20 * sqScale);
        }
        
        // Subtle minimal grid framing the final shot
        const frameAlpha = track(time, 9.0, 1.0, 0, 1, Easing.linear);
        if (frameAlpha > 0) {
            ctx.strokeStyle = `rgba(122, 118, 115, ${frameAlpha * 0.4})`;
            ctx.lineWidth = 1;
            
            // Frame bounds
            ctx.strokeRect(120, 120, 1680, 840);
            
            // Minimal crosshairs
            drawLine(ctx, 960, 90, 960, 150, Colors.orange, 2);
            drawLine(ctx, 960, 930, 960, 990, Colors.orange, 2);
            drawLine(ctx, 90, 540, 150, 540, Colors.orange, 2);
            drawLine(ctx, 1770, 540, 1830, 540, Colors.orange, 2);
        }
    }
};
