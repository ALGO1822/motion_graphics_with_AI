import { Easing, track, clamp, lerp, seededRandom } from './math.js';
import { Colors, createLayer } from './graphics.js';

const config = { width: 1920, height: 1080, fps: 30, durationInSeconds: 10 };
window.animationConfig = config;

const W = config.width, H = config.height;
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W; canvas.height = H;

const offscreen = createLayer();
const sceneA = createLayer();
const sceneB = createLayer();
const sceneC = createLayer();
const sceneD = createLayer();

// Pre-generate grain
const grainTiles = [];
for(let t = 0; t < 6; t++) {
    const gc = createLayer(512, 512);
    const id = gc.ctx.createImageData(512, 512);
    const d = id.data;
    let seed = t * 1000;
    for(let i=0; i<d.length; i+=4) {
        // Monochrome noise, 3.5% intensity -> approx +/- 9
        const v = (seededRandom(seed++) - 0.5) * 18; 
        d[i] = d[i+1] = d[i+2] = 127 + v;
        d[i+3] = 255;
    }
    gc.ctx.putImageData(id, 0, 0);
    grainTiles.push(gc.canvas);
}

function drawGrain(targetCtx, frame) {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'overlay';
    const tile = grainTiles[Math.floor(frame / 2) % 6];
    for(let y = 0; y < H; y += 512) {
        for(let x = 0; x < W; x += 512) {
            targetCtx.drawImage(tile, x, y);
        }
    }
    targetCtx.restore();
}

function getFont(weight, size, ls) {
    // scale auto-fit would go here, but prompt says measure display word if > 1680
    return `${Math.round(weight)} ${size}px Geist`;
}

// Text Reveal Rule (Clip rect, +110% line height up to 0)
function drawWordMasked(ctx, word, x, y, size, weight, color, ls, progress) {
    const lineHeight = size * 1.1; // approximate bounds
    const p = clamp(progress, 0, 1);
    const offset = (1 - p) * (lineHeight * 1.1);
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10, y - size, 1920, size + 30); // clip region
    ctx.clip();
    
    ctx.font = getFont(weight, size);
    ctx.letterSpacing = ls;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(word, x, Math.round(y + offset));
    ctx.restore();
    return ctx.measureText(word).width;
}

