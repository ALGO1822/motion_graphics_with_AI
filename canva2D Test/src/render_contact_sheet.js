import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const OUT_DIR = path.join(projectRoot, 'out');

// Frames requested by user: 0, 15, 30, 44, 70, 80, 100, 128, 150, 175, 196, 215, 225, 250, 299
const selectExpr = 'eq(n,0)+eq(n,20)+eq(n,30)+eq(n,50)+eq(n,56)+eq(n,62)+eq(n,90)+eq(n,104)+eq(n,122)+eq(n,140)+eq(n,160)+eq(n,180)+eq(n,205)+eq(n,222)+eq(n,232)+eq(n,240)+eq(n,260)+eq(n,299)';
const inputFrames = path.join(OUT_DIR, 'frames', 'frame_%05d.png');
const outputFile = path.join(OUT_DIR, 'contact_sheet.jpg');

// Using tile=3x6 because 18 frames
const ffmpegCmd = `ffmpeg -y -i "${inputFrames}" -filter_complex "select='${selectExpr}',tile=3x6:padding=10:margin=10" -frames:v 1 -q:v 2 "${outputFile}"`;

console.log(`Generating contact sheet...`);
exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    console.log(`Contact sheet generated at ${outputFile}`);
});
