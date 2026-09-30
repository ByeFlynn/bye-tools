import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('首页展示完整工具目录并支持搜索', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '欢迎使用 ByeTools' })).toBeVisible();
  await expect(page.locator('.tool-card')).toHaveCount(57);
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
  await page.locator('.tool-card[data-tool-id="html"]').click();
  await expect(page.locator('#workspace-category')).toHaveText('编码转换');
});

test('正则表达式测试支持常用模板和核心语法速查', async ({ page }) => {
  await page.goto('/#/tool/regex');
  await expect(page.getByRole('heading', { name: '正则表达式测试' })).toBeVisible();
  await expect(page.locator('.regex-preset')).toHaveCount(10);
  await expect(page.locator('.regex-syntax-item')).toHaveCount(15);
  await expect(page.locator('.regex-helper-panel')).toContainText('核心语法速查');
  await expect(page.locator('#tool-input')).toBeVisible();
  await expect(page.locator('.regex-helper-section').nth(0)).not.toHaveAttribute('open', '');
  await expect(page.locator('.regex-helper-section').nth(1)).not.toHaveAttribute('open', '');
  await page.locator('.regex-helper-section').first().locator('summary').click();
  await expect(page.locator('.regex-helper-section').first()).toHaveAttribute('open', '');

  await page.locator('[data-regex-preset="email"]').click();
  await expect(page.locator('#regex-pattern')).toHaveValue('^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$');
  await expect(page.locator('[data-regex-preset="email"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#tool-input').fill('test@example.com');
  await expect(page.locator('#tool-output')).toContainText('test@example.com');
  await expect(page.locator('#tool-status')).toHaveText('匹配 1 处');

  await page.locator('[data-regex-preset="digits"]').click();
  await expect(page.locator('#regex-pattern')).toHaveValue('^\\d+$');
  await expect(page.locator('[data-regex-preset="email"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#tool-input').fill('20260913');
  await expect(page.locator('#tool-output')).toContainText('20260913');
  await expect(page.locator('#tool-status')).toHaveText('匹配 1 处');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('JSON 转类型生成器支持代码编辑、语言切换和本地导出', async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await page.goto('/#/tool/json-to-types');
  await expect(page.getByRole('heading', { name: 'JSON 转类型生成器' })).toBeVisible();
  await expect(page.locator('.json-types-workbench .cm-editor')).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator('#json-types-status')).toContainText('Java 类型已生成', { timeout: 20_000 });
  await expect(page.locator('#json-types-output .cm-content')).toContainText('class Root');
  const languagePicker = page.locator('[data-bt-select="json-types-language"]');
  await languagePicker.locator('[data-bt-select-toggle]').click();
  await expect(languagePicker.locator('[data-bt-select-option]')).toHaveCount(24);
  await expect(languagePicker.locator('[data-bt-select-option]').first().locator('.bt-select-icon')).toHaveText('JV');
  await expect(languagePicker.locator('[data-bt-select-option]').first().locator('small')).toHaveText('类、字段与 JSON 绑定');
  await page.keyboard.press('Escape');
  await page.locator('[data-json-types-action="fullscreen"]').click();
  await expect(page.locator('#json-types-workbench')).toHaveClass(/is-fullscreen/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#json-types-workbench')).not.toHaveClass(/is-fullscreen/);

  const jsonFile = Buffer.from('[{"id":1,"profile":{"name":"A"},"tags":["one"]},{"id":2,"profile":{"name":"B","verified":true},"tags":["two"]}]', 'utf8');
  await page.locator('#json-types-file-input').setInputFiles({ name: 'response.json', mimeType: 'application/json', buffer: jsonFile });
  await page.locator('#json-types-root').fill('ApiResponse');
  await page.locator('#json-types-language').selectOption('typescript');
  await expect(page.locator('#json-types-language-badge')).toHaveText('TypeScript');
  await expect(page.locator('#json-types-status')).toContainText('TypeScript 类型已生成', { timeout: 20_000 });
  const output = page.locator('#json-types-output .cm-content');
  await expect(output).toContainText('APIResponse');
  await expect(output).toContainText('Profile');
  await expect(output).toContainText('verified?');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-json-types-action="download"]').click();
  expect((await downloadPromise).suggestedFilename()).toBe('ApiResponse.ts');

  const languages = await page.locator('#json-types-language option').evaluateAll((options) => options.map((option) => ({ value: option.value, label: option.dataset.label })));
  expect(languages).toHaveLength(24);
  for (const language of languages) {
    await page.locator('#json-types-language').selectOption(language.value);
    await expect(page.locator('#json-types-status')).toContainText(`${language.label} 类型已生成`, { timeout: 20_000 });
    await expect(page.locator('#json-types-output .cm-content')).not.toBeEmpty();
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const columns = await page.locator('.json-types-editor-layout').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(testInfo.project.name === '移动端' ? 1 : 2);
});

test('消息中间件工作台支持协议切换和桌面能力提示', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.locator('.tool-card[data-tool-id="message-queue"]').click();
  await expect(page.getByRole('heading', { name: '消息中间件' })).toBeVisible();
  await expect(page.locator('#workspace-category')).toHaveText('消息队列');
  await expect(page.locator('#mq-broker')).toHaveValue('mqtt');
  await expect(page.locator('#mq-topic')).toHaveValue('byetools/demo');
  const brokerPicker = page.locator('[data-bt-select="mq-broker"]');
  await brokerPicker.locator('[data-bt-select-toggle]').click();
  await brokerPicker.locator('[data-bt-select-option="kafka"], [data-bt-select-value="kafka"]').click();
  await expect(page.locator('#mq-topic')).toHaveValue('byetools.events');
  await expect(page.locator('#mq-group')).toHaveValue('byetools-consumer');
  await expect(page.locator('#mq-port')).toHaveValue('9092');
  await brokerPicker.locator('[data-bt-select-toggle]').click();
  await brokerPicker.locator('[data-bt-select-value="rabbitmq"]').click();
  await expect(page.locator('#mq-exchange')).toHaveValue('byetools.exchange');
  await expect(page.locator('#mq-queue')).toHaveValue('byetools.queue');
  await expect(page.locator('#mq-port')).toHaveValue('5672');
  await brokerPicker.locator('[data-bt-select-toggle]').click();
  await brokerPicker.locator('[data-bt-select-value="rocketmq"]').click();
  await expect(page.locator('#mq-topic')).toHaveValue('ByeToolsTopic');
  await expect(page.locator('#mq-tag')).toHaveValue('*');
  await expect(page.locator('#mq-group')).toHaveValue('byetools-consumer');
  await expect(page.locator('#mq-port')).toHaveValue('8081');
  await expect(page.locator('#mq-address-label')).toHaveText('Proxy Endpoint');
  await expect(page.locator('#mq-username-label')).toHaveText('AccessKey');
  await expect(page.locator('#mq-password-label')).toHaveText('SecretKey');
  await page.locator('#mq-config-name').fill('RocketMQ 测试');
  await page.locator('#mq-address').fill('rocketmq.example.test');
  await page.locator('#mq-tag').fill('TagA || TagB');
  await page.locator('[data-mq-action="save-config"]').click();
  await expect(page.locator('.mq-config-item')).toContainText('RocketMQ 测试');
  await page.locator('#mq-tag').fill('*');
  await page.locator('.mq-config-item [data-mq-config-action="apply"]').click();
  await expect(page.locator('#mq-tag')).toHaveValue('TagA || TagB');
  await page.locator('.mq-config-item [data-mq-config-action="delete"]').click();
  await expect(page.locator('.mq-config-empty')).toBeVisible();
  await brokerPicker.locator('[data-bt-select-toggle]').click();
  await brokerPicker.locator('[data-bt-select-value="kafka"]').click();
  await expect(page.locator('#mq-port')).toHaveValue('9092');
  await page.locator('[data-mq-format="json"]').click();
  await page.locator('#mq-config-name').fill('Kafka 测试');
  await page.locator('#mq-address').fill('mq.example.test');
  await page.locator('[data-mq-action="save-config"]').click();
  await expect(page.locator('#mq-config-list')).toBeVisible();
  await expect(page.locator('.mq-config-item')).toContainText('Kafka 测试');
  await page.locator('#mq-address').fill('changed.example.test');
  await page.locator('.mq-config-item [data-mq-config-action="apply"]').click();
  await expect(page.locator('#mq-address')).toHaveValue('mq.example.test');
  await page.locator('.mq-config-item [data-mq-config-action="delete"]').click();
  await expect(page.locator('.mq-config-empty')).toBeVisible();
  await page.locator('#mq-message').fill('{"event":"publish","value":1}');
  await page.locator('[data-mq-action="format"]').click();
  await expect(page.locator('#mq-message')).toHaveValue(/\n  "event": "publish"/);
  await page.locator('[data-mq-action="send"]').click();
  await expect(page.locator('#mq-connection-status')).toContainText('桌面端');
  await expect(page.locator('.mq-log-row')).toHaveCount(1);
  await page.locator('[data-mq-action="consume-start"]').click();
  await expect(page.locator('[data-mq-action="consume-stop"]')).toBeEnabled();
  await expect(page.locator('#mq-connection-status')).toContainText('消费待桌面端接入');
  if (!isMobile) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const toolbarTop = await page.locator('.mq-toolbar').evaluate((element) => Math.round(element.getBoundingClientRect().top));
    expect(toolbarTop).toBeGreaterThanOrEqual(90);
    expect(toolbarTop).toBeLessThanOrEqual(120);
    await expect(page.locator('.mq-toolbar-actions')).toBeInViewport();
  }
  const excelDownload = page.waitForEvent('download');
  await page.locator('[data-mq-action="export-consumed"]').click();
  expect((await excelDownload).suggestedFilename()).toBe('byetools-consumed-messages.xls');
});

test('Linux 命令速查支持分类、搜索、详情、复制和相关命令跳转', async ({ page, isMobile }) => {
  await page.goto('/#/tool/linux-commands');
  await expect(page.getByRole('heading', { name: 'Linux 命令速查' })).toBeVisible();
  await expect(page.locator('#linux-command-categories .linux-command-category')).toHaveCount(12);
  await expect(page.locator('#linux-command-list .linux-command-item')).not.toHaveCount(0);
  await expect(page.locator('#linux-command-detail')).toContainText('列出目录内容');
  await expect(page.locator('.linux-command-syntax')).toContainText('ls');

  await page.locator('#linux-command-search').fill('端口');
  await expect(page.locator('#linux-command-result-title')).toContainText('端口');
  await expect(page.locator('#linux-command-list')).toContainText('ss');
  await page.locator('.linux-command-item[data-linux-command="ss"]').click();
  await expect(page.locator('#linux-command-detail')).toContainText('查看套接字和端口状态');
  await expect(page.locator('.linux-command-detail')).toContainText('常用参数');
  await expect(page.locator('.linux-command-detail')).toContainText('使用示例');

  await page.locator('#linux-command-search').fill('grep');
  await expect(page.locator('.linux-command-item[data-linux-command="grep"]')).toBeVisible();
  await page.locator('.linux-command-item[data-linux-command="grep"]').click();
  await expect(page.locator('#linux-command-detail')).toContainText('按模式搜索文本');
  const clipboardText = await page.locator('[data-linux-copy]').first().getAttribute('data-linux-copy');
  expect(clipboardText).toBeTruthy();
  await page.locator('[data-linux-copy]').first().click();
  await expect(page.locator('#toast')).toContainText('命令已复制');

  await page.locator('#linux-command-search').fill('');
  await page.locator('[data-linux-category="filesystem"]').click();
  await expect(page.locator('#linux-command-result-title')).toHaveText('文件与目录');
  await page.locator('.linux-command-item[data-linux-command="rm"]').click();
  await expect(page.locator('.linux-command-risk-note.is-danger')).toContainText('危险操作');
  await expect(page.locator('.linux-command-risk-badge.is-danger')).toContainText('高风险');
  await page.locator('[data-linux-related="find"]').click();
  await expect(page.locator('#linux-command-detail h2')).toHaveText('find');

  await page.locator('#linux-command-search').fill('不存在的命令');
  await expect(page.locator('.linux-command-empty')).toBeVisible();
  await page.locator('[data-linux-action="clear-search"]').click();
  await expect(page.locator('.linux-command-item')).not.toHaveCount(0);

  if (!isMobile) {
    const columns = await page.locator('.linux-command-layout').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(3);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
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

test('JSON 工作台复制输入选区和当前树节点的实际值', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/#/tool/json');
  const input = page.locator('#json-input');
  await input.fill('{"previous":"旧值","selected":"需要复制的值","encoded":"hello%20world"}');
  await page.getByRole('button', { name: '格式化', exact: true }).click();

  await page.locator('.json-tree-value').filter({ hasText: '旧值' }).click();
  await page.getByRole('button', { name: '提取', exact: true }).click();
  await page.locator('.json-tree-value').filter({ hasText: '需要复制的值' }).click();
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('需要复制的值');

  await page.locator('.json-tree-value').filter({ hasText: 'hello world' }).click();
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('hello world');

  const formatted = await input.inputValue();
  const selectionStart = formatted.indexOf('selected');
  await input.evaluate((node, start) => {
    node.focus();
    node.setSelectionRange(start, start + 'selected'.length);
  }, selectionStart);
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('selected');
});

test('JSON 编辑器鼠标拖选的可见文本与剪贴板内容一致', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/#/tool/json');
  await page.locator('#json-input').fill(JSON.stringify({ orderCha: 'A', orderType: 'B', userLevel: '1004', userType: '2', isStaff: 'true' }));
  await page.getByRole('button', { name: '格式化', exact: true }).click();

  const keyToken = page.locator('#json-highlight .json-token-key').filter({ hasText: '"userType"' });
  const box = await keyToken.boundingBox();
  expect(box).not.toBeNull();
  const characterWidth = box.width / '"userType"'.length;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + characterWidth * 1.1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + characterWidth * 9, y, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.press('Control+C');

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('userType');
});

test('JSON 长内容滚动时工具栏保持可见且结果区内部滚动', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/tool/json');
  const largeValue = Object.fromEntries(Array.from({ length: 180 }, (_, index) => [`field_${index}`, `value_${index}`]));
  await page.locator('#json-input').fill(JSON.stringify(largeValue));
  await page.getByRole('button', { name: '格式化', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

  const layout = await page.evaluate(() => {
    const topbar = document.querySelector('.topbar').getBoundingClientRect();
    const toolbar = document.querySelector('.json-toolbar').getBoundingClientRect();
    const result = document.querySelector('#json-result-body');
    return {
      topbarBottom: topbar.bottom,
      toolbarTop: toolbar.top,
      toolbarBottom: toolbar.bottom,
      resultClientHeight: result.clientHeight,
      resultScrollHeight: result.scrollHeight,
    };
  });
  expect(layout.toolbarTop).toBeGreaterThanOrEqual(layout.topbarBottom);
  expect(layout.toolbarBottom).toBeLessThan(900);
  expect(layout.resultScrollHeight).toBeGreaterThan(layout.resultClientHeight);
});

test('格式化工具支持 XML 格式化、转换和 SQL 整理', async ({ page }) => {
  await page.goto('/#/tool/xml-format');
  await expect(page.getByRole('heading', { name: 'XML 格式化' })).toBeVisible();
  await page.getByRole('button', { name: '格式化', exact: true }).click();
  await expect(page.locator('#xml-format-output')).toContainText('<catalog>');
  await expect(page.locator('#xml-format-output')).toContainText('\n  <book');
  await page.getByRole('button', { name: '压缩', exact: true }).click();
  await expect(page.locator('#xml-format-output')).toHaveText(/^[^\n]+$/);

  await page.goto('/#/tool/xml-converter');
  await expect(page.getByRole('heading', { name: 'XML 转换器' })).toBeVisible();
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(page.locator('#xml-converter-output')).toContainText('"@id": "42"');
  await expect(page.locator('#xml-converter-output')).toContainText('"roles": [');
  await page.locator('#xml-converter-format').selectOption('yaml');
  await expect(page.locator('#xml-converter-output')).toContainText('roles:');

  await page.goto('/#/tool/sql-format');
  await expect(page.getByRole('heading', { name: 'SQL 格式化' })).toBeVisible();
  await page.getByRole('button', { name: '格式化', exact: true }).click();
  const sqlOutput = page.locator('#sql-format-output');
  await expect(sqlOutput).toContainText('SELECT');
  await expect(sqlOutput).toContainText('FROM');
  await expect(sqlOutput).toContainText('WHERE');
  await page.getByRole('button', { name: '压缩', exact: true }).click();
  await expect(sqlOutput).not.toBeEmpty();
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
  expect(toolIds).toHaveLength(57);
  for (const toolId of toolIds) {
    await test.step(`打开 ${toolId}`, async () => {
      await page.locator(`.tool-card[data-tool-id="${toolId}"]`).evaluate((card) => card.click());
      await expect(page.locator('#tool-workspace')).toBeVisible();
      await expect(page.locator('.workspace-notice')).toHaveCount(0);
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

test('RSA 工具支持生成密钥对并完成两种方案加解密', async ({ page }) => {
  await page.goto('/#/tool/rsa');
  await expect(page.getByRole('heading', { name: 'RSA 加密解密' })).toBeVisible();
  await expect(page.locator('#crypto-mode')).toHaveValue('RSA-OAEP');
  await expect(page.locator('#crypto-rsa-hash')).toHaveValue('SHA-256');

  const roundTrip = async (text) => {
    await page.locator('#crypto-input').fill(text);
    await page.locator('[data-crypto-operation="encrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(/^[A-Za-z0-9+/=]+$/);
    const outputLayout = await page.locator('#crypto-output').evaluate((node) => ({ overflowWrap: getComputedStyle(node).overflowWrap, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
    expect(outputLayout.overflowWrap).toBe('anywhere');
    expect(outputLayout.scrollWidth).toBeLessThanOrEqual(outputLayout.clientWidth + 1);
    const encrypted = await page.locator('#crypto-output').textContent();
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    await page.locator('#crypto-input').fill(encrypted);
    await page.locator('[data-crypto-operation="decrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(text);
  };

  await page.locator('[data-rsa-key-action="generate"]').click();
  await expect(page.locator('#crypto-rsa-public-key')).toHaveValue(/-----BEGIN PUBLIC KEY-----/);
  await expect(page.locator('#crypto-rsa-private-key')).toHaveValue(/-----BEGIN PRIVATE KEY-----/);
  await roundTrip('ByeTools RSA-OAEP');

  await page.locator('#crypto-mode').selectOption('RSAES-PKCS1-v1_5');
  await page.locator('[data-rsa-key-action="generate"]').click();
  await expect(page.locator('#crypto-rsa-public-key')).toHaveValue(/-----BEGIN PUBLIC KEY-----/);
  await roundTrip('ByeTools RSAES');
});

test('3DES 工具支持 CBC、ECB 加解密和原文密钥', async ({ page }) => {
  await page.goto('/#/tool/3des');
  await expect(page.getByRole('heading', { name: '3DES 加密解密' })).toBeVisible();
  await expect(page.locator('#crypto-mode')).toHaveValue('CBC');
  await page.locator('#crypto-key').fill('123456789012345678901234');
  await page.locator('#crypto-iv').fill('12345678');
  await page.locator('#crypto-input').fill('ByeTools 3DES');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const cbcEncrypted = await page.locator('#crypto-output').textContent();
  expect(cbcEncrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  await page.locator('#crypto-input').fill(cbcEncrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools 3DES');

  await page.locator('#crypto-mode').selectOption('ECB');
  await expect(page.locator('#crypto-iv')).toBeDisabled();
  await page.locator('#crypto-input').fill('ByeTools 3DES ECB');
  await page.locator('[data-crypto-operation="encrypt"]').click();
  const ecbEncrypted = await page.locator('#crypto-output').textContent();
  expect(ecbEncrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  await page.locator('#crypto-input').fill(ecbEncrypted);
  await page.locator('[data-crypto-operation="decrypt"]').click();
  await expect(page.locator('#crypto-output')).toHaveText('ByeTools 3DES ECB');
});

test('DES 工具支持 CBC、ECB 加解密并保留安全警告', async ({ page }) => {
  await page.goto('/#/tool/des');
  await page.locator('#crypto-key').fill('DESKey12');
  await page.locator('#crypto-iv').fill('DESIv123');
  await page.locator('#crypto-input').fill('ByeTools DES 测试');
  await expect(page.locator('.crypto-note')).toContainText('不适合新系统');

  for (const mode of ['CBC', 'ECB']) {
    await page.locator('#crypto-mode').selectOption(mode);
    await page.locator('#crypto-input').fill(`DES ${mode} 测试`);
    await page.locator('[data-crypto-operation="encrypt"]').click();
    const encrypted = await page.locator('#crypto-output').textContent();
    expect(encrypted).not.toContain('尚未接入');
    await page.locator('#crypto-input').fill(encrypted);
    await page.locator('[data-crypto-operation="decrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(`DES ${mode} 测试`);
  }
});

test('AES 支持 CFB、OFB、ECB 模式加解密', async ({ page }) => {
  await page.goto('/#/tool/aes');
  await page.locator('#crypto-key').fill('ByeToolsKey12345');

  for (const mode of ['CFB', 'OFB', 'ECB']) {
    await page.locator('#crypto-mode').selectOption(mode);
    if (mode !== 'ECB') await page.locator('#crypto-iv').fill('ByeToolsIV123456');
    await expect(page.locator('#crypto-mode-capability')).toContainText('浏览器可运行');
    await page.locator('#crypto-input').fill(`AES ${mode} 模式测试`);
    await page.locator('[data-crypto-operation="encrypt"]').click();
    const encrypted = await page.locator('#crypto-output').textContent();
    await page.locator('#crypto-input').fill(encrypted);
    await page.locator('[data-crypto-operation="decrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(`AES ${mode} 模式测试`);
  }
});

test('SM4 支持 CTR、CFB、OFB 模式加解密', async ({ page }) => {
  await page.goto('/#/tool/sm4');
  await page.locator('#crypto-key').fill('SM4Key-123456789');
  await page.locator('#crypto-iv').fill('SM4Iv-1234567890');

  for (const mode of ['CTR', 'CFB', 'OFB']) {
    await page.locator('#crypto-mode').selectOption(mode);
    await expect(page.locator('#crypto-mode-capability')).toContainText('浏览器可运行');
    await page.locator('#crypto-input').fill(`SM4 ${mode} 模式支持任意长度文本`);
    await page.locator('[data-crypto-operation="encrypt"]').click();
    const encrypted = await page.locator('#crypto-output').textContent();
    await page.locator('#crypto-input').fill(encrypted);
    await page.locator('[data-crypto-operation="decrypt"]').click();
    await expect(page.locator('#crypto-output')).toHaveText(`SM4 ${mode} 模式支持任意长度文本`);
  }
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

test('MD5 摘要支持 Hex 和 Base64 输出', async ({ page }) => {
  await page.goto('/#/tool/md5');
  await page.locator('#crypto-input').fill('abc');

  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('900150983cd24fb0d6963f7d28e17f72');
  await expect(page.locator('#crypto-status')).toContainText('已完成');

  await page.locator('#crypto-format').selectOption('base64');
  await page.getByRole('button', { name: '计算摘要', exact: true }).click();
  await expect(page.locator('#crypto-output')).toHaveText('kAFQmDzST7DWlj99KOF/cg==');
});

test('IP 查询显示公网归属地且本地地址不联网', async ({ page }) => {
  let requestCount = 0;
  await page.route('https://api.ipquery.io/**', async (route) => {
    requestCount += 1;
    await route.fulfill({ status: 429, body: '请求过于频繁' });
  });
  await page.route('https://free.freeipapi.com/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ipAddress: '8.8.8.8',
        ipVersion: 4,
        countryName: '美国',
        countryCode: 'US',
        regionName: '加利福尼亚州',
        cityName: '圣何塞',
        latitude: 37.3394,
        longitude: -121.895,
        timeZones: ['America/Los_Angeles'],
        asn: 15169,
        asnOrganization: 'Google LLC',
      }),
    });
  });
  await page.goto('/#/tool/ip');
  await page.locator('[data-tool-action="ip-query"]').click();
  await expect(page.locator('#ip-status')).toHaveText('查询完成');
  await expect(page.locator('#ip-result')).toContainText('美国 · 加利福尼亚州 · 圣何塞');
  await expect(page.locator('#ip-result')).toContainText('Google LLC');
  await expect(page.locator('#ip-result')).toContainText('AS15169');

  await page.locator('#ip-input').fill('192.168.1.1');
  await page.locator('[data-tool-action="ip-query"]').click();
  await expect(page.locator('#ip-status')).toHaveText('本地识别完成');
  await expect(page.locator('#ip-result')).toContainText('不适用于本地地址');
  expect(requestCount).toBe(2);
});

test('IP 查询过程中修改地址会取消请求并恢复按钮', async ({ page }) => {
  await page.route('https://api.ipquery.io/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ location: { country: '美国' } }),
    });
  });
  await page.goto('/#/tool/ip');
  const queryButton = page.locator('[data-tool-action="ip-query"]');
  await queryButton.click();
  await expect(queryButton).toBeDisabled();

  await page.locator('#ip-input').fill('192.168.1.1');
  await expect(queryButton).toBeEnabled();
  await expect(page.locator('#ip-status')).toHaveText('本地识别完成');
  await expect(page.locator('#ip-result')).toContainText('不适用于本地地址');
});

test('Kafka 配置支持 SASL PLAIN 用户名密码', async ({ page }) => {
  await page.goto('/#/tool/message-queue');
  const brokerPicker = page.locator('[data-bt-select="mq-broker"]');
  await brokerPicker.locator('[data-bt-select-toggle]').click();
  await brokerPicker.locator('[data-bt-select-value="kafka"]').click();
  await page.locator('#mq-address').fill('kafka.example.test');
  await page.locator('#mq-username').fill('byetools-user');
  await page.locator('#mq-password').fill('byetools-password');
  await page.locator('[data-mq-action="test"]').click();
  await expect(page.locator('#mq-connection-status')).toContainText('等待桌面端接入');
  await expect(page.locator('#mq-connection-status')).not.toContainText('暂不支持 SASL');
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
