import { Easing, track, keyframes, clamp, lerp } from './math.js';
import { Colors, createLayer, drawRect, drawLine } from './graphics.js';
import { drawKineticWord, drawText, drawSliced } from './typography.js';

const config = { width: 1920, height: 1080, fps: 30, durationInSeconds: 10 };
window.animationConfig = config;

const W = config.width, H = config.height;
const CX = W / 2, CY = H / 2;
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = W; canvas.height = H;

const FONT_LG = '900 240px "Helvetica Neue", Helvetica, sans-serif';
const FONT_XL = '900 340px "Helvetica Neue", Helvetica, sans-serif';

const buf1 = createLayer();
const buf2 = createLayer();

const STAGGER = {
    BUILD:   [0, 0.04, 0.08, 0.02, 0.06],
    SYSTEMS: [0, 0.03, 0.05, 0.02, 0.04, 0.03, 0.06],
    ITERATE: [0, 0.03, 0.02, 0.04, 0.01, 0.03, 0.05],
    CREATE:  [0, 0.04, 0.07, 0.02, 0.05, 0.03],
    FAVOUR:  [0, 0.05, 0.02, 0.07, 0.03, 0.06],
};

window.renderFrame = function(frame) {
    const t = frame / config.fps;

    ctx.fillStyle = Colors.bg;
    ctx.fillRect(0, 0, W, H);
    buf1.ctx.clearRect(0, 0, W, H);
    buf2.ctx.clearRect(0, 0, W, H);

    // ================================================================
    //  PHASE 1 — BUILD (0.0 – 1.5s) | Dynamic Pacing: Fast Snap, Long Hold
    //  Semantic Motion: Text literally constructs block-by-block from bottom up.
    // ================================================================
    if (t < 1.5) {
        // Base charcoal foundation
        const foundProg = track(t, 0.1, 0.4, 0, 1, Easing.easeOutExpo);
        const lw = lerp(0, 820, foundProg);
        drawRect(ctx, CX - lw/2, CY + 140, lw, 10, Colors.charcoal);

        buf1.ctx.save();
        drawKineticWord(buf1.ctx, "BUILD", CX, CY, FONT_LG, Colors.grey, 'center', 'middle', 18, (ch, i) => {
            const d = STAGGER.BUILD[i];
            const p = track(t, 0.3 + d, 0.5, 0, 1, Easing.spring);
            const ty = lerp(150, 0, clamp(p, 0, 1));
            // Stack up from bottom (clipping mask trick applied via drawSliced logic or just scaleY)
            // But we want it to feel constructed block by block. We use scaleY from the bottom.
            return { ty, scaleY: p }; // simple but effective construct from bottom
        });
        
        // Draw into bounding box
        if (lw > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(CX - 410, CY - 150, 820, 290);
            ctx.clip();
            ctx.drawImage(buf1.canvas, 0, 0);
            ctx.restore();
        }
    }

    // ================================================================
    //  PHASE 2 — SYSTEMS (1.5 – 2.8s) | Whip & Semantic Grid
    //  Anticipation: Screen winds up slightly positive before whipping -90.
    //  Overlapping Exits: BUILD slices delay their exit based on index.
    // ================================================================
    if (t >= 1.5 && t < 2.8) {
        // 1. Anticipation + Whip rotation
        const rotProg = track(t, 1.5, 1.0, 0, 1, Easing.tensionInOut); 
        // Maps 0->1 using tensionInOut. At early t, it goes negative (positive degrees).
        const globalRot = lerp(0, -Math.PI / 2, rotProg);

        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(globalRot);
        ctx.translate(-CX, -CY);

        // Outgoing BUILD with Overlapping Exit action
        if (rotProg < 1) {
            buf1.ctx.clearRect(0, 0, W, H);
            drawRect(buf1.ctx, CX - 410, CY - 145, 820, 290, Colors.charcoal);
            drawText(buf1.ctx, "BUILD", CX, CY, FONT_LG, Colors.grey, 'center', 'middle', 18);

            drawSliced(ctx, buf1.canvas, 0, 0, W, H, 8, false, (i, total) => {
                const exitDelay = i * 0.05;
                const exitProg = clamp((rotProg * 1.5) - exitDelay, 0, 1);
                const dir = (i % 2 === 0) ? 1 : -1;
                // Exits with extreme exponent
                const dx = dir * Math.pow(exitProg, 5) * W;
                return { dx };
            });
        }

        // Incoming SYSTEMS with Semantic Grids
        const revealProg = track(t, 1.9, 0.7, 0, 1, Easing.easeOutExpo);
        if (revealProg > 0) {
            ctx.save();
            ctx.translate(CX, CY);
            ctx.rotate(Math.PI / 2); // Counter rotate to stay visually upright
            
            // Draw Semantic Interlocking Grid
            ctx.globalAlpha = revealProg * 0.2;
            for (let i = -10; i <= 10; i++) {
                const off = (t * 100) % 50; // Constant motion
                drawLine(ctx, -W, i * 50 + off, W, i * 50 + off, Colors.charcoal, 1);
                drawLine(ctx, i * 50 - off, -H, i * 50 - off, H, Colors.charcoal, 1);
            }
            ctx.globalAlpha = 1;
            
            drawKineticWord(ctx, "SYSTEMS", 0, 0, FONT_LG, Colors.darkGrey, 'center', 'middle', 12, (ch, i) => {
                const d = STAGGER.SYSTEMS[i];
                const p = track(t, 2.0 + d, 0.5, 0, 1, Easing.spring);
                const dir = (i % 2 === 0) ? 1 : -1;
                const ty = lerp(dir * 200, 0, clamp(p, 0, 1));
                return { ty };
            });
            ctx.restore();
        }
        ctx.restore();
    }

    // ================================================================
    //  PHASE 3 — ITERATE (2.8 – 4.1s) | Semantic Loop & Echo
    //  SYSTEMS compresses, opens for ITERATE. ITERATE creates concentric echos.
    // ================================================================
    if (t >= 2.8 && t < 4.1) {
        const compress = track(t, 2.8, 0.4, 0, 1, Easing.easeInOutQuint);
        const rotate = track(t, 3.1, 0.3, 0, 1, Easing.easeInOutExpo);
        const expand = track(t, 3.3, 0.4, 0, 1, Easing.easeOutBack);
        
        // SYSTEMS compressing
        if (compress < 1 || (compress >= 1 && rotate < 1)) {
            drawKineticWord(ctx, "SYSTEMS", CX, CY, FONT_LG, Colors.darkGrey, 'center', 'middle', 12, (ch, i, cx, cy) => {
                const localP = clamp((compress - STAGGER.SYSTEMS[i]) * 1.5, 0, 1);
                const scaleX = lerp(1, 0.02, localP);
                const scaleY = lerp(1, 3.5, localP);
                const tx = lerp(0, CX + (i - 3) * 20 - cx, localP);
                const rot = rotate * (Math.PI / 2);
                return { tx, scaleX, scaleY, rot };
            });
        }

        // Charcoal structure
        if (rotate >= 0.5) {
            const maskW = lerp(140, 1300, expand);
            const maskH = lerp(30, 320, expand);
            ctx.save();
            ctx.translate(CX, CY);
            drawRect(ctx, -maskW/2, -maskH/2, maskW, maskH, Colors.charcoal);
            ctx.beginPath();
            ctx.rect(-maskW/2, -maskH/2, maskW, maskH);
            ctx.clip();

            if (t > 3.4) {
                // Semantic Echo effect: ITERATE spawns larger outline copies of itself
                const echoProg = track(t, 3.6, 0.5, 0, 1, Easing.easeOutExpo);
                
                // Draw Echos first (behind)
                if (echoProg > 0) {
                    ctx.save();
                    ctx.strokeStyle = Colors.grey;
                    ctx.lineWidth = 2;
                    for (let e = 1; e <= 3; e++) {
                        const s = 1 + (e * echoProg * 0.3);
                        const a = (1 - echoProg) * (0.6 / e);
                        ctx.save();
                        ctx.scale(s, s);
                        ctx.globalAlpha = Math.max(0, a);
                        // Just stroke it
                        ctx.font = FONT_LG;
                        ctx.textBaseline = 'middle';
                        ctx.textAlign = 'center';
                        ctx.strokeText("ITERATE", 0, 0); // Simplified for echo
                        ctx.restore();
                    }
                    ctx.restore();
                }

                // Core ITERATE
                drawKineticWord(ctx, "ITERATE", 0, 0, FONT_LG, Colors.grey, 'center', 'middle', 8, (ch, i) => {
                    const p = track(t, 3.4 + STAGGER.ITERATE[i], 0.4, 0, 1, Easing.spring);
                    const ty = lerp(200, 0, clamp(p, 0, 1));
                    return { ty };
                });
            }
            ctx.restore();
        }
    }

    // ================================================================
    //  PHASE 4 — CREATE (4.1 – 7.0s) | The Geometric Drafting Bridge
    //  ITERATE squeezed. Massive slow drafting of CREATE (Pacing tension).
    // ================================================================
    if (t >= 4.1 && t < 7.0) {
        const squeeze = track(t, 4.1, 0.4, 0, 1, Easing.easeInOutQuint);
        const expand  = track(t, 4.5, 0.4, 0, 1, Easing.easeInOutExpo);
        
        const maskW = keyframes(t, [
            { t: 4.1, v: 1300 },
            { t: 4.5, v: 1300 },
            { t: 4.9, v: W + 100, e: Easing.easeInOutExpo }
        ]);
        const maskH = keyframes(t, [
            { t: 4.1, v: 320 },
            { t: 4.5, v: 2, e: Easing.easeInOutQuint },
            { t: 4.9, v: H + 100, e: Easing.easeInOutExpo }
        ]);

        ctx.save();
        ctx.translate(CX, CY);
        drawRect(ctx, -maskW/2, -maskH/2, maskW, maskH, Colors.charcoal);
        
        ctx.beginPath();
        ctx.rect(-maskW/2, -maskH/2, maskW, maskH);
        ctx.clip();
        
        if (squeeze < 1) {
            drawKineticWord(ctx, "ITERATE", 0, 0, FONT_LG, Colors.grey, 'center', 'middle', 8, (ch, i) => {
                const scaleY = lerp(1, 0, squeeze);
                return { scaleY };
            });
        }
        ctx.restore();

        if (expand > 0) {
            const createText = "CREATE";
            const trackingAmt = 15;
            
            ctx.save();
            ctx.font = FONT_XL;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            
            let totalWidth = 0;
            let charWidths = [];
            for (let i = 0; i < createText.length; i++) {
                const cw = ctx.measureText(createText[i]).width;
                charWidths.push(cw);
                totalWidth += cw;
            }
            totalWidth += (createText.length - 1) * trackingAmt;
            
            let currentX = CX - totalWidth / 2;
            for (let i = 0; i < createText.length; i++) {
                const char = createText[i];
                const cx = currentX + charWidths[i] / 2;
                
                // Slow, deliberate drafting
                const outline = track(t, 4.8 + i * 0.15, 0.8, 0, 1, Easing.easeOutQuart);
                const fill = track(t, 5.5 + i * 0.15, 0.8, 0, 1, Easing.easeOutQuad);
                
                if (outline > 0) {
                    ctx.save();
                    ctx.strokeStyle = Colors.grey;
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    const pathLen = 3000;
                    ctx.setLineDash([pathLen]);
                    ctx.lineDashOffset = pathLen * (1 - outline);
                    ctx.strokeText(char, cx, CY);
                    ctx.restore();
                }
                
                if (fill > 0) {
                    ctx.save();
                    ctx.fillStyle = Colors.grey;
                    ctx.globalAlpha = fill;
                    ctx.fillText(char, cx, CY);
                    ctx.restore();
                }
                currentX += charWidths[i] + trackingAmt;
            }
            ctx.restore();
        }
    }

    // ================================================================
    //  PHASE 5/6 — FAVOUR (7.0 – 10.0s) | The Finale
    //  Overlapping Exits: The charcoal screen and CREATE shatter sequentially.
    // ================================================================
    if (t >= 7.0) {
        // Cascade slice & spin out of CREATE
        const shatterBase = track(t, 7.0, 1.2, 0, 1, Easing.easeOutExpo);
        const morph = track(t, 7.7, 0.6, 0, 1, Easing.easeInExpo);
        const frameExpand = track(t, 8.3, 0.7, 0, 1, Easing.easeOutBackStrong);

        // Draw exact end state of Phase 4 into buf1
        buf1.ctx.fillStyle = Colors.charcoal;
        buf1.ctx.fillRect(0, 0, W, H);
        drawText(buf1.ctx, "CREATE", CX, CY, FONT_XL, Colors.grey, 'center', 'middle', 15);

        if (morph < 1) {
            // Overlapping shatter exits!
            drawSliced(ctx, buf1.canvas, 0, 0, W, H, 36, true, (i, total) => {
                const distFromCenter = Math.abs((total / 2) - i) / (total / 2);
                const delay = distFromCenter * 0.3; // Edge pieces shatter later (or earlier)
                
                // Actual progress for this specific slice
                const sliceProg = clamp((shatterBase - delay) * 1.5, 0, 1);
                
                // 1. Shards spin 90 degrees
                const localSpinX = lerp(1, 0, sliceProg);
                
                // 2. Collapse to center as morph hits
                const sliceCenter = i * (W / total) + (W / total / 2);
                const dx = lerp(0, CX - sliceCenter, morph);
                
                return { dx, scaleX: localSpinX };
            });
        }
        
        if (morph > 0.8) {
            const frameW = lerp(50, 1600, clamp(frameExpand, 0, 1));
            const frameH = lerp(50, 780, clamp(frameExpand, 0, 1));

            ctx.strokeStyle = Colors.charcoal;
            ctx.lineWidth = 8;
            ctx.strokeRect(CX - frameW / 2, CY - frameH / 2, frameW, frameH);

            if (frameExpand > 0.2) {
                buf2.ctx.clearRect(0, 0, W, H);
                drawKineticWord(buf2.ctx, "FAVOUR", CX, CY, FONT_LG, Colors.darkGrey, 'center', 'middle', 35, (ch, i) => {
                    const d = STAGGER.FAVOUR[i];
                    const p = track(t, 8.5 + d, 0.7, 0, 1, Easing.spring);
                    const ty = lerp(450, 0, clamp(p, -0.2, 1));
                    const rot = lerp(Math.PI/4, 0, clamp(p, -0.2, 1));
                    return { ty, rot };
                });

                ctx.save();
                ctx.beginPath();
                ctx.rect(CX - frameW / 2, CY - frameH / 2, frameW, frameH);
                ctx.clip();
                ctx.drawImage(buf2.canvas, 0, 0);
                ctx.restore();
            }
        }
    }
};
