import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleRate = 44100;
const durationSeconds = 10;
const numSamples = sampleRate * durationSeconds;
const buffer = new Float32Array(numSamples);

// Simple synthesis functions
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
        
        // Envelope: quick attack, slow release
        const attack = 0.05;
        let env = 1;
        if (t < attack) env = t / attack;
        else env = 1 - ((t - attack) / (totalT - attack));
        
        buffer[i] += sample * volume * env;
    }
}

// 0.0s - 1.5s: BUILD (Heavy Sub Thuds)
for (let i=0; i<5; i++) {
    const start = 0.3 + i * 0.04;
    mixTone(start, start + 0.6, 120, 40, 'sine', 0.8);
}

// 1.5s - 2.8s: SYSTEMS (Anticipation suck in + Grid ratchet noise)
mixTone(1.5, 1.9, 200, 800, 'noise', 0.1); // suck in
mixTone(1.9, 2.5, 60, 40, 'sine', 0.9); // Heavy drop

// 2.8s - 4.1s: ITERATE (Digital echoing pings)
for (let i=0; i<3; i++) {
    mixTone(3.4 + i*0.2, 3.4 + i*0.2 + 0.5, 800 + i*200, 800 + i*200, 'sine', 0.1);
}

// 4.1s - 7.0s: CREATE (Squeeze + Drafting scratches)
mixTone(4.1, 4.5, 150, 40, 'noise', 0.2); // Squeeze
mixTone(4.8, 6.5, 4000, 2000, 'noise', 0.05); // Pencil drafting
mixTone(5.5, 7.0, 300, 300, 'sine', 0.1); // Fills glowing in

// 7.0s - 10.0s: FAVOUR (Shatter + Cinematic Riser + Final Hit)
mixTone(7.0, 7.7, 1000, 200, 'noise', 0.3); // Shatter
mixTone(7.0, 8.5, 50, 200, 'sine', 0.4); // Riser
mixTone(8.3, 10.0, 60, 30, 'sine', 1.0); // Massive final hit

// Normalize
let maxAmp = 0.001;
for (let i=0; i<numSamples; i++) {
    if (Math.abs(buffer[i]) > maxAmp) maxAmp = Math.abs(buffer[i]);
}

// Write WAV file
const dataSize = numSamples * 2; // 16-bit
const fileBuffer = Buffer.alloc(44 + dataSize);

// RIFF chunk
fileBuffer.write('RIFF', 0);
fileBuffer.writeUInt32LE(36 + dataSize, 4);
fileBuffer.write('WAVE', 8);
// fmt sub-chunk
fileBuffer.write('fmt ', 12);
fileBuffer.writeUInt32LE(16, 16); // Subchunk1Size
fileBuffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
fileBuffer.writeUInt16LE(1, 22); // NumChannels (Mono)
fileBuffer.writeUInt32LE(sampleRate, 24); // SampleRate
fileBuffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
fileBuffer.writeUInt16LE(2, 32); // BlockAlign
fileBuffer.writeUInt16LE(16, 34); // BitsPerSample
// data sub-chunk
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
