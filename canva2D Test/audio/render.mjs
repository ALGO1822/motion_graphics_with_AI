import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const browser = await chromium.launch({
        args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error));

    const htmlPath = path.resolve('audio/render.html');
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);

    const tlStr = fs.readFileSync(path.resolve('timeline.json'), 'utf8');
    const timeline = JSON.parse(tlStr);
    
    console.log('Generating audio...');
    const b64 = await page.evaluate(async (tl) => {
        return await window.__renderAudio(tl);
    }, timeline);

    const buffer = Buffer.from(b64, 'base64');
    const outPath = path.resolve('out/music.wav');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved music.wav (${buffer.length} bytes) to ${outPath}`);

    await browser.close();
})();
