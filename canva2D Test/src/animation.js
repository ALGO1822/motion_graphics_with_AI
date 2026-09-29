import { Easing, track, clamp, lerp, seededRandom } from './math.js';
import { Colors, createLayer } from './graphics.js';

const config = { width: 1920, height: 1080, fps: 30, durationInSeconds: 10 };
window.animationConfig = config;

const tl = window.timeline;

const W = config.width, H = config.height;
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W; canvas.height = H;

const offscreen = createLayer();

// Pre-generate grain
const grainTiles = [];
for(let t = 0; t < 6; t++) {
    const gc = createLayer(512, 512);
    const id = gc.ctx.createImageData(512, 512);
    const d = id.data;
    let seed = t * 1000;
    for(let i=0; i<d.length; i+=4) {
        const v = (seededRandom(seed++) - 0.5) * 4; 
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

function getFont(weight, size) {
    return `${Math.round(weight)} ${size}px Geist`;
}

function drawWordMasked(ctx, word, x, y, size, weight, color, ls, progress) {
    const lineHeight = size * 1.1; 
    const p = clamp(progress, 0, 1);
    const offset = (1 - p) * (lineHeight * 1.1);
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10, y - size, 1920, size + (size * 0.3)); 
    ctx.clip();
    
    ctx.font = getFont(weight, size);
    ctx.letterSpacing = ls;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(word, x, Math.round(y + offset));
    ctx.restore();
    
    ctx.font = getFont(weight, size);
    ctx.letterSpacing = ls;
    return ctx.measureText(word).width;
}

function drawLineMasked(ctx, line, x, y, size, weight, color, ls, startFrame, frame, stagger) {
    ctx.font = getFont(weight, size);
    ctx.letterSpacing = ls;
    const words = line.split(' ');
    let currentX = x;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wP = track(frame, startFrame + (i * stagger), 16, 0, 1, Easing.E_IN);
        const ww = drawWordMasked(ctx, word, currentX, y, size, weight, color, ls, wP);
        currentX += ww + ctx.measureText(' ').width;
    }
}

function getTransitionRect(f, base, scaleStart, growStart, growEnd) {
    if (f < scaleStart) return { ...base };
    let rect = { ...base };
    
    if (f >= scaleStart && f < growStart) {
        const p = track(f, scaleStart, growStart - scaleStart, 0, 1, Easing.E_IN);
        const scale = lerp(1, 0.92, p);
        const cx = rect.x + rect.w/2;
        const cy = rect.y + rect.h/2;
        rect.w *= scale;
        rect.h *= scale;
        rect.x = cx - rect.w/2;
        rect.y = cy - rect.h/2;
        return rect;
    }
    
    if (f >= growStart) {
        const scale = 0.92;
        const cx = rect.x + rect.w/2;
        const cy = rect.y + rect.h/2;
        const startW = rect.w * scale;
        const startH = rect.h * scale;
        const startX = cx - startW/2;
        const startY = cy - startH/2;
        
        const p = track(f, growStart, growEnd - growStart, 0, 1, Easing.E_PUSH);
        rect.x = lerp(startX, 0, p);
        rect.y = lerp(startY, 0, p);
        rect.w = lerp(startW, 1920, p);
        rect.h = lerp(startH, 1080, p);
    }
    return rect;
}

function drawHUD(ctx, frame, color) {
    const p = frame / 299;
    const endX = lerp(120, 1800, p);
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(120, 64, 1680, 3);
    
    ctx.globalAlpha = 1.0;
    ctx.fillRect(120, 64, endX - 120, 3);
}

const txtA = "Flutter first. Then Go. Now whole systems.";
ctx.font = getFont(400, 56);
ctx.letterSpacing = '0em';
const caretX = 120 + ctx.measureText(txtA).width + 8;
const caretY = 600 - 39;
const caretW = 28;
const caretH = 39;

const R6X = 1720, R6Y = 900, R6W = 40, R6H = 40;
const SheetBase = {x: 980, y: 150, w: 440, h: 600};

