(function attachByeToolsStorage(global) {
  'use strict';

  const DATABASE_NAME = 'byetools-web';
  const DATABASE_VERSION = 1;
  const CONFIG_KEY_ID = 'web-config-key-v1';
  const MIGRATION_ID = 'local-storage-v2';
  const LEGACY_CRYPTO_CONFIG_KEY = 'byetools-crypto-configs-v1';
  const LEGACY_CRYPTO_SECRET_KEY = 'byetools-crypto-config-secret-v1';
  const LEGACY_KEYS = [
    'byetools-favorites',
    'byetools-history',
    'byetools-theme-mode',
    'byetools-theme',
    'byetools-menu-layout',
    'byetools-density',
    'byetools-json-draft',
    'byetools-json-expanded',
    'byetools-json-layout',
    'byetools-json-sort',
    'byetools-json-lint',
    'byetools-json-auto-decode',
    'byetools-json-node-edit',
    'byetools-json-nested',
    'byetools-cron-history',
    LEGACY_CRYPTO_SECRET_KEY,
  ];
  const STORE_NAMES = {
    settings: 'app_settings',
    favorites: 'favorites',
    recentTools: 'recent_tools',
    history: 'tool_history',
    drafts: 'tool_drafts',
    configs: 'tool_configs',
    keys: 'crypto_keys',
    migrations: 'storage_migrations',
    legacy: 'legacy_values',
  };

  const desktopInvoke = global.__TAURI__?.core?.invoke;
  const desktopMode = typeof desktopInvoke === 'function';

  function invokeDesktop(command, args) {
    if (!desktopMode) return Promise.reject(new Error('桌面存储服务不可用'));
    return desktopInvoke(command, args);
  }

  function desktopSummaryToRecord(summary) {
    return {
      ...summary,
      payload: {
        schemaVersion: 1,
        toolId: summary.toolId,
        operation: summary.operation || 'digest',
        fields: Array.isArray(summary.summaryFields) ? summary.summaryFields : [],
      },
      desktopSummary: true,
    };
  }

  let databasePromise;
  let memoryMode = false;
  const memoryStores = new Map(Object.values(STORE_NAMES).map((name) => [name, new Map()]));

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 请求失败'));
    });
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;
    if (!global.indexedDB) {
      memoryMode = true;
      databasePromise = Promise.resolve(null);
      return databasePromise;
    }
    databasePromise = new Promise((resolve, reject) => {
      const request = global.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const createStore = (name, options) => database.objectStoreNames.contains(name) ? request.transaction.objectStore(name) : database.createObjectStore(name, options);
        createStore(STORE_NAMES.settings, { keyPath: 'key' });
        createStore(STORE_NAMES.favorites, { keyPath: 'toolId' });
        createStore(STORE_NAMES.recentTools, { keyPath: 'toolId' });
        const history = createStore(STORE_NAMES.history, { keyPath: 'id' });
        if (!history.indexNames.contains('toolId')) history.createIndex('toolId', 'toolId', { unique: false });
        createStore(STORE_NAMES.drafts, { keyPath: 'toolId' });
        const configs = createStore(STORE_NAMES.configs, { keyPath: 'id' });
        if (!configs.indexNames.contains('toolId')) configs.createIndex('toolId', 'toolId', { unique: false });
        createStore(STORE_NAMES.keys, { keyPath: 'id' });
        createStore(STORE_NAMES.migrations, { keyPath: 'id' });
        createStore(STORE_NAMES.legacy, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
      request.onblocked = () => reject(new Error('IndexedDB 被其他页面占用'));
    });
    return databasePromise;
  }

  function transaction(storeNames, mode, callback) {
    if (memoryMode) {
      try {
        const stores = storeNames.reduce((result, name) => {
          result[name] = memoryStores.get(name);
          return result;
        }, {});
        return Promise.resolve(callback(stores));
      } catch (error) {
        return Promise.reject(error);
      }
    }
    return openDatabase().then((database) => new Promise((resolve, reject) => {
      const currentTransaction = database.transaction(storeNames, mode);
      const stores = storeNames.reduce((result, name) => {
        result[name] = currentTransaction.objectStore(name);
        return result;
      }, {});
      let callbackResult;
      currentTransaction.oncomplete = () => resolve(callbackResult);
      currentTransaction.onerror = () => reject(currentTransaction.error || new Error('IndexedDB 事务失败'));
      currentTransaction.onabort = () => reject(currentTransaction.error || new Error('IndexedDB 事务已回滚'));
      try {
        callbackResult = callback(stores);
      } catch (error) {
        currentTransaction.abort();
        reject(error);
      }
    }));
  }

  async function getRecord(storeName, key) {
    await ready;
    if (memoryMode) return memoryStores.get(storeName).get(key);
    const database = await openDatabase();
    return requestResult(database.transaction(storeName, 'readonly').objectStore(storeName).get(key));
  }

  async function getAllRecords(storeName) {
    await ready;
    if (memoryMode) return [...memoryStores.get(storeName).values()];
    const database = await openDatabase();
    return requestResult(database.transaction(storeName, 'readonly').objectStore(storeName).getAll());
  }

  function parseLegacyJson(value, fallback) {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function readLegacyValue(key) {
    try {
      return global.localStorage?.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function writeMemory(storeName, value) {
    const store = memoryStores.get(storeName);
    const keyPath = storeName === STORE_NAMES.settings ? 'key' : storeName === STORE_NAMES.legacy ? 'key' : storeName === STORE_NAMES.favorites || storeName === STORE_NAMES.recentTools || storeName === STORE_NAMES.drafts ? 'toolId' : 'id';
    store.set(value[keyPath], value);
  }

  async function migrateLegacyData() {
    const marker = await getRecordWithoutReady(STORE_NAMES.migrations, MIGRATION_ID);
    if (marker?.status === 'completed') return;
    const now = Date.now();
    const favorites = parseLegacyJson(readLegacyValue('byetools-favorites'), []);
    const recentTools = parseLegacyJson(readLegacyValue('byetools-history'), []);
    const cronHistory = parseLegacyJson(readLegacyValue('byetools-cron-history'), []);
    const settings = [
      ['theme-mode', readLegacyValue('byetools-theme-mode') || readLegacyValue('byetools-theme') || 'dark'],
      ['menu-layout', readLegacyValue('byetools-menu-layout') || 'standard'],
      ['density', readLegacyValue('byetools-density') || 'comfortable'],
      ['json-layout', readLegacyValue('byetools-json-layout') || 'side'],
      ['json-sort', readLegacyValue('byetools-json-sort') || 'default'],
      ['json-lint', readLegacyValue('byetools-json-lint') !== 'false'],
      ['json-auto-decode', readLegacyValue('byetools-json-auto-decode') !== 'false'],
      ['json-node-edit', readLegacyValue('byetools-json-node-edit') !== 'false'],
      ['json-nested', readLegacyValue('byetools-json-nested') === 'true'],
    ];
    const jsonDraft = readLegacyValue('byetools-json-draft');
    const cryptoEnvelope = readLegacyValue(LEGACY_CRYPTO_CONFIG_KEY);
    const cryptoSecret = readLegacyValue(LEGACY_CRYPTO_SECRET_KEY);
    const writes = [
      ...settings.filter(([, value]) => value !== '').map(([key, value]) => ({ store: STORE_NAMES.settings, value: { key, value, updatedAt: now } })),
      ...(Array.isArray(favorites) ? favorites.filter((id) => typeof id === 'string').map((toolId, index) => ({ store: STORE_NAMES.favorites, value: { toolId, createdAt: now - index } })) : []),
      ...(Array.isArray(recentTools) ? recentTools.filter((id) => typeof id === 'string').map((toolId, index) => ({ store: STORE_NAMES.recentTools, value: { toolId, openedAt: now - index, openCount: 1 } })) : []),
      ...(jsonDraft ? [{ store: STORE_NAMES.drafts, value: { toolId: 'json', payload: { draft: jsonDraft, expanded: parseLegacyJson(readLegacyValue('byetools-json-expanded'), ['[]', '["tools"]']) }, isSensitive: 0, payloadVersion: 1, updatedAt: now } }] : []),
      ...(Array.isArray(cronHistory) ? cronHistory.filter((item) => item && typeof item.expression === 'string').map((item, index) => ({ store: STORE_NAMES.history, value: { id: `cron-${item.expression}`, toolId: 'cron', summaryJson: JSON.stringify({ expression: item.expression, description: item.description || '' }), createdAt: Number(item.savedAt) || now - index } })) : []),
      ...(cryptoEnvelope ? [{ store: STORE_NAMES.legacy, value: { key: LEGACY_CRYPTO_CONFIG_KEY, value: cryptoEnvelope, createdAt: now } }] : []),
      ...(cryptoSecret ? [{ store: STORE_NAMES.legacy, value: { key: LEGACY_CRYPTO_SECRET_KEY, value: cryptoSecret, createdAt: now } }] : []),
    ];
    if (memoryMode) {
      writes.forEach((item) => writeMemory(item.store, item.value));
      writeMemory(STORE_NAMES.migrations, { id: MIGRATION_ID, status: 'completed', migratedAt: now });
    } else {
      await transaction([...new Set(writes.map((item) => item.store).concat(STORE_NAMES.migrations))], 'readwrite', (stores) => {
        writes.forEach((item) => stores[item.store].put(item.value));
        stores[STORE_NAMES.migrations].put({ id: MIGRATION_ID, status: 'completed', migratedAt: now });
      });
    }
    LEGACY_KEYS.filter((key) => key !== LEGACY_CRYPTO_CONFIG_KEY).forEach((key) => {
      try { global.localStorage?.removeItem(key); } catch (error) { /* 忽略旧浏览器存储清理失败 */ }
    });
  }

  async function getRecordWithoutReady(storeName, key) {
    if (memoryMode) return memoryStores.get(storeName).get(key);
    const database = await openDatabase();
    return requestResult(database.transaction(storeName, 'readonly').objectStore(storeName).get(key));
  }

  const ready = desktopMode ? Promise.resolve() : openDatabase().then(() => migrateLegacyData());

  const api = {
    ready,
    get mode() { return desktopMode ? 'sqlite' : memoryMode ? 'memory' : 'indexeddb'; },
    async getSetting(key, fallback = null) {
      if (desktopMode) {
        const value = await invokeDesktop('setting_get', { key });
        return value == null ? fallback : value;
      }
      const record = await getRecord(STORE_NAMES.settings, key);
      return record ? record.value : fallback;
    },
    async setSetting(key, value) {
      if (desktopMode) return invokeDesktop('setting_set', { key, value });
      return transaction([STORE_NAMES.settings], 'readwrite', (stores) => {
        const record = { key, value, updatedAt: Date.now() };
        if (memoryMode) writeMemory(STORE_NAMES.settings, record); else stores[STORE_NAMES.settings].put(record);
        return value;
      });
    },
    async getFavorites() {
      if (desktopMode) return invokeDesktop('favorites_get');
      const records = await getAllRecords(STORE_NAMES.favorites);
      return records.sort((left, right) => right.createdAt - left.createdAt).map((record) => record.toolId);
    },
    async setFavorite(toolId, enabled) {
      if (desktopMode) return invokeDesktop('favorite_set', { toolId, enabled });
      return transaction([STORE_NAMES.favorites], 'readwrite', (stores) => {
        if (memoryMode) {
          if (enabled) writeMemory(STORE_NAMES.favorites, { toolId, createdAt: Date.now() });
          else memoryStores.get(STORE_NAMES.favorites).delete(toolId);
        } else if (enabled) stores[STORE_NAMES.favorites].put({ toolId, createdAt: Date.now() });
        else stores[STORE_NAMES.favorites].delete(toolId);
      });
    },
    async setRecentTools(ids) {
      if (desktopMode) return invokeDesktop('recent_tools_set', { ids });
      const values = [...new Set(ids)].slice(0, 12).map((toolId, index) => ({ toolId, openedAt: Date.now() - index, openCount: 1 }));
      return transaction([STORE_NAMES.recentTools], 'readwrite', (stores) => {
        if (memoryMode) {
          const store = memoryStores.get(STORE_NAMES.recentTools);
          store.clear();
          values.forEach((value) => store.set(value.toolId, value));
        } else {
          stores[STORE_NAMES.recentTools].clear();
          values.forEach((value) => stores[STORE_NAMES.recentTools].put(value));
        }
      });
    },
    async getRecentTools(limit = 12) {
      if (desktopMode) return invokeDesktop('recent_tools_get', { limit });
      const records = await getAllRecords(STORE_NAMES.recentTools);
      return records.sort((left, right) => right.openedAt - left.openedAt).slice(0, limit).map((record) => record.toolId);
    },
    async setDraft(toolId, payload, options = {}) {
      if (desktopMode) {
        return invokeDesktop('draft_set', {
          input: {
            toolId,
            payload,
            isSensitive: Boolean(options.isSensitive),
            payloadVersion: options.payloadVersion || 1,
          },
        });
      }
      const value = { toolId, payload, isSensitive: options.isSensitive ? 1 : 0, nonce: options.nonce || null, payloadVersion: options.payloadVersion || 1, cryptoVersion: options.cryptoVersion || null, keyId: options.keyId || null, updatedAt: Date.now() };
      return transaction([STORE_NAMES.drafts], 'readwrite', (stores) => { if (memoryMode) writeMemory(STORE_NAMES.drafts, value); else stores[STORE_NAMES.drafts].put(value); });
    },
    async getDraft(toolId) {
      if (desktopMode) return invokeDesktop('draft_get', { toolId });
      const record = await getRecord(STORE_NAMES.drafts, toolId);
      return record || null;
    },
    async getToolHistory(toolId) {
      if (desktopMode) return invokeDesktop('tool_history_get', { toolId });
      const records = await getAllRecords(STORE_NAMES.history);
      return records.filter((record) => record.toolId === toolId).sort((left, right) => right.createdAt - left.createdAt).map((record) => {
        try { return JSON.parse(record.summaryJson); } catch (error) { return null; }
      }).filter(Boolean);
    },
    async replaceToolHistory(toolId, items) {
      if (desktopMode) return invokeDesktop('tool_history_replace', { toolId, items });
      const records = items.map((item, index) => ({ id: `${toolId}-${item.expression || item.id || index}`, toolId, summaryJson: JSON.stringify(item), createdAt: Number(item.savedAt) || Date.now() - index }));
      return transaction([STORE_NAMES.history], 'readwrite', (stores) => {
        if (memoryMode) {
          const store = memoryStores.get(STORE_NAMES.history);
          [...store.values()].filter((record) => record.toolId === toolId).forEach((record) => store.delete(record.id));
          records.forEach((record) => store.set(record.id, record));
        } else {
          const index = stores[STORE_NAMES.history].index('toolId');
          const request = index.openCursor(IDBKeyRange.only(toolId));
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
            else records.forEach((record) => stores[STORE_NAMES.history].put(record));
          };
        }
      });
    },
    async clearToolHistory(toolId) {
      if (desktopMode) return invokeDesktop('tool_history_clear', { toolId });
      return this.replaceToolHistory(toolId, []);
    },
    async getCryptoConfigs() {
      if (desktopMode) throw new Error('桌面版配置列表必须指定工具 ID');
      return getAllRecords(STORE_NAMES.configs);
    },
    async replaceCryptoConfigs(records) {
      if (desktopMode) throw new Error('桌面版不支持批量替换加密配置，请使用固定配置命令');
      return transaction([STORE_NAMES.configs], 'readwrite', (stores) => {
        if (memoryMode) {
          const store = memoryStores.get(STORE_NAMES.configs);
          store.clear();
          records.forEach((record) => store.set(record.id, record));
        } else {
          stores[STORE_NAMES.configs].clear();
          records.forEach((record) => stores[STORE_NAMES.configs].put(record));
        }
      });
    },
    async getLegacyValue(key) {
      if (desktopMode) return '';
      const record = await getRecord(STORE_NAMES.legacy, key);
      return record?.value || readLegacyValue(key);
    },
    async removeLegacyValues(keys = LEGACY_KEYS) {
      if (desktopMode) return;
      return transaction([STORE_NAMES.legacy], 'readwrite', (stores) => {
        keys.forEach((key) => {
          if (memoryMode) memoryStores.get(STORE_NAMES.legacy).delete(key); else stores[STORE_NAMES.legacy].delete(key);
          try { global.localStorage?.removeItem(key); } catch (error) { /* 忽略旧浏览器存储清理失败 */ }
        });
      });
    },
    async getOrCreateConfigKey(legacySecret = '') {
      if (desktopMode) throw new Error('桌面版加密密钥由系统凭证存储管理');
      if (!global.crypto?.subtle) throw new Error('当前浏览器不支持本地加密存储');
      const stored = await getRecord(STORE_NAMES.keys, CONFIG_KEY_ID);
      if (stored?.key) return stored.key;
      let key;
      if (legacySecret) {
        const binary = global.atob(legacySecret);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        key = await global.crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      } else {
        key = await global.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      }
      const value = { id: CONFIG_KEY_ID, key, version: 1, createdAt: Date.now() };
      return transaction([STORE_NAMES.keys], 'readwrite', (stores) => {
        if (memoryMode) writeMemory(STORE_NAMES.keys, value); else stores[STORE_NAMES.keys].put(value);
        return key;
      }).then(() => key);
    },
    async markStorageReady() {
      const status = document.querySelector('#storage-status-text');
      if (desktopMode) {
        const details = await invokeDesktop('storage_status');
        if (status) status.textContent = `SQLite 本地存储 · ${details?.fieldEncryption || 'AES-256-GCM'}`;
      } else if (status) status.textContent = memoryMode ? '临时本地存储' : 'IndexedDB 本地存储';
    },
    async listCryptoConfigs(toolId) {
      if (!desktopMode) return [];
      const records = await invokeDesktop('crypto_config_list', { toolId });
      return Array.isArray(records) ? records.map(desktopSummaryToRecord) : [];
    },
    async saveCryptoConfig(toolId, name, payload) {
      const summary = await invokeDesktop('crypto_config_save', { input: { toolId, name, payload } });
      return desktopSummaryToRecord(summary);
    },
    async updateCryptoConfig(recordId, toolId, name, payload) {
      const summary = await invokeDesktop('crypto_config_update', { recordId, input: { toolId, name, payload } });
      return desktopSummaryToRecord(summary);
    },
    async applyCryptoConfig(toolId, recordId) {
      return invokeDesktop('crypto_config_apply', { toolId, recordId });
    },
    async deleteCryptoConfig(toolId, recordId) {
      return invokeDesktop('crypto_config_delete', { toolId, recordId });
    },
    async migrateCryptoConfigs(sourceVersion, records) {
      return invokeDesktop('crypto_config_migrate', { sourceVersion, records });
    },
    async rotateCryptoConfigKey(targetVersion) {
      return invokeDesktop('crypto_config_rotate_key', { targetVersion });
    },
    isDesktop: desktopMode,
    desktopInvoke: invokeDesktop,
  };

  global.ByeToolsStorage = api;
})(window);
