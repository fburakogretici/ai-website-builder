// Automatically generate preview.png for each template by taking a screenshot of preview.html
// Usage: node scripts/generate-template-previews.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const templatesDir = path.join(__dirname, '../public/templates');

async function getAllPreviewHtmlFiles() {
  const templateFolders = fs.readdirSync(templatesDir).filter(f => fs.statSync(path.join(templatesDir, f)).isDirectory());
  const result = [];
  for (const folder of templateFolders) {
    const langFolders = fs.readdirSync(path.join(templatesDir, folder)).filter(f => fs.statSync(path.join(templatesDir, folder, f)).isDirectory());
    for (const lang of langFolders) {
      const previewHtml = path.join(templatesDir, folder, lang, 'preview.html');
      const previewPng = path.join(templatesDir, folder, lang, 'preview.png');
      if (fs.existsSync(previewHtml)) {
        result.push({ html: previewHtml, png: previewPng });
      }
    }
  }
  return result;
}

async function generateScreenshots() {
  const files = await getAllPreviewHtmlFiles();
  const browser = await puppeteer.launch();
  for (const { html, png } of files) {
    const page = await browser.newPage();
    await page.goto('file://' + html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1200, height: 800 });
    await page.screenshot({ path: png, fullPage: true });
    console.log('Generated:', png);
    await page.close();
  }
  await browser.close();
}

generateScreenshots().catch(err => {
  console.error('Error generating previews:', err);
  process.exit(1);
});