function drawLineMasked(ctx, line, x, y, size, weight, color, ls, startFrame, frame, stagger) {
    ctx.font = getFont(weight, size);
    ctx.letterSpacing = ls;
    const words = line.split(' ');
    let currentX = x;
    for (let i = 0; i < words.length; i++) {
        const word = words[i] + ' ';
        const wP = track(frame, startFrame + (i * stagger), 16, 0, 1, Easing.E_IN);
        // We draw word by word, applying the same mask logic but horizontally placed
        const ww = drawWordMasked(ctx, words[i], currentX, y, size, weight, color, ls, wP);
        currentX += ww + ctx.measureText(' ').width; // space
    }
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function renderSceneA(ctx, f) {
    ctx.fillStyle = Colors.PAPER;
    ctx.fillRect(0, 0, W, H);
    
    // "15" -> "19"
    // f0: already 40% risen
    const p15 = track(f, -14, 36, 0, 1, Easing.E_IN); // reaches 1 at f22
    const w15 = lerp(200, 800, p15);
    
    // Odometer 5 -> 9
    ctx.save();
    ctx.font = getFont(w15, 560);
    ctx.letterSpacing = '-0.04em';
    ctx.fillStyle = Colors.INK;
    ctx.textBaseline = 'alphabetic';
    
    const xBase = 120;
    const yBase = 640;
    
    // Draw "1"
    const offset15 = (1 - p15) * (560 * 1.1 * 1.1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(xBase - 20, yBase - 560, 400, 600);
    ctx.clip();
    ctx.fillText("1", xBase, Math.round(yBase + offset15));
    ctx.restore();
    
    // Draw Odometer slot
    const w1 = ctx.measureText("1").width;
    const xOdo = xBase + w1;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(xOdo - 10, yBase - 560, 400, 620);
    ctx.clip();
    
    const odoP = track(f, 24, 20, 0, 1, Easing.E_PUSH);
    const yOdo = Math.round(yBase + offset15 + (odoP * 560 * 4)); // Shift up by 4 numbers
    
    // Draw 9, 8, 7, 6, 5 (bottom to top visually? No, 5 to 9 so 9 is at bottom)
    for(let i=0; i<=4; i++) {
        ctx.fillText((9 - i).toString(), xOdo, yOdo - (4-i)*560);
    }
    ctx.restore();
    ctx.restore();
    
    // Captions
    const cap1P = track(f, 4, 16, 0, 1, Easing.E_IN);
    const cap1Exit = track(f, 30, 16, 0, 1, Easing.E_PUSH);
    const cap2P = track(f, 38, 16, 0, 1, Easing.E_IN);
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(120, 760 - 60, 1000, 80);
    ctx.clip();
    
    if (cap1Exit < 1) {
        const yLine1 = 760 - (cap1Exit * 56 * 1.1);
        drawLineMasked(ctx, "Started university.", 120, Math.round(yLine1), 56, 400, Colors.SLATE_ON_PAPER, '0em', 4, f, 2);
    }
    
    if (cap2P > 0) {
        drawLineMasked(ctx, "Graduating this October.", 120, 760, 56, 400, Colors.SLATE_ON_PAPER, '0em', 38, f, 2);
    }
    ctx.restore();
}

function renderSceneB(ctx, f) {
    ctx.fillStyle = Colors.INK;
    ctx.fillRect(0, 0, W, H);
    
    // "Allocadia"
    const pAllo = track(f, 74, 26, 0, 1, Easing.E_IN);
    const wAllo = lerp(200, 700, pAllo);
    drawWordMasked(ctx, "Allocadia", 120, 400, 260, wAllo, Colors.PAPER, '-0.04em', pAllo);
    
    // Description
    drawLineMasked(ctx, "Assigns hostel rooms by solving", 120, 490, 56, 400, Colors.PAPER, '0em', 86, f, 2);
    drawLineMasked(ctx, "for everyone's preferences at once.", 120, 556, 56, 400, Colors.PAPER, '0em', 90, f, 2);
    
    // Caption
    drawLineMasked(ctx, "Go, Next.js, Python, PostgreSQL", 1240, 490, 36, 500, Colors.SLATE_ON_INK, '0em', 92, f, 2);
    
    // Room grid
    ctx.save();
    for (let c = 0; c < 28; c++) {
        for (let r = 0; r < 5; r++) {
            const startF = 92 + (c * 0.5);
            const pGrid = track(f, startF, 20, 0, 1, Easing.E_IN);
            const pSweep = track(f, 112 + (c / 28) * 16, 1, 0, 1, Easing.linear); // Hard flip
            
            if (pGrid > 0) {
                const seed = c * 100 + r;
                const rOffX = (seededRandom(seed) - 0.5) * 80;
                const rOffY = (seededRandom(seed+1) - 0.5) * 80;
                const rRot = (seededRandom(seed+2) - 0.5) * 50 * (Math.PI/180);
                
                const curX = lerp(120 + c * 60 + rOffX, 120 + c * 60, pGrid);
                const curY = lerp(680 + r * 60 + rOffY, 680 + r * 60, pGrid);
                const curRot = lerp(rRot, 0, pGrid);
                
                ctx.save();
                ctx.translate(curX + 14, curY + 14);
                ctx.rotate(curRot);
                ctx.globalAlpha = pGrid;
                
                if (pSweep > 0.5) {
                    ctx.fillStyle = Colors.PAPER;
                    ctx.fillRect(-14, -14, 28, 28);
                } else {
                    ctx.strokeStyle = Colors.PAPER;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-14, -14, 28, 28);
                }
                ctx.restore();
            }
        }
    }
    ctx.restore();
}

function renderSceneC(ctx, f) {
    ctx.fillStyle = Colors.COBALT;
    ctx.fillRect(0, 0, W, H);
    
    // "Nota"
    const pNota = track(f, 146, 26, 0, 1, Easing.E_IN);
    const wNota = lerp(200, 800, pNota);
    drawWordMasked(ctx, "Nota", 120, 560, 440, wNota, Colors.PAPER, '-0.04em', pNota);
    
    drawLineMasked(ctx, "Turns any PDF into diagrams", 120, 640, 56, 400, Colors.PAPER, '0em', 158, f, 2);
    drawLineMasked(ctx, "you can study.", 120, 706, 56, 400, Colors.PAPER, '0em', 162, f, 2);
    drawLineMasked(ctx, "Built with Flutter", 120, 800, 36, 500, Colors.PAPER, '0em', 166, f, 2); // Prompt says "x 120"
    
    // Visual Right Side
    const pTrace = track(f, 160, 10, 0, 1, Easing.linear);
    const pRetract = track(f, 176, 20, 0, 1, Easing.E_PUSH);
    
    const bx = 1240, by = 260, bw = 360, bh = 480;
    
    if (pTrace > 0 && pRetract < 1) {
        ctx.save();
        ctx.strokeStyle = Colors.PAPER;
        ctx.lineWidth = 4;
        const totalPerimeter = (bw + bh) * 2;
        const currentLen = totalPerimeter * (pTrace - pRetract);
        ctx.setLineDash([currentLen, 10000]);
        ctx.lineDashOffset = 0;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.restore();
    }
    
    // Bars / Nodes morph
    const morph = pRetract;
    
    const drawNode = (ix, iy, iw, ih, ir, m, cx, cy, cw, ch, cr, o) => {
        const x = lerp(ix, cx, m);
        const y = lerp(iy, cy, m);
        const w = lerp(iw, cw, m);
        const h = lerp(ih, ch, m);
        const r = lerp(ir, cr, m);
        if (h <= 0) return;
        ctx.save();
        ctx.fillStyle = Colors.PAPER;
        ctx.globalAlpha = 1 - o;
        roundedRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.restore();
    };
    
    const bars = [
        { y: by + 60, w: 240, x: bx + 60 },
        { y: by + 100, w: 200, x: bx + 60 },
        { y: by + 140, w: 220, x: bx + 60 },
        { y: by + 200, w: 180, x: bx + 60 },
        { y: by + 240, w: 260, x: bx + 60 },
        { y: by + 280, w: 140, x: bx + 60 },
    ];
    
    for (let i = 0; i < 6; i++) {
        const barP = track(f, 166 + i*1.5, 8, 0, 1, Easing.E_IN);
        if (barP > 0) {
            const ix = bars[i].x, iy = bars[i].y, iw = bars[i].w * barP, ih = 14;
            if (i === 0) {
                // Root node (center 1420,360, radius 40)
                drawNode(ix, iy, iw, ih, 7, morph, 1380, 320, 80, 80, 40, 0);
            } else if (i === 3) {
                // Child 1 (1320,620)
                drawNode(ix, iy, iw, ih, 7, morph, 1260, 580, 120, 80, 20, 0);
            } else if (i === 4) {
                // Child 2 (1520,620)
                drawNode(ix, iy, iw, ih, 7, morph, 1460, 580, 120, 80, 20, 0);
            } else {
                // Vanish
                drawNode(ix, iy, iw, ih, 7, morph, ix, iy + ih/2, iw, 0, 0, morph);
            }
        }
    }
    
    // Edges
    const edgeP = track(f, 192, 12, 0, 1, Easing.E_PUSH);
    if (edgeP > 0) {
        ctx.save();
        ctx.strokeStyle = Colors.PAPER;
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(1420, 400);
        ctx.lineTo(1420 + (1320-1420)*edgeP, 400 + (580-400)*edgeP);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(1420, 400);
        ctx.lineTo(1420 + (1520-1420)*edgeP, 400 + (580-400)*edgeP);
        ctx.stroke();
        
        ctx.restore();
    }
}

function renderSceneD(ctx, f) {
    ctx.fillStyle = Colors.PAPER;
    ctx.fillRect(0, 0, W, H);
    
    const pFav = track(f, 222, 28, 0, 1, Easing.E_IN);
    const wFav = lerp(200, 800, pFav);
    drawWordMasked(ctx, "Favour", 120, 560, 400, wFav, Colors.INK, '-0.04em', pFav);
    
    drawLineMasked(ctx, "I build things end to end.", 120, 680, 64, 400, Colors.INK, '0em', 238, f, 2);
    
    const urlP = track(f, 246, 12, 0, 1, Easing.E_IN);
    drawWordMasked(ctx, "devfavour.vercel.app", 120, 780, 44, 400, Colors.COBALT, '0em', urlP);
    
    const lineP = track(f, 254, 16, 0, 1, Easing.E_PUSH);
    if (lineP > 0) {
        ctx.fillStyle = Colors.COBALT;
        ctx.fillRect(120, 796, 440 * lineP, 3);
    }
}

function drawHUD(ctx, frame, fieldName, clipFunc) {
    ctx.save();
    clipFunc();
    
    // Progress line: 3 px horizontal line at y=64, x=120 to 1800
    // Fills left to right linearly over 300 frames
    const p = frame / 299;
    const endX = lerp(120, 1800, p);
    
    let color = Colors.INK; // Scene A
    if (fieldName === 'B') color = Colors.PAPER;
    if (fieldName === 'C') color = Colors.PAPER;
    if (fieldName === 'D') color = Colors.INK;
    
    // Track (20%)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(120, 64, 1680, 3);
    
    // Fill
    ctx.globalAlpha = 1.0;
    ctx.fillRect(120, 64, endX - 120, 3);
    
    ctx.restore();
}

function renderFrameAtTime(f, targetCtx) {
    // Render individual scenes
    renderSceneA(sceneA.ctx, f);
    renderSceneB(sceneB.ctx, f);
    renderSceneC(sceneC.ctx, f);
    renderSceneD(sceneD.ctx, f);
    
    targetCtx.fillStyle = '#000';
    targetCtx.fillRect(0, 0, W, H);
    
    // Base layout & Transitions
    // T1: PUSH LEFT (f66-f88)
    const t1P = track(f, 66, 22, 0, 1, Easing.E_PUSH);
    // T2: PUSH UP (f138-f160)
    const t2P = track(f, 138, 22, 0, 1, Easing.E_PUSH);
    // T3: CIRCLE MATCH CUT (f208-f236)
    const t3P = track(f, 208, 28, 0, 1, Easing.E_PUSH);
    
    if (f < 138) {
        // Scene A & B
        const edgeX = lerp(1920, 0, t1P);
        
        // Scene A (Outgoing)
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(0, 0, edgeX, H); // Field clip
        targetCtx.clip();
        const aOffsetX = -t1P * 1920 * 1.15;
        targetCtx.drawImage(sceneA.canvas, aOffsetX, 0);
        
        drawHUD(targetCtx, f, 'A', () => {
            targetCtx.beginPath();
            targetCtx.rect(0, 0, edgeX, H);
            targetCtx.clip();
        });
        targetCtx.restore();
        
        // Scene B (Incoming/Current)
        if (t1P > 0) {
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.rect(edgeX, 0, W - edgeX, H);
            targetCtx.clip();
            const bOffsetX = (1 - t1P) * 1920 * 1.35;
            targetCtx.drawImage(sceneB.canvas, bOffsetX, 0);
            
            drawHUD(targetCtx, f, 'B', () => {
                targetCtx.beginPath();
                targetCtx.rect(edgeX, 0, W - edgeX, H);
                targetCtx.clip();
            });
            targetCtx.restore();
        }
    } else if (f >= 138 && f < 208) {
        // Scene B & C
        const edgeY = lerp(1080, 0, t2P);
        
        // Scene B (Outgoing)
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(0, 0, W, edgeY);
        targetCtx.clip();
        const bOffsetY = -t2P * 1080 * 1.2;
        targetCtx.drawImage(sceneB.canvas, 0, bOffsetY);
        
        drawHUD(targetCtx, f, 'B', () => {
            targetCtx.beginPath();
            targetCtx.rect(0, 0, W, edgeY);
            targetCtx.clip();
        });
        targetCtx.restore();
        
        // Scene C (Incoming/Current)
        if (t2P > 0) {
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.rect(0, edgeY, W, H - edgeY);
            targetCtx.clip();
            const cOffsetY = (1 - t2P) * 1080 * 1.4;
            targetCtx.drawImage(sceneC.canvas, 0, cOffsetY);
            
            drawHUD(targetCtx, f, 'C', () => {
                targetCtx.beginPath();
                targetCtx.rect(0, edgeY, W, H - edgeY);
                targetCtx.clip();
            });
            targetCtx.restore();
        }
    } else {
        // Scene C & D
        const r = lerp(40, 1700, t3P);
        
        // Scene C (Outgoing)
        targetCtx.save();
        // C content drifts and scales
        const cOffsetX = -80 * t3P;
        const cScale = 1 - 0.04 * t3P;
        
        // Draw C masked by the INVERSE of the circle? No, draw C underneath, draw D over it inside the circle
        targetCtx.translate(W/2, H/2);
        targetCtx.scale(cScale, cScale);
        targetCtx.translate(-W/2, -H/2);
        targetCtx.drawImage(sceneC.canvas, cOffsetX, 0);
        targetCtx.restore();
        
        drawHUD(targetCtx, f, 'C', () => {
            targetCtx.beginPath();
            targetCtx.rect(0, 0, W, H);
            targetCtx.clip();
            // exclude circle
            targetCtx.beginPath();
            targetCtx.arc(1420, 360, r, 0, Math.PI*2);
            targetCtx.rect(W, 0, -W, H);
            targetCtx.clip('evenodd');
        });
        
        // Scene D (Incoming inside circle)
        if (t3P > 0) {
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.arc(1420, 360, r, 0, Math.PI * 2);
            targetCtx.clip();
            
            const dOffsetX = 120 * (1 - t3P);
            targetCtx.drawImage(sceneD.canvas, dOffsetX, 0);
            
            drawHUD(targetCtx, f, 'D', () => {
                targetCtx.beginPath();
                targetCtx.arc(1420, 360, r, 0, Math.PI * 2);
                targetCtx.clip();
            });
            targetCtx.restore();
        }
    }
}

window.renderFrame = function(frame) {
    // 180-degree shutter motion blur logic
    const isBlurring = (frame >= 66 && frame <= 88) || 
                       (frame >= 138 && frame <= 160) || 
                       (frame >= 208 && frame <= 236) ||
                       (frame >= 24 && frame <= 44); // Odometer
                       
    if (isBlurring) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        
        const subframes = 5;
        // 180 degree shutter means it exposes for half a frame duration
        // We evaluate f from frame to frame + 0.5
        for (let s = 0; s < subframes; s++) {
            const subF = frame + (s / (subframes - 1)) * 0.5;
            offscreen.ctx.clearRect(0, 0, W, H);
            renderFrameAtTime(subF, offscreen.ctx);
            
            ctx.globalAlpha = 1 / subframes;
            ctx.drawImage(offscreen.canvas, 0, 0);
        }
        ctx.globalAlpha = 1.0;
    } else {
        renderFrameAtTime(frame, ctx);
    }
    
    // Add noise OVER the motion blur
    drawGrain(ctx, frame);
};