function renderSceneA(ctx, f) {
    ctx.fillStyle = Colors.PAPER;
    ctx.fillRect(0, 0, W, H);
    drawHUD(ctx, f, Colors.INK);
    
    const pSelf = track(f, -10, 24, 0, 1, Easing.E_IN);
    const wSelf = lerp(200, 800, pSelf);
    drawWordMasked(ctx, "Self-taught.", 120, 520, 240, wSelf, Colors.INK, '-0.04em', pSelf);
    
    drawLineMasked(ctx, txtA, 120, 600, 56, 400, Colors.SLATE_ON_PAPER, '0em', 4, f, 2);
    
    if (f < tl.t1.shrinkStart) {
        if ((f >= tl.caret.on1 && f < tl.caret.off1) || (f >= tl.caret.on2 && f < tl.t1.shrinkStart)) {
            ctx.fillStyle = Colors.INK;
            ctx.fillRect(caretX, caretY, caretW, caretH);
        }
    }
}

function renderSceneB(ctx, f) {
    ctx.fillStyle = Colors.INK;
    ctx.fillRect(0, 0, W, H);
    drawHUD(ctx, f, Colors.PAPER);
    
    const pAllo = track(f, 46, 20, 0, 1, Easing.E_IN);
    const wAllo = lerp(200, 700, pAllo);
    drawWordMasked(ctx, "Allocadia", 120, 250, 190, wAllo, Colors.PAPER, '-0.04em', pAllo);
    
    drawLineMasked(ctx, "Assigns hostel rooms by solving", 120, 320, 44, 400, Colors.PAPER, '0em', 54, f, 1);
    drawLineMasked(ctx, "for everyone's preferences at once.", 120, 376, 44, 400, Colors.PAPER, '0em', 58, f, 1);
    drawLineMasked(ctx, "Go, Next.js, Python, PostgreSQL", 1200, 250, 32, 400, Colors.SLATE_ON_INK, '0em', 56, f, 1);
    
    const sy = [500, 580, 660, 740, 820, 900];
    
    if (f >= 62) {
        ctx.font = getFont(400, 32);
        ctx.fillStyle = Colors.SLATE_ON_INK;
        const pLabel = track(f, 62, 10, 0, 1, Easing.E_IN);
        if (pLabel > 0) {
            ctx.globalAlpha = pLabel;
            ctx.textAlign = 'left'; ctx.fillText("Students", 160, 452);
            ctx.textAlign = 'right'; ctx.fillText("Rooms", 1760, 452);
            ctx.textAlign = 'left'; ctx.globalAlpha = 1.0;
        }
    }
    
    for (let i = 0; i < 6; i++) {
        const p = track(f, 62 + i, 14, 0, 1, Easing.E_IN);
        if (p > 0) {
            ctx.save();
            ctx.translate(200, sy[i]); ctx.scale(p, p);
            ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fillStyle = Colors.PAPER; ctx.fill();
            ctx.restore();
            
            if (!(i === 5 && f >= tl.t2.shrinkStart)) {
                ctx.save();
                ctx.translate(1720, sy[i]); ctx.scale(p, p);
                const pFill = track(f, 112 + i, 1, 0, 1, Easing.linear);
                if (i === 5 && f >= tl.allocadia.r6Flip) {
                    ctx.fillStyle = Colors.COBALT; ctx.fillRect(-20, -20, 40, 40);
                } else if (pFill >= 0.5) {
                    ctx.fillStyle = Colors.PAPER; ctx.fillRect(-20, -20, 40, 40);
                } else {
                    ctx.strokeStyle = Colors.PAPER; ctx.lineWidth = 2; ctx.strokeRect(-20, -20, 40, 40);
                }
                
                if ((i === 0 || i === 3) && f >= 94) {
                    const pPulse1 = track(f, tl.allocadia.pulse1 - 2, 18, 0, 1, Easing.E_PUSH);
                    const pPulse2 = track(f, tl.allocadia.pulse2 - 2, 18, 0, 1, Easing.E_PUSH);
                    ctx.strokeStyle = Colors.PAPER;
                    if (pPulse1 > 0 && pPulse1 < 1) {
                        ctx.globalAlpha = 1 - pPulse1; ctx.lineWidth = 2;
                        ctx.strokeRect(-20 - (pPulse1 * 26), -20 - (pPulse1 * 26), 40 + (pPulse1 * 52), 40 + (pPulse1 * 52));
                    }
                    if (pPulse2 > 0 && pPulse2 < 1) {
                        ctx.globalAlpha = 1 - pPulse2; ctx.lineWidth = 2;
                        ctx.strokeRect(-20 - (pPulse2 * 26), -20 - (pPulse2 * 26), 40 + (pPulse2 * 52), 40 + (pPulse2 * 52));
                    }
                }
                ctx.restore();
            }
        }
    }
    
    const prefs1 = [0, 0, 0, 3, 3, 4]; const prefs2 = [1, 2, 1, 4, 5, 5];
    const finalAssign = [1, 2, 0, 4, 3, 5]; 
    for (let i = 0; i < 6; i++) {
        const p1 = track(f, 76 + i, 16, 0, 1, Easing.E_IN);
        if (p1 > 0) {
            const r1 = prefs1[i]; const isChosen1 = finalAssign[i] === r1;
            const retract1 = track(f, 112 + i, 8, 0, 1, Easing.E_IN);
            const w1 = isChosen1 ? lerp(3, 6, track(f, 112, 10, 0, 1, Easing.E_IN)) : 3;
            if (!(!isChosen1 && retract1 >= 1)) {
                ctx.save(); ctx.strokeStyle = Colors.PAPER; ctx.lineWidth = w1;
                const endX = lerp(200, 1720, isChosen1 ? p1 : p1 * (1 - retract1));
                if (endX > 200) {
                    ctx.beginPath();
                    const cy = sy[r1]; const cx = endX; const c_y = lerp(sy[i], cy, (cx - 200) / (1720 - 200));
                    ctx.moveTo(200, sy[i]); ctx.bezierCurveTo(200 + (cx - 200) * 0.4, sy[i], 200 + (cx - 200) * 0.6, c_y, cx, c_y); ctx.stroke();
                }
                ctx.restore();
            }
            
            const r2 = prefs2[i]; const isChosen2 = finalAssign[i] === r2;
            const retract2 = track(f, 112 + i, 8, 0, 1, Easing.E_IN);
            const w2 = isChosen2 ? lerp(2, 6, track(f, 112, 10, 0, 1, Easing.E_IN)) : 2;
            if (!(!isChosen2 && retract2 >= 1)) {
                ctx.save(); ctx.strokeStyle = isChosen2 ? Colors.PAPER : Colors.SLATE_ON_INK; ctx.lineWidth = w2;
                const endX = lerp(200, 1720, isChosen2 ? p1 : p1 * (1 - retract2));
                if (endX > 200) {
                    ctx.beginPath();
                    const cy = sy[r2]; const cx = endX; const c_y = lerp(sy[i], cy, (cx - 200) / (1720 - 200));
                    ctx.moveTo(200, sy[i]); ctx.bezierCurveTo(200 + (cx - 200) * 0.4, sy[i], 200 + (cx - 200) * 0.6, c_y, cx, c_y); ctx.stroke();
                }
                ctx.restore();
            }
        }
    }
    
    const cap1Exit = track(f, 94, 8, 0, 1, Easing.E_PUSH);
    const cap2Rise = track(f, 94, 8, 0, 1, Easing.E_IN);
    const cap2Exit = track(f, 112, 8, 0, 1, Easing.E_PUSH);
    const cap3Rise = track(f, 112, 8, 0, 1, Easing.E_IN);
    
    ctx.save();
    ctx.beginPath(); ctx.rect(120, 1010 - 44, 1000, 54); ctx.clip();
    if (cap1Exit < 1) drawLineMasked(ctx, "Everyone picks two rooms.", 120, 1010 - (cap1Exit * 44 * 1.1), 40, 500, Colors.PAPER, '0em', 76, f, 1);
    if (cap2Rise > 0 && cap2Exit < 1) drawLineMasked(ctx, "Some rooms are in demand.", 120, 1010 - (cap2Exit * 44 * 1.1), 40, 500, Colors.PAPER, '0em', 94, f, 1);
    if (cap3Rise > 0) drawLineMasked(ctx, "The program finds the best fit.", 120, 1010, 40, 500, Colors.PAPER, '0em', 112, f, 1);
    ctx.restore();
}

