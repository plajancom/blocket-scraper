const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/scrape', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.blocket.se/butik/husvagn-och-fritid', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    const data = await page.evaluate(() => {
      const ads = Array.from(document.querySelectorAll('a[href*="/annons/"]')).map(el => {
        const title = el.innerText.trim();
        const link = el.href;
        const price = el.querySelector('[class*="Price"]')?.innerText.trim() || '';
        const bg = el.querySelector('div[style*="background-image"]');
        const imageStyle = bg?.style?.backgroundImage || '';
        const match = imageStyle.match(/url\(["']?(.*?)["']?\)/);
        const image = match ? match[1] : '';
        return { title, link, price, image };
      });
      return ads;
    });

    res.status(200).json(data);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Scrape failed', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
