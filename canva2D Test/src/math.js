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
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
        return 0.5 * (-Math.pow(2, -10 * --t) + 2);
    },
    // Overshoot then settle — the hero easing for this project
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    // Strong overshoot
    easeOutBackStrong: t => {
        const c1 = 2.8;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    // Critically damped spring — fast arrival, tiny settle oscillation
    // Soft, controlled ease (smooth and precise, minimal elasticity)
    spring: t => {
        return 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-t * 8);
    },
    // Map bouncySpring to the same soft ease since user requested removing all extreme bounce
    bouncySpring: t => {
        return 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-t * 8);
    },
    // Anticipation: wind up significantly before launching
    anticipateBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    // Whip: slow wind up, massive acceleration, sudden stop
    whip: t => {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    // Cinematic slow-in, fast-out, slow-in with extreme tension
    tensionInOut: t => {
        const c = 2.5949095;
        return (t *= 2) < 1 
            ? 0.5 * (Math.pow(t, 2) * ((c + 1) * t - c))
            : 0.5 * (Math.pow(t - 2, 2) * ((c + 1) * (t - 2) + c) + 2);
    },
    // Anticipate then overshoot
    anticipateOvershoot: t => {
        if (t < 0.35) {
            // Anticipation phase: ease back
            const p = t / 0.35;
            return -0.08 * Math.sin(p * Math.PI);
        } else {
            // Forward with overshoot
            const p = (t - 0.35) / 0.65;
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
        }
    },
    // Slow start, explosive middle, cushioned landing
    easeInOutQuintSharp: t => {
        if (t < 0.5) return 16 * t * t * t * t * t;
        return 1 - Math.pow(-2 * t + 2, 5) / 2;
    }
};

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function map(v, in_min, in_max, out_min, out_max) {
    return lerp(out_min, out_max, clamp((v - in_min) / (in_max - in_min), 0, 1));
}

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
