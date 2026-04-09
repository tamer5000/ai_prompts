import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// collect data from URL with Playwright
app.post("/collect", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000);

    const html = await page.content();
    const title = await page.title();

    await browser.close();

    return res.json({
      success: true,
      url,
      title,
      fetchedAt: new Date().toISOString(),
      html,
    });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// collect-network data from URL with Playwright
app.post("/collect-network", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });

  let browser;
  const responses = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on("response", async (response) => {
      try {
        const ct = response.headers()["content-type"] || "";
        if (ct.includes("application/json")) {
          const json = await response.json();
          responses.push({
            url: response.url(),
            status: response.status(),
            body: json
          });
        }
      } catch {}
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);

    await browser.close();

    return res.json({
      success: true,
      url,
      responses
    });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});



app.post('/test-login', async (req, res) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors'
      ]
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // 🔥 لو حصل redirect لـ https رجّعه فورًا
    page.on('framenavigated', async frame => {
      const url = frame.url();

      if (url.startsWith('https://192.168.1.1')) {
        console.log('🚫 Blocked HTTPS redirect → forcing HTTP');
        await page.goto('http://192.168.1.1');
      }
    });

    console.log('🌐 Opening router...');

    await page.goto('http://192.168.1.1', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('🔐 Filling login...');

    await page.fill('#Frm_Username', req.body.username);
    await page.fill('#Frm_Password', req.body.password);

    console.log('👉 Clicking login...');

    await Promise.all([
      page.waitForNavigation({ timeout: 7000 }).catch(() => {}),
      page.click('#LoginId')
    ]);

    const loginError = await page.locator('text=Username or password is error').count();

    if (loginError > 0) {
      console.log('❌ Login FAILED');
      return res.json({ status: 'failed' });
    }

    console.log('✅ Login SUCCESS');

    return res.json({
      status: 'success',
      url: page.url()
    });

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});



// ✅ reboot
app.post('/reboot', async (req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--ignore-certificate-errors',
        '--allow-insecure-localhost',
        '--allow-running-insecure-content',
      ],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto('http://192.168.1.1');

    await page.fill('#Frm_Username', req.body.username);
    await page.fill('#Frm_Password', req.body.password);
    await page.click('#LoginId');

    await page.waitForTimeout(4000);

    await page.click('#mmManagDiag');
    await page.waitForTimeout(1000);

    await page.click('#mmManagDevice');
    await page.waitForTimeout(3000);

    await page.click('#Btn_restart');

    await page.waitForTimeout(2000);

    await browser.close();

    res.json({ status: 'reboot triggered' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});






app.get('/test', async (req, res) => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });

  const page = await browser.newPage();

  await page.goto('https://google.com');

  const title = await page.title();

  await browser.close();

  res.json({
    status: 'success',
    title: title
  });
});




// collect-network data from URL with Playwright
app.post("/collect-es", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });

  let browser;
  const jsonResponses = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on("response", async (response) => {
      try {
        const ct = response.headers()["content-type"] || "";
        if (ct.includes("application/json")) {
          const body = await response.json();
          jsonResponses.push({
            url: response.url(),
            body
          });
        }
      } catch {}
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000);

    const html = await page.content();
    const title = await page.title();

    await browser.close();

    return res.json({
      success: true,
      url,
      title,
      jsonResponses,
      html
    });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Playwright service running on port 3000");
});