function renderSceneC(ctx, f) {
    ctx.fillStyle = Colors.COBALT;
    ctx.fillRect(0, 0, W, H);
    drawHUD(ctx, f, Colors.PAPER);
    
    const pNota = track(f, 138, 20, 0, 1, Easing.E_IN);
    const wNota = lerp(200, 800, pNota);
    drawWordMasked(ctx, "Nota", 120, 330, 300, wNota, Colors.PAPER, '-0.04em', pNota);
    
    drawLineMasked(ctx, "Turns any PDF into diagrams", 120, 410, 44, 400, Colors.PAPER, '0em', 140, f, 1);
    drawLineMasked(ctx, "you can study.", 120, 466, 44, 400, Colors.PAPER, '0em', 144, f, 1);
    drawLineMasked(ctx, "Built with Flutter", 120, 530, 32, 400, Colors.PAPER, '0em', 148, f, 1);
    
    if (f < tl.t3.shrinkStart) {
        ctx.fillStyle = Colors.PAPER;
        ctx.fillRect(SheetBase.x, SheetBase.y, SheetBase.w, SheetBase.h);
    }
    
    const pTrace = track(f, 152, 8, 0, 1, Easing.linear);
    const pRetract = track(f, tl.t3.retractStart, tl.t3.retractEnd - tl.t3.retractStart, 0, 1, Easing.E_PUSH);
    
    if (pRetract < 1 && f < tl.t3.shrinkStart) {
        ctx.save();
        const rx = lerp(0, -500, pRetract);
        ctx.translate(rx, 0);
        ctx.globalAlpha = 1 - pRetract;
        ctx.font = getFont(700, 34); ctx.fillStyle = Colors.INK; ctx.textBaseline = 'alphabetic';
        if (pTrace > 0.5) ctx.fillText("Photosynthesis", 1012, 212);
        
        const by = [250, 380, 510, 640]; const bw = [396, 372, 396, 240];
        for (let b = 0; b < 4; b++) {
            for (let r = 0; r < 4; r++) {
                const barP = track(f, 152 + b*2 + r, 8, 0, 1, Easing.E_IN);
                if (barP > 0) {
                    ctx.fillStyle = Colors.MIST;
                    if (f >= tl.nota.bar1 && b === 0 && r === 1) ctx.fillStyle = Colors.COBALT;
                    if (f >= tl.nota.bar2 && b === 1 && r === 2) ctx.fillStyle = Colors.COBALT;
                    if (f >= tl.nota.bar3 && b === 2 && r === 0) ctx.fillStyle = Colors.COBALT;
                    ctx.fillRect(1012, by[b] + r*22, bw[r] * barP, 12);
                }
            }
        }
        ctx.restore();
    }
    
    const drawNode = (ix, iy, m, cx, cy, label) => {
        const x = lerp(ix, cx, m); const y = lerp(iy, cy, m);
        const w = lerp(396, 310, m); const h = lerp(12, 72, m);
        const r = lerp(0, 14, m);
        ctx.save(); ctx.fillStyle = Colors.PAPER; ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath(); ctx.fill();
        if (m > 0.8) {
            const alpha = track(m, 0.8, 0.2, 0, 1, Easing.linear);
            ctx.fillStyle = Colors.INK; ctx.globalAlpha = alpha;
            ctx.font = getFont(600, 30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, x + w/2, y + h/2 + 2);
        }
        ctx.restore();
    };
    
    const m1 = track(f, tl.nota.node1 - 6, 16, 0, 1, Easing.E_PUSH); // label at node1
    if (m1 > 0) drawNode(1012, 250 + 22, m1, 1490, 200, "Sunlight");
    const m2 = track(f, tl.nota.node2 - 6, 16, 0, 1, Easing.E_PUSH);
    if (m2 > 0) drawNode(1012, 380 + 44, m2, 1490, 400, "Leaf");
    const m3 = track(f, tl.nota.node3 - 6, 16, 0, 1, Easing.E_PUSH);
    if (m3 > 0) drawNode(1012, 510 + 0, m3, 1490, 600, "Sugar + oxygen");
    
    // Arrows finish by 212. Arrows start after nodes finish. Node1 finishes by 192+10=202. Let's start arrows at 200, 204.
    const a1 = track(f, 200, 8, 0, 1, Easing.linear);
    if (a1 > 0) {
        ctx.strokeStyle = Colors.PAPER; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(1490 + 155, 272 + 5); 
        ctx.lineTo(1490 + 155, lerp(272 + 5, 400 - 5, a1)); ctx.stroke();
        if (a1 >= 1) {
            ctx.fillStyle = Colors.PAPER; ctx.beginPath();
            ctx.moveTo(1490 + 155, 400 - 5); ctx.lineTo(1490 + 155 - 6, 400 - 5 - 12); ctx.lineTo(1490 + 155 + 6, 400 - 5 - 12); ctx.fill();
        }
    }
    const a2 = track(f, 204, 8, 0, 1, Easing.linear);
    if (a2 > 0) {
        ctx.strokeStyle = Colors.PAPER; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(1490 + 155, 472 + 5); 
        ctx.lineTo(1490 + 155, lerp(472 + 5, 600 - 5, a2)); ctx.stroke();
        if (a2 >= 1) {
            ctx.fillStyle = Colors.PAPER; ctx.beginPath();
            ctx.moveTo(1490 + 155, 600 - 5); ctx.lineTo(1490 + 155 - 6, 600 - 5 - 12); ctx.lineTo(1490 + 155 + 6, 600 - 5 - 12); ctx.fill();
        }
    }
    
    const cap1Exit = track(f, 166, 8, 0, 1, Easing.E_PUSH);
    const cap2Rise = track(f, 166, 8, 0, 1, Easing.E_IN);
    const cap2Exit = track(f, 186, 8, 0, 1, Easing.E_PUSH);
    const cap3Rise = track(f, 186, 8, 0, 1, Easing.E_IN);
    
    ctx.save();
    ctx.beginPath(); ctx.rect(120, 1010 - 44, 1000, 54); ctx.clip();
    if (cap1Exit < 1) drawLineMasked(ctx, "Drop in any PDF.", 120, 1010 - (cap1Exit * 44 * 1.1), 40, 500, Colors.PAPER, '0em', 152, f, 1);
    if (cap2Rise > 0 && cap2Exit < 1) drawLineMasked(ctx, "AI picks the key ideas.", 120, 1010 - (cap2Exit * 44 * 1.1), 40, 500, Colors.PAPER, '0em', 166, f, 1);
    if (cap3Rise > 0) drawLineMasked(ctx, "You get a diagram to study.", 120, 1010, 40, 500, Colors.PAPER, '0em', 186, f, 1);
    ctx.restore();
}

