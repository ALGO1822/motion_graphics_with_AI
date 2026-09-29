export const Colors = {
    PAPER: '#EEF0F3',
    INK: '#0C1226',
    COBALT: '#2A3BFF',
    SLATE_ON_PAPER: '#59627A',
    SLATE_ON_INK: '#9AA4BC'
};

export function createLayer(width = 1920, height = 1080) {
    // Determine if we are in browser or Node (Playwright provides standard DOM canvas)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx };
}

export function drawRect(ctx, x, y, w, h, color, rotation = 0, pivotX = 0, pivotY = 0) {
    ctx.save();
    ctx.translate(x + pivotX, y + pivotY);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.fillRect(-pivotX, -pivotY, w, h);
    ctx.restore();
}

export function drawLine(ctx, x1, y1, x2, y2, color, width = 1) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
}

export function drawCircle(ctx, x, y, radius, color, style='fill', lineWidth=1) {
    if(radius <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if(style === 'fill') {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Procedural trails/history renderer.
 * We sample the function f(t) backwards in time to draw trails.
 */
export function drawTrails(ctx, t, steps, dt, drawFunc, styleFunc) {
    for(let i = steps - 1; i >= 0; i--) {
        const timeOffset = t - (i * dt);
        if (timeOffset < 0) continue;
        ctx.save();
        if (styleFunc) styleFunc(ctx, i, steps);
        drawFunc(ctx, timeOffset, i);
        ctx.restore();
    }
}
