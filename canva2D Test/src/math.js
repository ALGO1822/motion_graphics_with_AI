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

// Cubic Bezier solver
function CubicBezier(mX1, mY1, mX2, mY2) {
    if (mX1 === mY1 && mX2 === mY2) return (x) => x;
    const NEWTON_ITERATIONS = 4;
    const NEWTON_MIN_SLOPE = 0.001;
    const SUBDIVISION_PRECISION = 0.0000001;
    const SUBDIVISION_MAX_ITERATIONS = 10;
    const kSplineTableSize = 11;
    const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
    const float32ArraySupported = typeof Float32Array === 'function';
    
    function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C(aA1)      { return 3.0 * aA1; }
    
    function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }
    function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }
    
    const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
    
    function getTForX(aX) {
        let intervalStart = 0.0;
        let currentSample = 1;
        const lastSample = kSplineTableSize - 1;
        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
        }
        --currentSample;
        const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        let guessForT = intervalStart + dist * kSampleStepSize;
        const initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
                const currentSlope = getSlope(guessForT, mX1, mX2);
                if (currentSlope === 0.0) return guessForT;
                const currentX = calcBezier(guessForT, mX1, mX2) - aX;
                guessForT -= currentX / currentSlope;
            }
            return guessForT;
        } else if (initialSlope === 0.0) {
            return guessForT;
        } else {
            let aB = intervalStart + kSampleStepSize;
            let aA = intervalStart;
            let currentX, currentT, i = 0;
            do {
                currentT = aA + (aB - aA) / 2.0;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) aB = currentT; else aA = currentT;
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
            return currentT;
        }
    }
    return function BezierEasing(x) {
        if (x === 0 || x === 1) return x;
        return calcBezier(getTForX(x), mY1, mY2);
    };
}

export const Easing = {
    linear: t => t,
    E_PUSH: CubicBezier(0.87, 0, 0.13, 1),
    E_IN: CubicBezier(0.16, 1, 0.3, 1)
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

export function track(time, startT, duration, startV, endV, easing = Easing.linear) {
    if (time <= startT) return startV;
    if (time >= startT + duration) return endV;
    const p = (time - startT) / duration;
    return startV + (endV - startV) * easing(p);
}

export function keyframes(time, frames) {
    if (frames.length === 0) return 0;
    if (frames.length === 1 || time <= frames[0].t) return frames[0].v;
    
    for (let i = 0; i < frames.length - 1; i++) {
        const f1 = frames[i];
        const f2 = frames[i+1];
        if (time >= f1.t && time < f2.t) {
            const duration = f2.t - f1.t;
            const p = (time - f1.t) / duration;
            const ease = f2.e || Easing.linear;
            return f1.v + (f2.v - f1.v) * ease(p);
        }
    }
    return frames[frames.length - 1].v;
}

export function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
