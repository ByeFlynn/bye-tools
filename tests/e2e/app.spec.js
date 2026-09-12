import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('首页展示完整工具目录并支持搜索', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '欢迎使用 ByeTools' })).toBeVisible();
  await expect(page.locator('.tool-card')).toHaveCount(50);
  if (isMobile) {
    await page.keyboard.press('Control+k');
    await page.locator('#palette-input').fill('Base64');
    await expect(page.locator('.palette-result[data-tool-id="base64"]')).toBeVisible();
  } else {
    await page.locator('#global-search').fill('Base64');
    await expect(page.locator('.tool-card[data-tool-id="base64"]')).toBeVisible();
    await expect(page.locator('#result-summary')).toContainText('找到');
  }
});

test('URL 和 HTML 工具卡片显示正确图标', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tool-card[data-tool-id="url"] .tool-icon')).toHaveText('URL');
  await expect(page.locator('.tool-card[data-tool-id="html"] .tool-icon')).toHaveText('</>');
});

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

test('图片工具支持 Base64 还原和模式切换', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="image-tools"]').click();
  await expect(page.getByRole('heading', { name: '图片工具' })).toBeVisible();
  await page.locator('[data-file-mode="base64"]').click();
  await page.locator('#image-base64-direction').selectOption('base64-to-image');
  await page.locator('#image-base64-input').fill(onePixelPng.toString('base64'));
  await page.locator('[data-file-action="image-process"]').click();
  await expect(page.locator('#image-result-stage img')).toBeVisible();
  await expect(page.locator('#image-result-caption')).toContainText('Base64 已还原');
  await page.locator('[data-file-mode="resize"]').click();
  await expect(page.locator('#image-width')).toBeVisible();
  await expect(page.locator('#image-height')).toBeVisible();
});

test('二维码与条形码工作台支持四种模式', async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="qr-barcode"]').click();
  await expect(page.getByRole('heading', { name: '二维码与条形码' })).toBeVisible();
  await page.locator('#qrbc-qr-text').fill('ByeTools QR');
  await page.locator('[data-qrbc-action="generate"]').click();
  await expect(page.locator('.qrbc-generated-image')).toBeVisible();
  await expect(page.locator('[data-qrbc-action="download"]')).toBeEnabled();
  const qrDataUrl = await page.locator('.qrbc-generated-image').getAttribute('src');
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  await page.locator('[data-file-mode="qr-recognize"]').click();
  await page.locator('#qrbc-file-input').setInputFiles({ name: 'qrcode.png', mimeType: 'image/png', buffer: qrBuffer });
  await page.locator('[data-qrbc-action="recognize"]').click();
  await expect(page.locator('#qrbc-recognized-text')).toHaveValue('ByeTools QR', { timeout: 15_000 });
  await page.locator('[data-file-mode="barcode-generate"]').click();
  await page.locator('#qrbc-barcode-text').fill('BYETOOLS-2026');
  await page.locator('[data-qrbc-action="generate"]').click();
  await expect(page.locator('.qrbc-barcode-canvas canvas')).toBeVisible();
  const barcodeDataUrl = await page.locator('.qrbc-barcode-canvas canvas').evaluate((canvas) => canvas.toDataURL('image/png'));
  const barcodeBuffer = Buffer.from(barcodeDataUrl.split(',')[1], 'base64');
  await page.locator('[data-file-mode="barcode-recognize"]').click();
  await page.locator('#qrbc-file-input').setInputFiles({ name: 'barcode.png', mimeType: 'image/png', buffer: barcodeBuffer });
  await page.locator('[data-qrbc-action="recognize"]').click();
  await expect(page.locator('#qrbc-recognized-text')).toHaveValue('BYETOOLS-2026', { timeout: 15_000 });
});

