import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/vercel/geist-font/main/fonts/geist-sans/variable-ttf/GeistVF.ttf';
const file = fs.createWriteStream("GeistVF.ttf");

https.get(url, response => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed.');
  });
}).on('error', err => {
  fs.unlink("GeistVF.ttf", () => {});
  console.error('Error:', err.message);
});