function getPortraitRect(f) {
    if (f < tl.t3.shrinkStart) return { ...SheetBase };
    if (f >= tl.t3.shrinkStart && f < tl.t3.growthStart) {
        const p = track(f, tl.t3.shrinkStart, tl.t3.growthStart - tl.t3.shrinkStart, 0, 1, Easing.E_IN);
        const scale = lerp(1, 0.92, p);
        return {
            x: SheetBase.x + SheetBase.w/2 - (SheetBase.w*scale)/2,
            y: SheetBase.y + SheetBase.h/2 - (SheetBase.h*scale)/2,
            w: SheetBase.w * scale,
            h: SheetBase.h * scale
        };
    }
    const start = {
        x: SheetBase.x + SheetBase.w/2 - (SheetBase.w*0.92)/2,
        y: SheetBase.y + SheetBase.h/2 - (SheetBase.h*0.92)/2,
        w: SheetBase.w * 0.92,
        h: SheetBase.h * 0.92
    };
    const end = { x: 1200, y: 140, w: 600, h: 822 };
    const p = track(f, tl.t3.growthStart, tl.t3.growthEnd - tl.t3.growthStart, 0, 1, Easing.E_PUSH);
    return {
        x: lerp(start.x, end.x, p),
        y: lerp(start.y, end.y, p),
        w: lerp(start.w, end.w, p),
        h: lerp(start.h, end.h, p)
    };
}