test('Markdown 编辑器支持实时预览、本地文件打开和保存', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="markdown-editor"]').click();
  await expect(page.getByRole('heading', { name: 'Markdown 编辑器' })).toBeVisible();
  await page.locator('#markdown-editor-input').fill('# 本地文档\n\n**继续编辑**');
  await expect(page.locator('#markdown-editor-preview h1')).toHaveText('本地文档');
  await expect(page.locator('#markdown-editor-preview strong')).toHaveText('继续编辑');
  await page.locator('#markdown-editor-file-input').setInputFiles({ name: 'readme.md', mimeType: 'text/markdown', buffer: Buffer.from('## 已打开文件\n\n- 第一行\n- 第二行', 'utf8') });
  await expect(page.locator('#markdown-editor-input')).toHaveValue(/已打开文件/);
  await expect(page.locator('#markdown-editor-filename')).toHaveValue('readme.md');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-markdown-editor-action="save"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('readme.md');
});

test('Markdown 编辑器支持编辑、源码、分栏和预览视图切换', async ({ page }) => {
  await page.goto('/#/tool/markdown-editor');
  const layout = page.locator('[data-markdown-editor-layout]');
  await expect(layout).toHaveAttribute('data-markdown-view', 'split');
  const headingPicker = page.locator('.markdown-editor-heading-select .bt-select');
  await headingPicker.locator('[data-bt-select-toggle]').click();
  await expect(headingPicker.locator('[data-bt-select-option]').first().locator('b')).toBeVisible();
  await expect(headingPicker.locator('[data-bt-select-option]').first().locator('b')).toHaveText('Heading 1');
  await headingPicker.locator('[data-bt-select-toggle]').click();
  await page.locator('[data-markdown-editor-view="source"]').click();
  await expect(layout).toHaveAttribute('data-markdown-view', 'source');
  await expect(page.locator('#markdown-editor-input')).toBeVisible();
  await expect(page.locator('#markdown-editor-preview')).toBeHidden();
  await page.locator('#markdown-editor-input').fill('## 视图测试');
  await page.locator('[data-markdown-editor-view="preview"]').click();
  await expect(layout).toHaveAttribute('data-markdown-view', 'preview');
  await expect(page.locator('#markdown-editor-preview h2')).toHaveText('视图测试');
  await expect(page.locator('#markdown-editor-input')).toBeHidden();
  await page.locator('[data-markdown-editor-view="edit"]').click();
  await expect(layout).toHaveAttribute('data-markdown-view', 'edit');
  await expect(page.locator('#markdown-editor-visual h2')).toHaveText('视图测试');
  await page.locator('#markdown-editor-visual').fill('可视化编辑内容');
  await expect(page.locator('#markdown-editor-input')).toHaveValue('## 可视化编辑内容');
  await page.locator('[data-markdown-editor-view="split"]').click();
  await expect(page.locator('#markdown-editor-preview')).toContainText('可视化编辑内容');
});

test('Markdown 编辑器工具栏支持常用块和行内语法', async ({ page }) => {
  await page.goto('/#/tool/markdown-editor');
  const input = page.locator('#markdown-editor-input');
  await input.fill('~~删除~~\n\n![图片](https://example.com/image.png)');
  await expect(page.locator('#markdown-editor-preview del')).toHaveText('删除');
  await expect(page.locator('#markdown-editor-preview img')).toHaveAttribute('alt', '图片');
  await input.fill('工具栏');
  await page.locator('[data-markdown-editor-format="strike"]').click();
  await expect(input).toHaveValue('工具栏~~文本~~');
  await page.locator('[data-markdown-editor-format="table"]').click();
  await expect(input).toHaveValue(/\| 项目 \| 说明 \|/);
  await page.locator('[data-markdown-editor-format="code-block"]').click();
  await expect(input).toHaveValue(/```text/);
  await page.locator('[data-markdown-editor-format="math"]').click();
  await expect(input).toHaveValue(/\$```text/);
  await page.locator('[data-markdown-editor-format="hr"]').click();
  await expect(input).toHaveValue(/---/);
});

