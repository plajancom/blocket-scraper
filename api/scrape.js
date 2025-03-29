const chromium = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
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
      const match = imageStyle.match(/url\\(["']?(.*?)["']?\\)/);
      const image = match ? match[1] : '';
      return { title, link, price, image };
    });
    return ads;
  });

  await browser.close();
  res.status(200).json(data);
};