function renderSceneD(ctx, f) {
    ctx.fillStyle = Colors.PAPER;
    ctx.fillRect(0, 0, W, H);
    drawHUD(ctx, f, Colors.INK);
    
    const pRetract = track(f, tl.t3.retractStart, tl.t3.retractEnd - tl.t3.retractStart, 0, 1, Easing.E_PUSH);
    if (pRetract > 0 && pRetract < 1) {
        ctx.save();
        const rx = lerp(0, -500, pRetract);
        ctx.translate(rx, 0); ctx.globalAlpha = 1 - pRetract;
        ctx.font = getFont(700, 34); ctx.fillStyle = Colors.INK; ctx.textBaseline = 'alphabetic';
        ctx.fillText("Photosynthesis", 1012, 212);
        const by = [250, 380, 510, 640]; const bw = [396, 372, 396, 240];
        for (let b = 0; b < 4; b++) {
            for (let r = 0; r < 4; r++) {
                ctx.fillStyle = Colors.MIST;
                if (f >= tl.nota.bar1 && b === 0 && r === 1) ctx.fillStyle = Colors.COBALT;
                if (f >= tl.nota.bar2 && b === 1 && r === 2) ctx.fillStyle = Colors.COBALT;
                if (f >= tl.nota.bar3 && b === 2 && r === 0) ctx.fillStyle = Colors.COBALT;
                ctx.fillRect(1012, by[b] + r*22, bw[r], 12);
            }
        }
        ctx.restore();
    }
    
    const pRect = getPortraitRect(f);
    const wipeP = track(f, tl.t3.wipeStart, tl.t3.wipeEnd - tl.t3.wipeStart, 0, 1, Easing.E_IN);
    if (wipeP > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(pRect.x, pRect.y, pRect.w, pRect.h * wipeP); ctx.clip();
        const cScale = track(f, tl.t3.growthStart, tl.t3.growthEnd - tl.t3.growthStart, 1.08, 1.0, Easing.E_PUSH);
        const img = document.getElementById('portrait');
        if (img && img.complete) {
            const sx = 32, sy = 0, sw = 800, sh = 1096;
            const imgRatio = sw / sh; const rectRatio = pRect.w / pRect.h;
            let drawW, drawH;
            if (rectRatio > imgRatio) { drawW = pRect.w; drawH = pRect.w / imgRatio; }
            else { drawH = pRect.h; drawW = pRect.h * imgRatio; }
            drawW *= cScale; drawH *= cScale;
            const dx = pRect.x + (pRect.w - drawW)/2; const dy = pRect.y + (pRect.h - drawH)/2;
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, drawW, drawH);
        }
        ctx.restore();
    }
    
    const pFav = track(f, tl.signOff.tagline - 12, 22, 0, 1, Easing.E_IN);
    const wFav = lerp(200, 800, pFav);
    drawWordMasked(ctx, "Favour", 120, 470, 260, wFav, Colors.INK, '-0.04em', pFav);
    
    drawLineMasked(ctx, "I build things end to end.", 120, 570, 56, 400, Colors.INK, '0em', tl.signOff.tagline, f, 2);
    drawLineMasked(ctx, "Flutter, Golang, NodeJS, Dart.", 120, 640, 36, 400, Colors.SLATE_ON_PAPER, '0em', tl.signOff.subline, f, 2);
    
    const pUrl = track(f, tl.signOff.url, 12, 0, 1, Easing.E_IN);
    const urlW = drawWordMasked(ctx, "devfavour.vercel.app", 120, 760, 44, 400, Colors.COBALT, '0em', pUrl);
    
    const lineP = track(f, tl.signOff.underlineStart, tl.signOff.underlineEnd - tl.signOff.underlineStart, 0, 1, Easing.E_PUSH);
    if (lineP > 0) {
        ctx.fillStyle = Colors.COBALT;
        ctx.fillRect(120, 780, urlW * lineP, 3);
    }
}

