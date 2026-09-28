export class PRNG {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    range(min, max) {
        return min + this.next() * (max - min);
    }
}

export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
        return 0.5 * (-Math.pow(2, -10 * --t) + 2);
    },
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
};

/**
 * Functional timeline interpolator
 */
export function track(time, startT, duration, startV, endV, easing = Easing.easeInOutCubic) {
    if (time <= startT) return startV;
    if (time >= startT + duration) return endV;
    const p = (time - startT) / duration;
    return startV + (endV - startV) * easing(p);
}

/**
 * Keyframe interpolator
 * frames: [{t: 0, v: 0}, {t: 1, v: 100, e: Easing.easeOutCubic}]
 */
export function keyframes(time, frames) {
    if (frames.length === 0) return 0;
    if (frames.length === 1 || time <= frames[0].t) return frames[0].v;
    
    for (let i = 0; i < frames.length - 1; i++) {
        const f1 = frames[i];
        const f2 = frames[i+1];
        if (time >= f1.t && time < f2.t) {
            const duration = f2.t - f1.t;
            const p = (time - f1.t) / duration;
            const ease = f2.e || Easing.easeInOutCubic;
            return f1.v + (f2.v - f1.v) * ease(p);
        }
    }
    return frames[frames.length - 1].v;
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

export const Colors = {
    bg: '#1C1B1A',
    orange: '#D95A2B',
    warmGray: '#7A7673',
    lightWarmGray: '#C4C2C0',
    offWhite: '#F2F0EB',
    black: '#0A0A0A'
};
