import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleRate = 44100;
const durationSeconds = 10;
const numSamples = sampleRate * durationSeconds;
const buffer = new Float32Array(numSamples);

function mixTone(startSec, endSec, freqStart, freqEnd, type = 'sine', volume = 0.5) {
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.floor(endSec * sampleRate);
    for (let i = startSample; i < endSample; i++) {
        const t = (i - startSample) / sampleRate;
        const totalT = endSec - startSec;
        const freq = freqStart + (freqEnd - freqStart) * (t / totalT);
        
        let sample = 0;
        if (type === 'sine') sample = Math.sin(2 * Math.PI * freq * t);
        if (type === 'noise') sample = (Math.random() * 2 - 1);
        
        const attack = 0.01;
        let env = 1;
        if (t < attack) env = t / attack;
        else env = 1 - ((t - attack) / (totalT - attack));
        
        buffer[i] += sample * volume * env;
    }
}

function tToSec(f) { return f / 30; }

mixTone(tToSec(44), tToSec(44) + 0.06, 80, 40, 'sine', 0.6);
mixTone(tToSec(132), tToSec(132) + 0.06, 80, 40, 'sine', 0.6);
mixTone(tToSec(216), tToSec(216) + 0.06, 80, 40, 'sine', 0.6);

mixTone(tToSec(18), tToSec(18) + 0.02, 3000, 3000, 'noise', 0.1);
mixTone(tToSec(34), tToSec(34) + 0.02, 3000, 3000, 'noise', 0.1);

mixTone(tToSec(168), tToSec(168) + 0.02, 3000, 3000, 'noise', 0.1);
mixTone(tToSec(174), tToSec(174) + 0.02, 3000, 3000, 'noise', 0.1);
mixTone(tToSec(180), tToSec(180) + 0.02, 3000, 3000, 'noise', 0.1);


let maxAmp = 0.001;
for (let i=0; i<numSamples; i++) {
    if (Math.abs(buffer[i]) > maxAmp) maxAmp = Math.abs(buffer[i]);
}

const dataSize = numSamples * 2;
const fileBuffer = Buffer.alloc(44 + dataSize);

fileBuffer.write('RIFF', 0);
fileBuffer.writeUInt32LE(36 + dataSize, 4);
fileBuffer.write('WAVE', 8);
fileBuffer.write('fmt ', 12);
fileBuffer.writeUInt32LE(16, 16);
fileBuffer.writeUInt16LE(1, 20);
fileBuffer.writeUInt16LE(1, 22);
fileBuffer.writeUInt32LE(sampleRate, 24);
fileBuffer.writeUInt32LE(sampleRate * 2, 28);
fileBuffer.writeUInt16LE(2, 32);
fileBuffer.writeUInt16LE(16, 34);
fileBuffer.write('data', 36);
fileBuffer.writeUInt32LE(dataSize, 40);

for (let i=0; i<numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i] / maxAmp));
    fileBuffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'soundtrack.wav'), fileBuffer);
console.log('Generated soundtrack.wav');