function renderFrameAtTime(f, targetCtx) {
    let baseScene = 'A'; let incomingScene = null; let clipRect = null;
    if (f >= tl.t1.shrinkStart && f < tl.t1.growthEnd) {
        baseScene = 'A'; incomingScene = 'B';
        clipRect = getTransitionRect(f, {x: caretX, y: caretY, w: caretW, h: caretH}, tl.t1.shrinkStart, tl.t1.growthStart, tl.t1.growthEnd);
    } else if (f >= tl.t1.growthEnd && f < tl.t2.shrinkStart) {
        baseScene = 'B';
    } else if (f >= tl.t2.shrinkStart && f < tl.t2.growthEnd) {
        baseScene = 'B'; incomingScene = 'C';
        clipRect = getTransitionRect(f, {x: R6X - 20, y: R6Y - 20, w: 40, h: 40}, tl.t2.shrinkStart, tl.t2.growthStart, tl.t2.growthEnd);
    } else if (f >= tl.t2.growthEnd && f < tl.t3.shrinkStart) {
        baseScene = 'C';
    } else if (f >= tl.t3.shrinkStart && f < tl.t3.growthEnd) {
        baseScene = 'C'; incomingScene = 'D';
        clipRect = getTransitionRect(f, SheetBase, tl.t3.shrinkStart, tl.t3.growthStart, tl.t3.growthEnd);
    } else if (f >= tl.t3.growthEnd) {
        baseScene = 'D';
    }
    
    targetCtx.fillStyle = '#000'; targetCtx.fillRect(0,0,W,H);
    if (baseScene === 'A') renderSceneA(targetCtx, f);
    if (baseScene === 'B') renderSceneB(targetCtx, f);
    if (baseScene === 'C') renderSceneC(targetCtx, f);
    if (baseScene === 'D') renderSceneD(targetCtx, f);
    if (incomingScene) {
        targetCtx.save(); targetCtx.beginPath();
        targetCtx.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h); targetCtx.clip();
        if (incomingScene === 'B') renderSceneB(targetCtx, f);
        if (incomingScene === 'C') renderSceneC(targetCtx, f);
        if (incomingScene === 'D') renderSceneD(targetCtx, f);
        targetCtx.restore();
    }
}

