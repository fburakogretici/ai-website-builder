
import puppeteer from 'puppeteer';
import { glob } from 'glob';
import path from 'path';

async function generatePreviews() {
  console.log('Finding preview.html files...');
  // Use a relative path from the project root where the script will be run
  const projectRoot = process.cwd();
  const files = await glob('public/templates/**/preview.html', { cwd: projectRoot, absolute: true });
  console.log(`Found ${files.length} files to process.`);

  if (files.length === 0) {
    console.log('No preview.html files found. Exiting.');
    return;
  }

  // Launch the browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set a standard viewport size
  await page.setViewport({ width: 1280, height: 720 });

  for (const file of files) {
    const fileUrl = `file://${file}`;
    const directory = path.dirname(file);
    const outputPath = path.join(directory, 'preview.png');

    try {
      console.log(`Processing ${file}...`);
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });
      
      // A short delay to ensure all rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      await page.screenshot({ path: outputPath });
      console.log(`✅ Successfully created screenshot: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to create screenshot for ${file}:`, error);
    }
  }

  await browser.close();
  console.log('All previews generated successfully.');
}

generatePreviews().catch(error => {
    console.error('An error occurred during preview generation:', error);
    process.exit(1);
});
