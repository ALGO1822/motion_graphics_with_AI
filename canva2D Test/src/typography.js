import { createLayer } from './graphics.js';

export function drawText(ctx, text, x, y, font, color, align = 'left', baseline = 'top', tracking = 0) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = tracking > 0 ? 'left' : align;
    ctx.textBaseline = baseline;
    
    if (tracking > 0) {
        let currentX = x;
        if (align === 'center') {
            const totalWidth = ctx.measureText(text).width + (text.length - 1) * tracking;
            currentX = x - totalWidth / 2;
        } else if (align === 'right') {
            const totalWidth = ctx.measureText(text).width + (text.length - 1) * tracking;
            currentX = x - totalWidth;
        }
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            ctx.fillText(char, currentX, y);
            currentX += ctx.measureText(char).width + tracking;
        }
    } else {
        ctx.fillText(text, x, y);
    }
    
    ctx.restore();
}

/**
 * Renders kinetic typography where each letter can be transformed by a callback function.
 */
export function drawKineticWord(ctx, text, x, y, font, color, align, baseline, tracking, transformCallback) {
    ctx.save();
    ctx.font = font;
    ctx.textBaseline = baseline;
    
    // First, measure to align properly
    let charWidths = [];
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
        const cw = ctx.measureText(text[i]).width;
        charWidths.push(cw);
        totalWidth += cw;
    }
    totalWidth += (text.length - 1) * tracking;

    let startX = x;
    if (align === 'center') startX -= totalWidth / 2;
    if (align === 'right') startX -= totalWidth;

    let currentX = startX;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const cx = currentX + charWidths[i] / 2;
        const cy = y;
        
        // Let the callback dictate the transform for this letter
        // Callback returns { tx, ty, scale, rot, opacity, color } (optional fields)
        const tr = transformCallback(char, i, cx, cy) || {};
        
        ctx.save();
        ctx.globalAlpha = tr.opacity !== undefined ? tr.opacity : 1;
        ctx.translate(cx + (tr.tx || 0), cy + (tr.ty || 0));
        ctx.rotate(tr.rot || 0);
        
        // Handle asymmetric scale
        const sx = tr.scaleX !== undefined ? tr.scaleX : (tr.scale !== undefined ? tr.scale : 1);
        const sy = tr.scaleY !== undefined ? tr.scaleY : (tr.scale !== undefined ? tr.scale : 1);
        ctx.scale(sx, sy);

        ctx.fillStyle = tr.color || color;
        ctx.textAlign = 'center'; // We translate to center of character
        
        // Adjust for baseline when scaled/rotated?
        ctx.fillText(char, 0, 0);
        ctx.restore();
        
        currentX += charWidths[i] + tracking;
    }
    
    ctx.restore();
}

// Global cache for sampled points to avoid expensive getImageData in every frame
const pointsCache = new Map();

/**
 * Samples a text string into an array of solid points.
 * Returns array of {x, y, alpha}
 */
export function textToPoints(text, font, tracking, density = 4) {
    const cacheKey = `${text}-${font}-${tracking}-${density}`;
    if (pointsCache.has(cacheKey)) return pointsCache.get(cacheKey);

    const layer = createLayer(1920, 1080);
    drawText(layer.ctx, text, 960, 540, font, '#FFFFFF', 'center', 'middle', tracking);
    
    const imageData = layer.ctx.getImageData(0, 0, 1920, 1080).data;
    const points = [];
    
    for (let y = 0; y < 1080; y += density) {
        for (let x = 0; x < 1920; x += density) {
            const index = (y * 1920 + x) * 4;
            const alpha = imageData[index + 3];
            if (alpha > 50) {
                points.push({
                    x: x - 960,
                    y: y - 540,
                    alpha: alpha / 255
                });
            }
        }
    }
    
    pointsCache.set(cacheKey, points);
    return points;
}

/**
 * Renders horizontal/vertical slices of a source canvas with procedural displacement.
 */
export function drawSliced(ctx, sourceCanvas, x, y, w, h, slices, isVertical, offsetFunc) {
    if (isVertical) {
        const sliceW = w / slices;
        for (let i = 0; i < slices; i++) {
            const sx = i * sliceW;
            const offset = offsetFunc(i, slices, sx);
            // offset has { dx, dy, opacity, scaleY } etc.
            ctx.save();
            ctx.globalAlpha = offset.opacity !== undefined ? offset.opacity : 1;
            ctx.translate(x + sx + (offset.dx || 0), y + (offset.dy || 0));
            if (offset.scaleY !== undefined) {
                ctx.scale(1, offset.scaleY);
            }
            ctx.drawImage(sourceCanvas, sx, 0, sliceW, h, 0, 0, sliceW, h);
            ctx.restore();
        }
    } else {
        const sliceH = h / slices;
        for (let i = 0; i < slices; i++) {
            const sy = i * sliceH;
            const offset = offsetFunc(i, slices, sy);
            ctx.save();
            ctx.globalAlpha = offset.opacity !== undefined ? offset.opacity : 1;
            ctx.translate(x + (offset.dx || 0), y + sy + (offset.dy || 0));
            if (offset.scaleX !== undefined) {
                ctx.scale(offset.scaleX, 1);
            }
            ctx.drawImage(sourceCanvas, 0, sy, w, sliceH, 0, 0, w, sliceH);
            ctx.restore();
        }
    }
}
