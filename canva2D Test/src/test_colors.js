import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const expected = [
    { f: 30, r: 238, g: 240, b: 243, name: 'PAPER' },
    { f: 100, r: 12, g: 18, b: 38, name: 'INK' },
    { f: 200, r: 42, g: 59, b: 255, name: 'COBALT' },
    { f: 290, r: 238, g: 240, b: 243, name: 'PAPER' }
];

let allPassed = true;

for (const exp of expected) {
    const frameFile = path.join(__dirname, '..', 'out', 'frames', `frame_${exp.f.toString().padStart(5, '0')}.png`);
    const cmd = `ffmpeg -i "${frameFile}" -vf "crop=1:1:1900:1060" -f image2pipe -vcodec rawvideo -pix_fmt rgb24 -`;
    try {
        const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] });
        const r = out[0];
        const g = out[1];
        const b = out[2];
        
        const rDiff = Math.abs(r - exp.r);
        const gDiff = Math.abs(g - exp.g);
        const bDiff = Math.abs(b - exp.b);
        
        if (rDiff <= 3 && gDiff <= 3 && bDiff <= 3) {
            console.log(`[PASS] Frame ${exp.f}: expected ${exp.name}, got rgb(${r},${g},${b})`);
        } else {
            console.error(`[FAIL] Frame ${exp.f}: expected ${exp.name} rgb(${exp.r},${exp.g},${exp.b}), got rgb(${r},${g},${b})`);
            allPassed = false;
        }
    } catch (e) {
        console.error(`Error reading frame ${exp.f}`, e.message);
        allPassed = false;
    }
}

if (!allPassed) {
    process.exit(1);
}
