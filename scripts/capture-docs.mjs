import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.BYETOOLS_DOCS_URL || 'http://127.0.0.1:4173';
const outputDirectory = 'docs/images/功能说明';

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
});
const page = await context.newPage();

async function preparePage(route = '/') {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#app');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

async function capture(name) {
  await page.evaluate(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(60);
  await page.locator('#toast').evaluate((node) => node.classList.remove('visible'));
  await page.screenshot({
    path: `${outputDirectory}/${name}.png`,
    fullPage: false,
    animations: 'disabled',
  });
}

await preparePage('/');
await page.locator('.topbar [data-action="settings"]').click();
await page.locator('[data-theme-choice="light"]').click();
await page.locator('.settings-close').click();
await page.waitForTimeout(250);
await capture('01-首页总览');

await page.locator('[data-view="all"]').first().click();
await page.waitForTimeout(250);
await capture('02-全部工具');

await preparePage('/#/tool/json');
await page.locator('#json-input').fill(JSON.stringify({
  orderId: 'BT-20261008-001',
  user: { userType: 'developer', active: true },
  items: [{ name: 'ByeTools', quantity: 1 }],
}, null, 2));
await page.locator('[data-json-action="format"]').click();
await page.waitForTimeout(250);
await capture('03-JSON格式化');

await preparePage('/#/tool/json-to-types');
const jsonTypesEditor = page.locator('#json-types-input .cm-content');
await jsonTypesEditor.waitFor({ state: 'visible' });
await jsonTypesEditor.click();
await page.keyboard.press('Control+A');
await page.keyboard.insertText(JSON.stringify({
  id: 1001,
  name: 'ByeTools',
  tags: ['developer', 'local'],
  owner: { id: 7, enabled: true },
}, null, 2));
await page.waitForTimeout(600);
await capture('04-JSON转类型');

await preparePage('/#/tool/aes');
await page.locator('#crypto-input').fill('ByeTools 本地加密示例');
await capture('05-AES加密解密');

await preparePage('/#/tool/qr-barcode');
await page.locator('#qrbc-qr-text').fill('https://byetools.local/docs');
await page.locator('[data-qrbc-action="generate"]').click();
await page.waitForTimeout(500);
await capture('06-二维码与条形码');

await preparePage('/#/tool/markdown-editor');
await page.locator('#markdown-editor-input').fill('# ByeTools 功能说明\n\n## 核心特点\n\n- 本地优先处理\n- 浏览器与桌面端统一体验\n- 覆盖开发、文本、文件和设计场景\n\n```json\n{"offline": true}\n```');
await page.waitForTimeout(350);
await capture('07-Markdown编辑器');

await preparePage('/#/tool/mindmap');
await page.locator('#mindmap-input').fill('# ByeTools\n## 编码转换\n### Base64\n### 二维码\n## 格式化工具\n### JSON\n### XML\n### SQL\n## 文件工具\n### 图片\n### PDF');
await page.waitForTimeout(350);
await capture('08-思维导图');

await preparePage('/#/tool/image-tools');
await capture('09-图片工具');

await preparePage('/#/tool/pdf-tools');
await capture('10-PDF工具');

await preparePage('/#/tool/message-queue');
await capture('11-消息队列');

await preparePage('/#/tool/linux-commands');
await page.locator('#linux-command-search').fill('端口');
await page.waitForTimeout(350);
await capture('12-Linux命令速查');

await preparePage('/#/tool/regex');
await page.locator('#regex-pattern').fill('^[\\w.-]+@[\\w.-]+\\.[A-Za-z]{2,}$');
await page.locator('#tool-input').fill('dev@byetools.local\ninvalid-email\nadmin@example.com');
await page.waitForTimeout(250);
await capture('13-正则表达式测试');

await preparePage('/#/tool/gradient');
await capture('14-渐变生成器');

await browser.close();

console.log(`功能说明截图已生成：${outputDirectory}`);