test('图片裁剪支持可视化裁剪框、比例、形状和导出尺寸', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="image-tools"]').click();
  await page.locator('[data-file-mode="crop"]').click();
  await page.locator('#image-file-input').setInputFiles({ name: 'crop.png', mimeType: 'image/png', buffer: onePixelPng });
  await expect(page.locator('#image-crop-editor')).toBeVisible();
  await page.locator('[data-crop-aspect="1:1"]').click();
  await expect(page.locator('#image-crop-ratio-label')).toHaveText('1:1');
  const frame = page.locator('#image-crop-frame');
  await frame.focus();
  const beforeX = await page.locator('#image-crop-x').inputValue();
  await page.keyboard.press('ArrowRight');
  expect(Number(await page.locator('#image-crop-x').inputValue())).toBeGreaterThanOrEqual(Number(beforeX));
  await page.locator('[data-crop-shape="circle"]').click();
  await page.locator('#image-crop-angle').fill('45');
  await page.locator('[data-crop-output="128"]').click();
  await page.locator('[data-file-action="image-process"]').click();
  await expect(page.locator('#image-result-stage img')).toBeVisible();
  await expect(page.locator('#image-result-caption')).toContainText('128 ×');
});

test('Favicon 生成器输出 PNG 套件和 HTML 片段', async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="favicon"]').click();
  await page.locator('#favicon-file-input').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: onePixelPng });
  await expect(page.locator('#favicon-status')).toHaveText('图片已就绪');
  await page.locator('[data-file-action="favicon-generate"]').click();
  await expect(page.locator('.favicon-result-item')).toHaveCount(6, { timeout: 15_000 });
  await expect(page.locator('#favicon-snippet')).toHaveValue(/favicon\.ico/);
  await expect(page.locator('[data-file-action="favicon-download-ico"]')).toBeEnabled();
});

test('PDF 工具支持多文件合并和页面模式切换', async ({ page }) => {
  const first = await PDFDocument.create();
  first.addPage([240, 320]);
  const second = await PDFDocument.create();
  second.addPage([240, 320]);
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="pdf-tools"]').click();
  await page.locator('#pdf-file-input').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await first.save()) },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await second.save()) },
  ]);
  await expect(page.locator('.pdf-file-item')).toHaveCount(2);
  await page.locator('[data-file-action="pdf-process"]').click();
  await expect(page.locator('#pdf-result-caption')).toContainText('2 个文件');
  await expect(page.locator('.pdf-result-item')).toHaveCount(1);
  await page.locator('[data-file-mode="watermark"]').click();
  await expect(page.locator('#pdf-watermark-text')).toBeVisible();
});

test('Base64 工作台可编码和解码', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="base64"]').click();
  await expect(page.getByRole('heading', { name: 'Base64 编解码' })).toBeVisible();
  await page.locator('#tool-input').fill('ByeTools');
  await page.getByRole('button', { name: '编码', exact: true }).click();
  await expect(page.locator('#tool-output')).toHaveText('QnllVG9vbHM=');
  await page.locator('#tool-input').fill('QnllVG9vbHM=');
  await page.getByRole('button', { name: '解码', exact: true }).click();
  await expect(page.locator('#tool-output')).toHaveText('ByeTools');
});

test('JSON 工作台支持格式化和视图切换', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="json"]').click();
  await page.locator('#json-input').fill('{"name":"ByeTools","ready":true}');
  await page.getByRole('button', { name: '格式化', exact: true }).click();
  await expect(page.locator('#json-input')).toHaveValue(/\n  "name": "ByeTools"/);
  await page.getByRole('button', { name: '元数据', exact: true }).click();
  await expect(page.locator('.json-metadata-grid')).toBeVisible();
});

test('主题和收藏状态写入 IndexedDB', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topbar [data-action="settings"]').click();
  await page.locator('[data-theme-choice="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.settings-close').click();
  await page.locator('.tool-card[data-tool-id="url"] .favorite-toggle').click();
  await expect(page.locator('[data-count="favorites"]').first()).toHaveText('1');
  const stores = await page.evaluate(async () => {
    const request = indexedDB.open('byetools-web');
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return [...database.objectStoreNames];
  });
  expect(stores).toContain('app_settings');
  expect(stores).toContain('favorites');
});

test('所有工具均可打开且不会产生页面异常', async ({ page }) => {
  test.setTimeout(60_000);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  const toolIds = await page.locator('.tool-card').evaluateAll((cards) => cards.map((card) => card.dataset.toolId));
  expect(toolIds).toHaveLength(50);
  for (const toolId of toolIds) {
    await test.step(`打开 ${toolId}`, async () => {
      await page.locator(`.tool-card[data-tool-id="${toolId}"]`).evaluate((card) => card.click());
      await expect(page.locator('#tool-workspace')).toBeVisible();
      await page.locator('[data-action="home"]').first().click();
    });
  }
  expect(pageErrors).toEqual([]);
});

