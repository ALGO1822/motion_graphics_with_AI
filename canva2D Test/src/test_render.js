import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, '..', 'out', 'frames');

async function testFrames() {
    const browser = await chromium.launch({
        args: ['--allow-file-access-from-files']
    });
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
    });

    const indexPath = path.join(__dirname, '..', 'index.html');
    const fileUrl = `file:///${indexPath.replace(/\\/g, '/')}`;
    await page.goto(fileUrl);

    // Verify dimensions
    const dims = await page.evaluate(() => {
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
    console.log('Canvas Dimensions:', dims);

    const canvasElement = await page.$('#stage');

    // Render test frames
    const frames = [0, 90, 150, 270, 299];
    for (const frame of frames) {
        await page.evaluate((f) => window.renderFrame(f), frame);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
        const framePath = path.join(OUT_DIR, `test_frame_${frame}.png`);
        await canvasElement.screenshot({ path: framePath });
        console.log(`Saved test frame ${frame}`);
    }

    await browser.close();
    console.log('Test complete.');
}

testFrames();
