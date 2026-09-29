import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const OUT_DIR = path.join(projectRoot, 'out');

// Frames requested by user: 0, 15, 30, 44, 70, 80, 100, 128, 150, 175, 196, 215, 225, 250, 299
const selectExpr = 'eq(n,0)+eq(n,15)+eq(n,30)+eq(n,44)+eq(n,70)+eq(n,80)+eq(n,100)+eq(n,128)+eq(n,150)+eq(n,175)+eq(n,196)+eq(n,215)+eq(n,225)+eq(n,250)+eq(n,299)';
const inputFrames = path.join(OUT_DIR, 'frames', 'frame_%05d.png');
const outputFile = path.join(OUT_DIR, 'contact_sheet.jpg');

// Using tile=3x5 because 15 frames
const ffmpegCmd = `ffmpeg -y -i "${inputFrames}" -filter_complex "select='${selectExpr}',tile=3x5:padding=10:margin=10" -frames:v 1 -q:v 2 "${outputFile}"`;

console.log(`Generating contact sheet...`);
exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    console.log(`Contact sheet generated at ${outputFile}`);
});
