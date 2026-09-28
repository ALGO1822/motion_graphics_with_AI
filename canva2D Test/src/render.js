import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const OUT_DIR = path.join(projectRoot, 'out');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const OUTPUT_FILE = path.join(OUT_DIR, 'output.mp4');

// Ensure output directories exist
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
} else {
    // Clean up old frames
    const files = fs.readdirSync(FRAMES_DIR);
    for (const file of files) {
        if (file.endsWith('.png')) {
            fs.unlinkSync(path.join(FRAMES_DIR, file));
        }
    }
}
if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE);
}

async function renderFrames() {
    console.log('Starting Playwright...');
    const browser = await chromium.launch({
        args: ['--allow-file-access-from-files']
    });
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
    });
    
    const indexPath = path.join(projectRoot, 'index.html');
    const fileUrl = `file:///${indexPath.replace(/\\/g, '/')}`;
    console.log(`Loading page: ${fileUrl}`);
    
    await page.goto(fileUrl);
    
    // Get animation configuration
    const config = await page.evaluate(() => window.animationConfig);
    console.log('Animation Config:', config);
    
    const totalFrames = config.fps * config.durationInSeconds;
    console.log(`Rendering ${totalFrames} frames...`);

    // Verify canvas dimensions match viewport
    const canvasDims = await page.evaluate(() => {
        const c = document.getElementById('stage');
        const rect = c.getBoundingClientRect();
        return {
            canvasWidth: c.width,
            canvasHeight: c.height,
            boundingX: rect.x,
            boundingY: rect.y,
            boundingWidth: rect.width,
            boundingHeight: rect.height
        };
    });
    console.log('Canvas Dimensions:', canvasDims);

    const canvasElement = await page.$('#stage');

    for (let frame = 0; frame < totalFrames; frame++) {
        // Call the renderFrame function
        await page.evaluate((f) => window.renderFrame(f), frame);
        
        // Wait for the next animation frame to ensure the canvas has actually updated on screen
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));

        // Capture screenshot of the canvas element
        const framePath = path.join(FRAMES_DIR, `frame_${frame.toString().padStart(5, '0')}.png`);
        await canvasElement.screenshot({ path: framePath });
        
        if (frame % 10 === 0) {
            console.log(`Rendered frame ${frame}/${totalFrames}`);
        }
    }

    console.log('Finished rendering frames. Closing browser...');
    await browser.close();
    
    return config.fps;
}

function encodeVideo(fps) {
    console.log('Encoding video with FFmpeg...');
    return new Promise((resolve, reject) => {
        const inputPattern = path.join(FRAMES_DIR, 'frame_%05d.png');
        // Command parameters:
        // -y : overwrite output
        // -framerate fps
        // -i inputPattern
        // -c:v libx264 : use h264 codec
        // -pix_fmt yuv420p : standard pixel format for mp4 compatibility
        const soundtrackPath = path.join(OUT_DIR, 'soundtrack.wav');
        let ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p "${OUTPUT_FILE}"`;
        
        if (fs.existsSync(soundtrackPath)) {
            ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -i "${soundtrackPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${OUTPUT_FILE}"`;
        }
        
        console.log(`Executing: ${ffmpegCmd}`);
        
        exec(ffmpegCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error encoding video: ${error.message}`);
                return reject(error);
            }
            console.log('FFmpeg Output:', stdout);
            if (stderr) {
                console.log('FFmpeg Stderr:', stderr); // FFmpeg often logs to stderr
            }
            console.log(`Video encoded successfully: ${OUTPUT_FILE}`);
            resolve();
        });
    });
}

async function main() {
    try {
        const fps = await renderFrames();
        await encodeVideo(fps);
        console.log('Process completed successfully!');
    } catch (err) {
        console.error('Process failed:', err);
        process.exit(1);
    }
}

main();