const accumBuffer = new Float32Array(W * H * 3);
window.renderFrame = function(frame) {
    const isBlurring = (frame >= tl.t1.growthStart && frame <= tl.t1.growthEnd) || 
                       (frame >= tl.t2.growthStart && frame <= tl.t2.growthEnd) || 
                       (frame >= tl.t3.retractStart && frame <= tl.t3.growthEnd);
    if (isBlurring) {
        const N = 12; accumBuffer.fill(0);
        for (let s = 0; s < N; s++) {
            const subF = frame + (s / (N - 1)) * (1 / 3);
            offscreen.ctx.clearRect(0, 0, W, H); renderFrameAtTime(subF, offscreen.ctx);
            const id = offscreen.ctx.getImageData(0, 0, W, H).data;
            for (let i = 0, j = 0; i < id.length; i += 4, j += 3) {
                accumBuffer[j] += id[i]; accumBuffer[j+1] += id[i+1]; accumBuffer[j+2] += id[i+2];
            }
        }
        const outId = ctx.createImageData(W, H);
        for (let i = 0, j = 0; i < outId.data.length; i += 4, j += 3) {
            outId.data[i] = accumBuffer[j] / N; outId.data[i+1] = accumBuffer[j+1] / N; outId.data[i+2] = accumBuffer[j+2] / N; outId.data[i+3] = 255;
        }
        ctx.putImageData(outId, 0, 0);
    } else {
        renderFrameAtTime(frame, ctx);
    }
    drawGrain(ctx, frame);
};