test('思维导图支持模板切换、实时生成和导出', async ({ page }) => {
  await page.goto('/#/tool/mindmap');
  await expect(page.getByRole('heading', { name: '思维导图生成' })).toBeVisible();
  await expect(page.locator('#mindmap-preview svg')).toBeVisible();
  await expect(page.locator('#mindmap-preview svg text').filter({ hasText: '365 工具箱' })).toBeVisible();
  await page.locator('[data-mindmap-template="architecture"]').click();
  await expect(page.locator('#mindmap-input')).toHaveValue(/应用系统/);
  await expect(page.locator('#mindmap-preview svg text').filter({ hasText: '应用系统' })).toBeVisible();
  await page.locator('#mindmap-input').fill('# 项目\n\n## 目标\n- 完成 MVP');
  await expect(page.locator('#mindmap-preview svg text').filter({ hasText: '完成 MVP' })).toBeVisible();
  await page.locator('[data-mindmap-action="clear"]').click();
  await expect(page.locator('#mindmap-preview svg text').filter({ hasText: '思维导图' })).toBeVisible();
  const svgDownload = page.waitForEvent('download');
  await page.locator('[data-mindmap-action="download-svg"]').click();
  expect((await svgDownload).suggestedFilename()).toBe('byetools-mindmap.svg');
});

test('Unicode 与 AES 工具执行真实转换', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="unicode"]').click();
  await page.locator('#tool-input').fill('工具箱');
  await page.getByRole('button', { name: 'Unicode 编码' }).click();
  await expect(page.locator('#tool-output')).toHaveText('\\u5de5\\u5177\\u7bb1');
  await page.locator('#tool-input').fill('\\u5de5\\u5177\\u7bb1');
  await page.getByRole('button', { name: 'Unicode 解码' }).click();
  await expect(page.locator('#tool-output')).toHaveText('工具箱');

  await page.locator('[data-action="home"]').first().click();
  await page.locator('.tool-card[data-tool-id="aes"]').click();
  await page.locator('#crypto-key').fill('AESKey-123456789');
  await page.locator('#crypto-iv').fill('AESIv-1234567890');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const encrypted = await page.locator('#crypto-output').textContent();
  expect(encrypted).toBeTruthy();
  await page.locator('#crypto-input').fill(encrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools 本地优先');
});

