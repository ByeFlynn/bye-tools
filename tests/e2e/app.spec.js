import { expect, test } from '@playwright/test';

test('首页展示完整工具目录并支持搜索', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '欢迎使用 ByeTools' })).toBeVisible();
  await expect(page.locator('.tool-card')).toHaveCount(44);
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
  expect(toolIds).toHaveLength(44);
  for (const toolId of toolIds) {
    await test.step(`打开 ${toolId}`, async () => {
      await page.locator(`.tool-card[data-tool-id="${toolId}"]`).evaluate((card) => card.click());
      await expect(page.locator('#tool-workspace')).toBeVisible();
      await page.locator('[data-action="home"]').first().click();
    });
  }
  expect(pageErrors).toEqual([]);
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
