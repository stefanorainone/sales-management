const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sales-crm-412055180465.europe-west1.run.app';
const TEST_EMAIL = 'admin@vr.com';
const TEST_PASSWORD = 'Admin123!';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results');

if (!fs.existsSync(SCREENSHOT_DIR)) { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }); }

async function takeScreenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'flow-' + name + '.png'), fullPage: true });
  console.log('📸 flow-' + name + '.png');
}

async function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function test() {
  console.log('🚀 COMPLETE FLOW TEST
');
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 900 } });
  const page = await browser.newPage();
  try {
    console.log('Login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);
    await takeScreenshot(page, '01-login');
    await page.waitForSelector('input[type=email]', { visible: true, timeout: 10000 });
    await page.type('input[type=email]', TEST_EMAIL, { delay: 50 });
    await page.type('input[type=password]', TEST_PASSWORD, { delay: 50 });
    const submit = await page.;
    await Promise.all([submit.click(), page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })]);
    console.log('✅ Logged in
');
    await wait(2000);
    
    console.log('Open /admin/ai-tasks...');
    await page.goto(BASE_URL + '/admin/ai-tasks', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000);
    await takeScreenshot(page, '02-ai-tasks');
    
    console.log('Click Generate...');
    const buttons1 = await page.12979('button');
    for (const btn of buttons1) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && txt.includes('Genera')) { await btn.click(); break; }
    }
    await wait(2000);
    await takeScreenshot(page, '03-modal');
    
    console.log('Enter prompt...');
    const textarea = await page.;
    if (textarea) await textarea.type('Genera 2 task semplici: chiamata cliente e email', { delay: 20 });
    await wait(500);
    await takeScreenshot(page, '04-prompt');
    
    console.log('Generate...');
    const buttons2 = await page.12979('button');
    for (const btn of buttons2) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && txt.includes('Genera Task')) { await btn.click(); break; }
    }
    console.log('Waiting 30s for AI...');
    await wait(30000);
    await takeScreenshot(page, '05-generated');
    
    console.log('Confirm...');
    const buttons3 = await page.12979('button');
    for (const btn of buttons3) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && (txt.includes('Conferma') || txt.includes('Salva'))) { await btn.click(); break; }
    }
    await wait(3000);
    await takeScreenshot(page, '06-confirmed');
    
    console.log('Go to /today...');
    await page.goto(BASE_URL + '/today', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(5000);
    await takeScreenshot(page, '07-today');
    
    console.log('Start task...');
    const buttons4 = await page.12979('button');
    for (const btn of buttons4) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && txt.includes('Inizia Task')) { await btn.click(); break; }
    }
    await wait(2000);
    await takeScreenshot(page, '08-modal');
    
    console.log('Fill form...');
    const notes = await page.;
    if (notes) await notes.type('Test completato!', { delay: 10 });
    const duration = await page.;
    if (duration) { await duration.click({ clickCount: 3 }); await duration.type('20'); }
    const buttons5 = await page.12979('button');
    for (const btn of buttons5) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && txt.includes('Successo')) { await btn.click(); break; }
    }
    await wait(1000);
    await takeScreenshot(page, '09-filled');
    
    console.log('Complete...');
    page.on('dialog', async dialog => await dialog.accept());
    const buttons6 = await page.12979('button');
    for (const btn of buttons6) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt && txt.includes('Completa')) { await btn.click(); break; }
    }
    await wait(5000);
    await takeScreenshot(page, '10-done');
    
    console.log('
✨ SUCCESS!
');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    await takeScreenshot(page, 'ERROR');
  } finally {
    await wait(10000);
    await browser.close();
  }
}

test().catch(err => { console.error(err); process.exit(1); });