test('SM2、SM3、SM4 工具执行真实国密运算', async ({ page }) => {
  await page.goto('/');

  await page.locator('.tool-card[data-tool-id="sm3"]').click();
  await page.locator('#crypto-input').fill('abc');
  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');

  await page.locator('[data-action="home"]').first().click();
  await page.locator('.tool-card[data-tool-id="sm4"]').click();
  await expect(page.locator('.crypto-key-field')).toContainText('密钥');
  await expect(page.locator('.crypto-key-field')).not.toContainText('Hex 密钥');
  await expect(page.locator('#crypto-iv')).not.toHaveAttribute('placeholder', /十六进制/);
  await page.locator('#crypto-key').fill('SM4Key-123456789');
  await page.locator('#crypto-iv').fill('SM4Iv-1234567890');
  await page.locator('#crypto-input').fill('ByeTools');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const sm4Encrypted = await page.locator('#crypto-output').textContent();
  expect(sm4Encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  await page.locator('#crypto-input').fill(sm4Encrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools');

  await page.locator('[data-action="home"]').first().click();
  await page.locator('.tool-card[data-tool-id="sm2"]').click();
  await page.locator('#crypto-key').fill('04f484dc2494f62b5d3d5ccd1fd43e91038cc6ae53b10a19c79248ddca1b35d33a8a6299ccd06615dd4d83379e01c32d1ced547fec2952b9d13e169e54fe913ca6');
  await page.locator('#crypto-input').fill('ByeTools');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const sm2Encrypted = await page.locator('#crypto-output').textContent();
  expect(sm2Encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  await page.locator('#crypto-key').fill('3ede63f46911ef86c71f04c554e7949a897452079a248d26a5225adc7b163ab9');
  await page.locator('#crypto-input').fill(sm2Encrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools');
});

test('SM2 支持生成密钥对、推导公钥和兼容密文格式', async ({ page }) => {
  await page.goto('/#/tool/sm2');
  await page.locator('[data-sm2-key-action="generate"]').click();
  await expect(page.locator('#crypto-key')).toHaveValue(/^[0-9a-f]{130}$/i);
  await expect(page.locator('#crypto-private-key')).toHaveValue(/^[0-9a-f]{64}$/i);
  await expect(page.locator('#crypto-sm2-public-status')).toHaveText('公钥合法 ✓');
  await expect(page.locator('#crypto-sm2-private-status')).toHaveText('私钥合法 ✓');

  const publicKey = await page.locator('#crypto-key').inputValue();
  const privateKey = await page.locator('#crypto-private-key').inputValue();
  await page.locator('#crypto-key').fill('');
  await page.locator('[data-sm2-key-action="derive"]').click();
  await expect(page.locator('#crypto-key')).toHaveValue(publicKey);

  const roundTrip = async (text) => {
    await page.locator('#crypto-input').fill(text);
    await page.locator('[data-crypto-operation="encrypt"]').click();
    const encrypted = await page.locator('#crypto-output').textContent();
    await page.locator('#crypto-input').fill(encrypted);
    await page.locator('[data-crypto-operation="decrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(text);
  };
  await roundTrip('SM2 密钥对');

  await page.locator('#sm2-cipher-prefix').check();
  await roundTrip('04 前缀');
  await page.locator('#sm2-cipher-prefix').uncheck();
  await page.locator('#sm2-cipher-der').check();
  await roundTrip('ASN.1 DER');
  await page.locator('#sm2-cipher-der').uncheck();
  await page.locator('#sm2-cipher-mode').selectOption('0');
  await roundTrip('C1C2C3');
  await expect(page.locator('#crypto-private-key')).toHaveValue(privateKey);
});

test('SM4 密钥和 IV 默认 UTF-8 并支持编码切换与随机生成', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="sm4"]').click();
  await expect(page.locator('#crypto-key-encoding')).toHaveValue('utf8');
  await expect(page.locator('#crypto-iv-encoding')).toHaveValue('utf8');

  await page.locator('[data-crypto-random="key"]').click();
  await page.locator('[data-crypto-random="iv"]').click();
  await expect(page.locator('#crypto-key')).toHaveValue(/^[A-Za-z0-9]{16}$/);
  await expect(page.locator('#crypto-iv')).toHaveValue(/^[A-Za-z0-9]{16}$/);
  await expect(page.locator('#crypto-key-length')).toHaveText('16 字节 ✓');
  await expect(page.locator('#crypto-iv-length')).toHaveText('16 字节 ✓');

  await page.locator('#crypto-key-encoding').selectOption('hex');
  await page.locator('#crypto-iv-encoding').selectOption('base64');
  await page.locator('#crypto-key').fill('00112233445566778899aabbccddeeff');
  await page.locator('#crypto-iv').fill('AAECAwQFBgcICQoLDA0ODw==');
  await expect(page.locator('#crypto-key-length')).toHaveText('16 字节 ✓');
  await expect(page.locator('#crypto-iv-length')).toHaveText('16 字节 ✓');

  await page.locator('#crypto-input').fill('ByeTools');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const encrypted = await page.locator('#crypto-output').textContent();
  expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  await page.locator('#crypto-input').fill(encrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools');
});

test('加密算法选择器显示图标和说明并支持切换', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="aes"]').click();
  await page.locator('[data-algorithm-toggle]').click();
  await expect(page.locator('#crypto-algorithm-menu')).toBeVisible();
  await expect(page.locator('[data-algorithm-option="sm4"] .tool-icon')).toBeVisible();
  await expect(page.locator('[data-algorithm-option="sm4"] small')).toHaveText('国密对称加密');
  await page.locator('[data-algorithm-option="sm4"]').click();
  await expect(page.getByRole('heading', { name: 'SM4 加密解密' })).toBeVisible();
});

test('所有单选下拉框统一显示图标说明并同步原生值', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="filter"]').click();
  const environmentPicker = page.locator('.bt-select:has(#environment-filter)');
  await expect(environmentPicker.locator('.bt-select-trigger .bt-select-icon')).toBeVisible();
  await expect(environmentPicker.locator('.bt-select-trigger-copy small')).toHaveText('显示全部工具');
  await environmentPicker.locator('[data-bt-select-toggle]').click();
  await expect(environmentPicker.locator('[data-bt-select-menu]')).toBeVisible();
  await expect(environmentPicker.locator('[data-bt-select-option] small').first()).toHaveText('显示全部工具');
  await environmentPicker.locator('[data-bt-select-option][data-bt-select-value="local"]').click();
  await expect(page.locator('#environment-filter')).toHaveValue('local');
  await expect(environmentPicker.locator('.bt-select-trigger-copy b')).toHaveText('本地优先');

  await page.locator('.tool-card[data-tool-id="time"]').click();
  const timeUnitPicker = page.locator('.bt-select:has(#time-timestamp-unit)');
  await timeUnitPicker.locator('[data-bt-select-toggle]').click();
  await timeUnitPicker.locator('[data-bt-select-option][data-bt-select-value="millisecond"]').click();
  await expect(page.locator('#time-timestamp-unit')).toHaveValue('millisecond');
  await expect(timeUnitPicker.locator('.bt-select-trigger-copy small')).toHaveText('Unix 毫秒级时间戳');
});

test('SHA-3 摘要支持三种标准变体和 Base64 输出', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="sha3"]').click();
  await page.locator('#crypto-input').fill('abc');

  await page.locator('#crypto-variant').selectOption('SHA3-256');
  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');

  await page.locator('#crypto-variant').selectOption('SHA3-384');
  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25');

  await page.locator('#crypto-variant').selectOption('SHA3-512');
  await page.locator('#crypto-format').selectOption('base64');
  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('t1GFCxpXFopWk82SS2sJbgj2IYJ0RPcNiE9dAkDScS4Q4RbpGSrzyRp+xXZH45NAVzQLTPQI1aVlkvgnTuxT8A==');
});

test('刷新后恢复主题与收藏', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topbar [data-action="settings"]').click();
  await page.locator('[data-theme-choice="light"]').click();
  await page.locator('.settings-close').click();
  await page.locator('.tool-card[data-tool-id="json"] .favorite-toggle').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.tool-card[data-tool-id="json"] .favorite-toggle')).toHaveClass(/is-favorite/);
});

test('刷新后恢复当前工具路由', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="json"]').click();
  await expect(page).toHaveURL(/#\/tool\/json$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'JSON 格式化' })).toBeVisible();
  await expect(page.locator('#json-workbench')).toBeVisible();
});

test('加密配置以密文保存并支持掩码历史与恢复', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="aes"]').click();
  const originalKey = await page.locator('#crypto-key').inputValue();
  await page.locator('[data-crypto-config-action="save"]').click();
  await page.locator('#crypto-config-name').fill('本地接口配置');
  await page.locator('[data-crypto-config-modal-action="save"]').click();
  await expect(page.locator('[data-crypto-config-modal]')).toHaveCount(0);

  const storedRecords = await page.evaluate(async () => {
    const request = indexedDB.open('byetools-web');
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('tool_configs', 'readonly');
    const recordsRequest = transaction.objectStore('tool_configs').getAll();
    return new Promise((resolve, reject) => {
      recordsRequest.onsuccess = () => resolve(recordsRequest.result);
      recordsRequest.onerror = () => reject(recordsRequest.error);
    });
  });
  expect(storedRecords).toHaveLength(1);
  expect(storedRecords[0].payload).not.toContain(originalKey);
  expect(storedRecords[0].aadVersion).toBe(1);

  await page.locator('#crypto-key').fill('ffffffffffffffffffffffffffffffff');
  await page.locator('[data-crypto-config-action="history"]').click();
  await expect(page.locator('.crypto-config-history-item')).toContainText('ByeT••••2345');
  await expect(page.locator('.crypto-config-history-item')).not.toContainText(originalKey);
  await page.locator('[data-crypto-history-action="apply"]').click();
  await expect(page.locator('#crypto-key')).toHaveValue(originalKey);
});

test('目标视口没有页面级横向溢出', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 780, height: 831 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
