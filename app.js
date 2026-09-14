import smCrypto from 'sm-crypto';
import { sha3_256, sha3_384, sha3_512 } from 'js-sha3';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js/browser';
import { BrowserMultiFormatReader } from '@zxing/browser';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const { sm2: sm2Library, sm3: sm3Library, sm4: sm4Library } = smCrypto;

const tools = [
  { id: 'json', name: 'JSON 格式化', description: '格式化、验证和美化 JSON 数据', category: 'format', label: '格式化工具', icon: '{ }', iconClass: 'icon-json', environment: 'local', featured: true, keywords: 'json 格式化 校验 美化 树 编辑 lint 解码' },
  { id: 'json-to-types', name: 'JSON 转类型生成器', description: '从 JSON 样本生成二十多种语言的类型定义', category: 'format', label: '格式化工具', icon: 'J→T', iconClass: 'icon-json-types', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: 'json types 类型 生成 typescript java go rust swift kotlin python csharp interface struct quicktype' },
  { id: 'xml-format', name: 'XML 格式化', description: '格式化、压缩和校验 XML 文档', category: 'format', label: '格式化工具', icon: 'XML', iconClass: 'icon-xml-format', environment: 'local', capability: 'ready', capabilityLabel: '本地处理', keywords: 'xml 格式化 压缩 美化 校验 pretty print' },
  { id: 'xml-converter', name: 'XML 转换器', description: '将 XML 转换为 JSON、YAML、TOML 等代码格式', category: 'format', label: '格式化工具', icon: 'X→', iconClass: 'icon-xml-converter', environment: 'local', capability: 'ready', capabilityLabel: '本地转换', keywords: 'xml 转换 json yaml toml javascript js php 数组 属性 命名空间' },
  { id: 'sql-format', name: 'SQL 格式化', description: '格式化、压缩和整理 SQL 查询语句', category: 'format', label: '格式化工具', icon: 'SQL', iconClass: 'icon-sql-format', environment: 'local', capability: 'ready', capabilityLabel: '本地处理', keywords: 'sql 格式化 压缩 mysql postgresql sqlite sqlserver 查询 database' },
  { id: 'base64', name: 'Base64 编解码', description: 'Base64 编码与解码', category: 'encoding', label: '编码转换', icon: '64', iconClass: 'icon-base64', environment: 'local', featured: true, keywords: 'base64 编码 解码' },
  { id: 'qr-barcode', name: '二维码与条形码', description: '二维码和条形码的生成与图片识别', category: 'encoding', label: '编码转换', icon: 'QR', iconClass: 'icon-qr-barcode', environment: 'local', capability: 'ready', capabilityLabel: '本地处理', keywords: '二维码 qr code 生成 识别 条形码 barcode 生成器 识别器' },
  { id: 'time', name: '时间戳转换', description: '时间戳、日期时间和时长单位互转', category: 'helper', label: '开发辅助', icon: '◷', iconClass: 'icon-time', environment: 'local', featured: true, keywords: '时间戳 日期 时间 时区 秒 毫秒 分 时 天 周 月 年' },
  { id: 'url', name: 'URL 编解码', description: 'URL 编码与解码', category: 'encoding', label: '编码转换', icon: 'URL', iconClass: 'icon-url', environment: 'local', featured: true, keywords: 'url 编码 解码' },
  { id: 'md5', name: 'MD5 摘要', description: 'MD5 摘要生成（不推荐安全用途）', category: 'crypto', label: '加密解密', icon: '▣', iconClass: 'icon-md5', environment: 'local', cryptoType: 'digest', capability: 'deprecated', capabilityLabel: '不推荐', keywords: 'md5 hash 摘要 弱算法' },
  { id: 'sha2', name: 'SHA-2 摘要', description: 'SHA-256、SHA-384、SHA-512 摘要生成', category: 'crypto', label: '加密解密', icon: '◆', iconClass: 'icon-sha', environment: 'local', cryptoType: 'digest', capability: 'ready', capabilityLabel: '可运行', keywords: 'sha sha2 sha-256 sha-384 sha-512 hash 摘要' },
  { id: 'sha3', name: 'SHA-3 摘要', description: 'SHA3-256、SHA3-384、SHA3-512 摘要生成', category: 'crypto', label: '加密解密', icon: 'S3', iconClass: 'icon-sha3', environment: 'local', cryptoType: 'digest', capability: 'ready', capabilityLabel: '可运行', keywords: 'sha3 sha-3 sha3-256 sha3-384 sha3-512 hash 摘要' },
  { id: 'sm2', name: 'SM2 加密解密', description: '国密 SM2 非对称加密与签名参数', category: 'crypto', label: '加密解密', icon: 'S2', iconClass: 'icon-sm2', environment: 'local', cryptoType: 'asymmetric', capability: 'ready', capabilityLabel: '可运行', keywords: 'sm2 国密 非对称 加密 解密 签名' },
  { id: 'sm3', name: 'SM3 摘要', description: '国密 SM3 摘要计算', category: 'crypto', label: '加密解密', icon: 'S3', iconClass: 'icon-sm3', environment: 'local', cryptoType: 'digest', capability: 'ready', capabilityLabel: '可运行', keywords: 'sm3 国密 hash 摘要' },
  { id: 'sm4', name: 'SM4 加密解密', description: '国密 SM4 对称加密与解密参数', category: 'crypto', label: '加密解密', icon: 'S4', iconClass: 'icon-sm4', environment: 'local', cryptoType: 'symmetric', capability: 'ready', capabilityLabel: '可运行', keywords: 'sm4 国密 对称 加密 解密' },
  { id: 'aes', name: 'AES 加密解密', description: 'AES-GCM、CBC、CTR、CFB、OFB、ECB 加密与解密', category: 'crypto', label: '加密解密', icon: 'AES', iconClass: 'icon-aes', environment: 'local', cryptoType: 'symmetric', capability: 'ready', capabilityLabel: '可运行', keywords: 'aes aes-gcm aes-cbc aes-ctr aes-cfb aes-ofb aes-ecb 对称 加密 解密' },
  { id: 'des', name: 'DES 加密解密', description: 'DES 对称加密与解密参数（不推荐）', category: 'crypto', label: '加密解密', icon: 'DES', iconClass: 'icon-des', environment: 'local', cryptoType: 'symmetric', capability: 'deprecated', capabilityLabel: '不推荐', keywords: 'des 对称 加密 解密 弱算法 已淘汰' },
  { id: '3des', name: '3DES 加密解密', description: 'Triple DES-CBC、ECB 加解密（仅兼容旧系统）', category: 'crypto', label: '加密解密', icon: '3D', iconClass: 'icon-3des', environment: 'local', cryptoType: 'symmetric', capability: 'ready', capabilityLabel: '兼容性支持', keywords: '3des triple des desede tdea 对称 加密 解密 兼容 旧系统' },
  { id: 'rsa', name: 'RSA 加密解密', description: 'RSA-OAEP、PKCS#1 v1.5 非对称加解密', category: 'crypto', label: '加密解密', icon: 'RSA', iconClass: 'icon-rsa', environment: 'local', cryptoType: 'asymmetric', capability: 'ready', capabilityLabel: '可运行', keywords: 'rsa rsa-oaep pkcs1 pkcs#1 公钥 私钥 非对称 加密 解密 密钥对' },
  { id: 'unicode', name: 'Unicode 编解码', description: 'Unicode 编码与解码', category: 'encoding', label: '编码转换', icon: 'U', iconClass: 'icon-unicode', environment: 'local', keywords: 'unicode 编码 解码' },
  { id: 'ip', name: 'IP 查询', description: 'IP 地址归属地查询', category: 'network', label: '网络工具', icon: '•', iconClass: 'icon-ip', environment: 'desktop', keywords: 'ip 地址 网络 查询' },
  { id: 'message-queue', name: '消息中间件', description: 'MQTT、Kafka、RabbitMQ、RocketMQ 消息发送与消费', category: 'message-queue', label: '消息队列', icon: 'MQ', iconClass: 'icon-message-queue', environment: 'desktop', keywords: 'mq mqtt kafka rabbitmq rocketmq 消息队列 消息中间件 发布 订阅 生产 消费 topic queue exchange tag nameserver' },
  { id: 'linux-commands', name: 'Linux 命令速查', description: '按分类查询命令解释、参数和实用示例', category: 'cheatsheet', label: '速查工具', icon: '>_', iconClass: 'icon-linux-command', environment: 'local', capability: 'ready', capabilityLabel: '本地查询', keywords: 'linux shell 命令 速查 手册 运维 参数 示例 文件 网络 进程 权限' },
  { id: 'html', name: 'HTML 转换', description: 'HTML 实体编码与解码', category: 'encoding', label: '编码转换', icon: '</>', iconClass: 'icon-html', environment: 'local', keywords: 'html 实体 编码 解码' },
  { id: 'regex', name: '正则表达式测试', description: '正则表达式在线测试', category: 'text', label: '文本工具', icon: '✣', iconClass: 'icon-regex', environment: 'local', keywords: 'regex 正则 匹配 测试' },
  { id: 'random', name: '随机数生成', description: '数字、UUID、颜色和令牌等多类型生成，支持 CSV 导出', category: 'generator', label: '生成器', icon: '⌁', iconClass: 'icon-random', environment: 'local', keywords: '随机数 uuid 随机字符串 整数 小数 布尔 hex base64 日期 颜色 ip csv 导出' },
  { id: 'password', name: '密码生成器', description: '批量生成安全随机密码，支持复制和 CSV 导出', category: 'generator', label: '生成器', icon: '•••', iconClass: 'icon-password', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: '密码 password 口令 随机 安全 强度 批量 csv 导出' },
  { id: 'color', name: '颜色转换', description: '颜色值转换、取色和 CSS 格式预览', category: 'helper', label: '开发辅助', icon: '●', iconClass: 'icon-color', environment: 'local', keywords: '颜色 hex hexa rgb rgba hsl hsla hsv 取色器' },
  { id: 'diff', name: '文本对比', description: '文本、JSON 和 Properties 差异', category: 'text', label: '文本工具', icon: '≠', iconClass: 'icon-diff', environment: 'local', keywords: 'diff 文本 对比 json properties' },
  { id: 'mermaid', name: 'Mermaid 图表', description: 'Mermaid 代码生成 SVG 图表', category: 'format', label: '格式化工具', icon: '◇', iconClass: 'icon-mermaid', environment: 'local', keywords: 'mermaid 图表 流程图 svg' },
  { id: 'markdown-image', name: 'Markdown 转图片', description: '主题排版与 PNG 导出', category: 'format', label: '格式化工具', icon: 'M↓', iconClass: 'icon-html', environment: 'local', keywords: 'markdown 图片 png 主题' },
  { id: 'markdown-editor', name: 'Markdown 编辑器', description: '编辑、预览并保存 Markdown 文档', category: 'format', label: '格式化工具', icon: 'MD', iconClass: 'icon-markdown-editor', environment: 'local', capability: 'ready', capabilityLabel: '本地编辑', keywords: 'markdown 编辑器 编辑 预览 文档 md 打开 保存 文件' },
  { id: 'mindmap', name: '思维导图生成', description: '将 Markdown 大纲转换为可下载的思维导图', category: 'format', label: '格式化工具', icon: 'MM', iconClass: 'icon-mindmap', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: '思维导图 mindmap markdown 大纲 结构图 svg png 模板' },
  { id: 'image-tools', name: '图片工具', description: '压缩、缩放、裁剪、格式转换和 Base64 互转', category: 'file', label: '文件工具', icon: 'IMG', iconClass: 'icon-image-tools', environment: 'local', capability: 'ready', capabilityLabel: '本地处理', keywords: '图片 压缩 尺寸 缩放 裁剪 格式 png jpg jpeg webp avif base64' },
  { id: 'favicon', name: 'Favicon 生成器', description: '从一张图片生成网站图标和常用尺寸 PNG', category: 'file', label: '文件工具', icon: '★', iconClass: 'icon-favicon', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: 'favicon 网站图标 ico png apple touch icon manifest' },
  { id: 'pdf-tools', name: 'PDF 工具', description: '合并、拆分、加水印、整理和转图片', category: 'file', label: '文件工具', icon: 'PDF', iconClass: 'icon-pdf-tools', environment: 'local', capability: 'ready', capabilityLabel: '本地处理', keywords: 'pdf 合并 拆分 水印 整理 页面重排 转图片 png' },
  { id: 'jwt', name: 'JWT 解析', description: '解析 Header、Payload 和时间字段', category: 'helper', label: '开发辅助', icon: 'JWT', iconClass: 'icon-sha', environment: 'local', keywords: 'jwt token header payload' },
  { id: 'curl', name: 'Curl 转代码', description: 'Curl 转 Fetch、Axios、Python、Go', category: 'network', label: '网络工具', icon: '↯', iconClass: 'icon-random', environment: 'local', keywords: 'curl fetch axios python go' },
  { id: 'cron', name: 'Cron 表达式', description: '校验表达式与预览执行时间', category: 'helper', label: '开发辅助', icon: '⏱', iconClass: 'icon-time', environment: 'local', keywords: 'cron 定时 任务 表达式' },
  { id: 'gradient', name: '渐变生成器', description: '生成线性、径向和锥形渐变 CSS', category: 'design', label: '设计工具', icon: '∿', iconClass: 'icon-color', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: '渐变 linear radial conic css design' },
  { id: 'shadow', name: '阴影生成器', description: '可视化调整多层 CSS 阴影', category: 'design', label: '设计工具', icon: '▧', iconClass: 'icon-color', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'box shadow css 阴影 design' },
  { id: 'contrast', name: '对比度检查', description: '检查前景色与背景色的 WCAG 对比度', category: 'design', label: '设计工具', icon: 'Aa', iconClass: 'icon-color', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'wcag contrast 无障碍 颜色 design' },
  { id: 'palette', name: '调色板生成器', description: '从基础颜色生成主题色阶', category: 'design', label: '设计工具', icon: '●●●', iconClass: 'icon-color', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'palette 色板 主题色 design' },
  { id: 'px-rem', name: 'px / rem 换算器', description: '按根字号换算 px、rem 和 em', category: 'design', label: '设计工具', icon: 'px', iconClass: 'icon-color', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'px rem em css design' },
  { id: 'uuid-generator', name: 'UUID 生成器', description: '批量生成可配置格式的 UUID，支持复制和 CSV', category: 'generator', label: '生成器', icon: 'ID', iconClass: 'icon-random', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: 'uuid id generator 生成器 大写 小写 连接符 csv' },
  { id: 'string-generator', name: '随机字符串生成器', description: '按长度和字符集批量生成随机字符串', category: 'generator', label: '生成器', icon: 'Aa', iconClass: 'icon-random', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: '随机字符串 token generator 大写 小写 数字 符号 csv' },
  { id: 'slug', name: 'Slug 生成器', description: '将标题和文本转换为 URL 友好 Slug', category: 'generator', label: '生成器', icon: '—', iconClass: 'icon-random', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: 'slug url seo generator 中文 分隔符' },
  { id: 'fake-data', name: '假数据生成器', description: '生成用户、地址、公司、商品和订单测试数据', category: 'generator', label: '生成器', icon: '{}', iconClass: 'icon-random', environment: 'local', capability: 'ready', capabilityLabel: '本地生成', keywords: 'mock fake data json generator 用户 地址 公司 商品 订单 csv' },
  { id: 'timezone', name: '时区转换器', description: '在不同时区之间换算同一时刻', category: 'helper', label: '开发辅助', icon: 'TZ', iconClass: 'icon-time', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'timezone 时区 utc 时间' },
  { id: 'date-calculator', name: '日期计算器', description: '计算日期差值并进行日期加减', category: 'helper', label: '开发辅助', icon: '+', iconClass: 'icon-time', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'date 日期 差值 加减 时间' },
  { id: 'world-clock', name: '世界时钟', description: '查看常用城市的实时本地时间', category: 'helper', label: '开发辅助', icon: '◴', iconClass: 'icon-time', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'world clock 城市 时间' },
  { id: 'text-counter', name: '文本统计', description: '统计字符、词数、行数和 UTF-8 字节', category: 'text', label: '文本工具', icon: '#', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'text counter 字符 字数 统计' },
  { id: 'case-converter', name: '大小写转换', description: '转换 camel、snake、kebab 和 Pascal 等命名风格', category: 'text', label: '文本工具', icon: 'Aa', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'case camel snake kebab pascal 文本' },
  { id: 'text-replace', name: '文本替换', description: '支持普通匹配和正则表达式批量替换', category: 'text', label: '文本工具', icon: '↔', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'replace 文本替换 regex 正则' },
  { id: 'text-cleaner', name: '文本清理', description: '清理空白、空行和不可见字符', category: 'text', label: '文本工具', icon: '≡', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'cleaner 清理 空白 文本' },
  { id: 'line-tools', name: '行操作工具', description: '对文本行进行去重、排序、编号和过滤', category: 'text', label: '文本工具', icon: '☷', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'line 行 去重 排序 文本' },
  { id: 'invisible', name: '不可见字符查看器', description: '识别空格、制表符、换行和零宽字符', category: 'text', label: '文本工具', icon: '·', iconClass: 'icon-regex', environment: 'local', capability: 'ready', capabilityLabel: '本地运行', keywords: 'invisible unicode 空格 制表符 文本' },
];

const featured = tools.filter((tool) => tool.featured);
const defaultJson = '{"name":"ByeTools","tools":["JSON","Base64","JWT"],"offline":true}';
const storage = window.ByeToolsStorage;

const state = {
  activeFilter: 'all',
  activeView: 'home',
  query: '',
  environment: 'all',
  sort: 'default',
  currentTool: null,
  favorites: new Set(),
  history: [],
  messageQueue: {
    configs: [],
  },
  json: {
    draft: defaultJson,
    value: null,
    valid: false,
    error: null,
    selectedPath: [],
    expanded: new Set(['[]', '["tools"]']),
    outputView: 'tree',
    layout: 'side',
    sort: 'default',
    jsonLint: true,
    autoDecode: true,
    nodeEdit: true,
    nestedParse: false,
    extracted: null,
    elapsed: 0,
  },
};

let storageHydrated = false;

async function hydratePersistedState() {
  if (!storage) return;
  try {
    await storage.ready;
    const [favorites, recentTools, themeMode, menuLayout, density, jsonDraft, messageQueueConfigs] = await Promise.all([
      storage.getFavorites(),
      storage.getRecentTools(),
      storage.getSetting('theme-mode', 'dark'),
      storage.getSetting('menu-layout', 'standard'),
      storage.getSetting('density', 'comfortable'),
      storage.getDraft('json'),
      storage.getSetting('mq-configs', []),
    ]);
    state.favorites = new Set(Array.isArray(favorites) ? favorites : []);
    state.history = Array.isArray(recentTools) ? recentTools.filter((id) => tools.some((tool) => tool.id === id)) : [];
    state.messageQueue.configs = Array.isArray(messageQueueConfigs) ? messageQueueConfigs.filter((item) => item && typeof item === 'object' && item.id && item.name) : [];
    const draftPayload = jsonDraft?.payload && typeof jsonDraft.payload === 'object' ? jsonDraft.payload : {};
    if (typeof draftPayload.draft === 'string' && draftPayload.draft) state.json.draft = draftPayload.draft;
    if (Array.isArray(draftPayload.expanded)) state.json.expanded = new Set(draftPayload.expanded);
    state.json.layout = ['side', 'stack'].includes(await storage.getSetting('json-layout', 'side')) ? await storage.getSetting('json-layout', 'side') : 'side';
    state.json.sort = ['default', 'asc', 'desc'].includes(await storage.getSetting('json-sort', 'default')) ? await storage.getSetting('json-sort', 'default') : 'default';
    state.json.jsonLint = (await storage.getSetting('json-lint', true)) !== false;
    state.json.autoDecode = (await storage.getSetting('json-auto-decode', true)) !== false;
    state.json.nodeEdit = (await storage.getSetting('json-node-edit', true)) !== false;
    state.json.nestedParse = (await storage.getSetting('json-nested', false)) === true;
    applyTheme(themeMode, { persist: false });
    applyMenuLayout(menuLayout, { persist: false });
    applyDensity(density, { persist: false });
    storageHydrated = true;
    renderFeatured();
    renderTools();
  } catch (error) {
    showToast(`本地数据读取失败：${error.message}`);
  }
}

let activeWorkspaceCleanup = null;
const CONFIG_STORAGE_KEY = 'byetools-crypto-configs-v1';
const CONFIG_SECRET_KEY = 'byetools-crypto-config-secret-v1';
const CONFIG_CRYPTO_VERSION = 1;
let pendingCryptoConfigEditId = '';
const configTextFieldIds = new Set([
  'crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-iv', 'regex-pattern', 'color-input', 'palette-base',
  'password-custom-symbols', 'string-custom-symbols', 'replace-search',
  'replace-with', 'line-filter-regex', 'cron-expression',
]);

const refs = {
  root: document.documentElement,
  home: document.querySelector('#home-view'),
  workspace: document.querySelector('#tool-workspace'),
  utility: document.querySelector('#utility-view'),
  sidebar: document.querySelector('#sidebar'),
  settingsPopover: document.querySelector('#settings-popover'),
  toolGrid: document.querySelector('#tool-grid'),
  featuredGrid: document.querySelector('#featured-grid'),
  empty: document.querySelector('#empty-state'),
  summary: document.querySelector('#result-summary'),
  globalSearch: document.querySelector('#global-search'),
  filterPanel: document.querySelector('#filter-panel'),
  palette: document.querySelector('#command-palette'),
  paletteInput: document.querySelector('#palette-input'),
  paletteResults: document.querySelector('#palette-results'),
  toast: document.querySelector('#toast'),
};

const regexPresets = [
  { id: 'email', label: '邮箱地址', pattern: '^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$', description: '匹配常见邮箱格式' },
  { id: 'url', label: '网址 URL', pattern: 'https?://[^\\s]+', description: '匹配 HTTP 或 HTTPS 地址' },
  { id: 'phone', label: '中国手机号', pattern: '^1[3-9]\\d{9}$', description: '匹配 11 位手机号码' },
  { id: 'ipv4', label: 'IPv4 地址', pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$', description: '匹配标准 IPv4 地址' },
  { id: 'date', label: '日期格式', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: '匹配 YYYY-MM-DD 日期' },
  { id: 'digits', label: '纯数字', pattern: '^\\d+$', description: '只允许输入数字' },
  { id: 'integer', label: '整数', pattern: '^-?\\d+$', description: '匹配正负整数' },
  { id: 'chinese', label: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', description: '匹配连续中文字符' },
  { id: 'whitespace', label: '连续空白', pattern: '\\s+', description: '匹配空格、制表符或换行' },
  { id: 'username', label: '用户名', pattern: '^[a-zA-Z][a-zA-Z0-9_]{2,15}$', description: '字母开头的 3-16 位用户名' },
];

const regexSyntax = [
  { token: '.', label: '任意字符', description: '匹配除换行外的任意单个字符' },
  { token: '\\d', label: '数字', description: '匹配一个数字字符' },
  { token: '\\w', label: '单词字符', description: '匹配字母、数字或下划线' },
  { token: '\\s', label: '空白字符', description: '匹配空格、制表符或换行' },
  { token: '^', label: '开头', description: '匹配字符串或行的开始位置' },
  { token: '$', label: '结尾', description: '匹配字符串或行的结束位置' },
  { token: '*', label: '零次或多次', description: '前一个表达式可重复零次以上' },
  { token: '+', label: '一次或多次', description: '前一个表达式至少出现一次' },
  { token: '?', label: '零次或一次', description: '前一个表达式最多出现一次' },
  { token: '{n,m}', label: '重复次数', description: '限定前一个表达式重复 n 到 m 次' },
  { token: '[abc]', label: '字符集合', description: '匹配集合中的任意一个字符' },
  { token: '[^abc]', label: '排除集合', description: '匹配不在集合中的任意字符' },
  { token: '(abc)', label: '捕获分组', description: '将多个表达式组合并捕获结果' },
  { token: '(?:abc)', label: '非捕获分组', description: '组合表达式但不保存捕获结果' },
  { token: 'a|b', label: '或条件', description: '匹配 a 或 b 其中任意一个' },
];

const regexHelperMarkup = () => `<section class="regex-helper-panel" aria-label="正则表达式辅助信息">
  <details class="regex-helper-section">
    <summary class="regex-helper-head"><div><strong>常用正则表达式</strong><small>点击模板即可填入上方输入框</small></div><span class="code-badge">PRESETS</span></summary>
    <div class="regex-preset-grid">${regexPresets.map((preset) => `<button class="regex-preset" type="button" data-regex-preset="${preset.id}" aria-pressed="false"><span>${escapeHtml(preset.label)}</span><small>${escapeHtml(preset.description)}</small></button>`).join('')}</div>
  </details>
  <details class="regex-helper-section">
    <summary class="regex-helper-head"><div><strong>核心语法速查</strong><small>JavaScript 正则表达式语法</small></div><span class="code-badge">SYNTAX</span></summary>
    <div class="regex-syntax-grid">${regexSyntax.map((item) => `<div class="regex-syntax-item"><code>${escapeHtml(item.token)}</code><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></div></div>`).join('')}</div>
  </details>
</section>`;

const workspaceTemplates = {
  json: () => `<div class="json-workbench" id="json-workbench">
    <div class="json-toolbar" role="toolbar" aria-label="JSON 工具栏">
      <div class="json-toolbar-group json-toolbar-main">
        <button class="json-command is-primary" type="button" data-json-action="format">格式化</button>
        <button class="json-command" type="button" data-json-action="minify">压缩</button>
      </div>
      <div class="json-toolbar-group json-layout-toggle" role="group" aria-label="布局方向">
        <button class="json-command ${state.json.layout === 'side' ? 'is-active' : ''}" type="button" data-json-action="layout" data-layout="side">左右</button>
        <button class="json-command ${state.json.layout === 'stack' ? 'is-active' : ''}" type="button" data-json-action="layout" data-layout="stack">上下</button>
      </div>
      <label class="json-sort-control">排序<select id="json-sort-select" aria-label="JSON 排序"><option value="default" ${state.json.sort === 'default' ? 'selected' : ''}>默认</option><option value="asc" ${state.json.sort === 'asc' ? 'selected' : ''}>键名升序</option><option value="desc" ${state.json.sort === 'desc' ? 'selected' : ''}>键名降序</option></select></label>
      <div class="json-toolbar-group json-toggle-group">
        ${jsonToggleMarkup('jsonLint', 'JSONLint')}
        ${jsonToggleMarkup('autoDecode', '自动解码')}
        ${jsonToggleMarkup('nodeEdit', '节点编辑')}
        ${jsonToggleMarkup('nestedParse', '嵌套解析')}
      </div>
      <div class="json-toolbar-group json-encoding-group">
        <button class="json-command" type="button" data-json-action="unicode-encode">Uni 编码</button>
        <button class="json-command" type="button" data-json-action="unicode-decode">Uni 解码</button>
        <button class="json-command" type="button" data-json-action="url-decode">URL 解码</button>
      </div>
    </div>
    <div class="json-status-strip" id="json-status-strip"><span class="json-status-dot"></span><span id="json-status-text">正在校验输入</span><span class="json-status-meta" id="json-status-meta">本地解析 · 原始内容不会上传</span></div>
    <div class="json-layout ${state.json.layout === 'stack' ? 'is-stack' : ''}" id="json-layout">
      <section class="json-pane json-editor-pane" aria-label="JSON 输入区">
        <div class="json-pane-head"><div><strong>输入</strong><small>实时校验 · 支持行号定位</small></div><span class="json-pane-badge">UTF-8</span></div>
        <div class="json-editor-shell" id="json-editor-shell">
          <div class="json-line-numbers" id="json-line-numbers" aria-hidden="true"></div>
          <div class="json-editor-stage">
            <pre class="json-highlight" id="json-highlight" aria-hidden="true"></pre>
            <textarea class="json-input" id="json-input" spellcheck="false" wrap="off" aria-label="JSON 输入">${escapeHtml(state.json.draft)}</textarea>
          </div>
        </div>
        <div class="json-error" id="json-error" hidden></div>
        <div class="json-pane-foot"><span>输入变化后自动解析</span><button class="text-button" type="button" data-json-action="clear-input">清空</button></div>
      </section>
      <section class="json-pane json-result-pane" aria-label="JSON 解析结果">
        <div class="json-pane-head json-result-head"><div><strong>解析结果</strong><small id="json-result-caption">JSON 树视图</small></div><div class="json-result-actions">
          <button type="button" data-json-action="tree">树视图</button><button type="button" data-json-action="extract">提取</button><button type="button" data-json-action="table">表格</button><button type="button" data-json-action="metadata">元数据</button><button type="button" data-json-action="collapse">折叠</button><button type="button" data-json-action="copy">复制</button><button type="button" data-json-action="download">下载</button>
        </div></div>
        <div class="json-result-body" id="json-result-body"></div>
        <div class="json-extract-panel" id="json-extract-panel" hidden></div>
      </section>
    </div>
  </div>`,
  'json-to-types': jsonTypesWorkbenchMarkup,
  base64: () => `<div class="workspace-toolbar"><button class="primary-button" data-tool-action="base64-encode">编码</button><button class="secondary-button" data-tool-action="base64-decode">解码</button><button class="secondary-button" data-tool-action="copy-output">复制结果</button></div><div class="tool-panel"><div class="workspace-card"><div class="workspace-card-head"><span>输入</span><span>UTF-8</span></div><textarea id="tool-input" spellcheck="false" placeholder="输入要编码或解码的文本…">ByeTools 本地优先</textarea></div><div class="workspace-card"><div class="workspace-card-head"><span>输出</span><span id="tool-status">等待处理</span></div><pre id="tool-output" aria-live="polite"></pre></div></div>`,
  url: () => `<div class="workspace-toolbar"><button class="primary-button" data-tool-action="url-encode">编码</button><button class="secondary-button" data-tool-action="url-decode">解码</button><button class="secondary-button" data-tool-action="copy-output">复制结果</button></div><div class="tool-panel"><div class="workspace-card"><div class="workspace-card-head"><span>输入</span><span>URL Component</span></div><textarea id="tool-input" spellcheck="false" placeholder="输入 URL 或文本…">https://byetools.local/search?q=开发工具</textarea></div><div class="workspace-card"><div class="workspace-card-head"><span>输出</span><span id="tool-status">等待处理</span></div><pre id="tool-output" aria-live="polite"></pre></div></div>`,
  unicode: () => `<div class="workspace-toolbar"><button class="primary-button" data-tool-action="unicode-encode">Unicode 编码</button><button class="secondary-button" data-tool-action="unicode-decode">Unicode 解码</button><button class="secondary-button" data-tool-action="copy-output">复制结果</button></div><div class="tool-panel"><div class="workspace-card"><div class="workspace-card-head"><span>输入内容</span><span>UTF-8 / \\uXXXX</span></div><textarea id="tool-input" spellcheck="false" placeholder="输入文本或 Unicode 转义序列…">ByeTools 开发者工具箱</textarea></div><div class="workspace-card"><div class="workspace-card-head"><span>转换结果</span><span id="tool-status">等待处理</span></div><pre id="tool-output" aria-live="polite"></pre></div></div>`,
  time: timeWorkbenchMarkup,
  color: colorWorkbenchMarkup,
  gradient: gradientWorkbenchMarkup,
  shadow: shadowWorkbenchMarkup,
  contrast: contrastWorkbenchMarkup,
  palette: paletteWorkbenchMarkup,
  'px-rem': pxRemWorkbenchMarkup,
  jwt: jwtWorkbenchMarkup,
  timezone: timezoneWorkbenchMarkup,
  'date-calculator': dateCalculatorWorkbenchMarkup,
  'world-clock': worldClockWorkbenchMarkup,
  'text-counter': textCounterWorkbenchMarkup,
  'case-converter': caseConverterWorkbenchMarkup,
  'text-replace': textReplaceWorkbenchMarkup,
  'text-cleaner': textCleanerWorkbenchMarkup,
  'line-tools': lineToolsWorkbenchMarkup,
  invisible: invisibleWorkbenchMarkup,
  regex: () => `<div class="tool-panel regex-tool-panel"><section class="workspace-card regex-input-card"><div class="workspace-card-head"><div><strong>正则表达式</strong><small>输入表达式后实时匹配</small></div><span class="code-badge">REGEX</span></div><textarea class="regex-pattern-input" id="regex-pattern" spellcheck="false" placeholder="输入正则表达式…">(ByeTools)</textarea><div class="workspace-card-head"><div><strong>测试文本</strong><small>输入待匹配的文本内容</small></div><span>UTF-8</span></div><textarea class="regex-test-input" id="tool-input" spellcheck="false" placeholder="输入测试文本…">欢迎使用 ByeTools 开发者工具箱</textarea>${regexHelperMarkup()}</section><section class="workspace-card regex-result-card"><div class="workspace-card-head"><div><strong>匹配结果</strong><small>根据输入实时更新</small></div><span id="tool-status">实时计算</span></div><pre id="tool-output" aria-live="polite"></pre></section></div>`,
  hash: () => `<div class="workspace-form"><label>输入文本<textarea id="tool-input" style="min-height:180px" spellcheck="false" placeholder="输入要计算 Hash 的文本…">ByeTools</textarea></label><div class="workspace-toolbar"><button class="primary-button" data-tool-action="hash">计算 Hash</button><button class="secondary-button" data-tool-action="copy-output">复制结果</button></div><div class="workspace-result" id="hash-result"></div></div>`,
  random: randomWorkbenchMarkup,
  password: passwordWorkbenchMarkup,
  'uuid-generator': uuidGeneratorWorkbenchMarkup,
  'string-generator': randomStringWorkbenchMarkup,
  slug: slugWorkbenchMarkup,
  'fake-data': fakeDataWorkbenchMarkup,
  ip: ipWorkbenchMarkup,
  curl: curlWorkbenchMarkup,
  html: htmlWorkbenchMarkup,
  mermaid: mermaidWorkbenchMarkup,
  'xml-format': xmlFormatWorkbenchMarkup,
  'xml-converter': xmlConverterWorkbenchMarkup,
  'sql-format': sqlFormatWorkbenchMarkup,
  'markdown-image': markdownImageWorkbenchMarkup,
  'markdown-editor': markdownEditorWorkbenchMarkup,
  mindmap: mindmapWorkbenchMarkup,
  'image-tools': imageToolsWorkbenchMarkup,
  'qr-barcode': qrBarcodeWorkbenchMarkup,
  favicon: faviconWorkbenchMarkup,
  'pdf-tools': pdfToolsWorkbenchMarkup,
  'message-queue': messageQueueWorkbenchMarkup,
  'linux-commands': linuxCommandWorkbenchMarkup,
  diff: diffWorkbenchMarkup,
  cron: cronWorkbenchMarkup,
  md5: (tool) => cryptoWorkbenchMarkup(tool),
  sha2: (tool) => cryptoWorkbenchMarkup(tool),
  sha3: (tool) => cryptoWorkbenchMarkup(tool),
  sm2: (tool) => cryptoWorkbenchMarkup(tool),
  sm3: (tool) => cryptoWorkbenchMarkup(tool),
  sm4: (tool) => cryptoWorkbenchMarkup(tool),
  aes: (tool) => cryptoWorkbenchMarkup(tool),
  des: (tool) => cryptoWorkbenchMarkup(tool),
  '3des': (tool) => cryptoWorkbenchMarkup(tool),
  rsa: (tool) => cryptoWorkbenchMarkup(tool),
  default: (tool) => `<div class="workspace-notice">${tool.name} 当前仅提供能力入口，所需运行能力尚未接入。</div>`,
};

const jsonTypeLanguages = [
  { value: 'java', label: 'Java', icon: 'JV', description: '类、字段与 JSON 绑定', extension: 'java' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS', description: '接口、类型与联合类型', extension: 'ts' },
  { value: 'typescript-zod', label: 'TypeScript + Zod', icon: 'TZ', description: '类型与运行时校验 Schema', extension: 'ts' },
  { value: 'go', label: 'Go', icon: 'GO', description: '结构体与 JSON 标签', extension: 'go' },
  { value: 'rust', label: 'Rust', icon: 'RS', description: 'Serde 结构体与枚举', extension: 'rs' },
  { value: 'swift', label: 'Swift', icon: 'SW', description: 'Codable 结构体', extension: 'swift' },
  { value: 'kotlin', label: 'Kotlin', icon: 'KT', description: 'data class 与可空类型', extension: 'kt' },
  { value: 'python', label: 'Python', icon: 'PY', description: '类型注解与数据类', extension: 'py' },
  { value: 'csharp', label: 'C#', icon: 'C#', description: '.NET 类型与 JSON 特性', extension: 'cs' },
  { value: 'cplusplus', label: 'C++', icon: 'C+', description: '结构体与 JSON 转换', extension: 'cpp' },
  { value: 'javascript', label: 'JavaScript', icon: 'JS', description: '转换函数与运行时类型', extension: 'js' },
  { value: 'javascript-prop-types', label: 'JavaScript PropTypes', icon: 'PT', description: 'React PropTypes 声明', extension: 'js' },
  { value: 'flow', label: 'Flow', icon: 'FL', description: 'Flow 静态类型声明', extension: 'js' },
  { value: 'objective-c', label: 'Objective-C', icon: 'OC', description: '原生模型类', extension: 'm' },
  { value: 'dart', label: 'Dart', icon: 'DA', description: 'Flutter 数据模型', extension: 'dart' },
  { value: 'ruby', label: 'Ruby', icon: 'RB', description: 'Ruby 类型与转换方法', extension: 'rb' },
  { value: 'php', label: 'PHP', icon: 'PH', description: 'PHP 类与转换方法', extension: 'php' },
  { value: 'scala3', label: 'Scala 3', icon: 'SC', description: 'case class 类型模型', extension: 'scala' },
  { value: 'haskell', label: 'Haskell', icon: 'HS', description: '记录与 Aeson 实例', extension: 'hs' },
  { value: 'elm', label: 'Elm', icon: 'EL', description: '类型别名与解码器', extension: 'elm' },
  { value: 'crystal', label: 'Crystal', icon: 'CR', description: 'Crystal 类型模型', extension: 'cr' },
  { value: 'elixir', label: 'Elixir', icon: 'EX', description: '模块与结构体', extension: 'ex' },
  { value: 'cjson', label: 'C (cJSON)', icon: 'C', description: 'C 结构体与 cJSON', extension: 'h' },
  { value: 'json-schema', label: 'JSON Schema', icon: 'JS', description: 'Draft Schema 结构定义', extension: 'schema.json' },
];

const jsonTypesExample = `{
  "id": 1042,
  "name": "ByeTools",
  "active": true,
  "score": 4.8,
  "tags": ["json", "types", "codegen"],
  "owner": {
    "login": "developer",
    "verified": false
  },
  "createdAt": "2026-09-13T10:00:00Z"
}`;

let jsonTypesEditorRuntimePromise = null;

function getJsonTypeLanguage(value) {
  return jsonTypeLanguages.find((language) => language.value === value) || jsonTypeLanguages[0];
}

function jsonTypeLanguageOptionsMarkup(selected = 'java') {
  return jsonTypeLanguages.map((language) => `<option value="${language.value}" data-icon="${language.icon}" data-label="${language.label}" data-description="${language.description}" ${language.value === selected ? 'selected' : ''}>${language.label}</option>`).join('');
}

function jsonTypesSpecificOptionsMarkup(language) {
  if (language === 'java') return `<label class="json-types-field"><span>包名</span><input id="json-types-package" data-json-types-option type="text" value="io.byetools" spellcheck="false" /></label><label class="json-types-field"><span>数组类型</span><select id="json-types-array-type" data-json-types-option><option value="array">数组 T[]</option><option value="list" selected>List&lt;T&gt;</option></select></label><label class="json-types-field"><span>日期类型</span><select id="json-types-datetime-provider" data-json-types-option><option value="java8" selected>Java 8 Time</option><option value="legacy">Date / Calendar</option></select></label><label class="json-types-field"><span>缩略词风格</span><select id="json-types-acronym-style" data-json-types-option><option value="pascal" selected>Pascal</option><option value="camel">camel</option><option value="original">保持原样</option><option value="lowerCase">小写</option></select></label><label class="json-types-check"><input id="json-types-lombok" data-json-types-option type="checkbox" /><span>Lombok</span></label>`;
  if (language === 'go') return `<label class="json-types-field"><span>包名</span><input id="json-types-package" data-json-types-option type="text" value="main" spellcheck="false" /></label><label class="json-types-field"><span>字段标签</span><input id="json-types-field-tags" data-json-types-option type="text" value="json" spellcheck="false" /></label><label class="json-types-check"><input id="json-types-omit-empty" data-json-types-option type="checkbox" /><span>omitempty</span></label>`;
  if (language === 'rust') return `<label class="json-types-field"><span>字段可见性</span><select id="json-types-visibility" data-json-types-option><option value="public" selected>public</option><option value="crate">crate</option><option value="private">private</option></select></label><label class="json-types-check"><input id="json-types-derive-debug" data-json-types-option type="checkbox" checked /><span>Debug</span></label><label class="json-types-check"><input id="json-types-derive-clone" data-json-types-option type="checkbox" checked /><span>Clone</span></label><label class="json-types-check"><input id="json-types-derive-partial" data-json-types-option type="checkbox" /><span>PartialEq</span></label>`;
  if (language === 'swift') return `<label class="json-types-field"><span>访问级别</span><select id="json-types-access-level" data-json-types-option><option value="internal" selected>internal</option><option value="public">public</option></select></label><label class="json-types-field"><span>类型形式</span><select id="json-types-struct-class" data-json-types-option><option value="struct" selected>struct</option><option value="class">class</option></select></label><label class="json-types-check"><input id="json-types-mutable" data-json-types-option type="checkbox" /><span>可变属性</span></label><label class="json-types-check"><input id="json-types-sendable" data-json-types-option type="checkbox" /><span>Sendable</span></label>`;
  if (language === 'kotlin') return `<label class="json-types-field"><span>包名</span><input id="json-types-package" data-json-types-option type="text" value="io.byetools" spellcheck="false" /></label><label class="json-types-field"><span>JSON 框架</span><select id="json-types-kotlin-framework" data-json-types-option><option value="jackson" selected>Jackson</option><option value="kotlinx">kotlinx.serialization</option><option value="klaxon">Klaxon</option></select></label>`;
  if (language === 'csharp') return `<label class="json-types-field"><span>命名空间</span><input id="json-types-namespace" data-json-types-option type="text" value="ByeTools.Models" spellcheck="false" /></label><label class="json-types-field"><span>JSON 框架</span><select id="json-types-csharp-framework" data-json-types-option><option value="SystemTextJson" selected>System.Text.Json</option><option value="NewtonSoft">Newtonsoft.Json</option></select></label><label class="json-types-field"><span>集合类型</span><select id="json-types-array-type" data-json-types-option><option value="array" selected>数组 T[]</option><option value="list">List&lt;T&gt;</option></select></label>`;
  if (['typescript', 'flow'].includes(language)) return `<label class="json-types-check"><input id="json-types-prefer-types" data-json-types-option type="checkbox" /><span>优先 type</span></label><label class="json-types-check"><input id="json-types-readonly" data-json-types-option type="checkbox" /><span>readonly</span></label><label class="json-types-check"><input id="json-types-nice-names" data-json-types-option type="checkbox" /><span>规范字段名</span></label>`;
  if (language === 'python') return `<label class="json-types-field"><span>Python 版本</span><select id="json-types-python-version" data-json-types-option><option value="3.10" selected>Python 3.10+</option><option value="3.9">Python 3.9</option><option value="3.7">Python 3.7</option><option value="3.6">Python 3.6</option></select></label><label class="json-types-check"><input id="json-types-pydantic" data-json-types-option type="checkbox" /><span>Pydantic BaseModel</span></label>`;
  if (language === 'cplusplus') return `<label class="json-types-field"><span>命名空间</span><input id="json-types-namespace" data-json-types-option type="text" value="byetools" spellcheck="false" /></label>`;
  return '<span class="json-types-options-empty">当前语言使用通用推断选项</span>';
}

function jsonTypesWorkbenchMarkup() {
  return `<div class="json-types-workbench" id="json-types-workbench">
    <div class="json-types-toolbar">
      <div class="json-types-toolbar-copy"><span class="toolbar-label">类型生成</span><span class="json-types-local-badge"><i></i>浏览器本地运行</span></div>
      <div class="json-types-toolbar-actions"><button class="secondary-button" type="button" data-json-types-action="clear">⌫ 清空</button><button class="secondary-button" type="button" data-json-types-action="copy" disabled>▣ 复制</button><button class="secondary-button" type="button" data-json-types-action="download" disabled>↓ 下载</button><button class="secondary-button" type="button" data-json-types-action="fullscreen" title="进入全屏"><span aria-hidden="true">↗</span> 全屏</button></div>
    </div>
    <div class="json-types-editor-layout">
      <section class="json-types-pane" aria-label="JSON 输入区"><div class="json-types-pane-head"><div><span class="json-types-pane-dot is-input"></span><strong>JSON 输入</strong></div><div class="json-types-pane-tools"><label title="输入自动换行"><input id="json-types-input-wrap" type="checkbox" checked /><span>↵</span></label><span id="json-types-input-count">0 字符</span></div></div><div class="json-types-editor-host is-loading" id="json-types-input" aria-label="JSON 输入代码编辑器"><span>正在加载编辑器</span></div></section>
      <section class="json-types-pane" aria-label="类型输出区"><div class="json-types-pane-head"><div><span class="json-types-pane-dot is-output"></span><strong>生成的类型</strong></div><div class="json-types-pane-tools"><label title="输出自动换行"><input id="json-types-output-wrap" type="checkbox" /><span>↵</span></label><span class="json-types-language-badge" id="json-types-language-badge">Java</span></div></div><div class="json-types-editor-host is-loading" id="json-types-output" aria-label="生成类型代码编辑器"><span>正在加载生成引擎</span></div></section>
    </div>
    <div class="json-types-settings">
      <div class="json-types-settings-primary"><label class="json-types-field json-types-language-field"><span>语言</span><select id="json-types-language" aria-label="目标语言">${jsonTypeLanguageOptionsMarkup()}</select></label><label class="json-types-field json-types-root-field"><span>根类型名</span><input id="json-types-root" type="text" value="Root" maxlength="64" spellcheck="false" /></label><label class="json-types-check is-emphasis"><input id="json-types-just-types" type="checkbox" checked /><span>仅类型</span></label><button class="json-types-options-toggle" type="button" data-json-types-action="toggle-options" aria-expanded="true">☷ 选项 <span>⌃</span></button></div>
      <div class="json-types-options" id="json-types-options"><div class="json-types-inference"><span>推断</span><label class="json-types-check"><input id="json-types-infer-dates" type="checkbox" checked /><span>日期时间</span></label><label class="json-types-check"><input id="json-types-infer-maps" type="checkbox" checked /><span>字典</span></label><label class="json-types-check"><input id="json-types-infer-enums" type="checkbox" checked /><span>枚举</span></label><label class="json-types-check"><input id="json-types-all-optional" type="checkbox" /><span>全部可选</span></label><label class="json-types-check"><input id="json-types-sort-fields" type="checkbox" /><span>字段排序</span></label></div><div class="json-types-specific-options" id="json-types-specific-options">${jsonTypesSpecificOptionsMarkup('java')}</div></div>
    </div>
    <div class="json-types-statusbar"><span id="json-types-status"><i></i>正在加载类型引擎</span><span id="json-types-output-meta">等待生成</span></div>
    <div class="json-types-quick-actions"><span>快捷操作</span><input class="file-native-input" id="json-types-file-input" type="file" accept=".json,application/json,text/json" /><label class="secondary-button" for="json-types-file-input">↥ 打开文件</label><button class="secondary-button" type="button" data-json-types-action="sample">载入示例</button></div>
  </div>`;
}

function loadJsonTypesEditorRuntime() {
  if (!jsonTypesEditorRuntimePromise) {
    jsonTypesEditorRuntimePromise = Promise.all([
      import('codemirror'),
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/language'),
      import('@codemirror/lang-json'),
      import('@codemirror/lang-javascript'),
      import('@codemirror/lang-java'),
      import('@codemirror/lang-python'),
      import('@codemirror/lang-rust'),
      import('@codemirror/lang-cpp'),
      import('@codemirror/legacy-modes/mode/clike'),
      import('@codemirror/legacy-modes/mode/go'),
      import('@codemirror/legacy-modes/mode/crystal'),
      import('@codemirror/legacy-modes/mode/elm'),
      import('@codemirror/legacy-modes/mode/haskell'),
      import('@codemirror/legacy-modes/mode/ruby'),
      import('@codemirror/legacy-modes/mode/swift'),
    ]).then(([codemirror, stateModule, viewModule, languageModule, jsonModule, javascriptModule, javaModule, pythonModule, rustModule, cppModule, clikeModule, goModule, crystalModule, elmModule, haskellModule, rubyModule, swiftModule]) => ({ codemirror, stateModule, viewModule, languageModule, jsonModule, javascriptModule, javaModule, pythonModule, rustModule, cppModule, clikeModule, goModule, crystalModule, elmModule, haskellModule, rubyModule, swiftModule }));
  }
  return jsonTypesEditorRuntimePromise;
}

function jsonTypesLanguageSupport(runtime, language) {
  const { StreamLanguage } = runtime.languageModule;
  if (language === 'json-schema') return runtime.jsonModule.json();
  if (['typescript', 'typescript-zod'].includes(language)) return runtime.javascriptModule.javascript({ typescript: true });
  if (['javascript', 'javascript-prop-types', 'flow'].includes(language)) return runtime.javascriptModule.javascript();
  if (language === 'java') return runtime.javaModule.java();
  if (language === 'python') return runtime.pythonModule.python();
  if (language === 'rust') return runtime.rustModule.rust();
  if (language === 'cplusplus') return runtime.cppModule.cpp();
  const legacyModes = {
    cjson: runtime.clikeModule.c,
    csharp: runtime.clikeModule.csharp,
    dart: runtime.clikeModule.dart,
    kotlin: runtime.clikeModule.kotlin,
    'objective-c': runtime.clikeModule.objectiveC,
    php: runtime.clikeModule.c,
    scala3: runtime.clikeModule.scala,
    go: runtime.goModule.go,
    crystal: runtime.crystalModule.crystal,
    elm: runtime.elmModule.elm,
    haskell: runtime.haskellModule.haskell,
    ruby: runtime.rubyModule.ruby,
    elixir: runtime.rubyModule.ruby,
    swift: runtime.swiftModule.swift,
  };
  return legacyModes[language] ? StreamLanguage.define(legacyModes[language]) : [];
}

async function bindJsonTypesWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.querySelector('#json-types-workbench');
  const inputHost = content.querySelector('#json-types-input');
  const outputHost = content.querySelector('#json-types-output');
  const languageSelect = content.querySelector('#json-types-language');
  const languageBadge = content.querySelector('#json-types-language-badge');
  const rootInput = content.querySelector('#json-types-root');
  const optionsPanel = content.querySelector('#json-types-options');
  const specificOptions = content.querySelector('#json-types-specific-options');
  const status = content.querySelector('#json-types-status');
  const outputMeta = content.querySelector('#json-types-output-meta');
  const copyButton = content.querySelector('[data-json-types-action="copy"]');
  const downloadButton = content.querySelector('[data-json-types-action="download"]');
  const fullscreenButton = content.querySelector('[data-json-types-action="fullscreen"]');
  const fileInput = content.querySelector('#json-types-file-input');
  const originalBodyOverflow = document.body.style.overflow;
  let disposed = false;
  let inputView = null;
  let outputView = null;
  let worker = null;
  let generationTimer = 0;
  let persistTimer = 0;
  let requestId = 0;
  let latestRequestId = 0;
  let outputCode = '';
  let suppressInputUpdate = false;
  let currentLanguage = languageSelect.value;
  const specificValues = {};

  const cleanup = () => {
    disposed = true;
    clearTimeout(generationTimer);
    clearTimeout(persistTimer);
    worker?.terminate();
    inputView?.destroy();
    outputView?.destroy();
    document.removeEventListener('keydown', onDocumentKeydown);
    document.body.style.overflow = originalBodyOverflow;
  };
  activeWorkspaceCleanup = cleanup;

  const renderStatus = (message, tone = '') => {
    status.className = tone ? `is-${tone}` : '';
    status.innerHTML = `<i></i>${escapeHtml(message)}`;
  };

  const fieldValue = (id, fallback = '') => {
    const field = content.querySelector(`#${id}`);
    if (!field) return fallback;
    return field.type === 'checkbox' ? field.checked : field.value;
  };

  const collectRendererOptions = () => {
    const options = { 'just-types': Boolean(fieldValue('json-types-just-types')) };
    if (currentLanguage === 'java') Object.assign(options, { package: fieldValue('json-types-package', 'io.byetools'), 'array-type': fieldValue('json-types-array-type', 'list'), 'datetime-provider': fieldValue('json-types-datetime-provider', 'java8'), 'acronym-style': fieldValue('json-types-acronym-style', 'pascal'), lombok: Boolean(fieldValue('json-types-lombok')) });
    if (currentLanguage === 'go') Object.assign(options, { package: fieldValue('json-types-package', 'main'), 'field-tags': fieldValue('json-types-field-tags', 'json'), 'omit-empty': Boolean(fieldValue('json-types-omit-empty')) });
    if (currentLanguage === 'rust') Object.assign(options, { visibility: fieldValue('json-types-visibility', 'public'), 'derive-debug': Boolean(fieldValue('json-types-derive-debug')), 'derive-clone': Boolean(fieldValue('json-types-derive-clone')), 'derive-partial-eq': Boolean(fieldValue('json-types-derive-partial')) });
    if (currentLanguage === 'swift') Object.assign(options, { 'access-level': fieldValue('json-types-access-level', 'internal'), 'struct-or-class': fieldValue('json-types-struct-class', 'struct'), 'mutable-properties': Boolean(fieldValue('json-types-mutable')), sendable: Boolean(fieldValue('json-types-sendable')) });
    if (currentLanguage === 'kotlin') Object.assign(options, { package: fieldValue('json-types-package', 'io.byetools'), framework: fieldValue('json-types-kotlin-framework', 'jackson') });
    if (currentLanguage === 'csharp') Object.assign(options, { namespace: fieldValue('json-types-namespace', 'ByeTools.Models'), framework: fieldValue('json-types-csharp-framework', 'SystemTextJson'), 'array-type': fieldValue('json-types-array-type', 'array') });
    if (['typescript', 'flow'].includes(currentLanguage)) Object.assign(options, { 'prefer-types': Boolean(fieldValue('json-types-prefer-types')), readonly: Boolean(fieldValue('json-types-readonly')), 'nice-property-names': Boolean(fieldValue('json-types-nice-names')) });
    if (currentLanguage === 'python') Object.assign(options, { 'python-version': fieldValue('json-types-python-version', '3.10'), 'pydantic-base-model': Boolean(fieldValue('json-types-pydantic')) });
    if (currentLanguage === 'cplusplus') Object.assign(options, { namespace: fieldValue('json-types-namespace', 'byetools') });
    return options;
  };

  const collectSpecificValues = () => {
    const values = {};
    specificOptions.querySelectorAll('[data-json-types-option]').forEach((field) => { values[field.id] = field.type === 'checkbox' ? field.checked : field.value; });
    specificValues[currentLanguage] = values;
  };

  const applySpecificValues = () => {
    const values = specificValues[currentLanguage] || {};
    Object.entries(values).forEach(([id, value]) => {
      const field = content.querySelector(`#${id}`);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else field.value = value;
      if (field.tagName === 'SELECT') syncBtSelect(field);
    });
  };

  const persistState = () => {
    if (!storage || !inputView) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      collectSpecificValues();
      Promise.all([
        storage.setDraft('json-to-types', { draft: inputView.state.doc.toString() }),
        storage.setSetting('json-types-preferences', {
          language: currentLanguage,
          rootName: rootInput.value,
          justTypes: Boolean(fieldValue('json-types-just-types')),
          inferDates: Boolean(fieldValue('json-types-infer-dates')),
          inferMaps: Boolean(fieldValue('json-types-infer-maps')),
          inferEnums: Boolean(fieldValue('json-types-infer-enums')),
          allOptional: Boolean(fieldValue('json-types-all-optional')),
          sortFields: Boolean(fieldValue('json-types-sort-fields')),
          inputWrap: content.querySelector('#json-types-input-wrap').checked,
          outputWrap: content.querySelector('#json-types-output-wrap').checked,
          specificValues,
        }),
      ]).catch(() => {});
    }, 220);
  };

  const updateInputCount = () => {
    const value = inputView?.state.doc.toString() || '';
    content.querySelector('#json-types-input-count').textContent = `${value.length.toLocaleString('zh-CN')} 字符`;
  };

  const setEditorText = (view, value, suppress = false) => {
    if (!view) return;
    if (suppress) suppressInputUpdate = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    if (suppress) suppressInputUpdate = false;
  };

  const setOutput = (value) => {
    outputCode = value;
    setEditorText(outputView, value);
    copyButton.disabled = !value;
    downloadButton.disabled = !value;
    const lines = value ? value.split('\n').length : 0;
    outputMeta.textContent = value ? `${lines.toLocaleString('zh-CN')} 行 · ${value.length.toLocaleString('zh-CN')} 字符` : '等待生成';
  };

  const generationError = (message) => {
    setOutput('');
    renderStatus(message, 'error');
  };

  const generate = () => {
    if (!worker || !inputView) return;
    const id = ++requestId;
    latestRequestId = id;
    const json = inputView.state.doc.toString();
    updateInputCount();
    if (!json.trim()) { generationError('请输入 JSON 样本'); return; }
    try { JSON.parse(json); } catch (error) { generationError(`JSON 格式有误：${error.message}`); return; }
    const rootName = rootInput.value.trim();
    if (!rootName) { generationError('请输入根类型名'); return; }
    if (/[^\p{L}\p{N}_$\- ]/u.test(rootName)) { generationError('根类型名包含不支持的字符'); return; }
    renderStatus(`正在生成 ${getJsonTypeLanguage(currentLanguage).label} 类型`, 'running');
    worker.postMessage({
      id,
      json,
      language: currentLanguage,
      rootName,
      rendererOptions: collectRendererOptions(),
      inference: {
        inferDateTimes: Boolean(fieldValue('json-types-infer-dates')),
        inferMaps: Boolean(fieldValue('json-types-infer-maps')),
        inferEnums: Boolean(fieldValue('json-types-infer-enums')),
        inferUuids: true,
        inferIntegerStrings: false,
        inferBooleanStrings: false,
        allPropertiesOptional: Boolean(fieldValue('json-types-all-optional')),
        alphabetizeProperties: Boolean(fieldValue('json-types-sort-fields')),
      },
    });
    persistState();
  };

  const scheduleGeneration = () => {
    clearTimeout(generationTimer);
    generationTimer = setTimeout(generate, 260);
  };

  const renderSpecificOptions = () => {
    specificOptions.innerHTML = jsonTypesSpecificOptionsMarkup(currentLanguage);
    applySpecificValues();
    enhanceBtSelects(specificOptions);
  };

  const toggleFullscreen = (force) => {
    const enabled = typeof force === 'boolean' ? force : !workbench.classList.contains('is-fullscreen');
    workbench.classList.toggle('is-fullscreen', enabled);
    document.body.style.overflow = enabled ? 'hidden' : originalBodyOverflow;
    fullscreenButton.innerHTML = enabled ? '<span aria-hidden="true">↙</span> 退出全屏' : '<span aria-hidden="true">↗</span> 全屏';
    fullscreenButton.title = enabled ? '退出全屏' : '进入全屏';
  };

  function onDocumentKeydown(event) {
    if (event.key === 'Escape' && workbench.classList.contains('is-fullscreen')) toggleFullscreen(false);
    if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, .cm-editor, [contenteditable="true"]')) {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  try {
    const savedStatePromise = storage ? Promise.all([storage.getDraft('json-to-types'), storage.getSetting('json-types-preferences', {})]).catch(() => [null, {}]) : Promise.resolve([null, {}]);
    const [runtime, savedState] = await Promise.all([loadJsonTypesEditorRuntime(), savedStatePromise]);
    if (disposed || !document.body.contains(workbench)) return;
    const [savedDraft, savedPreferences] = savedState;
    if (savedPreferences?.language && jsonTypeLanguages.some((language) => language.value === savedPreferences.language)) languageSelect.value = savedPreferences.language;
    currentLanguage = languageSelect.value;
    rootInput.value = savedPreferences?.rootName || rootInput.value;
    const preferenceFields = {
      'json-types-just-types': savedPreferences?.justTypes,
      'json-types-infer-dates': savedPreferences?.inferDates,
      'json-types-infer-maps': savedPreferences?.inferMaps,
      'json-types-infer-enums': savedPreferences?.inferEnums,
      'json-types-all-optional': savedPreferences?.allOptional,
      'json-types-sort-fields': savedPreferences?.sortFields,
      'json-types-input-wrap': savedPreferences?.inputWrap,
      'json-types-output-wrap': savedPreferences?.outputWrap,
    };
    Object.entries(preferenceFields).forEach(([id, value]) => { if (typeof value === 'boolean') content.querySelector(`#${id}`).checked = value; });
    Object.assign(specificValues, savedPreferences?.specificValues || {});
    syncBtSelect(languageSelect);
    languageBadge.textContent = getJsonTypeLanguage(currentLanguage).label;
    renderSpecificOptions();

    const { EditorState, Compartment } = runtime.stateModule;
    const { EditorView } = runtime.viewModule;
    const inputWrapCompartment = new Compartment();
    const outputWrapCompartment = new Compartment();
    const outputLanguageCompartment = new Compartment();
    const editorTheme = EditorView.theme({
      '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--text)' },
      '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.72' },
      '.cm-content': { minHeight: '100%', padding: '18px 8px' },
      '.cm-line': { padding: '0 10px' },
      '.cm-gutters': { borderRight: '1px solid var(--line)', backgroundColor: 'var(--bg-soft)', color: 'var(--text-muted)' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--brand) 8%, transparent)' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'color-mix(in srgb, var(--brand) 27%, transparent) !important' },
      '.cm-cursor': { borderLeftColor: 'var(--brand-bright)' },
      '.cm-foldPlaceholder': { border: '1px solid var(--line-strong)', backgroundColor: 'var(--panel-strong)', color: 'var(--text-muted)' },
      '&.cm-focused': { outline: 'none' },
    });
    inputHost.textContent = '';
    outputHost.textContent = '';
    inputHost.classList.remove('is-loading');
    outputHost.classList.remove('is-loading');
    const initialJson = savedDraft?.payload?.draft || jsonTypesExample;
    inputView = new EditorView({
      doc: initialJson,
      extensions: [runtime.codemirror.basicSetup, runtime.jsonModule.json(), editorTheme, inputWrapCompartment.of(content.querySelector('#json-types-input-wrap').checked ? EditorView.lineWrapping : []), EditorView.contentAttributes.of({ 'aria-label': 'JSON 输入代码编辑器' }), EditorView.updateListener.of((update) => { if (!update.docChanged || suppressInputUpdate) return; updateInputCount(); scheduleGeneration(); persistState(); })],
      parent: inputHost,
    });
    outputView = new EditorView({
      doc: '',
      extensions: [runtime.codemirror.basicSetup, editorTheme, outputLanguageCompartment.of(jsonTypesLanguageSupport(runtime, currentLanguage)), outputWrapCompartment.of(content.querySelector('#json-types-output-wrap').checked ? EditorView.lineWrapping : []), EditorState.readOnly.of(true), EditorView.editable.of(false), EditorView.contentAttributes.of({ 'aria-label': '生成类型代码编辑器', tabindex: '0' })],
      parent: outputHost,
    });
    worker = new Worker(new URL('./json-types.worker.js', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event) => {
      const result = event.data || {};
      if (disposed || result.id !== latestRequestId) return;
      if (!result.ok) { generationError(`生成失败：${result.error || '未知错误'}`); return; }
      setOutput(result.code || '');
      renderStatus(`${getJsonTypeLanguage(currentLanguage).label} 类型已生成`, 'success');
    });
    worker.addEventListener('error', () => { if (!disposed) generationError('类型生成引擎加载失败'); });

    languageSelect.addEventListener('change', () => {
      collectSpecificValues();
      currentLanguage = languageSelect.value;
      languageBadge.textContent = getJsonTypeLanguage(currentLanguage).label;
      renderSpecificOptions();
      outputView.dispatch({ effects: outputLanguageCompartment.reconfigure(jsonTypesLanguageSupport(runtime, currentLanguage)) });
      scheduleGeneration();
      persistState();
    });
    rootInput.addEventListener('input', () => { scheduleGeneration(); persistState(); });
    optionsPanel.addEventListener('input', (event) => { if (event.target.matches('[data-json-types-option]')) collectSpecificValues(); scheduleGeneration(); persistState(); });
    optionsPanel.addEventListener('change', (event) => { if (event.target.matches('[data-json-types-option]')) collectSpecificValues(); scheduleGeneration(); persistState(); });
    content.querySelectorAll('#json-types-just-types, #json-types-infer-dates, #json-types-infer-maps, #json-types-infer-enums, #json-types-all-optional, #json-types-sort-fields').forEach((field) => field.addEventListener('change', () => { scheduleGeneration(); persistState(); }));
    content.querySelector('#json-types-input-wrap').addEventListener('change', (event) => { inputView.dispatch({ effects: inputWrapCompartment.reconfigure(event.target.checked ? EditorView.lineWrapping : []) }); persistState(); });
    content.querySelector('#json-types-output-wrap').addEventListener('change', (event) => { outputView.dispatch({ effects: outputWrapCompartment.reconfigure(event.target.checked ? EditorView.lineWrapping : []) }); persistState(); });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error('JSON 文件不能超过 10 MB');
        const text = await file.text();
        JSON.parse(text);
        setEditorText(inputView, text, true);
        updateInputCount();
        scheduleGeneration();
        persistState();
        showToast(`已打开 ${file.name}`);
      } catch (error) { generationError(`文件读取失败：${error.message}`); }
      fileInput.value = '';
    });
    content.addEventListener('click', (event) => {
      const button = event.target.closest('[data-json-types-action]');
      if (!button) return;
      const action = button.dataset.jsonTypesAction;
      if (action === 'clear') { setEditorText(inputView, '', true); setOutput(''); updateInputCount(); generationError('请输入 JSON 样本'); persistState(); inputView.focus(); }
      if (action === 'copy' && outputCode) copyText(outputCode).then(() => showToast('类型定义已复制'));
      if (action === 'download' && outputCode) {
        const language = getJsonTypeLanguage(currentLanguage);
        const name = rootInput.value.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'Root';
        downloadBlob(new Blob([outputCode], { type: 'text/plain;charset=utf-8' }), `${name}.${language.extension}`);
        showToast('类型定义已下载');
      }
      if (action === 'fullscreen') toggleFullscreen();
      if (action === 'sample') { setEditorText(inputView, jsonTypesExample, true); updateInputCount(); scheduleGeneration(); persistState(); inputView.focus(); }
      if (action === 'toggle-options') {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('span').textContent = expanded ? '⌃' : '⌄';
        optionsPanel.hidden = !expanded;
      }
    });
    document.addEventListener('keydown', onDocumentKeydown);
    updateInputCount();
    generate();
  } catch (error) {
    if (disposed) return;
    inputHost.classList.remove('is-loading');
    outputHost.classList.remove('is-loading');
    inputHost.textContent = '编辑器加载失败';
    outputHost.textContent = '类型生成引擎加载失败';
    generationError(error.message || '工具初始化失败');
  }
}

const timeUnitFactors = { millisecond: 1, second: 1000, minute: 60000, hour: 3600000, day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
const timeUnitLabels = { millisecond: '毫秒', second: '秒', minute: '分', hour: '时', day: '天', week: '周', month: '月（按 30 天）', year: '年（按 365 天）' };

function formatDateTimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function timeUnitOptions(selected = 'second') {
  return Object.keys(timeUnitLabels).map((unit) => `<option value="${unit}" ${unit === selected ? 'selected' : ''}>${timeUnitLabels[unit]}</option>`).join('');
}

function timeWorkbenchMarkup() {
  return `<div class="special-workbench time-workbench">
    <div class="time-mode-tabs" id="time-mode-tabs" role="tablist" aria-label="时间工具模式"><button class="time-mode-tab is-active" type="button" data-time-mode="timestamp-to-date">时间戳转时间</button><button class="time-mode-tab" type="button" data-time-mode="date-to-timestamp">时间转时间戳</button><button class="time-mode-tab" type="button" data-time-mode="unit-convert">时长单位换算</button></div>
    <div class="time-layout"><section class="workspace-card time-config-card"><div class="workspace-card-head"><div><strong>转换设置</strong><small id="time-config-caption">支持秒、毫秒时间戳</small></div><span class="code-badge">TIME</span></div><div class="time-form" id="time-form"></div></section><section class="workspace-card time-result-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small id="time-result-caption">等待转换</small></div><span id="time-status" class="time-status">准备就绪</span></div><div class="workspace-result time-result" id="time-result"><div class="special-empty"><span class="special-empty-icon">◷</span><strong>输入内容开始转换</strong><small>结果会显示在这里</small></div></div></section></div>
    <div class="time-note"><span class="time-note-icon">i</span><span>时间戳使用 Unix 时间标准；月按 30 天、年按 365 天进行时长换算，适合开发估算。</span></div>
  </div>`;
}

function timeFormMarkup(mode) {
  if (mode === 'timestamp-to-date') return `<div class="time-form-grid"><label class="time-field"><span>时间戳</span><input id="time-timestamp" type="text" inputmode="decimal" value="1725609600" placeholder="输入时间戳" /></label><label class="time-field"><span>输入单位</span><select id="time-timestamp-unit"><option value="auto">自动识别</option><option value="second" selected>秒</option><option value="millisecond">毫秒</option></select></label></div><div class="time-action-row"><button class="primary-button" type="button" data-time-action="timestamp-to-date">转换为时间</button><button class="secondary-button" type="button" data-time-action="time-now">使用当前时间</button></div><p class="time-form-hint">10 位左右通常为秒，13 位左右通常为毫秒；也可以手动指定单位。</p>`;
  if (mode === 'date-to-timestamp') return `<div class="time-form-grid"><label class="time-field time-field-wide"><span>日期与时间</span><input id="time-date" type="datetime-local" step="1" /></label><label class="time-field"><span>时间基准</span><select id="time-reference"><option value="local" selected>本地时间</option><option value="utc">UTC 时间</option></select></label></div><div class="time-action-row"><button class="primary-button" type="button" data-time-action="date-to-timestamp">转换为时间戳</button><button class="secondary-button" type="button" data-time-action="time-now">使用当前时间</button></div><p class="time-form-hint">本地时间按当前设备时区计算，UTC 时间按零时区计算。</p>`;
  return `<div class="time-form-grid"><label class="time-field"><span>数值</span><input id="time-duration-value" type="number" step="any" value="1" /></label><label class="time-field"><span>从</span><select id="time-duration-from">${timeUnitOptions('day')}</select></label><label class="time-field"><span>转换为</span><select id="time-duration-to">${timeUnitOptions('hour')}</select></label></div><div class="time-action-row"><button class="primary-button" type="button" data-time-action="unit-convert">开始换算</button><button class="secondary-button" type="button" data-time-action="unit-swap">交换单位</button></div><p class="time-form-hint">支持毫秒、秒、分、时、天、周、月和年之间互转。</p>`;
}

function timeResultLine(label, value) { return `<div class="result-line"><span>${escapeHtml(label)}</span><code>${escapeHtml(value)}</code></div>`; }

function bindTimeWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const tabs = content.querySelector('#time-mode-tabs');
  const form = content.querySelector('#time-form');
  const result = content.querySelector('#time-result');
  const resultCaption = content.querySelector('#time-result-caption');
  const configCaption = content.querySelector('#time-config-caption');
  const status = content.querySelector('#time-status');
  let mode = 'timestamp-to-date';
  const setStatus = (text, state = '') => { status.textContent = text; status.className = `time-status ${state}`.trim(); };
  const renderTimestampToDate = () => {
    const rawValue = form.querySelector('#time-timestamp')?.value.trim() || '';
    const raw = Number(rawValue);
    const unit = form.querySelector('#time-timestamp-unit')?.value || 'auto';
    const effectiveUnit = unit === 'auto' ? (Math.abs(raw) >= 100000000000 ? 'millisecond' : 'second') : unit;
    const milliseconds = effectiveUnit === 'millisecond' ? raw : raw * 1000;
    const date = rawValue && Number.isFinite(raw) ? new Date(milliseconds) : new Date(Number.NaN);
    if (Number.isNaN(date.getTime())) { result.innerHTML = '<div class="workspace-notice">请输入有效的秒或毫秒时间戳</div>'; resultCaption.textContent = '输入有误'; setStatus('无法转换', 'is-error'); return; }
    result.innerHTML = `${timeResultLine('本地时间', date.toLocaleString('zh-CN', { hour12: false }))}${timeResultLine('UTC 时间', date.toUTCString())}${timeResultLine('ISO 8601', date.toISOString())}${timeResultLine('秒', String(Math.floor(date.getTime() / 1000)))}${timeResultLine('毫秒', String(date.getTime()))}`;
    resultCaption.textContent = `${effectiveUnit === 'second' ? '秒' : '毫秒'}时间戳`; setStatus('转换完成', 'is-success');
  };
  const renderDateToTimestamp = () => {
    const value = form.querySelector('#time-date')?.value || '';
    const reference = form.querySelector('#time-reference')?.value || 'local';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) { result.innerHTML = '<div class="workspace-notice">请选择有效的日期和时间</div>'; resultCaption.textContent = '输入有误'; setStatus('无法转换', 'is-error'); return; }
    const parts = match.slice(1).map(Number);
    const milliseconds = reference === 'utc' ? Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] || 0) : new Date(value).getTime();
    if (Number.isNaN(milliseconds)) { result.innerHTML = '<div class="workspace-notice">日期格式无效</div>'; resultCaption.textContent = '输入有误'; setStatus('无法转换', 'is-error'); return; }
    result.innerHTML = `${timeResultLine('时间戳（秒）', String(Math.floor(milliseconds / 1000)))}${timeResultLine('时间戳（毫秒）', String(milliseconds))}${timeResultLine('时间基准', reference === 'utc' ? 'UTC 时间' : '本地时间')}`;
    resultCaption.textContent = 'Unix 时间戳'; setStatus('转换完成', 'is-success');
  };
  const renderUnitConvert = () => {
    const value = Number(form.querySelector('#time-duration-value')?.value);
    const from = form.querySelector('#time-duration-from')?.value || 'day';
    const to = form.querySelector('#time-duration-to')?.value || 'hour';
    const converted = value * timeUnitFactors[from] / timeUnitFactors[to];
    if (!Number.isFinite(value) || !Number.isFinite(converted)) { result.innerHTML = '<div class="workspace-notice">请输入有效的时长数值</div>'; resultCaption.textContent = '输入有误'; setStatus('无法换算', 'is-error'); return; }
    const formatted = Number(converted.toPrecision(12)).toString();
    result.innerHTML = `${timeResultLine('换算结果', `${formatted} ${timeUnitLabels[to]}`)}${timeResultLine('原始数值', `${value} ${timeUnitLabels[from]}`)}${timeResultLine('换算比例', `1 ${timeUnitLabels[from]} = ${(timeUnitFactors[from] / timeUnitFactors[to]).toPrecision(8)} ${timeUnitLabels[to]}`)}`;
    resultCaption.textContent = `${timeUnitLabels[from]} → ${timeUnitLabels[to]}`; setStatus('换算完成', 'is-success');
  };
  const render = () => { if (mode === 'timestamp-to-date') renderTimestampToDate(); else if (mode === 'date-to-timestamp') renderDateToTimestamp(); else renderUnitConvert(); };
  const renderForm = () => {
    form.innerHTML = timeFormMarkup(mode);
    if (mode === 'date-to-timestamp') form.querySelector('#time-date').value = formatDateTimeLocalValue(new Date());
    configCaption.textContent = mode === 'timestamp-to-date' ? '支持秒、毫秒时间戳' : mode === 'date-to-timestamp' ? '输出秒和毫秒两种结果' : '支持 8 种时间单位互转';
    tabs.querySelectorAll('[data-time-mode]').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.timeMode === mode));
    render();
  };
  tabs.addEventListener('click', (event) => { const button = event.target.closest('[data-time-mode]'); if (!button) return; mode = button.dataset.timeMode; renderForm(); });
  form.addEventListener('click', (event) => { const button = event.target.closest('[data-time-action]'); if (!button) return; if (button.dataset.timeAction === 'time-now') { if (mode === 'timestamp-to-date') { form.querySelector('#time-timestamp').value = String(Math.floor(Date.now() / 1000)); const unit = form.querySelector('#time-timestamp-unit'); unit.value = 'second'; syncBtSelect(unit); } else if (mode === 'date-to-timestamp') form.querySelector('#time-date').value = formatDateTimeLocalValue(new Date()); render(); return; } if (button.dataset.timeAction === 'unit-swap') { const from = form.querySelector('#time-duration-from'); const to = form.querySelector('#time-duration-to'); [from.value, to.value] = [to.value, from.value]; syncBtSelect(from); syncBtSelect(to); render(); return; } render(); });
  form.addEventListener('input', () => { if (mode !== 'timestamp-to-date' || form.querySelector('#time-timestamp')?.value.trim()) render(); });
  form.addEventListener('change', () => render());
  renderForm();
}

function jwtSampleToken() {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJieWV0b29scyIsInJvbGUiOiJkZXZlbG9wZXIiLCJpYXQiOjE3MjU2MDk2MDAsImV4cCI6MjA0OTQ3MjAwMH0.signature-demo';
}

function jwtWorkbenchMarkup() {
  return `<div class="special-workbench jwt-workbench">
    <div class="jwt-toolbar"><div class="jwt-toolbar-main"><button class="primary-button" type="button" data-jwt-action="parse">解析 Token</button><button class="secondary-button" type="button" data-jwt-action="clear">清空</button><button class="secondary-button" type="button" data-jwt-action="copy">复制解析结果</button></div><span class="jwt-status" id="jwt-status">等待解析</span><span class="jwt-local-badge"><i></i>本地解析</span></div>
    <div class="jwt-layout">
      <section class="workspace-card jwt-input-card"><div class="workspace-card-head"><div><strong>JWT 输入</strong><small>粘贴完整的 Header.Payload.Signature</small></div><span class="code-badge">JWT</span></div><textarea id="jwt-input" spellcheck="false" wrap="off" aria-label="JWT 输入">${escapeHtml(jwtSampleToken())}</textarea><div class="workspace-card-foot"><span id="jwt-input-meta">等待输入</span><span>Base64URL</span></div></section>
      <div class="jwt-result-column">
        <section class="workspace-card jwt-claims-card"><div class="workspace-card-head"><div><strong>Claim 概览</strong><small id="jwt-claims-caption">解析后显示时间状态</small></div><span id="jwt-claims-state" class="jwt-claims-state">--</span></div><div id="jwt-claims" class="jwt-claims"><div class="special-empty"><span class="special-empty-icon">ID</span><strong>等待解析 Token</strong><small>exp、iat、nbf 等时间字段会自动识别</small></div></div></section>
        <div class="jwt-segment-grid">
          <section class="workspace-card jwt-segment-card"><div class="workspace-card-head"><div><strong>Header</strong><small id="jwt-header-caption">JSON 对象</small></div><span class="jwt-segment-index">01</span></div><pre id="jwt-header-value"></pre></section>
          <section class="workspace-card jwt-segment-card"><div class="workspace-card-head"><div><strong>Payload</strong><small id="jwt-payload-caption">JSON 对象</small></div><span class="jwt-segment-index">02</span></div><pre id="jwt-payload-value"></pre></section>
          <section class="workspace-card jwt-segment-card jwt-signature-card"><div class="workspace-card-head"><div><strong>Signature</strong><small id="jwt-signature-caption">仅展示，不验证签名</small></div><span class="jwt-segment-index">03</span></div><pre id="jwt-signature-value"></pre></section>
        </div>
      </div>
    </div>
    <div class="jwt-note"><span class="jwt-note-icon">i</span><span>JWT 解析只在当前浏览器内完成，用于查看令牌结构和 Claim 内容；页面不会验证签名，也不会将 Token 上传到服务器。</span></div>
  </div>`;
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error('JWT 分段不是有效的 Base64URL');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return { text: new TextDecoder('utf-8').decode(bytes), bytes };
}

function jwtJsonText(value, fallback) {
  try { return JSON.stringify(value, null, 2); } catch (error) { return fallback; }
}

function formatJwtTimestamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '不是有效时间戳';
  const milliseconds = Math.abs(number) >= 100000000000 ? number : number * 1000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? '不是有效时间戳' : date.toLocaleString('zh-CN', { hour12: false });
}

function formatJwtRemaining(milliseconds) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  if (totalMinutes < 60) return `${totalMinutes} 分钟`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `${hours} 小时`;
  return `${Math.floor(hours / 24)} 天`;
}

function jwtClaimState(key, value) {
  const number = Number(value);
  if (!['exp', 'nbf'].includes(key) || !Number.isFinite(number)) return '';
  const milliseconds = (Math.abs(number) >= 100000000000 ? number : number * 1000);
  const difference = milliseconds - Date.now();
  if (key === 'exp') return difference <= 0 ? '<span class="jwt-claim-state is-error">已过期</span>' : `<span class="jwt-claim-state is-success">剩余 ${formatJwtRemaining(difference)}</span>`;
  return difference <= 0 ? '<span class="jwt-claim-state is-success">已生效</span>' : `<span class="jwt-claim-state is-warning">${formatJwtRemaining(difference)} 后生效</span>`;
}

function jwtClaimsMarkup(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '<div class="workspace-notice">Payload 不是 JSON 对象，无法识别标准 Claim。</div>';
  const preferred = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];
  const keys = [...preferred.filter((key) => Object.prototype.hasOwnProperty.call(payload, key)), ...Object.keys(payload).filter((key) => !preferred.includes(key)).slice(0, 5)];
  if (!keys.length) return '<div class="workspace-notice">Payload 为空，没有可展示的 Claim。</div>';
  return `<div class="jwt-claim-grid">${keys.map((key) => {
    const value = payload[key];
    const isTime = ['exp', 'iat', 'nbf'].includes(key);
    const valueText = isTime ? `${escapeHtml(String(value))}<small>${escapeHtml(formatJwtTimestamp(value))}</small>` : escapeHtml(typeof value === 'object' ? JSON.stringify(value) : String(value));
    return `<div class="jwt-claim-item"><div><span>${escapeHtml(key)}</span>${jwtClaimState(key, value)}</div><strong>${valueText}</strong></div>`;
  }).join('')}</div>`;
}

function bindJwtWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#jwt-input');
  const status = content.querySelector('#jwt-status');
  const inputMeta = content.querySelector('#jwt-input-meta');
  const claims = content.querySelector('#jwt-claims');
  const claimsCaption = content.querySelector('#jwt-claims-caption');
  const claimsState = content.querySelector('#jwt-claims-state');
  const header = content.querySelector('#jwt-header-value');
  const payload = content.querySelector('#jwt-payload-value');
  const signature = content.querySelector('#jwt-signature-value');
  const headerCaption = content.querySelector('#jwt-header-caption');
  const payloadCaption = content.querySelector('#jwt-payload-caption');
  const signatureCaption = content.querySelector('#jwt-signature-caption');
  let lastResult = '';
  const setStatus = (text, className = '') => { status.textContent = text; status.className = `jwt-status ${className}`.trim(); };
  const renderEmpty = (message = '等待解析 Token') => {
    inputMeta.textContent = `${input.value.length} 个字符`;
    claims.innerHTML = `<div class="special-empty"><span class="special-empty-icon">ID</span><strong>${message}</strong><small>支持标准的三段式 JWT 结构</small></div>`;
    claimsCaption.textContent = '解析后显示时间状态'; claimsState.textContent = '--'; claimsState.className = 'jwt-claims-state';
    header.textContent = ''; payload.textContent = ''; signature.textContent = '';
    headerCaption.textContent = 'JSON 对象'; payloadCaption.textContent = 'JSON 对象'; signatureCaption.textContent = '仅展示，不验证签名';
    lastResult = '';
  };
  const render = () => {
    const token = input.value.trim();
    inputMeta.textContent = `${input.value.length} 个字符`;
    if (!token) { renderEmpty('输入 JWT 后开始解析'); setStatus('等待输入'); return; }
    const parts = token.split('.');
    if (parts.length !== 3) { renderEmpty('JWT 应包含三段内容'); setStatus('格式有误', 'is-error'); return; }
    try {
      const headerDecoded = decodeBase64Url(parts[0]);
      const payloadDecoded = decodeBase64Url(parts[1]);
      const signatureDecoded = decodeBase64Url(parts[2]);
      let headerValue;
      let payloadValue;
      try { headerValue = JSON.parse(headerDecoded.text); } catch (error) { headerValue = null; }
      try { payloadValue = JSON.parse(payloadDecoded.text); } catch (error) { payloadValue = null; }
      header.textContent = headerValue ? jwtJsonText(headerValue, headerDecoded.text) : headerDecoded.text;
      payload.textContent = payloadValue ? jwtJsonText(payloadValue, payloadDecoded.text) : payloadDecoded.text;
      signature.textContent = parts[2];
      headerCaption.textContent = `${headerValue ? 'JSON 对象' : '文本'} · ${headerDecoded.bytes.length} B`;
      payloadCaption.textContent = `${payloadValue ? 'JSON 对象' : '文本'} · ${payloadDecoded.bytes.length} B`;
      signatureCaption.textContent = `Base64URL · ${signatureDecoded.bytes.length} B`;
      claims.innerHTML = jwtClaimsMarkup(payloadValue);
      const timeKeys = payloadValue && typeof payloadValue === 'object' ? ['exp', 'iat', 'nbf'].filter((key) => Object.prototype.hasOwnProperty.call(payloadValue, key)) : [];
      claimsCaption.textContent = timeKeys.length ? `识别到 ${timeKeys.join('、')} 时间字段` : '未发现标准时间字段';
      if (payloadValue?.exp != null) {
        const expired = Number(payloadValue.exp) * (Math.abs(Number(payloadValue.exp)) >= 100000000000 ? 1 : 1000) <= Date.now();
        claimsState.textContent = expired ? '已过期' : '有效期内'; claimsState.className = `jwt-claims-state ${expired ? 'is-error' : 'is-success'}`;
      } else { claimsState.textContent = '无 exp'; claimsState.className = 'jwt-claims-state is-warning'; }
      lastResult = `Header\n${header.textContent}\n\nPayload\n${payload.textContent}\n\nSignature\n${signature.textContent}`;
      setStatus('解析完成', 'is-success');
    } catch (error) {
      renderEmpty('无法解析 JWT 分段'); setStatus(error.message, 'is-error');
    }
  };
  content.querySelector('[data-jwt-action="parse"]').addEventListener('click', render);
  content.querySelector('[data-jwt-action="clear"]').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  content.querySelector('[data-jwt-action="copy"]').addEventListener('click', () => { if (!lastResult) { showToast('请先解析有效 JWT'); return; } copyText(lastResult).then(() => showToast('JWT 解析结果已复制')); });
  input.addEventListener('input', render);
  render();
}

const timeZoneCatalog = [
  { id: 'Asia/Shanghai', label: '中国标准时间', city: '北京' },
  { id: 'UTC', label: '协调世界时', city: 'UTC' },
  { id: 'Asia/Tokyo', label: '日本标准时间', city: '东京' },
  { id: 'Asia/Singapore', label: '新加坡时间', city: '新加坡' },
  { id: 'Europe/London', label: '英国时间', city: '伦敦' },
  { id: 'America/New_York', label: '美国东部时间', city: '纽约' },
  { id: 'America/Los_Angeles', label: '美国太平洋时间', city: '洛杉矶' },
  { id: 'Australia/Sydney', label: '澳大利亚东部时间', city: '悉尼' },
  { id: 'Europe/Paris', label: '中欧时间', city: '巴黎' },
  { id: 'Asia/Dubai', label: '海湾标准时间', city: '迪拜' },
];

function timeZoneOptions(selected = 'Asia/Shanghai') {
  return timeZoneCatalog.map((zone) => `<option value="${zone.id}" ${zone.id === selected ? 'selected' : ''}>${zone.city} · ${zone.label}</option>`).join('');
}

function parseDateTimeLocalParts(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] || 0) };
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
  return probe.getUTCFullYear() === parts.year && probe.getUTCMonth() === parts.month - 1 && probe.getUTCDate() === parts.day && probe.getUTCHours() === parts.hour && probe.getUTCMinutes() === parts.minute && probe.getUTCSeconds() === parts.second ? parts : null;
}

function getTimeZoneParts(date, timeZone) {
  const values = {};
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).forEach((part) => { if (part.type !== 'literal') values[part.type] = Number(part.value); });
  return values;
}

function formatTimeZoneDate(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);
  const pad = (value) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

function formatDateTimeForZone(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);
  const pad = (value) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

function zonedDateTimeToDate(value, timeZone) {
  const parts = parseDateTimeLocalParts(value);
  if (!parts) return new Date(Number.NaN);
  const targetEpoch = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let guess = targetEpoch;
  for (let index = 0; index < 4; index += 1) {
    const actual = getTimeZoneParts(new Date(guess), timeZone);
    const actualEpoch = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const next = guess + targetEpoch - actualEpoch;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess);
}

function timeZoneOffsetMinutes(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);
  return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime()) / 60000);
}

function formatTimeZoneOffset(minutes) {
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}

function timezoneWorkbenchMarkup() {
  const initial = formatDateTimeForZone(new Date(), 'Asia/Shanghai');
  return `<div class="special-workbench timezone-workbench">
    <div class="timezone-toolbar"><div><span class="toolbar-label">时区换算</span><span class="timezone-toolbar-note"><i></i>自动处理夏令时偏移</span></div><div class="timezone-toolbar-actions"><button class="secondary-button" type="button" data-timezone-action="now">使用当前时间</button><button class="secondary-button" type="button" data-timezone-action="swap">交换时区</button></div></div>
    <div class="timezone-layout"><section class="workspace-card timezone-config-card"><div class="workspace-card-head"><div><strong>转换设置</strong><small>输入来源时区的本地日期时间</small></div><span class="code-badge">IANA</span></div><div class="timezone-form" id="timezone-form"><label class="timezone-field timezone-field-wide"><span>日期与时间</span><input id="timezone-datetime" type="datetime-local" step="1" value="${initial}" /></label><div class="timezone-route"><label class="timezone-field"><span>来源时区</span><select id="timezone-source">${timeZoneOptions('Asia/Shanghai')}</select></label><button class="timezone-swap-button" type="button" data-timezone-action="swap" title="交换来源和目标时区">⇄</button><label class="timezone-field"><span>目标时区</span><select id="timezone-target">${timeZoneOptions('America/New_York')}</select></label></div><div class="timezone-quick-list"><span>常用目标</span><button type="button" data-timezone-quick="UTC">UTC</button><button type="button" data-timezone-quick="Asia/Tokyo">东京</button><button type="button" data-timezone-quick="Europe/London">伦敦</button><button type="button" data-timezone-quick="America/New_York">纽约</button><button type="button" data-timezone-quick="Australia/Sydney">悉尼</button></div><div class="timezone-form-actions"><button class="primary-button" type="button" data-timezone-action="convert">立即转换</button><span id="timezone-status" class="timezone-status">准备就绪</span></div></div></section><section class="workspace-card timezone-result-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small id="timezone-result-caption">目标时区本地时间</small></div><span class="code-badge">RESULT</span></div><div class="timezone-result" id="timezone-result"><div class="timezone-primary-result"><span>目标时间</span><strong id="timezone-primary-value">--</strong><small id="timezone-primary-zone">--</small></div><div class="timezone-result-list" id="timezone-result-list"></div></div></section></div>
    <div class="timezone-note"><span class="time-note-icon">i</span><span>使用 IANA 时区名称计算，跨越夏令时的地区会按指定日期自动使用对应偏移。</span></div>
  </div>`;
}

function bindTimezoneWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const form = content.querySelector('#timezone-form');
  const dateInput = content.querySelector('#timezone-datetime');
  const source = content.querySelector('#timezone-source');
  const target = content.querySelector('#timezone-target');
  const result = content.querySelector('#timezone-result');
  const primaryValue = content.querySelector('#timezone-primary-value');
  const primaryZone = content.querySelector('#timezone-primary-zone');
  const resultList = content.querySelector('#timezone-result-list');
  const caption = content.querySelector('#timezone-result-caption');
  const status = content.querySelector('#timezone-status');
  const setStatus = (text, className = '') => { status.textContent = text; status.className = `timezone-status ${className}`.trim(); };
  const render = () => {
    const instant = zonedDateTimeToDate(dateInput.value, source.value);
    if (Number.isNaN(instant.getTime())) { result.classList.add('is-error'); primaryValue.textContent = '无法转换'; primaryZone.textContent = '请输入有效的日期和时间'; resultList.innerHTML = ''; caption.textContent = '输入有误'; setStatus('输入有误', 'is-error'); return; }
    result.classList.remove('is-error');
    const targetInfo = timeZoneCatalog.find((zone) => zone.id === target.value);
    const sourceInfo = timeZoneCatalog.find((zone) => zone.id === source.value);
    const targetParts = getTimeZoneParts(instant, target.value);
    const targetText = formatTimeZoneDate(instant, target.value);
    const targetOffset = formatTimeZoneOffset(timeZoneOffsetMinutes(instant, target.value));
    primaryValue.textContent = targetText;
    primaryZone.textContent = `${targetInfo?.city || target.value} · ${targetOffset}`;
    resultList.innerHTML = `${timeResultLine('来源时间', `${formatTimeZoneDate(instant, source.value)} · ${sourceInfo?.city || source.value}`)}${timeResultLine('UTC 时间', formatTimeZoneDate(instant, 'UTC'))}${timeResultLine('时间戳（秒）', String(Math.floor(instant.getTime() / 1000)))}${timeResultLine('时间戳（毫秒）', String(instant.getTime()))}${timeResultLine('目标偏移', targetOffset)}`;
    caption.textContent = `${sourceInfo?.city || source.value} → ${targetInfo?.city || target.value}`;
    setStatus(`已转换 · ${targetParts.year}/${targetParts.month}/${targetParts.day}`, 'is-success');
  };
  const setNow = () => { dateInput.value = formatDateTimeForZone(new Date(), source.value); render(); };
  form.addEventListener('click', (event) => {
    const action = event.target.closest('[data-timezone-action]')?.dataset.timezoneAction;
    const quick = event.target.closest('[data-timezone-quick]')?.dataset.timezoneQuick;
    if (quick) { target.value = quick; syncBtSelect(target); render(); return; }
    if (action === 'now') setNow();
    else if (action === 'swap') { const instant = zonedDateTimeToDate(dateInput.value, source.value); [source.value, target.value] = [target.value, source.value]; syncBtSelect(source); syncBtSelect(target); if (!Number.isNaN(instant.getTime())) dateInput.value = formatDateTimeForZone(instant, source.value); render(); }
    else if (action === 'convert') render();
  });
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();
}

function dateCalculatorWorkbenchMarkup() {
  return `<div class="special-workbench datecalc-workbench"><div class="datecalc-mode-tabs" id="datecalc-mode-tabs" role="tablist" aria-label="日期计算模式"><button class="datecalc-mode-tab is-active" type="button" data-datecalc-mode="difference">日期差值</button><button class="datecalc-mode-tab" type="button" data-datecalc-mode="add-subtract">日期加减</button></div><div class="datecalc-layout"><section class="workspace-card datecalc-config-card"><div class="workspace-card-head"><div><strong>计算设置</strong><small id="datecalc-config-caption">计算两个日期之间的时间跨度</small></div><span class="code-badge">DATE</span></div><div class="datecalc-form" id="datecalc-form"></div></section><section class="workspace-card datecalc-result-card"><div class="workspace-card-head"><div><strong>计算结果</strong><small id="datecalc-result-caption">等待计算</small></div><span id="datecalc-status" class="datecalc-status">准备就绪</span></div><div class="datecalc-result" id="datecalc-result"><div class="special-empty"><span class="special-empty-icon">+</span><strong>输入日期开始计算</strong><small>结果会显示在这里</small></div></div></section></div><div class="datecalc-note"><span class="time-note-icon">i</span><span>日期差值按本地时间计算；月和年加减会保留日期，遇到月末时自动调整到该月最后一天。</span></div></div>`;
}

function dateCalculatorFormMarkup(mode) {
  const now = new Date();
  const later = new Date(now.getTime() + 7 * 86400000);
  if (mode === 'difference') return `<div class="datecalc-form-grid"><label class="datecalc-field datecalc-field-wide"><span>开始日期</span><input id="datecalc-start" type="datetime-local" step="1" value="${formatDateTimeLocalValue(now)}" /></label><label class="datecalc-field datecalc-field-wide"><span>结束日期</span><input id="datecalc-end" type="datetime-local" step="1" value="${formatDateTimeLocalValue(later)}" /></label></div><div class="datecalc-actions"><button class="primary-button" type="button" data-datecalc-action="calculate">计算差值</button><button class="secondary-button" type="button" data-datecalc-action="now">结束日期设为现在</button></div><p class="datecalc-form-hint">支持正向和反向日期差值，结果同时显示总天数、总小时和总分钟。</p>`;
  return `<div class="datecalc-form-grid"><label class="datecalc-field datecalc-field-wide"><span>基准日期</span><input id="datecalc-base" type="datetime-local" step="1" value="${formatDateTimeLocalValue(now)}" /></label><label class="datecalc-field"><span>操作</span><select id="datecalc-operation"><option value="add" selected>增加</option><option value="subtract">减少</option></select></label><label class="datecalc-field"><span>数值</span><input id="datecalc-amount" type="number" step="any" value="1" /></label><label class="datecalc-field"><span>单位</span><select id="datecalc-unit"><option value="day" selected>天</option><option value="week">周</option><option value="month">月</option><option value="year">年</option><option value="hour">小时</option><option value="minute">分钟</option><option value="second">秒</option></select></label></div><div class="datecalc-actions"><button class="primary-button" type="button" data-datecalc-action="calculate">计算结果</button><button class="secondary-button" type="button" data-datecalc-action="now">基准日期设为现在</button></div><p class="datecalc-form-hint">支持天、周、月、年、小时、分钟和秒；月末日期会自动适配。</p>`;
}

function dateCalcDurationText(milliseconds) {
  const sign = milliseconds < 0 ? '-' : '';
  let remaining = Math.abs(milliseconds);
  const days = Math.floor(remaining / 86400000); remaining -= days * 86400000;
  const hours = Math.floor(remaining / 3600000); remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000); remaining -= minutes * 60000;
  const seconds = Math.floor(remaining / 1000);
  return `${sign}${days} 天 ${hours} 时 ${minutes} 分 ${seconds} 秒`;
}

function addDateCalendarDuration(date, amount, unit) {
  const result = new Date(date.getTime());
  if (['month', 'year'].includes(unit)) {
    const originalDay = result.getDate();
    const targetMonth = result.getMonth() + amount * (unit === 'year' ? 12 : 1);
    result.setDate(1);
    result.setMonth(targetMonth);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }
  const factors = { day: 86400000, week: 604800000, hour: 3600000, minute: 60000, second: 1000 };
  result.setTime(result.getTime() + amount * factors[unit]);
  return result;
}

function bindDateCalculatorWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const tabs = content.querySelector('#datecalc-mode-tabs');
  const form = content.querySelector('#datecalc-form');
  const result = content.querySelector('#datecalc-result');
  const resultCaption = content.querySelector('#datecalc-result-caption');
  const configCaption = content.querySelector('#datecalc-config-caption');
  const status = content.querySelector('#datecalc-status');
  let mode = 'difference';
  const setStatus = (text, className = '') => { status.textContent = text; status.className = `datecalc-status ${className}`.trim(); };
  const render = () => {
    if (mode === 'difference') {
      const startValue = form.querySelector('#datecalc-start')?.value || '';
      const endValue = form.querySelector('#datecalc-end')?.value || '';
      const start = new Date(startValue).getTime();
      const end = new Date(endValue).getTime();
      if (!startValue || !endValue || Number.isNaN(start) || Number.isNaN(end)) { result.innerHTML = '<div class="workspace-notice">请选择有效的开始和结束日期</div>'; resultCaption.textContent = '输入有误'; setStatus('无法计算', 'is-error'); return; }
      const difference = end - start;
      const absolute = Math.abs(difference);
      const totalDays = Number((absolute / 86400000).toFixed(6));
      const totalHours = Number((absolute / 3600000).toFixed(4));
      const totalMinutes = Number((absolute / 60000).toFixed(2));
      result.innerHTML = `<div class="datecalc-primary"><strong>${escapeHtml(dateCalcDurationText(difference))}</strong><span>${difference >= 0 ? '结束日期晚于开始日期' : '结束日期早于开始日期'}</span></div><div class="datecalc-metric-grid"><div><span>总天数</span><strong>${totalDays}</strong></div><div><span>总小时</span><strong>${totalHours}</strong></div><div><span>总分钟</span><strong>${totalMinutes}</strong></div><div><span>总秒数</span><strong>${Math.floor(absolute / 1000)}</strong></div></div><div class="datecalc-result-lines">${timeResultLine('开始', new Date(start).toLocaleString('zh-CN', { hour12: false }))}${timeResultLine('结束', new Date(end).toLocaleString('zh-CN', { hour12: false }))}</div>`;
      resultCaption.textContent = '日期差值'; setStatus('计算完成', 'is-success');
      return;
    }
    const baseValue = form.querySelector('#datecalc-base')?.value || '';
    const base = new Date(baseValue);
    const amount = Number(form.querySelector('#datecalc-amount')?.value);
    const operation = form.querySelector('#datecalc-operation')?.value || 'add';
    const unit = form.querySelector('#datecalc-unit')?.value || 'day';
    if (!baseValue || Number.isNaN(base.getTime()) || !Number.isFinite(amount)) { result.innerHTML = '<div class="workspace-notice">请输入有效的基准日期和数值</div>'; resultCaption.textContent = '输入有误'; setStatus('无法计算', 'is-error'); return; }
    const signedAmount = operation === 'subtract' ? -amount : amount;
    const calculated = addDateCalendarDuration(base, signedAmount, unit);
    result.innerHTML = `<div class="datecalc-primary"><strong>${escapeHtml(formatDateTimeLocalValue(calculated).replace('T', ' '))}</strong><span>${operation === 'subtract' ? '基准日期减少' : '基准日期增加'} ${amount} ${({ day: '天', week: '周', month: '月', year: '年', hour: '小时', minute: '分钟', second: '秒' })[unit]}</span></div><div class="datecalc-result-lines">${timeResultLine('基准日期', base.toLocaleString('zh-CN', { hour12: false }))}${timeResultLine('结果日期', calculated.toLocaleString('zh-CN', { hour12: false }))}${timeResultLine('星期', calculated.toLocaleDateString('zh-CN', { weekday: 'long' }))}</div>`;
    resultCaption.textContent = '日期加减'; setStatus('计算完成', 'is-success');
  };
  const renderForm = () => {
    form.innerHTML = dateCalculatorFormMarkup(mode);
    configCaption.textContent = mode === 'difference' ? '计算两个日期之间的时间跨度' : '按单位增加或减少日期';
    tabs.querySelectorAll('[data-datecalc-mode]').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.datecalcMode === mode));
    render();
  };
  tabs.addEventListener('click', (event) => { const button = event.target.closest('[data-datecalc-mode]'); if (!button) return; mode = button.dataset.datecalcMode; renderForm(); });
  form.addEventListener('click', (event) => { const action = event.target.closest('[data-datecalc-action]')?.dataset.datecalcAction; if (action === 'calculate') render(); if (action === 'now') { const end = form.querySelector('#datecalc-end'); const base = form.querySelector('#datecalc-base'); if (end) end.value = formatDateTimeLocalValue(new Date()); if (base) base.value = formatDateTimeLocalValue(new Date()); render(); } });
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  renderForm();
}

const worldClockCities = [
  { id: 'beijing', city: '北京', country: '中国', timeZone: 'Asia/Shanghai', zone: '中国标准时间' },
  { id: 'tokyo', city: '东京', country: '日本', timeZone: 'Asia/Tokyo', zone: '日本标准时间' },
  { id: 'singapore', city: '新加坡', country: '新加坡', timeZone: 'Asia/Singapore', zone: '新加坡时间' },
  { id: 'london', city: '伦敦', country: '英国', timeZone: 'Europe/London', zone: '英国时间' },
  { id: 'new-york', city: '纽约', country: '美国', timeZone: 'America/New_York', zone: '美国东部时间' },
  { id: 'los-angeles', city: '洛杉矶', country: '美国', timeZone: 'America/Los_Angeles', zone: '美国太平洋时间' },
  { id: 'sydney', city: '悉尼', country: '澳大利亚', timeZone: 'Australia/Sydney', zone: '澳大利亚东部时间' },
  { id: 'paris', city: '巴黎', country: '法国', timeZone: 'Europe/Paris', zone: '中欧时间' },
  { id: 'dubai', city: '迪拜', country: '阿联酋', timeZone: 'Asia/Dubai', zone: '海湾标准时间' },
];

function worldClockWorkbenchMarkup() {
  return `<div class="special-workbench world-clock-workbench"><div class="world-clock-toolbar"><div class="world-clock-add"><label><span>添加城市</span><select id="world-clock-city-select">${worldClockCities.map((city) => `<option value="${city.id}">${city.city} · ${city.country}</option>`).join('')}</select></label><button class="primary-button" type="button" data-world-clock-action="add">添加</button></div><div class="world-clock-controls"><div class="world-clock-segmented" role="group" aria-label="时间格式"><button type="button" class="is-active" data-world-clock-format="24">24 小时</button><button type="button" data-world-clock-format="12">12 小时</button></div><label class="world-clock-check"><input id="world-clock-seconds" type="checkbox" checked />显示秒</label><button class="secondary-button" type="button" data-world-clock-action="now">同步时间</button></div></div><div class="world-clock-grid" id="world-clock-grid"></div><div class="world-clock-note"><span class="time-note-icon">i</span><span>时间每秒自动更新，城市卡片显示当地日期、UTC 偏移和与本地日期的关系。</span></div></div>`;
}

function worldClockDateRelation(date, timeZone, localTimeZone) {
  const current = getTimeZoneParts(date, timeZone);
  const local = getTimeZoneParts(date, localTimeZone);
  const currentDay = Date.UTC(current.year, current.month - 1, current.day);
  const localDay = Date.UTC(local.year, local.month - 1, local.day);
  const difference = Math.round((currentDay - localDay) / 86400000);
  return difference === 0 ? '今天' : difference > 0 ? `本地 +${difference} 天` : `本地 ${difference} 天`;
}

function worldClockTimeText(date, timeZone, format, showSeconds) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone, hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined, hour12: format === '12' }).format(date);
}

function worldClockCardMarkup(city, date, format, showSeconds, localTimeZone) {
  const parts = getTimeZoneParts(date, city.timeZone);
  const hour = parts.hour;
  const offset = formatTimeZoneOffset(timeZoneOffsetMinutes(date, city.timeZone));
  const workTime = hour >= 9 && hour < 18;
  const dateText = `${parts.year}年${parts.month}月${parts.day}日 · ${new Intl.DateTimeFormat('zh-CN', { timeZone: city.timeZone, weekday: 'long' }).format(date)}`;
  return `<article class="world-clock-card"><div class="world-clock-card-head"><div><strong>${city.city}</strong><span>${city.country} · ${city.zone}</span></div><button class="world-clock-remove" type="button" data-world-clock-remove="${city.id}" title="移除城市" aria-label="移除${city.city}">×</button></div><div class="world-clock-time">${escapeHtml(worldClockTimeText(date, city.timeZone, format, showSeconds))}</div><div class="world-clock-date">${dateText}</div><div class="world-clock-card-foot"><span>${offset}</span><span class="world-clock-day">${worldClockDateRelation(date, city.timeZone, localTimeZone)}</span><span class="world-clock-work ${workTime ? 'is-working' : ''}"><i></i>${workTime ? '工作时间' : '非工作时间'}</span></div></article>`;
}

function bindWorldClockWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const grid = content.querySelector('#world-clock-grid');
  const citySelect = content.querySelector('#world-clock-city-select');
  const seconds = content.querySelector('#world-clock-seconds');
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  let selected = ['beijing', 'tokyo', 'singapore', 'london', 'new-york', 'los-angeles', 'sydney'];
  let format = '24';
  const render = () => {
    const now = new Date();
    grid.innerHTML = selected.map((id) => worldClockCities.find((city) => city.id === id)).filter(Boolean).map((city) => worldClockCardMarkup(city, now, format, seconds.checked, localTimeZone)).join('');
    content.querySelectorAll('[data-world-clock-format]').forEach((button) => button.classList.toggle('is-active', button.dataset.worldClockFormat === format));
  };
  content.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-world-clock-remove]')?.dataset.worldClockRemove;
    const action = event.target.closest('[data-world-clock-action]')?.dataset.worldClockAction;
    const formatButton = event.target.closest('[data-world-clock-format]')?.dataset.worldClockFormat;
    if (remove) { selected = selected.filter((id) => id !== remove); if (!selected.length) selected = ['beijing']; render(); }
    if (action === 'add') { if (!selected.includes(citySelect.value)) selected.push(citySelect.value); render(); }
    if (action === 'now') render();
    if (formatButton) { format = formatButton; render(); }
  });
  seconds.addEventListener('change', render);
  render();
  const timer = setInterval(render, 1000);
  activeWorkspaceCleanup = () => clearInterval(timer);
}

function textCounterWorkbenchMarkup() {
  return `<div class="special-workbench text-counter-workbench"><div class="text-tool-toolbar"><div><span class="toolbar-label">实时文本统计</span><span class="text-tool-toolbar-note"><i></i>输入即计算 · 本地处理</span></div><div class="text-tool-toolbar-actions"><button class="secondary-button" type="button" data-text-counter-action="sample">填入示例</button><button class="secondary-button" type="button" data-text-counter-action="clear">清空</button><button class="secondary-button" type="button" data-text-counter-action="copy">复制统计</button></div></div><div class="text-counter-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>输入文本</strong><small>支持中文、英文、数字和多行内容</small></div><span class="code-badge">UTF-8</span></div><textarea id="text-counter-input" spellcheck="false" placeholder="输入或粘贴文本…">ByeTools 是一个本地优先的开发者工具箱。\n统计字符、行数和 UTF-8 字节大小。</textarea><div class="workspace-card-foot"><span id="text-counter-input-meta">等待输入</span><span>实时统计</span></div></section><section class="workspace-card text-counter-result-card"><div class="workspace-card-head"><div><strong>统计结果</strong><small>按 Unicode 字符和 UTF-8 字节计算</small></div><span id="text-counter-status" class="text-tool-status">准备就绪</span></div><div class="text-stat-grid" id="text-counter-results"></div></section></div></div>`;
}

function textStatMarkup(label, value, hint, className = '') {
  return `<div class="text-stat-card ${className}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint)}</small></div>`;
}

function bindTextCounterWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#text-counter-input');
  const results = content.querySelector('#text-counter-results');
  const status = content.querySelector('#text-counter-status');
  const meta = content.querySelector('#text-counter-input-meta');
  let lastStats = '';
  const render = () => {
    const text = input.value;
    const lines = text ? text.split(/\r\n|\r|\n/) : [];
    const stats = { chars: [...text].length, utf16: text.length, words: text.trim() ? text.trim().split(/\s+/u).length : 0, lines: lines.length, nonEmptyLines: lines.filter((line) => line.trim()).length, chinese: (text.match(/[\u3400-\u9fff]/g) || []).length, letters: (text.match(/[A-Za-z]/g) || []).length, numbers: (text.match(/\d/g) || []).length, spaces: (text.match(/\s/g) || []).length, bytes: new TextEncoder().encode(text).length };
    results.innerHTML = `${textStatMarkup('字符数', stats.chars, 'Unicode 字符', 'is-primary')}${textStatMarkup('UTF-8 字节', stats.bytes, '编码后大小')}${textStatMarkup('行数', stats.lines, `${stats.nonEmptyLines} 个非空行`)}${textStatMarkup('词数', stats.words, '按空白分隔')}${textStatMarkup('汉字', stats.chinese, 'CJK 字符')}${textStatMarkup('英文字母', stats.letters, 'A-Z / a-z')}${textStatMarkup('数字', stats.numbers, '0-9')}${textStatMarkup('空白符', stats.spaces, '空格、换行和制表符')}`;
    meta.textContent = `${stats.chars} 个字符 · ${stats.bytes} B`;
    status.textContent = text ? '统计完成' : '等待输入'; status.className = `text-tool-status ${text ? 'is-success' : ''}`.trim();
    lastStats = `字符数：${stats.chars}\nUTF-8 字节：${stats.bytes}\n行数：${stats.lines}\n非空行：${stats.nonEmptyLines}\n词数：${stats.words}\n汉字：${stats.chinese}\n英文字母：${stats.letters}\n数字：${stats.numbers}\n空白符：${stats.spaces}`;
  };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-text-counter-action]')?.dataset.textCounterAction; if (action === 'sample') { input.value = 'ByeTools 是一个本地优先的开发者工具箱。\n统计字符、行数和 UTF-8 字节大小。'; render(); } if (action === 'clear') { input.value = ''; render(); input.focus(); } if (action === 'copy' && lastStats) copyText(lastStats).then(() => showToast('统计结果已复制')); });
  input.addEventListener('input', render);
  render();
}

function caseConverterWorkbenchMarkup() {
  return `<div class="special-workbench case-converter-workbench"><div class="text-tool-toolbar"><div class="case-mode-field"><label for="case-mode">转换风格</label><select id="case-mode"><option value="lower">小写 lowercase</option><option value="upper">大写 UPPERCASE</option><option value="sentence">句首大写 Sentence case</option><option value="title">标题格式 Title Case</option><option value="camel" selected>小驼峰 camelCase</option><option value="pascal">大驼峰 PascalCase</option><option value="snake">下划线 snake_case</option><option value="kebab">短横线 kebab-case</option><option value="screaming-snake">常量 SCREAMING_SNAKE_CASE</option><option value="dot">点号 dot.case</option><option value="path">路径 path/case</option></select></div><div class="text-tool-toolbar-actions"><button class="primary-button" type="button" data-case-action="convert">转换</button><button class="secondary-button" type="button" data-case-action="swap">交换</button><button class="secondary-button" type="button" data-case-action="copy">复制结果</button><button class="secondary-button" type="button" data-case-action="clear">清空</button><span id="case-status" class="text-tool-status">实时转换</span></div></div><div class="case-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>输入文本</strong><small>支持短语、变量名和多行标题</small></div><span class="code-badge">INPUT</span></div><textarea id="case-input" spellcheck="false">Hello developer tools</textarea><div class="workspace-card-foot"><span>转换会重新拆分单词边界</span><span>UTF-8</span></div></section><section class="workspace-card text-output-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small>可选择并复制结果</small></div><span id="case-output-meta" class="text-tool-status">camelCase</span></div><textarea id="case-output" readonly spellcheck="false" aria-label="转换结果"></textarea><div class="workspace-card-foot"><span id="case-output-length">0 个字符</span><span>只读结果</span></div></section></div></div>`;
}

function splitIdentifierWords(value) {
  return String(value).trim().replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[^A-Za-z0-9\u3400-\u9fff]+/u).filter(Boolean);
}

function capitalizeWord(value) { return value ? `${value.charAt(0).toLocaleUpperCase('zh-CN')}${value.slice(1).toLocaleLowerCase('zh-CN')}` : ''; }

function convertCaseText(value, mode) {
  if (!value) return '';
  if (mode === 'lower') return value.toLocaleLowerCase('zh-CN');
  if (mode === 'upper') return value.toLocaleUpperCase('zh-CN');
  const words = splitIdentifierWords(value);
  if (!words.length) return '';
  const lower = words.map((word) => word.toLocaleLowerCase('zh-CN'));
  if (mode === 'sentence') return capitalizeWord(lower.join(' '));
  if (mode === 'title') return lower.map(capitalizeWord).join(' ');
  if (mode === 'camel') return lower[0] + lower.slice(1).map(capitalizeWord).join('');
  if (mode === 'pascal') return lower.map(capitalizeWord).join('');
  if (mode === 'snake') return lower.join('_');
  if (mode === 'kebab') return lower.join('-');
  if (mode === 'screaming-snake') return lower.join('_').toLocaleUpperCase('zh-CN');
  if (mode === 'dot') return lower.join('.');
  if (mode === 'path') return lower.join('/');
  return value;
}

function bindCaseConverterWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#case-input');
  const output = content.querySelector('#case-output');
  const mode = content.querySelector('#case-mode');
  const status = content.querySelector('#case-status');
  const outputMeta = content.querySelector('#case-output-meta');
  const outputLength = content.querySelector('#case-output-length');
  const render = () => { output.value = convertCaseText(input.value, mode.value); outputMeta.textContent = mode.options[mode.selectedIndex].textContent.split(' ')[0]; outputLength.textContent = `${[...output.value].length} 个字符`; status.textContent = input.value ? '转换完成' : '等待输入'; status.className = `text-tool-status ${input.value ? 'is-success' : ''}`.trim(); };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-case-action]')?.dataset.caseAction; if (action === 'convert') render(); if (action === 'swap') { [input.value, output.value] = [output.value, input.value]; render(); } if (action === 'clear') { input.value = ''; render(); input.focus(); } if (action === 'copy') copyText(output.value).then(() => showToast('转换结果已复制')); });
  input.addEventListener('input', render); mode.addEventListener('change', render); render();
}

function textReplaceWorkbenchMarkup() {
  return `<div class="special-workbench text-replace-workbench"><div class="replace-toolbar"><div class="replace-field"><label for="replace-search">查找内容</label><input id="replace-search" type="text" spellcheck="false" placeholder="输入要查找的文本或正则表达式" value="ByeTools" /></div><div class="replace-arrow">→</div><div class="replace-field"><label for="replace-with">替换为</label><input id="replace-with" type="text" spellcheck="false" placeholder="输入替换内容" value="开发工具箱" /></div><div class="replace-options"><label><input id="replace-regex" type="checkbox" />正则</label><label><input id="replace-global" type="checkbox" checked />全部替换</label><label><input id="replace-ignore-case" type="checkbox" />忽略大小写</label></div><div class="replace-actions"><button class="primary-button" type="button" data-replace-action="run">执行替换</button><button class="secondary-button" type="button" data-replace-action="copy">复制结果</button><button class="secondary-button" type="button" data-replace-action="clear">清空</button><span id="replace-status" class="text-tool-status">准备就绪</span></div></div><div class="text-compare-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>原始文本</strong><small>输入内容变化时自动预览</small></div><span class="code-badge">SOURCE</span></div><textarea id="replace-input" spellcheck="false">ByeTools 提供本地开发工具。\nByeTools 无需登录，数据保存在当前设备。</textarea><div class="workspace-card-foot"><span id="replace-input-meta">0 个字符</span><span>UTF-8</span></div></section><section class="workspace-card text-output-card"><div class="workspace-card-head"><div><strong>替换结果</strong><small>支持正则分组引用，如 $1</small></div><span class="code-badge">RESULT</span></div><textarea id="replace-output" readonly spellcheck="false" aria-label="替换结果"></textarea><div class="workspace-card-foot"><span id="replace-output-meta">等待处理</span><span>只读结果</span></div></section></div></div>`;
}

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function bindTextReplaceWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const search = content.querySelector('#replace-search');
  const replacement = content.querySelector('#replace-with');
  const input = content.querySelector('#replace-input');
  const output = content.querySelector('#replace-output');
  const status = content.querySelector('#replace-status');
  const inputMeta = content.querySelector('#replace-input-meta');
  const outputMeta = content.querySelector('#replace-output-meta');
  let lastResult = '';
  const render = () => {
    const source = input.value;
    const query = search.value;
    inputMeta.textContent = `${[...source].length} 个字符`;
    if (!query) { output.value = source; outputMeta.textContent = '请输入查找内容'; status.textContent = '等待查找条件'; status.className = 'text-tool-status'; lastResult = source; return; }
    try {
      const isRegex = content.querySelector('#replace-regex').checked;
      const global = content.querySelector('#replace-global').checked;
      const ignoreCase = content.querySelector('#replace-ignore-case').checked;
      const flags = `${global ? 'g' : ''}${ignoreCase ? 'i' : ''}`;
      const pattern = new RegExp(isRegex ? query : escapeRegExp(query), flags);
      // 使用独立的全局表达式统计匹配项，避免捕获组被计入数量
      const countPattern = new RegExp(isRegex ? query : escapeRegExp(query), `g${ignoreCase ? 'i' : ''}`);
      const matches = source.match(countPattern) || [];
      output.value = source.replace(pattern, replacement.value);
      outputMeta.textContent = `替换 ${matches.length} 处 · ${[...output.value].length} 个字符`;
      status.textContent = matches.length ? `已替换 ${matches.length} 处` : '没有找到匹配内容'; status.className = `text-tool-status ${matches.length ? 'is-success' : ''}`.trim(); lastResult = output.value;
    } catch (error) { output.value = ''; outputMeta.textContent = '正则表达式有误'; status.textContent = `处理失败：${error.message}`; status.className = 'text-tool-status is-error'; lastResult = ''; }
  };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-replace-action]')?.dataset.replaceAction; if (action === 'run') render(); if (action === 'copy') copyText(lastResult).then(() => showToast('替换结果已复制')); if (action === 'clear') { input.value = ''; output.value = ''; render(); input.focus(); } });
  content.addEventListener('input', (event) => { if (event.target.matches('input, textarea')) render(); });
  content.addEventListener('change', render);
  render();
}

function textCleanerWorkbenchMarkup() {
  return `<div class="special-workbench text-cleaner-workbench"><div class="text-tool-toolbar"><div><span class="toolbar-label">文本清理</span><span class="text-tool-toolbar-note"><i></i>按选项实时预览</span></div><div class="text-tool-toolbar-actions"><button class="primary-button" type="button" data-clean-action="run">应用清理</button><button class="secondary-button" type="button" data-clean-action="copy">复制结果</button><button class="secondary-button" type="button" data-clean-action="clear">清空</button><span id="clean-status" class="text-tool-status">准备就绪</span></div></div><div class="cleaner-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>原始文本</strong><small>空格、换行和不可见字符均可处理</small></div><span class="code-badge">SOURCE</span></div><textarea id="clean-input" spellcheck="false">  第一行内容  \n\n第二行内容\t\t\n第三行内容  </textarea><div class="workspace-card-foot"><span id="clean-input-meta">0 个字符</span><span>UTF-8</span></div></section><section class="workspace-card cleaner-options-card"><div class="workspace-card-head"><div><strong>清理选项</strong><small>选择需要执行的处理</small></div><span class="code-badge">OPTIONS</span></div><div class="cleaner-options"><label class="clean-option"><input id="clean-trim" type="checkbox" checked /><span><b>每行去除首尾空白</b><small>保留行内空格</small></span></label><label class="clean-option"><input id="clean-spaces" type="checkbox" checked /><span><b>合并连续空格</b><small>多个空格或制表符合并为一个空格</small></span></label><label class="clean-option"><input id="clean-empty" type="checkbox" /><span><b>删除空行</b><small>移除只包含空白的行</small></span></label><label class="clean-option"><input id="clean-invisible" type="checkbox" /><span><b>删除隐藏字符</b><small>移除零宽字符、控制字符和 BOM</small></span></label><label class="clean-option"><span><b>换行格式</b><select id="clean-newline"><option value="lf" selected>LF（Unix / Linux）</option><option value="crlf">CRLF（Windows）</option></select></span></label></div><div class="cleaner-summary" id="clean-summary">等待处理</div></section><section class="workspace-card text-output-card"><div class="workspace-card-head"><div><strong>清理结果</strong><small>结果可直接复制到代码或文档中</small></div><span class="code-badge">RESULT</span></div><textarea id="clean-output" readonly spellcheck="false" aria-label="清理结果"></textarea><div class="workspace-card-foot"><span id="clean-output-meta">等待处理</span><span>只读结果</span></div></section></div></div>`;
}

function cleanTextValue(text, options) {
  let value = String(text).replace(/\r\n?|\n/g, '\n');
  if (options.removeInvisible) value = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200d\u2060\ufeff]/g, '');
  let lines = value.split('\n');
  if (options.trimLines) lines = lines.map((line) => line.trim());
  if (options.mergeSpaces) lines = lines.map((line) => line.replace(/[ \t]+/g, ' '));
  if (options.removeEmpty) lines = lines.filter((line) => line.trim() !== '');
  value = lines.join(options.newline === 'crlf' ? '\r\n' : '\n');
  return value;
}

function bindTextCleanerWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#clean-input');
  const output = content.querySelector('#clean-output');
  const status = content.querySelector('#clean-status');
  const summary = content.querySelector('#clean-summary');
  const render = () => {
    const options = { trimLines: content.querySelector('#clean-trim').checked, mergeSpaces: content.querySelector('#clean-spaces').checked, removeEmpty: content.querySelector('#clean-empty').checked, removeInvisible: content.querySelector('#clean-invisible').checked, newline: content.querySelector('#clean-newline').value };
    output.value = cleanTextValue(input.value, options);
    const beforeLines = input.value ? input.value.split(/\r\n|\r|\n/).length : 0;
    const afterLines = output.value ? output.value.split(/\r\n|\r|\n/).length : 0;
    const changed = input.value.length - output.value.length;
    content.querySelector('#clean-input-meta').textContent = `${[...input.value].length} 个字符 · ${beforeLines} 行`;
    content.querySelector('#clean-output-meta').textContent = `${[...output.value].length} 个字符 · ${afterLines} 行`;
    summary.textContent = input.value === output.value ? '内容无需清理' : `已处理 ${Math.abs(changed)} 个字符 · ${Math.abs(beforeLines - afterLines)} 行变化`;
    status.textContent = input.value === output.value ? '无变化' : '预览已更新'; status.className = `text-tool-status ${input.value === output.value ? '' : 'is-success'}`.trim();
  };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-clean-action]')?.dataset.cleanAction; if (action === 'run') render(); if (action === 'copy') copyText(output.value).then(() => showToast('清理结果已复制')); if (action === 'clear') { input.value = ''; render(); input.focus(); } });
  content.addEventListener('input', (event) => { if (event.target.matches('input, textarea')) render(); }); content.addEventListener('change', render); render();
}

function lineToolsWorkbenchMarkup() {
  return `<div class="special-workbench line-tools-workbench"><div class="line-tools-toolbar"><div class="line-tool-field"><label for="line-operation">处理方式</label><select id="line-operation"><option value="dedupe" selected>去除重复行</option><option value="sort-asc">按字典升序</option><option value="sort-desc">按字典降序</option><option value="reverse">反转行顺序</option><option value="number">添加行号</option><option value="remove-empty">删除空行</option><option value="filter">筛选包含内容的行</option></select></div><div class="line-tool-field line-filter-field"><label for="line-filter">筛选内容</label><input id="line-filter" type="text" placeholder="仅筛选模式使用" spellcheck="false" /></div><label class="line-check"><input id="line-trim" type="checkbox" checked />去除行首尾空白</label><label class="line-check"><input id="line-ignore-case" type="checkbox" />排序忽略大小写</label><label class="line-check"><input id="line-filter-regex" type="checkbox" />筛选使用正则</label><div class="line-tools-actions"><button class="primary-button" type="button" data-line-action="run">执行处理</button><button class="secondary-button" type="button" data-line-action="copy">复制结果</button><button class="secondary-button" type="button" data-line-action="clear">清空</button><span id="line-status" class="text-tool-status">准备就绪</span></div></div><div class="text-compare-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>输入行</strong><small>一行一条内容</small></div><span class="code-badge">LINES</span></div><textarea id="line-input" spellcheck="false">apple\nbanana\napple\nOrange\nbanana\npear</textarea><div class="workspace-card-foot"><span id="line-input-meta">0 行</span><span>UTF-8</span></div></section><section class="workspace-card text-output-card"><div class="workspace-card-head"><div><strong>处理结果</strong><small>按当前方式生成</small></div><span class="code-badge">RESULT</span></div><textarea id="line-output" readonly spellcheck="false" aria-label="行处理结果"></textarea><div class="workspace-card-foot"><span id="line-output-meta">等待处理</span><span>只读结果</span></div></section></div></div>`;
}

function lineToolResult(text, operation, options) {
  let lines = text ? text.split(/\r\n|\r|\n/) : [];
  if (options.trim) lines = lines.map((line) => line.trim());
  if (operation === 'remove-empty') lines = lines.filter((line) => line.trim() !== '');
  if (operation === 'dedupe') { const seen = new Set(); lines = lines.filter((line) => { const key = options.ignoreCase ? line.toLocaleLowerCase('zh-CN') : line; if (seen.has(key)) return false; seen.add(key); return true; }); }
  if (operation === 'sort-asc' || operation === 'sort-desc') { lines = [...lines].sort((a, b) => { const left = options.ignoreCase ? a.toLocaleLowerCase('zh-CN') : a; const right = options.ignoreCase ? b.toLocaleLowerCase('zh-CN') : b; return left.localeCompare(right, 'zh-CN') * (operation === 'sort-asc' ? 1 : -1); }); }
  if (operation === 'reverse') lines.reverse();
  if (operation === 'filter') {
    if (options.filterRegex) { const pattern = new RegExp(options.filter, options.ignoreCase ? 'i' : ''); lines = lines.filter((line) => pattern.test(line)); }
    else { const query = options.ignoreCase ? options.filter.toLocaleLowerCase('zh-CN') : options.filter; lines = lines.filter((line) => (options.ignoreCase ? line.toLocaleLowerCase('zh-CN') : line).includes(query)); }
  }
  if (operation === 'number') lines = lines.map((line, index) => `${String(index + 1).padStart(String(lines.length).length, '0')}. ${line}`);
  return lines.join('\n');
}

function bindLineToolsWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#line-input');
  const output = content.querySelector('#line-output');
  const status = content.querySelector('#line-status');
  const render = () => {
    const operation = content.querySelector('#line-operation').value;
    const options = { trim: content.querySelector('#line-trim').checked, ignoreCase: content.querySelector('#line-ignore-case').checked, filter: content.querySelector('#line-filter').value, filterRegex: content.querySelector('#line-filter-regex').checked };
    try {
      output.value = lineToolResult(input.value, operation, options);
      const inputLines = input.value ? input.value.split(/\r\n|\r|\n/) : [];
      const outputLines = output.value ? output.value.split(/\r\n|\r|\n/) : [];
      content.querySelector('#line-input-meta').textContent = `${inputLines.length} 行 · ${[...input.value].length} 个字符`;
      content.querySelector('#line-output-meta').textContent = `${outputLines.length} 行 · ${[...output.value].length} 个字符`;
      status.textContent = `${outputLines.length} 行已生成`; status.className = 'text-tool-status is-success';
    } catch (error) { output.value = ''; status.textContent = `处理失败：${error.message}`; status.className = 'text-tool-status is-error'; }
  };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-line-action]')?.dataset.lineAction; if (action === 'run') render(); if (action === 'copy') copyText(output.value).then(() => showToast('行处理结果已复制')); if (action === 'clear') { input.value = ''; render(); input.focus(); } });
  content.addEventListener('input', (event) => { if (event.target.matches('input, textarea')) render(); }); content.addEventListener('change', render); render();
}

const invisibleCharacterDefinitions = {
  ' ': { label: '空格', symbol: '␠', code: 'U+0020', className: 'space' },
  '\t': { label: '制表符', symbol: '⇥', code: 'U+0009', className: 'tab' },
  '\n': { label: '换行', symbol: '↵', code: 'U+000A', className: 'newline' },
  '\r': { label: '回车', symbol: '␍', code: 'U+000D', className: 'newline' },
  '\u00a0': { label: '不换行空格', symbol: 'NBSP', code: 'U+00A0', className: 'space' },
  '\u200b': { label: '零宽空格', symbol: 'ZWSP', code: 'U+200B', className: 'zero-width' },
  '\u200c': { label: '零宽非连接符', symbol: 'ZWNJ', code: 'U+200C', className: 'zero-width' },
  '\u200d': { label: '零宽连接符', symbol: 'ZWJ', code: 'U+200D', className: 'zero-width' },
  '\u2060': { label: '词连接符', symbol: 'WJ', code: 'U+2060', className: 'zero-width' },
  '\ufeff': { label: '字节顺序标记', symbol: 'BOM', code: 'U+FEFF', className: 'format' },
};

function invisibleDefinition(char) {
  if (invisibleCharacterDefinitions[char]) return invisibleCharacterDefinitions[char];
  const code = char.codePointAt(0);
  if (code < 32 || code === 127) return { label: '控制字符', symbol: `CTRL ${code.toString(16).toUpperCase()}`, code: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`, className: 'control' };
  return null;
}

function invisiblePreviewMarkup(text, showMarkers) {
  return [...text].map((char) => { const definition = invisibleDefinition(char); if (!definition) return escapeHtml(char); return showMarkers ? `<mark class="invisible-marker invisible-marker-${definition.className}" title="${definition.label} · ${definition.code}">${escapeHtml(definition.symbol)}</mark>` : escapeHtml(char); }).join('') || '<span class="invisible-empty">输入文本后显示字符标记</span>';
}

function invisibleTableMarkup(text) {
  const entries = new Map();
  let position = 0;
  [...text].forEach((char) => { const definition = invisibleDefinition(char); if (definition) { const key = definition.code; const entry = entries.get(key) || { ...definition, count: 0, positions: [] }; entry.count += 1; if (entry.positions.length < 8) entry.positions.push(position + 1); entries.set(key, entry); } position += 1; });
  if (!entries.size) return '<div class="invisible-table-empty">没有发现不可见字符</div>';
  return `<div class="invisible-table-wrap"><table class="invisible-table"><thead><tr><th>字符</th><th>名称</th><th>编码</th><th>数量</th><th>位置</th></tr></thead><tbody>${[...entries.values()].map((entry) => `<tr><td><span class="invisible-table-symbol invisible-marker-${entry.className}">${escapeHtml(entry.symbol)}</span></td><td>${escapeHtml(entry.label)}</td><td><code>${escapeHtml(entry.code)}</code></td><td>${entry.count}</td><td>${entry.positions.join(', ')}${entry.count > entry.positions.length ? '…' : ''}</td></tr>`).join('')}</tbody></table></div>`;
}

function invisibleWorkbenchMarkup() {
  return `<div class="special-workbench invisible-workbench"><div class="text-tool-toolbar"><div><span class="toolbar-label">不可见字符查看器</span><span class="text-tool-toolbar-note"><i></i>定位空格、换行和零宽字符</span></div><div class="text-tool-toolbar-actions"><label class="invisible-check"><input id="invisible-markers" type="checkbox" checked />显示字符标记</label><button class="secondary-button" type="button" data-invisible-action="copy">复制原文</button><button class="secondary-button" type="button" data-invisible-action="clear">清空</button><span id="invisible-status" class="text-tool-status">准备就绪</span></div></div><div class="invisible-layout"><section class="workspace-card text-input-card"><div class="workspace-card-head"><div><strong>输入文本</strong><small>保留原始字符用于检测</small></div><span class="code-badge">SOURCE</span></div><textarea id="invisible-input" spellcheck="false">第一行\t含有制表符\n第二行\u200b含有零宽字符\n第三行含有普通空格</textarea><div class="workspace-card-foot"><span id="invisible-input-meta">0 个字符</span><span>UTF-8</span></div></section><section class="workspace-card invisible-result-card"><div class="workspace-card-head"><div><strong>可视化结果</strong><small>标记颜色用于区分不同类型</small></div><span class="code-badge">PREVIEW</span></div><div class="invisible-preview" id="invisible-preview"></div><div class="invisible-summary" id="invisible-summary"></div></section></div><section class="workspace-card invisible-table-card"><div class="workspace-card-head"><div><strong>字符明细</strong><small>最多展示每类字符的前 8 个位置</small></div><span class="code-badge">DETAIL</span></div><div id="invisible-table"></div></section></div>`;
}

function bindInvisibleWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#invisible-input');
  const preview = content.querySelector('#invisible-preview');
  const summary = content.querySelector('#invisible-summary');
  const table = content.querySelector('#invisible-table');
  const status = content.querySelector('#invisible-status');
  const render = () => {
    const text = input.value;
    const entries = [...text].map(invisibleDefinition).filter(Boolean);
    const zeroWidth = entries.filter((entry) => entry.className === 'zero-width').length;
    preview.innerHTML = invisiblePreviewMarkup(text, content.querySelector('#invisible-markers').checked);
    summary.innerHTML = `${textStatMarkup('不可见字符', entries.length, entries.length ? '需要关注' : '未发现', entries.length ? 'is-warning' : 'is-primary')}${textStatMarkup('字符总数', [...text].length, 'Unicode 字符')}${textStatMarkup('零宽字符', zeroWidth, '不可见但会影响匹配')}`;
    table.innerHTML = invisibleTableMarkup(text);
    content.querySelector('#invisible-input-meta').textContent = `${[...text].length} 个字符 · ${entries.length} 个不可见字符`;
    status.textContent = entries.length ? `发现 ${entries.length} 个不可见字符` : '未发现不可见字符'; status.className = `text-tool-status ${entries.length ? 'is-warning' : 'is-success'}`;
  };
  content.addEventListener('click', (event) => { const action = event.target.closest('[data-invisible-action]')?.dataset.invisibleAction; if (action === 'copy') copyText(input.value).then(() => showToast('原文已复制')); if (action === 'clear') { input.value = ''; render(); input.focus(); } });
  input.addEventListener('input', render); content.querySelector('#invisible-markers').addEventListener('change', render); render();
}

function clampColorChannel(value) { return Math.max(0, Math.min(255, Number(value) || 0)); }
function clampAlpha(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
function parseColorAlpha(value) { return String(value).trim().endsWith('%') ? clampAlpha(Number.parseFloat(value) / 100) : clampAlpha(Number.parseFloat(value)); }
function parseColorChannel(value) { return String(value).trim().endsWith('%') ? clampColorChannel(Number.parseFloat(value) * 2.55) : clampColorChannel(Number.parseFloat(value)); }
function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = Math.max(0, Math.min(1, saturation / 100));
  const l = Math.max(0, Math.min(1, lightness / 100));
  if (!s) return { r: l * 255, g: l * 255, b: l * 255 };
  const hueToChannel = (p, q, t) => { let value = t; if (value < 0) value += 1; if (value > 1) value -= 1; if (value < 1 / 6) return p + (q - p) * 6 * value; if (value < 1 / 2) return q; if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6; return p; };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: hueToChannel(p, q, h + 1 / 3) * 255, g: hueToChannel(p, q, h) * 255, b: hueToChannel(p, q, h - 1 / 3) * 255 };
}
function parseColorValue(value, allowNamed = true) {
  const input = String(value).trim();
  const hexMatch = input.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) { const raw = hexMatch[1].length <= 4 ? hexMatch[1].split('').map((item) => item + item).join('') : hexMatch[1]; return { r: Number.parseInt(raw.slice(0, 2), 16), g: Number.parseInt(raw.slice(2, 4), 16), b: Number.parseInt(raw.slice(4, 6), 16), a: raw.length === 8 ? Number.parseInt(raw.slice(6, 8), 16) / 255 : 1 }; }
  const functionMatch = input.match(/^(rgba?|hsla?)\((.*)\)$/i);
  if (functionMatch) {
    const name = functionMatch[1].toLowerCase();
    const tokens = functionMatch[2].replace(/,/g, ' ').replace(/\//g, ' / ').split(/\s+/).filter(Boolean);
    const slash = tokens.indexOf('/');
    const channelTokens = tokens.slice(0, 3);
    const alphaToken = slash >= 0 ? tokens[slash + 1] : tokens[3];
    const alpha = alphaToken == null ? 1 : parseColorAlpha(alphaToken);
    if (channelTokens.length < 3) return null;
    if (name.startsWith('rgb')) return { r: parseColorChannel(channelTokens[0]), g: parseColorChannel(channelTokens[1]), b: parseColorChannel(channelTokens[2]), a: alpha };
    const hue = Number.parseFloat(channelTokens[0]);
    const saturation = Number.parseFloat(channelTokens[1]);
    const lightness = Number.parseFloat(channelTokens[2]);
    if (![hue, saturation, lightness].every(Number.isFinite)) return null;
    return { ...hslToRgb(hue, saturation, lightness), a: alpha };
  }
  if (allowNamed && input) {
    const probe = document.createElement('span');
    probe.style.color = input;
    if (probe.style.color) { document.body.appendChild(probe); const computed = getComputedStyle(probe).color; probe.remove(); return parseColorValue(computed, false); }
  }
  return null;
}
function rgbToHex(color, withAlpha = false) { const channel = (value) => Math.round(clampColorChannel(value)).toString(16).padStart(2, '0'); const base = `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`; return withAlpha ? `${base}${channel(color.a * 255)}` : base; }
function colorAlphaText(value) { return Number(value.toFixed(3)).toString(); }
function rgbToHsl(color) { const r = color.r / 255; const g = color.g / 255; const b = color.b / 255; const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min; let h = 0; const l = (max + min) / 2; const s = !delta ? 0 : delta / (1 - Math.abs(2 * l - 1)); if (delta) { if (max === r) h = 60 * (((g - b) / delta) % 6); else if (max === g) h = 60 * ((b - r) / delta + 2); else h = 60 * ((r - g) / delta + 4); } return { h: (h + 360) % 360, s: s * 100, l: l * 100 }; }
function rgbToHsv(color) { const r = color.r / 255; const g = color.g / 255; const b = color.b / 255; const max = Math.max(r, g, b); const delta = max - Math.min(r, g, b); let h = 0; if (delta) { if (max === r) h = 60 * (((g - b) / delta) % 6); else if (max === g) h = 60 * ((b - r) / delta + 2); else h = 60 * ((r - g) / delta + 4); } return { h: (h + 360) % 360, s: max ? delta / max * 100 : 0, v: max * 100 }; }

function colorWorkbenchMarkup() {
  return `<div class="special-workbench color-workbench"><div class="color-layout"><section class="color-input-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>颜色输入</strong><small>输入 CSS 颜色值，或使用取色器选择</small></div></div><div class="color-input-grid"><label class="color-value-field"><span>颜色值</span><input id="color-input" type="text" value="#6366f1" spellcheck="false" placeholder="#6366f1、rgb(...)、hsl(...)"></label><label class="color-picker-field"><span>选择颜色</span><input id="color-picker" type="color" value="#6366f1" aria-label="选择颜色"></label></div><div class="color-sample-heading"><span>示例颜色</span><small>点击快速查看</small></div><div class="color-samples"><button type="button" data-color-sample="#ef4444"><i style="background:#ef4444"></i><code>#ef4444</code></button><button type="button" data-color-sample="#22c55e"><i style="background:#22c55e"></i><code>#22c55e</code></button><button type="button" data-color-sample="#3b82f6"><i style="background:#3b82f6"></i><code>#3b82f6</code></button><button type="button" data-color-sample="rgba(245, 158, 11, .65)"><i style="background:#f59e0b"></i><code>rgba(...)</code></button><button type="button" data-color-sample="hsl(262 83% 58%)"><i style="background:#8b5cf6"></i><code>hsl(...)</code></button></div><div class="color-input-actions"><button class="secondary-button" type="button" data-color-action="color-clear">清空</button><span id="color-status">本地解析</span></div></section><section class="workspace-card color-preview-card"><div class="workspace-card-head"><div><strong>颜色预览</strong><small id="color-preview-caption">实时更新</small></div><span class="code-badge">PREVIEW</span></div><div class="color-preview-body"><div class="color-preview-swatch" id="color-preview-swatch"></div><code id="color-preview-value">#6366f1</code><span>当前颜色</span></div></section></div><section class="workspace-card color-results-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small>常用 CSS 格式</small></div><span class="code-badge" id="color-result-count">5 种格式</span></div><div class="color-results" id="color-results"></div></section></div>`;
}

function bindColorWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#color-input');
  const picker = content.querySelector('#color-picker');
  const preview = content.querySelector('#color-preview-swatch');
  const previewValue = content.querySelector('#color-preview-value');
  const previewCaption = content.querySelector('#color-preview-caption');
  const results = content.querySelector('#color-results');
  const status = content.querySelector('#color-status');
  const render = () => {
    const parsed = parseColorValue(input.value);
    if (!parsed) { preview.style.background = 'var(--bg-soft)'; previewValue.textContent = '无法解析'; previewCaption.textContent = '请输入 HEX、RGB 或 HSL'; results.innerHTML = '<div class="special-empty"><span class="special-empty-icon">?</span><strong>颜色值格式有误</strong><small>支持 HEX、HEXA、RGB、RGBA、HSL 和 HSLA</small></div>'; status.textContent = '格式有误'; status.className = 'color-status is-error'; return; }
    const alpha = colorAlphaText(parsed.a);
    const hsl = rgbToHsl(parsed);
    const hsv = rgbToHsv(parsed);
    const hasAlpha = parsed.a < 0.999;
    const hex = rgbToHex(parsed, hasAlpha);
    const rgb = hasAlpha ? `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${alpha})` : `rgb(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)})`;
    const hslValue = hasAlpha ? `hsla(${hsl.h.toFixed(2)}, ${hsl.s.toFixed(2)}%, ${hsl.l.toFixed(2)}%, ${alpha})` : `hsl(${hsl.h.toFixed(2)}, ${hsl.s.toFixed(2)}%, ${hsl.l.toFixed(2)}%)`;
    const rows = [{ label: hasAlpha ? 'HEXA' : 'HEX', value: hex, hint: '十六进制颜色' }, { label: hasAlpha ? 'RGBA' : 'RGB', value: rgb, hint: 'RGB 通道值' }, { label: hasAlpha ? 'HSLA' : 'HSL', value: hslValue, hint: '色相、饱和度、亮度' }, { label: 'HSV', value: `hsv(${hsv.h.toFixed(2)}, ${hsv.s.toFixed(2)}%, ${hsv.v.toFixed(2)}%)`, hint: '色相、饱和度、明度' }, { label: 'CSS 变量', value: `--color-value: ${hex};`, hint: '可直接放入样式变量' }];
    preview.style.background = `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${parsed.a})`;
    previewValue.textContent = hex; previewCaption.textContent = hasAlpha ? `含透明度 ${alpha}` : '实时更新'; picker.value = rgbToHex(parsed); status.textContent = '解析成功'; status.className = 'color-status is-success';
    results.innerHTML = rows.map((row) => `<div class="color-format-row"><div><span>${escapeHtml(row.label)}</span><code>${escapeHtml(row.value)}</code><small>${escapeHtml(row.hint)}</small></div><button class="secondary-button" type="button" data-color-copy="${escapeHtml(row.value)}" title="复制${escapeHtml(row.label)}">复制</button></div>`).join('');
  };
  input.addEventListener('input', render);
  picker.addEventListener('input', () => { input.value = picker.value; render(); });
  content.querySelectorAll('[data-color-sample]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.colorSample; render(); }));
  content.querySelector('[data-color-action="color-clear"]').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  results.addEventListener('click', (event) => { const button = event.target.closest('[data-color-copy]'); if (button) copyText(button.dataset.colorCopy).then(() => showToast('颜色值已复制')); });
  render();
}

function ipWorkbenchMarkup() {
  return `<div class="special-workbench network-workbench">
    <div class="special-toolbar">
      <label class="special-input-field"><span>IP 地址</span><input id="ip-input" type="text" value="8.8.8.8" spellcheck="false" placeholder="输入 IPv4 或 IPv6 地址…" /></label>
      <button class="primary-button" data-tool-action="ip-query">查询地址</button>
      <button class="secondary-button" data-tool-action="ip-clear">清空</button>
      <span class="special-toolbar-note"><i></i>本地校验 · 公网归属地查询</span>
    </div>
    <div class="ip-workspace-grid">
      <section class="workspace-card ip-result-card"><div class="workspace-card-head"><span>地址概览</span><span id="ip-status">等待查询</span></div><div class="ip-result-body" id="ip-result"></div></section>
      <aside class="info-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>查询说明</strong><small>先完成本地地址识别</small></div></div><div class="info-list"><div><b>支持类型</b><span>IPv4、IPv6</span></div><div><b>本地判断</b><span>公网、内网、回环、链路本地</span></div><div><b>联网信息</b><span>国家、地区、城市、运营商、ASN、时区</span></div><div><b>隐私边界</b><span>仅在查询公网地址时发送给 IPQuery 或 FreeIPAPI</span></div></div><div class="info-callout">私有、回环和链路本地地址不会发起联网请求。</div></aside>
    </div>
  </div>`;
}

function messageQueueWorkbenchMarkup() {
  const desktopMq = Boolean(storage?.isDesktop);
  return `<div class="special-workbench mq-workbench" data-mq-workbench>
    <div class="special-toolbar mq-toolbar">
      <div class="mq-toolbar-copy"><span class="toolbar-label">消息中间件</span><span class="mq-capability-badge ${desktopMq ? 'is-ready' : ''}"><i></i>${desktopMq ? '桌面端已启用真实连接' : 'Web 仅支持配置与编辑'}</span></div>
      <div class="mq-toolbar-actions">
        <button class="secondary-button" type="button" data-mq-action="test">测试连接</button>
        <button class="primary-button" type="button" data-mq-action="send">发送消息</button>
        <button class="secondary-button" type="button" data-mq-action="consume-start">开始消费</button>
        <button class="secondary-button" type="button" data-mq-action="consume-stop" disabled>停止消费</button>
        <button class="secondary-button" type="button" data-mq-action="clear">清空</button>
      </div>
    </div>
    <div class="mq-layout">
      <section class="workspace-card mq-config-card">
        <div class="workspace-card-head"><div><strong>连接配置</strong><small>填写 Broker 与认证信息，密码不会出现在消息日志中</small></div><span class="code-badge">BROKER</span></div>
        <div class="mq-config-manager"><div class="mq-config-manager-head"><div><strong>配置管理</strong><small>保存后可在当前设备查询并应用连接参数</small></div><span class="code-badge">CONFIG</span></div><div class="mq-config-manager-form"><label class="mq-field"><span>配置名称</span><input id="mq-config-name" type="text" value="本地 MQTT" spellcheck="false" placeholder="例如：测试环境" /></label><div class="mq-config-manager-actions"><button class="primary-button" type="button" data-mq-action="save-config">保存配置</button><button class="secondary-button" type="button" data-mq-action="query-configs">查询配置</button></div></div><div class="mq-config-list" id="mq-config-list" hidden></div></div>
        <div class="mq-form-grid">
          <label class="mq-field mq-field-wide"><span>消息中间件</span><select id="mq-broker" aria-label="消息中间件"><option value="mqtt" data-icon="MQ" data-label="MQTT" data-description="轻量发布与订阅">MQTT</option><option value="kafka" data-icon="KF" data-label="Kafka" data-description="主题生产与消费">Kafka</option><option value="rabbitmq" data-icon="RM" data-label="RabbitMQ" data-description="交换机与队列消息">RabbitMQ</option><option value="rocketmq" data-icon="RQ" data-label="RocketMQ" data-description="5.x Proxy 消息服务">RocketMQ</option></select></label>
          <label class="mq-field mq-field-wide"><span id="mq-address-label">Broker 地址</span><input id="mq-address" type="text" value="localhost" spellcheck="false" placeholder="例如 mqtt.example.com" /></label>
          <label class="mq-field"><span>端口</span><input id="mq-port" type="number" value="1883" min="1" max="65535" inputmode="numeric" /></label>
          <label class="mq-field"><span id="mq-username-label">用户名</span><input id="mq-username" type="text" spellcheck="false" autocomplete="username" placeholder="可选" /></label>
          <label class="mq-field"><span id="mq-password-label">密码</span><input id="mq-password" type="password" spellcheck="false" autocomplete="current-password" placeholder="可选" /></label>
          <label class="mq-switch-field"><input id="mq-tls" type="checkbox" /><span><b>启用 TLS</b><small>使用加密传输连接 Broker</small></span></label>
        </div>
        <div class="mq-target-section"><div class="mq-target-heading"><div><strong>消息目标</strong><small id="mq-target-caption">MQTT Topic 与服务质量</small></div><span class="code-badge" id="mq-target-badge">TOPIC</span></div><div class="mq-target-fields" id="mq-target-fields"></div></div>
        <div class="mq-status-panel" id="mq-connection-status" role="status"><span class="mq-status-dot"></span><div><strong>等待操作</strong><small>${desktopMq ? '桌面端会使用当前配置连接 Broker。' : 'Web 端不会建立真实 MQ 连接，请使用桌面客户端执行操作。'}</small></div></div>
      </section>
      <section class="workspace-card mq-message-card">
        <div class="workspace-card-head"><div><strong>消息内容</strong><small>发送时作为消息正文，消费时用于查看目标配置</small></div><div class="mq-message-head-actions"><span class="code-badge" id="mq-message-badge">TEXT</span><div class="mq-message-modes" role="group" aria-label="消息格式"><button type="button" class="is-active" data-mq-format="text">文本</button><button type="button" data-mq-format="json">JSON</button></div></div></div>
        <textarea id="mq-message" spellcheck="false" placeholder="输入要发送的消息…">ByeTools MQ message</textarea>
        <div class="mq-message-tools"><span id="mq-message-status">文本消息 · 20 字符</span><div><button class="text-button" type="button" data-mq-action="format">格式化 JSON</button><button class="text-button" type="button" data-mq-action="clear-message">清空内容</button><button class="text-button" type="button" data-mq-action="copy-message">复制内容</button></div></div>
      </section>
    </div>
    <section class="workspace-card mq-log-card">
      <div class="workspace-card-head"><div><strong>消息日志</strong><small>${desktopMq ? '记录桌面端连接、发送与消费结果' : '仅记录本地操作意图，不代表 Broker 已接收或返回消息'}</small></div><div class="mq-log-head-actions"><button class="text-button" type="button" data-mq-action="export-consumed">导出消费消息</button><button class="text-button" type="button" data-mq-action="clear-log">清空日志</button></div></div>
      <div class="mq-log-table-wrap"><table class="mq-log-table"><thead><tr><th>时间</th><th>方向</th><th>状态</th><th>中间件</th><th>内容摘要</th></tr></thead><tbody id="mq-log-body"><tr class="mq-log-empty"><td colspan="5">暂无操作日志</td></tr></tbody></table></div>
    </section>
    <aside class="info-panel mq-info-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>桌面端能力说明</strong><small>${desktopMq ? '当前运行在 Tauri 桌面端' : '浏览器受网络沙箱限制'}</small></div></div><div class="info-list"><div><b>连接能力</b><span>${desktopMq ? 'MQTT、Kafka、RabbitMQ、RocketMQ 均由桌面端直接连接和操作。' : '可填写 Broker、Topic、队列和消息内容，支持本地格式校验。'}</span></div><div><b>发送与消费</b><span>${desktopMq ? '支持真实测试连接、发送消息、持续消费和停止消费者。' : '请使用桌面客户端执行真实发送与消费。'}</span></div><div><b>隐私边界</b><span>密码或 SecretKey 只用于当前桌面会话连接，不会写入消息日志。</span></div></div><div class="info-callout">${desktopMq ? 'RocketMQ 使用 5.x Proxy Endpoint；RabbitMQ 的 Exchange、Queue 与绑定关系需提前创建。' : '点击发送或消费后会显示桌面端提示，不会伪造成功消息。'}</div></aside>
  </div>`;
}

function curlWorkbenchMarkup() {
  return `<div class="special-workbench curl-workbench">
    <div class="special-toolbar curl-toolbar"><label class="special-select-field"><span>目标语言</span><select id="curl-language"><option value="fetch">Fetch</option><option value="axios">Axios</option><option value="python">Python</option><option value="go">Go</option></select></label><button class="primary-button" data-tool-action="curl-parse">解析并转换</button><button class="secondary-button" data-tool-action="curl-copy">复制代码</button><button class="secondary-button" data-tool-action="curl-clear">清空</button><span class="special-toolbar-note"><i></i>支持 URL、请求方法、请求头和请求体</span></div>
    <div class="tool-panel curl-panel"><section class="workspace-card"><div class="workspace-card-head"><div><strong>Curl 命令</strong><small>粘贴终端中的请求命令</small></div><span class="code-badge">SHELL</span></div><textarea id="curl-input" spellcheck="false" placeholder="curl 'https://example.com/api' -H 'accept: application/json'">curl 'https://api.example.com/users?page=1' -H 'accept: application/json' -H 'x-client: ByeTools'</textarea><div class="workspace-card-foot"><span id="curl-status">等待解析</span><span>本地转换</span></div></section><section class="workspace-card"><div class="workspace-card-head"><div><strong>代码结果</strong><small id="curl-output-caption">Fetch 请求</small></div><span class="code-badge" id="curl-output-language">JS</span></div><pre id="curl-output" aria-live="polite"></pre><div class="workspace-card-foot"><span>可直接复制到项目中</span><button class="text-button" data-tool-action="curl-copy">复制</button></div></section></div>
    <div class="curl-parse-summary" id="curl-summary"></div>
  </div>`;
}

function htmlWorkbenchMarkup() {
  return `<div class="special-workbench html-workbench">
    <div class="special-toolbar"><span class="toolbar-label">HTML 实体转换</span><button class="primary-button" data-tool-action="html-encode">实体编码</button><button class="secondary-button" data-tool-action="html-decode">实体解码</button><button class="secondary-button" data-tool-action="html-clear">清空</button><button class="secondary-button" data-tool-action="html-copy">复制结果</button><span class="special-toolbar-note"><i></i>支持中文、引号和特殊字符</span></div>
    <div class="tool-panel html-panel"><section class="workspace-card"><div class="workspace-card-head"><div><strong>输入内容</strong><small>原始 HTML 或实体文本</small></div><span class="code-badge">TEXT</span></div><textarea id="html-input" spellcheck="false" placeholder="输入 HTML 片段…">&lt;h1&gt;ByeTools&lt;/h1&gt;
&lt;p&gt;开发者工具箱&lt;/p&gt;</textarea></section><section class="workspace-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small id="html-output-caption">等待操作</small></div><span class="code-badge">HTML</span></div><pre id="html-output" aria-live="polite"></pre><div class="workspace-card-foot"><span id="html-status">输入内容后选择转换方式</span><button class="text-button" data-tool-action="html-copy">复制</button></div></section></div>
  </div>`;
}

function xmlFormatWorkbenchMarkup() {
  return `<div class="special-workbench formatter-workbench xml-format-workbench">
    <div class="special-toolbar formatter-toolbar"><input class="file-native-input" id="xml-format-file" type="file" accept=".xml,text/xml,application/xml" /><label class="formatter-file-button" for="xml-format-file"><span aria-hidden="true">↥</span>打开 XML</label><button class="primary-button" data-tool-action="xml-format">格式化</button><button class="secondary-button" data-tool-action="xml-minify">压缩</button><button class="secondary-button" data-tool-action="xml-sample">示例</button><button class="secondary-button" data-tool-action="xml-clear">清空</button><button class="secondary-button" data-tool-action="xml-copy">复制结果</button><button class="secondary-button" data-tool-action="xml-download">下载</button><button class="secondary-button" data-tool-action="xml-fullscreen">全屏</button><span class="special-toolbar-note"><i></i>浏览器本地解析，不上传文档</span></div>
    <div class="formatter-status" id="xml-format-status"><span class="formatter-status-dot"></span><span>等待输入</span><small>XML · UTF-8</small></div>
    <div class="formatter-layout"><section class="workspace-card formatter-editor-card"><div class="workspace-card-head"><div><strong>XML 输入</strong><small>支持属性、嵌套节点和命名空间</small></div><span class="code-badge">XML</span></div><textarea class="formatter-editor" id="xml-format-input" spellcheck="false" wrap="off" aria-label="XML 输入">&lt;catalog&gt;
  &lt;book id="bk101"&gt;
    &lt;title&gt;ByeTools 开发者工具箱&lt;/title&gt;
    &lt;author&gt;ByeTools&lt;/author&gt;
  &lt;/book&gt;
&lt;/catalog&gt;</textarea><div class="workspace-card-foot"><span id="xml-format-input-meta">0 个字符</span><span>实时校验</span></div></section><section class="workspace-card formatter-output-card"><div class="workspace-card-head"><div><strong>格式化结果</strong><small>解析错误会在这里提示</small></div><span class="code-badge">OUTPUT</span></div><pre class="formatter-output" id="xml-format-output" aria-live="polite"></pre><div class="workspace-card-foot"><span id="xml-format-output-meta">等待操作</span><button class="text-button" data-tool-action="xml-copy">复制</button></div></section></div>
  </div>`;
}

function xmlConverterWorkbenchMarkup() {
  return `<div class="special-workbench formatter-workbench xml-converter-workbench">
    <div class="special-toolbar formatter-toolbar"><input class="file-native-input" id="xml-converter-file" type="file" accept=".xml,text/xml,application/xml" /><label class="formatter-file-button" for="xml-converter-file"><span aria-hidden="true">↥</span>打开 XML</label><label class="special-select-field formatter-select-field"><span>输出格式</span><select id="xml-converter-format"><option value="json">JSON</option><option value="yaml">YAML</option><option value="toml">TOML</option><option value="javascript">JS 对象</option><option value="php">PHP 数组</option></select></label><button class="primary-button" data-tool-action="xml-convert">转换</button><button class="secondary-button" data-tool-action="xml-converter-sample">示例</button><button class="secondary-button" data-tool-action="xml-converter-clear">清空</button><button class="secondary-button" data-tool-action="xml-converter-copy">复制结果</button><button class="secondary-button" data-tool-action="xml-converter-download">下载</button><button class="secondary-button" data-tool-action="xml-converter-fullscreen">全屏</button><span class="special-toolbar-note"><i></i>结构转换在浏览器本地完成</span></div>
    <div class="formatter-options"><label class="formatter-option-check"><input id="xml-ignore-attributes" type="checkbox" /><span>忽略 XML 属性</span></label><label class="formatter-option-check"><input id="xml-strip-namespace" type="checkbox" checked /><span>去除命名空间前缀</span></label><label class="formatter-option-check"><input id="xml-force-array" type="checkbox" /><span>单元素也转数组</span></label><label class="special-input-field formatter-prefix-field"><span>属性前缀</span><input id="xml-attribute-prefix" type="text" value="@" maxlength="4" aria-label="属性前缀" /></label><label class="special-select-field formatter-indent-field"><span>缩进</span><select id="xml-converter-indent"><option value="2">2 空格</option><option value="4">4 空格</option><option value="tab">制表符</option></select></label></div>
    <div class="formatter-status" id="xml-converter-status"><span class="formatter-status-dot"></span><span>等待输入</span><small>XML → JSON</small></div>
    <div class="formatter-layout"><section class="workspace-card formatter-editor-card"><div class="workspace-card-head"><div><strong>XML 输入</strong><small>重复节点会自动合并为数组</small></div><span class="code-badge">XML</span></div><textarea class="formatter-editor" id="xml-converter-input" spellcheck="false" wrap="off" aria-label="XML 转换输入">&lt;user id="42"&gt;
  &lt;name&gt;ByeTools&lt;/name&gt;
  &lt;roles&gt;developer&lt;/roles&gt;
  &lt;roles&gt;designer&lt;/roles&gt;
&lt;/user&gt;</textarea><div class="workspace-card-foot"><span id="xml-converter-input-meta">0 个字符</span><span>本地解析</span></div></section><section class="workspace-card formatter-output-card"><div class="workspace-card-head"><div><strong>转换结果</strong><small id="xml-converter-output-caption">JSON 对象</small></div><span class="code-badge" id="xml-converter-output-badge">JSON</span></div><pre class="formatter-output" id="xml-converter-output" aria-live="polite"></pre><div class="workspace-card-foot"><span id="xml-converter-output-meta">等待转换</span><button class="text-button" data-tool-action="xml-converter-copy">复制</button></div></section></div>
  </div>`;
}

function sqlFormatWorkbenchMarkup() {
  return `<div class="special-workbench formatter-workbench sql-format-workbench">
    <div class="special-toolbar formatter-toolbar"><button class="primary-button" data-tool-action="sql-format">格式化</button><button class="secondary-button" data-tool-action="sql-minify">压缩</button><button class="secondary-button" data-tool-action="sql-sample">示例</button><button class="secondary-button" data-tool-action="sql-clear">清空</button><button class="secondary-button" data-tool-action="sql-copy">复制结果</button><button class="secondary-button" data-tool-action="sql-download">下载</button><button class="secondary-button" data-tool-action="sql-fullscreen">全屏</button><span class="special-toolbar-note"><i></i>仅在当前设备整理 SQL，不执行数据库操作</span></div>
    <div class="formatter-options sql-options"><label class="special-select-field"><span>数据库方言</span><select id="sql-dialect"><option value="mysql">MySQL</option><option value="postgresql">PostgreSQL</option><option value="sqlite">SQLite</option><option value="sqlserver">SQL Server</option></select></label><label class="special-select-field"><span>关键字大小写</span><select id="sql-keyword-case"><option value="original">原样</option><option value="upper" selected>大写</option><option value="lower">小写</option></select></label><label class="special-select-field"><span>缩进</span><select id="sql-indent"><option value="2" selected>2 空格</option><option value="4">4 空格</option><option value="tab">制表符</option></select></label><label class="formatter-option-check"><input id="sql-break-logic" type="checkbox" checked /><span>AND / OR 独立换行</span></label><label class="formatter-option-check"><input id="sql-blank-lines" type="checkbox" checked /><span>语句之间空行</span></label><label class="formatter-option-check"><input id="sql-compact-operators" type="checkbox" /><span>运算符紧凑</span></label></div>
    <div class="formatter-status" id="sql-format-status"><span class="formatter-status-dot"></span><span>等待输入</span><small>SQL · 本地格式化</small></div>
    <div class="formatter-layout"><section class="workspace-card formatter-editor-card"><div class="workspace-card-head"><div><strong>SQL 输入</strong><small>支持查询、更新、CTE 和多条语句</small></div><span class="code-badge">SQL</span></div><textarea class="formatter-editor" id="sql-format-input" spellcheck="false" wrap="off" aria-label="SQL 输入">SELECT u.id,u.name,COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.status='active' AND o.created_at &gt;= '2026-01-01' GROUP BY u.id,u.name ORDER BY order_count DESC LIMIT 20;</textarea><div class="workspace-card-foot"><span id="sql-format-input-meta">0 个字符</span><span>不会执行 SQL</span></div></section><section class="workspace-card formatter-output-card"><div class="workspace-card-head"><div><strong>格式化结果</strong><small>关键字和子句自动分行</small></div><span class="code-badge">OUTPUT</span></div><pre class="formatter-output" id="sql-format-output" aria-live="polite"></pre><div class="workspace-card-foot"><span id="sql-format-output-meta">等待操作</span><button class="text-button" data-tool-action="sql-copy">复制</button></div></section></div>
  </div>`;
}

function mermaidWorkbenchMarkup() {
  return `<div class="special-workbench mermaid-workbench">
    <div class="special-toolbar"><span class="toolbar-label">Mermaid 渲染器</span><button class="primary-button" data-tool-action="mermaid-render">渲染图表</button><button class="secondary-button" data-tool-action="mermaid-copy">复制 SVG</button><button class="secondary-button" data-tool-action="mermaid-download">下载 SVG</button><span class="special-toolbar-note"><i></i>当前支持常用流程图和关系图语法</span></div>
    <div class="tool-panel mermaid-panel"><section class="workspace-card"><div class="workspace-card-head"><div><strong>Mermaid 代码</strong><small>左侧编辑，右侧实时预览</small></div><span class="code-badge">MERMAID</span></div><textarea id="mermaid-input" spellcheck="false">flowchart LR
  A[开始] --> B[处理]
  B --> C[完成]</textarea><div class="workspace-card-foot"><span id="mermaid-status">等待渲染</span><span>本地 SVG</span></div></section><section class="workspace-card mermaid-preview-card"><div class="workspace-card-head"><div><strong>图表预览</strong><small>可缩放查看节点关系</small></div><span class="code-badge">SVG</span></div><div class="mermaid-preview" id="mermaid-preview"></div><div class="workspace-card-foot"><span>浏览器本地生成</span><button class="text-button" data-tool-action="mermaid-render">重新渲染</button></div></section></div>
  </div>`;
}

function markdownImageWorkbenchMarkup() {
  return `<div class="special-workbench markdown-image-workbench">
    <div class="special-toolbar markdown-toolbar"><label class="special-select-field"><span>主题</span><select id="markdown-theme"><option value="midnight">深夜蓝</option><option value="paper">纸张白</option><option value="mint">薄荷绿</option></select></label><label class="special-select-field"><span>字号</span><select id="markdown-size"><option value="16">16 px</option><option value="18" selected>18 px</option><option value="20">20 px</option><option value="24">24 px</option></select></label><button class="primary-button" data-tool-action="markdown-render">更新预览</button><button class="secondary-button" data-tool-action="markdown-export">导出 PNG</button><span class="special-toolbar-note"><i></i>将 Markdown 排版为适合分享的图片</span></div>
    <div class="tool-panel markdown-panel"><section class="workspace-card"><div class="workspace-card-head"><div><strong>Markdown 内容</strong><small>支持标题、列表、强调和代码</small></div><span class="code-badge">MD</span></div><textarea id="markdown-input" spellcheck="false"># ByeTools

一套专注本地处理的开发者工具箱。

## 今日工具

- JSON 格式化
- Curl 转代码
- Cron 表达式</textarea><div class="workspace-card-foot"><span id="markdown-status">实时排版</span><span>本地生成</span></div></section><section class="workspace-card markdown-preview-card"><div class="workspace-card-head"><div><strong>图片预览</strong><small>导出时保留当前主题与字号</small></div><span class="code-badge">PNG</span></div><div class="markdown-preview" id="markdown-preview"></div></section></div>
  </div>`;
}

function markdownEditorWorkbenchMarkup() {
  return `<div class="special-workbench markdown-editor-workbench">
    <div class="markdown-editor-toolbar">
      <div class="markdown-editor-file-actions"><input class="file-native-input" id="markdown-editor-file-input" type="file" accept=".md,.markdown,.mdown,.mkdn,.txt,text/markdown,text/plain" /><label class="markdown-editor-open" for="markdown-editor-file-input" title="打开本地 Markdown 文件"><span aria-hidden="true">↥</span>打开文件</label><label class="markdown-editor-filename"><span>文件名</span><input id="markdown-editor-filename" type="text" value="untitled.md" spellcheck="false" /></label></div>
      <div class="markdown-editor-view-switch" role="tablist" aria-label="编辑器视图"><button class="markdown-editor-view" type="button" role="tab" aria-selected="false" data-markdown-editor-view="edit"><span aria-hidden="true">T</span>编辑</button><button class="markdown-editor-view" type="button" role="tab" aria-selected="false" data-markdown-editor-view="source"><span aria-hidden="true">&lt;/&gt;</span>源码</button><button class="markdown-editor-view is-active" type="button" role="tab" aria-selected="true" data-markdown-editor-view="split"><span aria-hidden="true">▣</span>分栏</button><button class="markdown-editor-view" type="button" role="tab" aria-selected="false" data-markdown-editor-view="preview"><span aria-hidden="true">◉</span>预览</button></div>
      <div class="markdown-editor-actions"><button class="secondary-button" type="button" data-markdown-editor-action="new" title="新建文档">＋ 新建</button><button class="secondary-button" type="button" data-markdown-editor-action="copy-markdown" title="复制 Markdown 源码">▣ 复制</button><button class="secondary-button" type="button" data-markdown-editor-action="fullscreen" title="进入全屏">↗ 全屏</button><button class="primary-button" type="button" data-markdown-editor-action="save" title="保存 Markdown 文件">↓ 保存</button><span class="markdown-editor-status" id="markdown-editor-status">本地草稿</span></div>
    </div>
    <div class="markdown-editor-formatbar" role="toolbar" aria-label="Markdown 格式工具栏"><label class="markdown-editor-heading-select"><span class="sr-only">标题级别</span><select id="markdown-editor-heading" aria-label="标题级别"><option value="1" selected>Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option><option value="5">Heading 5</option><option value="6">Heading 6</option></select></label><span class="markdown-editor-divider" aria-hidden="true"></span><button type="button" data-markdown-editor-format="bold" title="粗体"><b>B</b></button><button type="button" data-markdown-editor-format="italic" title="斜体"><i>I</i></button><button type="button" data-markdown-editor-format="strike" title="删除线"><s>S</s></button><button type="button" data-markdown-editor-format="code" title="行内代码">&lt;/&gt;</button><span class="markdown-editor-divider" aria-hidden="true"></span><button type="button" data-markdown-editor-format="unordered" title="无序列表">•</button><button type="button" data-markdown-editor-format="ordered" title="有序列表">1.</button><button type="button" data-markdown-editor-format="task" title="任务列表">☑</button><button type="button" data-markdown-editor-format="quote" title="引用">❯</button><span class="markdown-editor-divider" aria-hidden="true"></span><button type="button" data-markdown-editor-format="link" title="链接">↗</button><button type="button" data-markdown-editor-format="image" title="图片">▧</button><button type="button" data-markdown-editor-format="table" title="表格">▦</button><button type="button" data-markdown-editor-format="code-block" title="代码块">[ ]</button><button type="button" data-markdown-editor-format="math" title="公式">Σ</button><button type="button" data-markdown-editor-format="hr" title="分隔线">—</button><span class="markdown-editor-toolbar-hint">Markdown · 本地编辑</span></div>
    <div class="markdown-editor-layout" data-markdown-editor-layout data-markdown-view="split"><section class="workspace-card markdown-editor-input-card" data-markdown-editor-pane="source"><div class="workspace-card-head"><div><strong>源码编辑</strong><small>标准 Markdown 源码，输入时实时同步预览</small></div><span class="code-badge">MD</span></div><div class="markdown-editor-edit-shell"><div class="markdown-editor-line-numbers" id="markdown-editor-line-numbers" aria-hidden="true">1</div><textarea id="markdown-editor-input" spellcheck="false" wrap="off" aria-label="Markdown 编辑区"># ByeTools Markdown\n\n在这里编辑 Markdown 文档，右侧会实时显示预览。\n\n## 常用语法\n\n- 支持标题、列表和引用\n- 支持 **粗体**、*斜体* 和 \`行内代码\`\n\n> 所有内容只在当前设备处理。</textarea></div><div class="workspace-card-foot"><span id="markdown-editor-count">0 字符 · 0 行</span><button class="text-button" type="button" data-markdown-editor-action="clear">清空</button></div></section><section class="workspace-card markdown-editor-visual-card" data-markdown-editor-pane="visual"><div class="workspace-card-head"><div><strong>编辑</strong><small>所见即所得编辑，格式会同步为 Markdown</small></div><span class="code-badge">EDIT</span></div><div class="markdown-editor-visual" id="markdown-editor-visual" contenteditable="true" role="textbox" aria-label="Markdown 可视化编辑区" spellcheck="false"></div><div class="workspace-card-foot"><span>可视化编辑</span><span>自动同步源码</span></div></section><section class="workspace-card markdown-editor-preview-card" data-markdown-editor-pane="preview"><div class="workspace-card-head"><div><strong>实时预览</strong><small>渲染后的 Markdown 文档</small></div><div class="markdown-preview-actions"><span class="code-badge">PREVIEW</span><button class="text-button" type="button" data-markdown-editor-action="copy-html">复制 HTML</button></div></div><div class="markdown-editor-preview" id="markdown-editor-preview"></div><div class="workspace-card-foot"><span>本地渲染</span><span id="markdown-editor-preview-meta">实时更新</span></div></section></div>
  </div>`;
}

function diffWorkbenchMarkup() {
  return `<div class="special-workbench diff-workbench">
    <div class="special-toolbar"><span class="toolbar-label">按行比较文本差异</span><button class="primary-button" data-tool-action="diff-compare">开始对比</button><button class="secondary-button" data-tool-action="diff-swap">交换内容</button><button class="secondary-button" data-tool-action="diff-clear">清空</button><button class="secondary-button" data-tool-action="diff-copy">复制结果</button><span class="special-toolbar-note"><i></i>适合文本、JSON 和 Properties 文件</span></div>
    <div class="diff-input-grid"><section class="workspace-card"><div class="workspace-card-head"><div><strong>原文</strong><small>基准版本</small></div><span class="code-badge">A</span></div><textarea id="diff-left" spellcheck="false">name=ByeTools
version=0.1
mode=local</textarea></section><section class="workspace-card"><div class="workspace-card-head"><div><strong>新文</strong><small>待比较版本</small></div><span class="code-badge">B</span></div><textarea id="diff-right" spellcheck="false">name=ByeTools
version=0.2
mode=local
theme=dark</textarea></section></div>
    <section class="workspace-card diff-result-card"><div class="workspace-card-head"><div><strong>差异结果</strong><small>新增、删除和未变化行</small></div><span id="diff-status">等待对比</span></div><div class="diff-stats" id="diff-stats"></div><div class="diff-result" id="diff-result"></div></section>
  </div>`;
}

const cronFieldDefinitions = [
  { key: 'second', label: '秒', unit: '秒', min: 0, max: 59, every: '每秒执行' },
  { key: 'minute', label: '分', unit: '分钟', min: 0, max: 59, every: '每分钟执行' },
  { key: 'hour', label: '时', unit: '小时', min: 0, max: 23, every: '每小时执行' },
  { key: 'day', label: '日', unit: '日', min: 1, max: 31, every: '每天执行' },
  { key: 'month', label: '月', unit: '月', min: 1, max: 12, every: '每月执行' },
  { key: 'week', label: '周', unit: '周', min: 1, max: 7, every: '每周执行' },
  { key: 'year', label: '年', unit: '年', min: 1970, max: 2099, every: '每年执行' },
];

const cronExamples = [
  ['0 0 12 * * ?', '每天中午 12 点执行'],
  ['0 0 0 * * ?', '每天凌晨 0 点执行'],
  ['0 */5 * * * ?', '每隔 5 分钟执行'],
  ['0 0 */1 * * ?', '每小时整点执行'],
  ['0 30 9 ? * MON-FRI', '工作日上午 9:30 执行'],
];

function cronWorkbenchMarkup() {
  return `<div class="special-workbench cron-workbench">
    <div class="cron-expression-bar"><label><span>Cron 表达式</span><input id="cron-expression" type="text" value="0 0 12 * * ?" spellcheck="false" autocomplete="off" /></label><button class="primary-button" data-tool-action="cron-parse">解析</button><button class="secondary-button" data-tool-action="cron-save">保存</button><button class="secondary-button" data-tool-action="cron-copy">复制</button><span class="cron-expression-status" id="cron-expression-status">Quartz 6 字段</span></div>
    <div class="cron-layout"><section class="cron-config-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>可视化配置器</strong><small>字段配置与表达式实时同步</small></div></div><div class="cron-field-tabs" id="cron-field-tabs" role="tablist" aria-label="Cron 字段"></div><div class="cron-field-config" id="cron-field-config"></div><div class="cron-expression-table" id="cron-expression-table"></div></section><aside class="cron-side-column"><section class="cron-side-card"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>常用示例</strong><small>点击示例快速填充</small></div><button class="link-button" data-tool-action="cron-help">表达式详解</button></div><div class="cron-examples" id="cron-examples"></div></section><section class="cron-side-card cron-history-card"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>历史记录</strong><small>保存在当前设备</small></div><button class="link-button" data-tool-action="cron-clear-history">清空</button></div><div class="cron-history" id="cron-history"></div></section></aside></div>
    <section class="cron-explanation"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>表达式说明</strong><small>根据当前字段给出可读描述</small></div></div><div class="cron-explanation-text" id="cron-explanation-text"></div></section>
    <section class="cron-runs-card"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>执行时间预览</strong><small>近 15 次</small></div><span class="cron-now-label" id="cron-now-label"></span></div><div class="cron-runs" id="cron-runs"></div></section>
  </div>`;
}

function randomWorkbenchMarkup() {
  return `<div class="special-workbench random-workbench">
    <div class="special-toolbar random-toolbar"><label class="special-select-field"><span>生成类型</span><select id="random-type"><option value="integer">整数</option><option value="decimal">小数</option><option value="boolean">布尔值</option><option value="uuid">UUID v4</option><option value="hex">十六进制</option><option value="base64">Base64 令牌</option><option value="string">随机字符串</option><option value="color">颜色值</option><option value="date">日期时间</option><option value="ip">IPv4 地址</option><option value="binary">二进制</option></select></label><label class="special-number-field random-count-field"><span>生成数量</span><input id="random-count" type="number" min="1" max="20" value="5" aria-label="生成数量" /></label><button class="primary-button" data-tool-action="random-generate">生成随机值</button><button class="secondary-button" data-tool-action="random-copy">复制全部</button><button class="secondary-button" data-tool-action="random-export">导出 CSV</button><button class="secondary-button" data-tool-action="random-clear">清空</button><span class="special-toolbar-note"><i></i>使用浏览器安全随机源 · 结果仅保存在当前页面</span></div>
    <div class="random-layout"><section class="random-settings-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>生成参数</strong><small>根据类型调整范围和格式</small></div></div><div id="random-settings"></div><div class="random-tip"><span>i</span><p>生成结果使用当前设备的安全随机源，适合开发测试和临时数据构造。</p></div></section><section class="workspace-card random-output-card"><div class="workspace-card-head"><div><strong>生成结果</strong><small id="random-output-caption">等待生成</small></div><span class="code-badge" id="random-output-badge">VALUES</span></div><div class="random-output" id="random-output"></div><div class="workspace-card-foot"><span id="random-status">准备就绪</span><span id="random-output-meta"></span></div></section></div>
  </div>`;
}

function passwordWorkbenchMarkup() {
  return `<div class="special-workbench password-workbench">
    <section class="password-result-panel"><div class="password-result-header"><div class="password-result-copy"><span class="password-result-label">批量生成结果</span><strong id="password-output-count">等待生成</strong></div><div class="password-result-actions"><button class="secondary-button" data-tool-action="password-copy">复制全部</button><button class="secondary-button" data-tool-action="password-export">导出 CSV</button></div></div><div class="password-output-list" id="password-output-list"></div><div class="password-strength"><span class="password-strength-track"><i id="password-strength-bar"></i></span><b id="password-strength-label">等待生成</b></div></section>
    <button class="password-generate-button" type="button" data-tool-action="password-generate"><span aria-hidden="true">↻</span>生成密码</button>
    <div class="password-layout"><section class="password-options-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>生成参数</strong><small>选择数量、长度和字符组成</small></div></div><label class="password-count-field"><span>生成数量<b id="password-count-value">1</b></span><input id="password-count" type="number" min="1" max="50" value="1" inputmode="numeric" /></label><label class="password-range-field"><span>密码长度<b id="password-length-value">16</b></span><input id="password-length" type="range" min="8" max="64" value="16" /></label><div class="password-option-grid"><label class="password-option is-selected"><input type="checkbox" id="password-uppercase" checked /><span class="password-option-symbol">Aa</span><span><b>大写字母</b><small>A-Z</small></span><i>✓</i></label><label class="password-option is-selected"><input type="checkbox" id="password-lowercase" checked /><span class="password-option-symbol password-option-symbol-lower">abc</span><span><b>小写字母</b><small>a-z</small></span><i>✓</i></label><label class="password-option is-selected"><input type="checkbox" id="password-numbers" checked /><span class="password-option-symbol">123</span><span><b>数字</b><small>0-9</small></span><i>✓</i></label><label class="password-option is-selected"><input type="checkbox" id="password-symbols" checked /><span class="password-option-symbol password-option-symbol-special">!@#</span><span><b>特殊字符</b><small>!@#$%</small></span><i>✓</i></label></div><label class="password-custom-field"><span>自定义特殊字符</span><input id="password-custom-symbols" type="text" value="!@#$%^&*()_+-=[]{}|;:,.<>?" spellcheck="false" /></label><label class="password-check-field"><input type="checkbox" id="password-avoid-ambiguous" checked /><span>排除易混淆字符</span><small>如 0、O、l、1、I</small></label></section><aside class="password-info-panel"><div class="panel-heading"><span class="panel-heading-mark"></span><div><strong>密码提示</strong><small>适合开发环境临时使用</small></div></div><div class="password-info-list"><div><b>安全随机</b><span>使用浏览器安全随机数生成器</span></div><div><b>本地处理</b><span>密码不会上传或写入服务器</span></div><div><b>推荐长度</b><span>普通账号建议 16 位以上</span></div></div><div class="password-warning">密码只在当前页面生成，复制或导出后请按项目安全规范保存。</div></aside></div>
  </div>`;
}

function uuidGeneratorWorkbenchMarkup() {
  return `<div class="special-workbench generator-tool-workbench uuid-generator-workbench">
    <div class="generator-toolbar"><div class="generator-toolbar-copy"><span class="toolbar-label">UUID v4 生成器</span><span class="generator-toolbar-note"><i></i>浏览器安全随机源 · 本地生成</span></div><div class="generator-toolbar-actions"><button class="primary-button" type="button" data-generator-action="uuid-generate">生成 UUID</button><button class="secondary-button" type="button" data-generator-action="uuid-copy">复制全部</button><button class="secondary-button" type="button" data-generator-action="uuid-export">导出 CSV</button><button class="secondary-button" type="button" data-generator-action="uuid-clear">清空</button></div></div>
    <div class="generator-tool-layout"><section class="workspace-card generator-config-card"><div class="workspace-card-head"><div><strong>生成参数</strong><small>控制数量和输出格式</small></div><span class="code-badge">OPTIONS</span></div><div class="generator-form"><label class="generator-field"><span>生成数量</span><input id="uuid-count" type="number" min="1" max="50" value="5" inputmode="numeric" /></label><label class="generator-field"><span>字母大小写</span><select id="uuid-case"><option value="lower" selected>小写</option><option value="upper">大写</option></select></label><label class="generator-check-field"><input id="uuid-hyphens" type="checkbox" checked /><span><b>保留连接符</b><small>标准 8-4-4-4-12 格式</small></span></label></div><div class="generator-callout"><strong>UUID v4</strong><span>随机生成符合 RFC 4122 版本和变体规范的标识符。</span></div></section><section class="workspace-card generator-output-card"><div class="workspace-card-head"><div><strong>生成结果</strong><small id="uuid-output-caption">等待生成</small></div><span class="code-badge">UUID</span></div><div class="generator-output-list" id="uuid-output-list"></div><div class="workspace-card-foot"><span id="uuid-status">准备就绪</span><span id="uuid-output-meta"></span></div></section></div>
  </div>`;
}

function randomStringWorkbenchMarkup() {
  return `<div class="special-workbench generator-tool-workbench string-generator-workbench">
    <div class="generator-toolbar"><div class="generator-toolbar-copy"><span class="toolbar-label">随机字符串生成器</span><span class="generator-toolbar-note"><i></i>可用于测试数据、临时标识和令牌</span></div><div class="generator-toolbar-actions"><button class="primary-button" type="button" data-generator-action="string-generate">生成字符串</button><button class="secondary-button" type="button" data-generator-action="string-copy">复制全部</button><button class="secondary-button" type="button" data-generator-action="string-export">导出 CSV</button><button class="secondary-button" type="button" data-generator-action="string-clear">清空</button></div></div>
    <div class="generator-tool-layout"><section class="workspace-card generator-config-card"><div class="workspace-card-head"><div><strong>生成参数</strong><small>选择长度和字符组成</small></div><span class="code-badge">OPTIONS</span></div><div class="generator-form generator-form-grid"><label class="generator-field"><span>生成数量</span><input id="string-count" type="number" min="1" max="50" value="5" inputmode="numeric" /></label><label class="generator-field"><span>字符串长度</span><input id="string-length" type="number" min="1" max="256" value="16" inputmode="numeric" /></label></div><div class="generator-option-grid"><label class="generator-option is-selected"><input type="checkbox" id="string-uppercase" checked /><span class="generator-option-symbol">Aa</span><span><b>大写字母</b><small>A-Z</small></span><i>✓</i></label><label class="generator-option is-selected"><input type="checkbox" id="string-lowercase" checked /><span class="generator-option-symbol generator-option-symbol-lower">abc</span><span><b>小写字母</b><small>a-z</small></span><i>✓</i></label><label class="generator-option is-selected"><input type="checkbox" id="string-numbers" checked /><span class="generator-option-symbol">123</span><span><b>数字</b><small>0-9</small></span><i>✓</i></label><label class="generator-option"><input type="checkbox" id="string-symbols" /><span class="generator-option-symbol generator-option-symbol-special">!@#</span><span><b>特殊字符</b><small>自定义字符</small></span><i>✓</i></label></div><label class="generator-custom-field"><span>自定义特殊字符</span><input id="string-custom-symbols" type="text" value="-_" spellcheck="false" placeholder="例如：-_@" /></label><label class="generator-check-field"><input type="checkbox" id="string-avoid-ambiguous" checked /><span><b>排除易混淆字符</b><small>如 0、O、l、1、I</small></span></label><div class="generator-callout" id="string-pool-summary">当前字符集：大写、小写、数字</div></section><section class="workspace-card generator-output-card"><div class="workspace-card-head"><div><strong>生成结果</strong><small id="string-output-caption">等待生成</small></div><span class="code-badge">STRING</span></div><div class="generator-output-list" id="string-output-list"></div><div class="workspace-card-foot"><span id="string-status">准备就绪</span><span id="string-output-meta"></span></div></section></div>
  </div>`;
}

function slugWorkbenchMarkup() {
  return `<div class="special-workbench generator-tool-workbench slug-workbench">
    <div class="generator-toolbar"><div class="generator-toolbar-copy"><span class="toolbar-label">Slug 生成器</span><span class="generator-toolbar-note"><i></i>输入内容后实时生成 URL 友好文本</span></div><div class="generator-toolbar-actions"><button class="secondary-button" type="button" data-generator-action="slug-copy">复制结果</button><button class="secondary-button" type="button" data-generator-action="slug-download">导出文本</button><button class="secondary-button" type="button" data-generator-action="slug-clear">清空</button></div></div>
    <div class="slug-generator-layout"><section class="workspace-card generator-input-card"><div class="workspace-card-head"><div><strong>原始文本</strong><small>标题、文章名称或页面路径</small></div><span class="code-badge">INPUT</span></div><textarea id="slug-input" spellcheck="false" placeholder="输入要转换的标题或文本…">ByeTools 开发者工具箱：常用工具集合</textarea><div class="workspace-card-foot"><span id="slug-input-meta">0 个字符</span><span>实时处理</span></div></section><section class="workspace-card generator-config-card"><div class="workspace-card-head"><div><strong>转换设置</strong><small>控制 URL 文本的格式</small></div><span class="code-badge">OPTIONS</span></div><div class="generator-form"><label class="generator-field"><span>分隔符</span><select id="slug-separator"><option value="-" selected>连字符（-）</option><option value="_">下划线（_）</option><option value=".">点号（.）</option></select></label><label class="generator-field"><span>最大长度</span><input id="slug-max-length" type="number" min="10" max="180" value="80" inputmode="numeric" /></label><label class="generator-check-field"><input id="slug-lowercase" type="checkbox" checked /><span><b>转换为小写</b><small>统一 URL 文本格式</small></span></label><label class="generator-check-field"><input id="slug-keep-chinese" type="checkbox" checked /><span><b>保留中文字符</b><small>关闭后仅保留字母和数字</small></span></label></div><div class="generator-callout" id="slug-rule-summary">等待输入内容</div></section><section class="workspace-card generator-output-card slug-result-card"><div class="workspace-card-head"><div><strong>Slug 结果</strong><small>可直接用于 URL、文件名或 CSS 类名</small></div><span class="code-badge">SLUG</span></div><div class="slug-result-body"><code id="slug-output">等待转换</code><button class="slug-copy-button" type="button" data-generator-action="slug-copy">复制</button></div><div class="workspace-card-foot"><span id="slug-status">准备就绪</span><span id="slug-output-meta"></span></div></section></div>
  </div>`;
}

function fakeDataWorkbenchMarkup() {
  return `<div class="special-workbench generator-tool-workbench fake-data-workbench">
    <div class="generator-toolbar"><div class="generator-toolbar-copy"><span class="toolbar-label">假数据生成器</span><span class="generator-toolbar-note"><i></i>本地生成 · 适合接口联调和页面原型</span></div><div class="generator-toolbar-actions"><button class="primary-button" type="button" data-generator-action="fake-generate">生成数据</button><button class="secondary-button" type="button" data-generator-action="fake-copy">复制 JSON</button><button class="secondary-button" type="button" data-generator-action="fake-export-json">导出 JSON</button><button class="secondary-button" type="button" data-generator-action="fake-export-csv">导出 CSV</button><button class="secondary-button" type="button" data-generator-action="fake-clear">清空</button></div></div>
    <div class="fake-data-layout"><section class="workspace-card generator-config-card"><div class="workspace-card-head"><div><strong>数据参数</strong><small>选择数据类型和生成数量</small></div><span class="code-badge">OPTIONS</span></div><div class="generator-form"><label class="generator-field"><span>数据类型</span><select id="fake-data-type"><option value="user" selected>用户</option><option value="address">地址</option><option value="company">公司</option><option value="product">商品</option><option value="order">订单</option></select></label><label class="generator-field"><span>生成数量</span><input id="fake-data-count" type="number" min="1" max="50" value="5" inputmode="numeric" /></label></div><div class="fake-schema" id="fake-data-schema"></div><div class="generator-callout">数据只保存在当前页面，不代表真实用户或真实业务数据。</div></section><section class="workspace-card fake-output-card"><div class="workspace-card-head"><div><strong>生成结果</strong><small id="fake-output-caption">等待生成</small></div><span class="code-badge">JSON</span></div><pre class="fake-output" id="fake-data-output" aria-live="polite"></pre><div class="workspace-card-foot"><span id="fake-status">准备就绪</span><span id="fake-output-meta"></span></div></section></div>
  </div>`;
}

function gradientWorkbenchMarkup() {
  return `<div class="special-workbench design-workbench gradient-workbench">
    <div class="design-toolbar"><div class="design-toolbar-copy"><span class="toolbar-label">渐变生成器</span><span class="design-toolbar-note"><i></i>实时预览 CSS 渐变效果</span></div><div class="design-toolbar-actions"><button class="primary-button" type="button" data-design-action="gradient-apply">更新预览</button><button class="secondary-button" type="button" data-design-action="gradient-copy">复制 CSS</button><button class="secondary-button" type="button" data-design-action="gradient-reset">重置</button></div></div>
    <div class="design-tool-layout gradient-layout"><section class="workspace-card design-settings-card"><div class="workspace-card-head"><div><strong>渐变参数</strong><small>选择类型、方向和颜色节点</small></div><span class="code-badge">OPTIONS</span></div><div class="design-form"><label class="design-field"><span>渐变类型</span><select id="gradient-type"><option value="linear" selected>线性渐变</option><option value="radial">径向渐变</option><option value="conic">锥形渐变</option></select></label><label class="design-field" id="gradient-angle-field"><span>方向角度 <b id="gradient-angle-value">135°</b></span><input id="gradient-angle" type="range" min="0" max="360" value="135" /></label></div><div class="design-section-heading"><strong>颜色节点</strong><span id="gradient-stop-count">3 / 5</span></div><div class="gradient-stops" id="gradient-stops"></div><button class="design-add-button" type="button" data-design-action="gradient-add-stop">+ 添加颜色节点</button><div class="design-callout"><strong>CSS 渐变</strong><span>颜色节点会按位置排序，适合直接复制到 background 或 background-image。</span></div></section><section class="workspace-card design-preview-card"><div class="workspace-card-head"><div><strong>效果预览</strong><small id="gradient-preview-caption">实时更新</small></div><span class="code-badge">PREVIEW</span></div><div class="gradient-preview-surface" id="gradient-preview"></div><div class="design-code-block"><div><span>CSS 代码</span><button class="text-button" type="button" data-design-action="gradient-copy">复制</button></div><code id="gradient-css"></code></div><div class="workspace-card-foot"><span id="gradient-status">准备就绪</span><span id="gradient-output-meta"></span></div></section></div>
  </div>`;
}

function shadowWorkbenchMarkup() {
  return `<div class="special-workbench design-workbench shadow-workbench">
    <div class="design-toolbar"><div class="design-toolbar-copy"><span class="toolbar-label">阴影生成器</span><span class="design-toolbar-note"><i></i>支持多层阴影和内阴影</span></div><div class="design-toolbar-actions"><button class="primary-button" type="button" data-design-action="shadow-apply">更新预览</button><button class="secondary-button" type="button" data-design-action="shadow-copy">复制 CSS</button><button class="secondary-button" type="button" data-design-action="shadow-reset">重置</button></div></div>
    <div class="design-tool-layout shadow-layout"><section class="workspace-card design-settings-card"><div class="workspace-card-head"><div><strong>阴影图层</strong><small>调整偏移、模糊、扩散和透明度</small></div><span class="code-badge" id="shadow-layer-count">1 LAYER</span></div><div class="shadow-layers" id="shadow-layers"></div><button class="design-add-button" type="button" data-design-action="shadow-add-layer">+ 添加阴影图层</button><div class="design-form shadow-extra-form"><label class="design-field"><span>预览圆角 <b id="shadow-radius-value">16px</b></span><input id="shadow-radius" type="range" min="0" max="48" value="16" /></label></div><div class="design-callout"><strong>box-shadow</strong><span>最多添加 3 层阴影，图层顺序会保持与 CSS 输出一致。</span></div></section><section class="workspace-card design-preview-card"><div class="workspace-card-head"><div><strong>效果预览</strong><small id="shadow-preview-caption">实时更新</small></div><span class="code-badge">PREVIEW</span></div><div class="shadow-preview-stage"><div class="shadow-preview-sample" id="shadow-preview">ByeTools</div></div><div class="design-code-block"><div><span>CSS 代码</span><button class="text-button" type="button" data-design-action="shadow-copy">复制</button></div><code id="shadow-css"></code></div><div class="workspace-card-foot"><span id="shadow-status">准备就绪</span><span id="shadow-output-meta"></span></div></section></div>
  </div>`;
}

function contrastWorkbenchMarkup() {
  return `<div class="special-workbench design-workbench contrast-workbench">
    <div class="design-toolbar"><div class="design-toolbar-copy"><span class="toolbar-label">对比度检查</span><span class="design-toolbar-note"><i></i>依据 WCAG 2.2 检查文本可读性</span></div><div class="design-toolbar-actions"><button class="secondary-button" type="button" data-design-action="contrast-swap">交换颜色</button><button class="secondary-button" type="button" data-design-action="contrast-copy">复制报告</button><button class="secondary-button" type="button" data-design-action="contrast-reset">重置</button></div></div>
    <div class="contrast-layout"><section class="workspace-card contrast-input-card"><div class="workspace-card-head"><div><strong>颜色设置</strong><small>输入 HEX、RGB 或使用取色器</small></div><span class="code-badge">COLORS</span></div><div class="contrast-color-form"><div class="contrast-color-field"><div><span>文字颜色</span><input id="contrast-foreground-picker" type="color" value="#111827" aria-label="选择文字颜色" /></div><input id="contrast-foreground" type="text" value="#111827" spellcheck="false" aria-label="输入文字颜色" /></div><div class="contrast-color-field"><div><span>背景颜色</span><input id="contrast-background-picker" type="color" value="#ffffff" aria-label="选择背景颜色" /></div><input id="contrast-background" type="text" value="#ffffff" spellcheck="false" aria-label="输入背景颜色" /></div><label class="design-field"><span>示例文字大小</span><select id="contrast-text-size"><option value="normal" selected>普通文本（16px）</option><option value="large">大号文本（24px / 粗体）</option></select></label></div><div class="contrast-input-note"><span>AA</span><p>普通文本建议至少 4.5:1，大号文本建议至少 3:1。</p></div></section><section class="workspace-card contrast-preview-card"><div class="workspace-card-head"><div><strong>可读性预览</strong><small id="contrast-preview-caption">实时更新</small></div><span class="code-badge">PREVIEW</span></div><div class="contrast-preview" id="contrast-preview"><strong id="contrast-preview-title">ByeTools 开发者工具箱</strong><span id="contrast-preview-copy">清晰的颜色对比让内容更容易阅读</span></div><div class="contrast-ratio-hero"><span>对比度</span><strong id="contrast-ratio">--</strong><small id="contrast-ratio-note">请输入有效颜色</small></div></section></div>
    <section class="workspace-card contrast-results-card"><div class="workspace-card-head"><div><strong>WCAG 检查结果</strong><small>同时查看普通文本和大号文本等级</small></div><span class="code-badge">WCAG 2.2</span></div><div class="contrast-result-grid" id="contrast-results"></div><div class="workspace-card-foot"><span id="contrast-status">准备就绪</span><span id="contrast-output-meta"></span></div></section>
  </div>`;
}

function paletteWorkbenchMarkup() {
  return `<div class="special-workbench design-workbench palette-workbench">
    <div class="design-toolbar"><div class="design-toolbar-copy"><span class="toolbar-label">调色板生成器</span><span class="design-toolbar-note"><i></i>生成可直接用于项目的颜色方案</span></div><div class="design-toolbar-actions"><button class="primary-button" type="button" data-design-action="palette-generate">生成调色板</button><button class="secondary-button" type="button" data-design-action="palette-copy">复制 CSS</button><button class="secondary-button" type="button" data-design-action="palette-export">导出 JSON</button><button class="secondary-button" type="button" data-design-action="palette-reset">重置</button></div></div>
    <div class="design-tool-layout palette-layout"><section class="workspace-card design-settings-card"><div class="workspace-card-head"><div><strong>调色板参数</strong><small>从基础色生成色阶或配色关系</small></div><span class="code-badge">OPTIONS</span></div><div class="design-form"><label class="design-field"><span>基础颜色</span><div class="design-color-input"><input id="palette-picker" type="color" value="#6366f1" aria-label="选择基础颜色" /><input id="palette-base" type="text" value="#6366f1" spellcheck="false" aria-label="输入基础颜色" /></div></label><label class="design-field"><span>配色方式</span><select id="palette-scheme"><option value="scale" selected>单色阶梯</option><option value="complementary">互补配色</option><option value="analogous">类似色</option><option value="triadic">三角色</option></select></label><label class="design-field"><span>色阶数量</span><select id="palette-count"><option value="5">5 个</option><option value="7" selected>7 个</option><option value="9">9 个</option><option value="11">11 个</option></select></label></div><div class="design-callout"><strong>COLOR SYSTEM</strong><span>点击色块可复制单个颜色，右侧 CSS 变量可直接粘贴到主题文件。</span></div></section><section class="workspace-card palette-result-card"><div class="workspace-card-head"><div><strong>调色板预览</strong><small id="palette-preview-caption">实时生成</small></div><span class="code-badge" id="palette-count-label">7 COLORS</span></div><div class="palette-swatches" id="palette-swatches"></div><div class="palette-code-block"><div><span>CSS 变量</span><button class="text-button" type="button" data-design-action="palette-copy">复制</button></div><code id="palette-css"></code></div><div class="workspace-card-foot"><span id="palette-status">准备就绪</span><span id="palette-output-meta"></span></div></section></div>
  </div>`;
}

function pxRemWorkbenchMarkup() {
  return `<div class="special-workbench design-workbench px-rem-workbench">
    <div class="design-toolbar"><div class="design-toolbar-copy"><span class="toolbar-label">px / rem 换算器</span><span class="design-toolbar-note"><i></i>按根字号快速换算 CSS 尺寸</span></div><div class="design-toolbar-actions"><button class="secondary-button" type="button" data-design-action="px-copy">复制全部</button><button class="secondary-button" type="button" data-design-action="px-reset">重置</button></div></div>
    <div class="design-tool-layout px-rem-layout"><section class="workspace-card design-settings-card"><div class="workspace-card-head"><div><strong>换算参数</strong><small>输入一个尺寸并选择单位</small></div><span class="code-badge">INPUT</span></div><div class="design-form"><label class="design-field"><span>数值</span><input id="px-rem-value" type="number" step="any" value="16" inputmode="decimal" /></label><label class="design-field"><span>输入单位</span><select id="px-rem-unit"><option value="px" selected>px</option><option value="rem">rem</option><option value="em">em</option></select></label><label class="design-field"><span>根字号</span><div class="design-input-with-suffix"><input id="px-rem-root" type="number" step="any" min="1" max="64" value="16" inputmode="decimal" /><span>px</span></div></label><label class="design-field"><span>小数位数</span><select id="px-rem-precision"><option value="0">0 位</option><option value="1">1 位</option><option value="2" selected>2 位</option><option value="3">3 位</option><option value="4">4 位</option></select></label></div><div class="px-rem-quick"><span>常用值</span><button type="button" data-px-rem-quick="8">8</button><button type="button" data-px-rem-quick="12">12</button><button type="button" data-px-rem-quick="16">16</button><button type="button" data-px-rem-quick="24">24</button><button type="button" data-px-rem-quick="32">32</button></div></section><section class="workspace-card px-rem-result-card"><div class="workspace-card-head"><div><strong>换算结果</strong><small id="px-rem-result-caption">实时计算</small></div><span class="code-badge">RESULT</span></div><div class="px-rem-results" id="px-rem-results"></div><div class="px-rem-css-preview"><span>CSS 示例</span><code id="px-rem-css"></code></div><div class="workspace-card-foot"><span id="px-rem-status">准备就绪</span><span id="px-rem-output-meta"></span></div></section></div>
  </div>`;
}

function secureRandomInt(max) {
  const limit = Math.max(1, Math.floor(Number(max)));
  if (window.crypto?.getRandomValues) {
    if (limit <= 0x100000000) {
      const values = new Uint32Array(1);
      const ceiling = Math.floor(0x100000000 / limit) * limit;
      do { window.crypto.getRandomValues(values); } while (values[0] >= ceiling);
      return values[0] % limit;
    }
    const values = new Uint32Array(2);
    const range = 2 ** 53;
    const safeLimit = Math.min(limit, Number.MAX_SAFE_INTEGER);
    const ceiling = Math.floor(range / safeLimit) * safeLimit;
    let value;
    do { window.crypto.getRandomValues(values); value = values[0] * 0x200000 + (values[1] >>> 11); } while (value >= ceiling);
    return value % safeLimit;
  }
  return Math.floor(Math.random() * limit);
}

function randomFromCharset(charset, length) {
  return Array.from({ length }, () => charset[secureRandomInt(charset.length)]).join('');
}

function secureRandomBytes(length) {
  const bytes = new Uint8Array(length);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes); else bytes.forEach((_, index) => { bytes[index] = secureRandomInt(256); });
  return bytes;
}

function randomUuid() {
  const bytes = secureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const randomCharset = { letters: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', mixed: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789', numbers: '0123456789' };

function randomSettingsMarkup(type) {
  if (type === 'integer') return `<div class="random-field-grid"><label><span>最小值</span><input id="random-min" type="number" value="1" /></label><label><span>最大值</span><input id="random-max" type="number" value="100" /></label></div><p class="random-field-hint">包含边界值，支持负数</p>`;
  if (type === 'decimal') return `<div class="random-field-grid"><label><span>最小值</span><input id="random-min" type="number" value="0" step="any" /></label><label><span>最大值</span><input id="random-max" type="number" value="1" step="any" /></label></div><label class="random-single-field"><span>小数位数</span><input id="random-decimals" type="number" min="0" max="12" value="3" /></label>`;
  if (type === 'hex') return `<label class="random-single-field"><span>字节长度</span><input id="random-length" type="number" min="1" max="128" value="16" /></label><p class="random-field-hint">每个字节由两位十六进制字符表示</p>`;
  if (type === 'base64') return `<label class="random-single-field"><span>字节长度</span><input id="random-length" type="number" min="1" max="128" value="24" /></label><p class="random-field-hint">适合生成临时令牌和测试数据</p>`;
  if (type === 'string') return `<div class="random-field-grid"><label><span>字符串长度</span><input id="random-length" type="number" min="1" max="256" value="16" /></label><label><span>字符集</span><select id="random-charset"><option value="mixed">字母 + 数字</option><option value="letters">仅字母</option><option value="numbers">仅数字</option></select></label></div>`;
  if (type === 'date') return `<div class="random-field-grid"><label><span>开始日期</span><input id="random-start-date" type="date" value="2025-01-01" /></label><label><span>结束日期</span><input id="random-end-date" type="date" value="2026-12-31" /></label></div><p class="random-field-hint">随机生成日期时间，精确到秒</p>`;
  if (type === 'boolean') return `<div class="random-type-note"><span class="random-type-note-icon">01</span><div><b>true / false</b><small>等概率生成布尔值</small></div></div>`;
  if (type === 'uuid') return `<div class="random-field-grid random-uuid-settings"><label><span>字母大小写</span><select id="random-uuid-case"><option value="lower">小写</option><option value="upper">大写</option></select></label><label class="random-check-field"><input id="random-uuid-hyphens" type="checkbox" checked /><span>保留连接符</span><small>8-4-4-4-12 标准格式</small></label></div><p class="random-field-hint">版本和变体位保持符合 UUID v4 规范</p>`;
  if (type === 'color') return `<div class="random-type-note"><span class="random-type-note-icon">#</span><div><b>#RRGGBB</b><small>生成可直接使用的十六进制颜色值</small></div></div>`;
  if (type === 'ip') return `<div class="random-type-note"><span class="random-type-note-icon">IP</span><div><b>IPv4 地址</b><small>生成 0-255 范围内的测试地址</small></div></div>`;
  if (type === 'binary') return `<label class="random-single-field"><span>二进制位数</span><input id="random-length" type="number" min="1" max="256" value="16" /></label>`;
  return '';
}

function randomBase64(length) {
  const bytes = secureRandomBytes(length);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function randomValue(type, content) {
  const numberValue = (id, fallback) => Number(content.querySelector(id)?.value ?? fallback);
  if (type === 'integer') { const min = numberValue('#random-min', 1); const max = numberValue('#random-max', 100); return String(Math.floor(Math.min(min, max) + secureRandomInt(Math.floor(Math.abs(max - min)) + 1))); }
  if (type === 'decimal') { const min = numberValue('#random-min', 0); const max = numberValue('#random-max', 1); const decimals = Math.max(0, Math.min(12, numberValue('#random-decimals', 3))); return (Math.min(min, max) + (Math.max(min, max) - Math.min(min, max)) * (secureRandomInt(1000000) / 1000000)).toFixed(decimals); }
  if (type === 'boolean') return secureRandomInt(2) === 1 ? 'true' : 'false';
  if (type === 'uuid') {
    const value = randomUuid();
    const withCase = content.querySelector('#random-uuid-case')?.value === 'upper' ? value.toUpperCase() : value.toLowerCase();
    return content.querySelector('#random-uuid-hyphens')?.checked === false ? withCase.replace(/-/g, '') : withCase;
  }
  if (type === 'hex') return [...secureRandomBytes(numberValue('#random-length', 16))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (type === 'base64') return randomBase64(numberValue('#random-length', 24));
  if (type === 'string') return randomFromCharset(randomCharset[content.querySelector('#random-charset')?.value || 'mixed'], Math.max(1, numberValue('#random-length', 16)));
  if (type === 'color') return `#${randomFromCharset('0123456789abcdef', 6)}`;
  if (type === 'ip') return Array.from({ length: 4 }, () => secureRandomInt(256)).join('.');
  if (type === 'date') { const start = new Date(`${content.querySelector('#random-start-date')?.value || '2025-01-01'}T00:00:00`).getTime(); const end = new Date(`${content.querySelector('#random-end-date')?.value || '2026-12-31'}T23:59:59`).getTime(); const lower = Math.min(start, end); const upper = Math.max(start, end); return new Date(lower + secureRandomInt(Math.max(1, upper - lower + 1))).toLocaleString('zh-CN'); }
  if (type === 'binary') return randomFromCharset('01', Math.max(1, numberValue('#random-length', 16)));
  return '';
}

function bindRandomWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const type = content.querySelector('#random-type');
  const count = content.querySelector('#random-count');
  const settings = content.querySelector('#random-settings');
  const output = content.querySelector('#random-output');
  const caption = content.querySelector('#random-output-caption');
  const badge = content.querySelector('#random-output-badge');
  const status = content.querySelector('#random-status');
  const meta = content.querySelector('#random-output-meta');
  let generatedValues = [];
  const renderSettings = () => { settings.innerHTML = randomSettingsMarkup(type.value); };
  const generate = () => {
    const amount = Math.max(1, Math.min(20, Number(count.value) || 1));
    count.value = String(amount);
    const values = Array.from({ length: amount }, () => randomValue(type.value, content));
    generatedValues = values;
    output.innerHTML = values.map((value, index) => { const escapedValue = escapeHtml(value); const colorPreview = type.value === 'color' ? `<span class="random-color-swatch" role="img" style="background-color: ${escapedValue}" title="颜色预览 ${escapedValue}" aria-label="颜色预览 ${escapedValue}"></span>` : ''; const rowClass = type.value === 'color' ? ' random-output-row-color' : ''; return `<div class="random-output-row${rowClass}">${colorPreview}<span class="random-output-index">${String(index + 1).padStart(2, '0')}</span><code>${escapedValue}</code><button type="button" data-random-value="${escapedValue}" title="复制此结果">复制</button></div>`; }).join('');
    caption.textContent = `${amount} 个结果 · ${type.options[type.selectedIndex].text}`;
    badge.textContent = type.value.toUpperCase();
    status.textContent = '生成完成';
    status.className = 'crypto-status-success';
    meta.textContent = `${values.join('').length} 个字符`;
  };
  type.addEventListener('change', () => { renderSettings(); generate(); });
  settings.addEventListener('change', (event) => { if (type.value === 'uuid' && event.target.matches('#random-uuid-case, #random-uuid-hyphens')) generate(); });
  content.querySelector('[data-tool-action="random-generate"]').addEventListener('click', generate);
  content.querySelector('[data-tool-action="random-copy"]').addEventListener('click', () => { if (!generatedValues.length) { showToast('没有可复制的随机结果'); return; } copyText(generatedValues.join('\n')).then(() => showToast('随机结果已复制')); });
  content.querySelector('[data-tool-action="random-export"]').addEventListener('click', () => { if (!generatedValues.length) { showToast('没有可导出的随机结果'); return; } const typeLabel = type.options[type.selectedIndex]?.text || type.value; downloadCsv(['序号', '生成类型', '结果'], generatedValues.map((value, index) => [index + 1, typeLabel, value]), 'byetools-random.csv', '随机结果已导出'); });
  content.querySelector('[data-tool-action="random-clear"]').addEventListener('click', () => { generatedValues = []; output.innerHTML = '<div class="special-empty"><strong>结果已清空</strong><small>点击生成按钮重新创建随机值</small></div>'; status.textContent = '等待生成'; status.className = ''; meta.textContent = ''; caption.textContent = '等待生成'; badge.textContent = 'VALUES'; });
  output.addEventListener('click', (event) => { const button = event.target.closest('[data-random-value]'); if (button) copyText(button.dataset.randomValue).then(() => showToast('结果已复制')); });
  renderSettings();
  generate();
}

function passwordPool(content) {
  const avoid = content.querySelector('#password-avoid-ambiguous')?.checked;
  const removeAmbiguous = (value) => avoid ? value.replace(/[0Ol1I|]/g, '') : value;
  const pools = [];
  if (content.querySelector('#password-uppercase')?.checked) pools.push(removeAmbiguous('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  if (content.querySelector('#password-lowercase')?.checked) pools.push(removeAmbiguous('abcdefghijklmnopqrstuvwxyz'));
  if (content.querySelector('#password-numbers')?.checked) pools.push(removeAmbiguous('0123456789'));
  if (content.querySelector('#password-symbols')?.checked) pools.push(removeAmbiguous(content.querySelector('#password-custom-symbols')?.value || '!@#$%^&*'));
  return pools.filter(Boolean);
}

function passwordStrength(length, poolCount) {
  const score = Math.min(100, Math.round((length / 32) * 52 + poolCount * 12));
  return score < 45 ? ['较弱', 'weak'] : score < 72 ? ['中等', 'medium'] : ['高强度', 'strong'];
}

function bindPasswordWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const outputList = content.querySelector('#password-output-list');
  const outputCount = content.querySelector('#password-output-count');
  const count = content.querySelector('#password-count');
  const countLabel = content.querySelector('#password-count-value');
  const length = content.querySelector('#password-length');
  const lengthLabel = content.querySelector('#password-length-value');
  const strengthLabel = content.querySelector('#password-strength-label');
  const strengthBar = content.querySelector('#password-strength-bar');
  let generatedValues = [];
  const buildPassword = (pools, targetLength) => {
    const all = pools.join('');
    const chars = pools.map((pool) => pool[secureRandomInt(pool.length)]);
    while (chars.length < targetLength) chars.push(all[secureRandomInt(all.length)]);
    for (let index = chars.length - 1; index > 0; index -= 1) { const swap = secureRandomInt(index + 1); [chars[index], chars[swap]] = [chars[swap], chars[index]]; }
    return chars.join('');
  };
  const generate = () => {
    const pools = passwordPool(content);
    const amount = Math.max(1, Math.min(50, Math.trunc(Number(count.value)) || 1));
    const targetLength = Math.max(8, Math.min(64, Math.trunc(Number(length.value)) || 16));
    count.value = String(amount);
    length.value = String(targetLength);
    countLabel.textContent = String(amount);
    lengthLabel.textContent = String(targetLength);
    if (!pools.length) { generatedValues = []; outputCount.textContent = '无法生成'; outputList.innerHTML = '<div class="special-empty"><strong>请至少选择一种字符类型</strong><small>选择字符类型后重新生成</small></div>'; strengthLabel.textContent = '无法生成'; strengthLabel.className = 'password-strength-label-weak'; strengthBar.style.width = '0%'; strengthBar.className = 'is-empty'; return; }
    generatedValues = Array.from({ length: amount }, () => buildPassword(pools, targetLength));
    outputCount.textContent = `${amount} 条密码 · ${targetLength} 位`;
    outputList.innerHTML = generatedValues.map((value, index) => `<div class="password-output-row"><span>${String(index + 1).padStart(2, '0')}</span><code>${escapeHtml(value)}</code><button class="secondary-button" type="button" data-password-value="${escapeHtml(value)}">复制</button></div>`).join('');
    const [label, level] = passwordStrength(targetLength, pools.length);
    strengthLabel.textContent = label;
    strengthLabel.className = `password-strength-label-${level}`;
    strengthBar.style.width = `${level === 'strong' ? 100 : level === 'medium' ? 68 : 38}%`;
    strengthBar.className = `password-strength-bar-${level}`;
  };
  content.querySelector('[data-tool-action="password-generate"]').addEventListener('click', generate);
  content.querySelector('[data-tool-action="password-copy"]').addEventListener('click', () => { if (!generatedValues.length) { showToast('没有可复制的密码'); return; } copyText(generatedValues.join('\n')).then(() => showToast('密码列表已复制')); });
  content.querySelector('[data-tool-action="password-export"]').addEventListener('click', () => { if (!generatedValues.length) { showToast('没有可导出的密码'); return; } downloadCsv(['序号', '密码长度', '密码'], generatedValues.map((value, index) => [index + 1, value.length, value]), 'byetools-passwords.csv', '密码已导出'); });
  outputList.addEventListener('click', (event) => { const button = event.target.closest('[data-password-value]'); if (button) copyText(button.dataset.passwordValue).then(() => showToast('密码已复制')); });
  count.addEventListener('input', () => { countLabel.textContent = String(Math.max(1, Math.min(50, Number(count.value) || 1))); });
  length.addEventListener('input', () => { lengthLabel.textContent = length.value; });
  content.querySelectorAll('.password-option input, #password-custom-symbols, #password-avoid-ambiguous').forEach((field) => field.addEventListener('change', () => { field.closest('.password-option')?.classList.toggle('is-selected', field.checked); generate(); }));
  content.querySelector('#password-custom-symbols').addEventListener('input', generate);
  generate();
}

function generatorEmptyMarkup(title, detail) {
  return `<div class="special-empty"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></div>`;
}

function generatorValue(value, fallback, min, max) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Math.trunc(Number.isFinite(number) ? number : fallback)));
}

function bindUuidGeneratorWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const output = content.querySelector('#uuid-output-list');
  const caption = content.querySelector('#uuid-output-caption');
  const status = content.querySelector('#uuid-status');
  const meta = content.querySelector('#uuid-output-meta');
  let generatedValues = [];
  const generate = () => {
    const count = generatorValue(content.querySelector('#uuid-count').value, 5, 1, 50);
    const upper = content.querySelector('#uuid-case').value === 'upper';
    const hyphens = content.querySelector('#uuid-hyphens').checked;
    generatedValues = Array.from({ length: count }, () => {
      const value = randomUuid();
      const formatted = upper ? value.toUpperCase() : value.toLowerCase();
      return hyphens ? formatted : formatted.replace(/-/g, '');
    });
    content.querySelector('#uuid-count').value = String(count);
    output.innerHTML = generatedValues.map((value, index) => `<div class="generator-output-row"><span>${String(index + 1).padStart(2, '0')}</span><code>${escapeHtml(value)}</code><button class="secondary-button" type="button" data-generator-value="${escapeHtml(value)}">复制</button></div>`).join('');
    caption.textContent = `${count} 个结果 · ${hyphens ? '标准格式' : '无连接符'}`;
    status.textContent = '生成完成';
    status.className = 'text-tool-status is-success';
    meta.textContent = `${generatedValues.join('').length} 个字符`;
  };
  const clear = () => { generatedValues = []; output.innerHTML = generatorEmptyMarkup('结果已清空', '点击生成按钮重新创建 UUID'); caption.textContent = '等待生成'; status.textContent = '等待生成'; status.className = 'text-tool-status'; meta.textContent = ''; };
  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-generator-action], [data-generator-value]');
    if (!button) return;
    const action = button.dataset.generatorAction;
    if (button.dataset.generatorValue) copyText(button.dataset.generatorValue).then(() => showToast('UUID 已复制'));
    if (action === 'uuid-generate') generate();
    if (action === 'uuid-copy') { if (!generatedValues.length) { showToast('没有可复制的 UUID'); return; } copyText(generatedValues.join('\n')).then(() => showToast('UUID 列表已复制')); }
    if (action === 'uuid-export') { if (!generatedValues.length) { showToast('没有可导出的 UUID'); return; } downloadCsv(['序号', 'UUID'], generatedValues.map((value, index) => [index + 1, value]), 'byetools-uuid.csv', 'UUID 已导出'); }
    if (action === 'uuid-clear') clear();
  });
  content.addEventListener('change', (event) => { if (event.target.matches('#uuid-count, #uuid-case, #uuid-hyphens')) generate(); });
  generate();
}

function stringGeneratorPools(content) {
  const avoid = content.querySelector('#string-avoid-ambiguous').checked;
  const clean = (value) => avoid ? value.replace(/[0Ol1I|]/g, '') : value;
  const pools = [];
  const labels = [];
  if (content.querySelector('#string-uppercase').checked) { pools.push(clean('ABCDEFGHIJKLMNOPQRSTUVWXYZ')); labels.push('大写'); }
  if (content.querySelector('#string-lowercase').checked) { pools.push(clean('abcdefghijklmnopqrstuvwxyz')); labels.push('小写'); }
  if (content.querySelector('#string-numbers').checked) { pools.push(clean('0123456789')); labels.push('数字'); }
  if (content.querySelector('#string-symbols').checked) { pools.push(clean(content.querySelector('#string-custom-symbols').value || '-_')); labels.push('符号'); }
  return { pools: pools.filter(Boolean), labels };
}

function randomStringFromPools(pools, length) {
  const charset = pools.join('');
  const chars = [];
  if (length >= pools.length) pools.forEach((pool) => chars.push(pool[secureRandomInt(pool.length)]));
  while (chars.length < length) chars.push(charset[secureRandomInt(charset.length)]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = secureRandomInt(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join('');
}

function bindRandomStringWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const output = content.querySelector('#string-output-list');
  const caption = content.querySelector('#string-output-caption');
  const status = content.querySelector('#string-status');
  const meta = content.querySelector('#string-output-meta');
  const poolSummary = content.querySelector('#string-pool-summary');
  let generatedValues = [];
  const generate = () => {
    const count = generatorValue(content.querySelector('#string-count').value, 5, 1, 50);
    const length = generatorValue(content.querySelector('#string-length').value, 16, 1, 256);
    const { pools, labels } = stringGeneratorPools(content);
    content.querySelector('#string-count').value = String(count);
    content.querySelector('#string-length').value = String(length);
    poolSummary.textContent = pools.length ? `当前字符集：${labels.join('、')}${content.querySelector('#string-avoid-ambiguous').checked ? ' · 已排除易混淆字符' : ''}` : '请至少选择一种字符类型';
    if (!pools.length) { generatedValues = []; output.innerHTML = generatorEmptyMarkup('无法生成字符串', '选择字符类型后重新生成'); caption.textContent = '等待生成'; status.textContent = '输入有误'; status.className = 'text-tool-status is-error'; meta.textContent = ''; return; }
    generatedValues = Array.from({ length: count }, () => randomStringFromPools(pools, length));
    output.innerHTML = generatedValues.map((value, index) => `<div class="generator-output-row"><span>${String(index + 1).padStart(2, '0')}</span><code>${escapeHtml(value)}</code><button class="secondary-button" type="button" data-generator-value="${escapeHtml(value)}">复制</button></div>`).join('');
    caption.textContent = `${count} 个结果 · ${length} 位`;
    status.textContent = '生成完成';
    status.className = 'text-tool-status is-success';
    meta.textContent = `${generatedValues.join('').length} 个字符`;
  };
  const clear = () => { generatedValues = []; output.innerHTML = generatorEmptyMarkup('结果已清空', '点击生成按钮重新创建字符串'); caption.textContent = '等待生成'; status.textContent = '等待生成'; status.className = 'text-tool-status'; meta.textContent = ''; };
  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-generator-action], [data-generator-value]');
    if (!button) return;
    const action = button.dataset.generatorAction;
    if (button.dataset.generatorValue) copyText(button.dataset.generatorValue).then(() => showToast('字符串已复制'));
    if (action === 'string-generate') generate();
    if (action === 'string-copy') { if (!generatedValues.length) { showToast('没有可复制的字符串'); return; } copyText(generatedValues.join('\n')).then(() => showToast('字符串列表已复制')); }
    if (action === 'string-export') { if (!generatedValues.length) { showToast('没有可导出的字符串'); return; } downloadCsv(['序号', '字符串长度', '结果'], generatedValues.map((value, index) => [index + 1, value.length, value]), 'byetools-random-strings.csv', '字符串已导出'); }
    if (action === 'string-clear') clear();
  });
  content.addEventListener('change', (event) => { if (event.target.matches('#string-count, #string-length, #string-uppercase, #string-lowercase, #string-numbers, #string-symbols, #string-avoid-ambiguous')) { event.target.closest('.generator-option')?.classList.toggle('is-selected', event.target.checked); generate(); } });
  content.addEventListener('input', (event) => { if (event.target.matches('#string-custom-symbols')) generate(); });
  generate();
}

function slugifyValue(value, options) {
  let text = String(value || '');
  try { text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (error) { text = text.replace(/[\u0300-\u036f]/g, ''); }
  text = text.replace(/&/g, ' and ');
  const invalid = options.keepChinese ? /[^\p{L}\p{N}]+/gu : /[^A-Za-z0-9]+/g;
  text = text.replace(invalid, options.separator);
  const repeated = new RegExp(`${escapeRegExp(options.separator)}+`, 'g');
  text = text.replace(repeated, options.separator).replace(new RegExp(`^${escapeRegExp(options.separator)}|${escapeRegExp(options.separator)}$`, 'g'), '');
  if (options.lowercase) text = text.toLocaleLowerCase('zh-CN');
  text = text.slice(0, options.maxLength).replace(new RegExp(`${escapeRegExp(options.separator)}$`), '');
  return text;
}

function bindSlugWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#slug-input');
  const output = content.querySelector('#slug-output');
  const preview = content.querySelector('#slug-rule-summary');
  const status = content.querySelector('#slug-status');
  const outputMeta = content.querySelector('#slug-output-meta');
  let currentValue = '';
  const render = () => {
    const separator = content.querySelector('#slug-separator').value;
    const maxLength = generatorValue(content.querySelector('#slug-max-length').value, 80, 10, 180);
    const options = { separator, maxLength, lowercase: content.querySelector('#slug-lowercase').checked, keepChinese: content.querySelector('#slug-keep-chinese').checked };
    content.querySelector('#slug-max-length').value = String(maxLength);
    currentValue = slugifyValue(input.value, options);
    output.textContent = currentValue || '等待转换';
    content.querySelector('#slug-input-meta').textContent = `${[...input.value].length} 个字符`;
    outputMeta.textContent = currentValue ? `${[...currentValue].length} 个字符 · 最长 ${maxLength}` : '';
    preview.textContent = currentValue ? `规则：${options.lowercase ? '小写' : '保留大小写'} · ${options.keepChinese ? '保留中文' : '仅字母数字'} · 分隔符 ${separator}` : '等待输入内容';
    status.textContent = currentValue ? '已实时生成' : '等待输入';
    status.className = `text-tool-status ${currentValue ? 'is-success' : ''}`.trim();
  };
  content.addEventListener('click', (event) => {
    const action = event.target.closest('[data-generator-action]')?.dataset.generatorAction;
    if (action === 'slug-copy') { if (!currentValue) { showToast('没有可复制的 Slug'); return; } copyText(currentValue).then(() => showToast('Slug 已复制')); }
    if (action === 'slug-download') { if (!currentValue) { showToast('没有可导出的 Slug'); return; } downloadTextFile(currentValue, 'byetools-slug.txt'); showToast('Slug 已导出'); }
    if (action === 'slug-clear') { input.value = ''; render(); input.focus(); }
  });
  content.addEventListener('input', (event) => { if (event.target.matches('#slug-input, #slug-max-length')) render(); });
  content.addEventListener('change', render);
  render();
}

const fakeDataDefinitions = {
  user: { label: '用户', fields: ['id', 'name', 'email', 'phone', 'role', 'createdAt'] },
  address: { label: '地址', fields: ['id', 'province', 'city', 'district', 'street', 'zipCode'] },
  company: { label: '公司', fields: ['id', 'name', 'industry', 'contact', 'phone', 'website'] },
  product: { label: '商品', fields: ['id', 'name', 'category', 'price', 'stock', 'status'] },
  order: { label: '订单', fields: ['orderNo', 'customer', 'amount', 'status', 'createdAt', 'items'] },
};

const fakeNames = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '周磊', '吴倩', '徐浩'];
const fakeProvinces = [['北京市', '北京市', '朝阳区'], ['上海市', '上海市', '浦东新区'], ['广东省', '深圳市', '南山区'], ['浙江省', '杭州市', '西湖区'], ['四川省', '成都市', '武侯区'], ['湖北省', '武汉市', '洪山区']];
const fakeIndustries = ['软件开发', '电子商务', '智能制造', '企业服务', '数字媒体', '信息安全'];
const fakeProducts = [['开发者键盘', '办公设备'], ['云端存储套餐', '软件服务'], ['接口监控服务', '开发工具'], ['数据分析报表', '企业服务'], ['项目协作空间', '效率工具'], ['安全审计服务', '信息安全']];

function fakeRandomPick(list) { return list[secureRandomInt(list.length)]; }
function fakeDigits(length) { return Array.from({ length }, () => String(secureRandomInt(10))).join(''); }
function fakeDateTime() { return new Date(Date.now() - secureRandomInt(90 * 86400000)).toISOString().slice(0, 19).replace('T', ' '); }
function fakeRecord(type) {
  const name = fakeRandomPick(fakeNames);
  const phone = `1${fakeRandomPick(['3', '5', '7', '8', '9'])}${fakeDigits(9)}`;
  if (type === 'user') return { id: `usr_${fakeDigits(8)}`, name, email: `user${fakeDigits(5)}@example.com`, phone, role: fakeRandomPick(['管理员', '开发者', '访客', '测试人员']), createdAt: fakeDateTime() };
  if (type === 'address') { const [province, city, district] = fakeRandomPick(fakeProvinces); return { id: `addr_${fakeDigits(8)}`, province, city, district, street: `${fakeRandomPick(['科技', '创新', '建设', '人民'])}路 ${secureRandomInt(180) + 1} 号`, zipCode: fakeDigits(6) }; }
  if (type === 'company') return { id: `cmp_${fakeDigits(8)}`, name: `${fakeRandomPick(['星云', '蓝桥', '远见', '云杉', '启明'])}${fakeRandomPick(['科技', '信息', '网络', '软件'])}有限公司`, industry: fakeRandomPick(fakeIndustries), contact: name, phone, website: `https://www.example.com/${fakeDigits(6)}` };
  if (type === 'product') { const [product, category] = fakeRandomPick(fakeProducts); return { id: `prd_${fakeDigits(8)}`, name: product, category, price: (secureRandomInt(98000) / 100 + 20).toFixed(2), stock: secureRandomInt(980) + 20, status: fakeRandomPick(['在售', '预售', '缺货']) }; }
  const items = Array.from({ length: secureRandomInt(3) + 1 }, () => { const [product] = fakeRandomPick(fakeProducts); return { name: product, quantity: secureRandomInt(3) + 1 }; });
  return { orderNo: `BY${new Date().getFullYear()}${fakeDigits(10)}`, customer: name, amount: (secureRandomInt(198000) / 100 + 20).toFixed(2), status: fakeRandomPick(['待付款', '处理中', '已完成', '已取消']), createdAt: fakeDateTime(), items };
}

function bindFakeDataWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const output = content.querySelector('#fake-data-output');
  const schema = content.querySelector('#fake-data-schema');
  const caption = content.querySelector('#fake-output-caption');
  const status = content.querySelector('#fake-status');
  const meta = content.querySelector('#fake-output-meta');
  let records = [];
  const renderSchema = () => { const type = content.querySelector('#fake-data-type').value; const definition = fakeDataDefinitions[type]; schema.innerHTML = `<div class="fake-schema-title">字段预览</div><div class="fake-schema-fields">${definition.fields.map((field) => `<span>${escapeHtml(field)}</span>`).join('')}</div>`; };
  const generate = () => {
    const type = content.querySelector('#fake-data-type').value;
    const count = generatorValue(content.querySelector('#fake-data-count').value, 5, 1, 50);
    content.querySelector('#fake-data-count').value = String(count);
    records = Array.from({ length: count }, () => fakeRecord(type));
    const text = JSON.stringify(records, null, 2);
    output.textContent = text;
    caption.textContent = `${count} 条${fakeDataDefinitions[type].label}数据`;
    status.textContent = '生成完成';
    status.className = 'text-tool-status is-success';
    meta.textContent = `${text.length} 个字符`;
  };
  const clear = () => { records = []; output.textContent = ''; caption.textContent = '等待生成'; status.textContent = '等待生成'; status.className = 'text-tool-status'; meta.textContent = ''; };
  content.addEventListener('click', (event) => {
    const action = event.target.closest('[data-generator-action]')?.dataset.generatorAction;
    if (!action) return;
    const type = content.querySelector('#fake-data-type').value;
    if (action === 'fake-generate') generate();
    if (action === 'fake-copy') { if (!records.length) { showToast('没有可复制的假数据'); return; } copyText(output.textContent).then(() => showToast('JSON 数据已复制')); }
    if (action === 'fake-export-json') { if (!records.length) { showToast('没有可导出的假数据'); return; } downloadTextFile(output.textContent, `byetools-${type}-data.json`, 'application/json;charset=utf-8'); showToast('JSON 文件已导出'); }
    if (action === 'fake-export-csv') { if (!records.length) { showToast('没有可导出的假数据'); return; } const headers = fakeDataDefinitions[type].fields; downloadCsv(headers, records.map((record) => headers.map((field) => typeof record[field] === 'object' ? JSON.stringify(record[field]) : record[field])), `byetools-${type}-data.csv`, 'CSV 文件已导出'); }
    if (action === 'fake-clear') clear();
  });
  content.addEventListener('change', (event) => { if (event.target.matches('#fake-data-type')) { renderSchema(); generate(); } });
  renderSchema();
  generate();
}

function designColorPickerValue(value, fallback = '#6366f1') {
  const parsed = parseColorValue(value);
  return parsed ? rgbToHex(parsed) : fallback;
}

function designRgba(value, alpha) {
  const parsed = parseColorValue(value) || { r: 0, g: 0, b: 0, a: 1 };
  const opacity = Math.max(0, Math.min(1, Number.isFinite(Number(alpha)) ? Number(alpha) : parsed.a));
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${Number(opacity.toFixed(3))})`;
}

function bindGradientWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const type = content.querySelector('#gradient-type');
  const angle = content.querySelector('#gradient-angle');
  const angleValue = content.querySelector('#gradient-angle-value');
  const angleField = content.querySelector('#gradient-angle-field');
  const stopsNode = content.querySelector('#gradient-stops');
  const stopCount = content.querySelector('#gradient-stop-count');
  const preview = content.querySelector('#gradient-preview');
  const cssOutput = content.querySelector('#gradient-css');
  const status = content.querySelector('#gradient-status');
  const meta = content.querySelector('#gradient-output-meta');
  let stops = [{ color: '#6366f1', position: 0 }, { color: '#a855f7', position: 48 }, { color: '#ec4899', position: 100 }];
  let currentCss = '';
  const renderStops = () => {
    stopsNode.innerHTML = stops.map((stop, index) => {
      const pickerValue = designColorPickerValue(stop.color);
      return `<div class="gradient-stop-row"><span class="gradient-stop-index">${String(index + 1).padStart(2, '0')}</span><input class="gradient-stop-picker" type="color" value="${pickerValue}" data-gradient-index="${index}" data-gradient-picker="true" aria-label="选择第 ${index + 1} 个颜色" /><input class="gradient-stop-color" type="text" value="${escapeHtml(stop.color)}" data-gradient-index="${index}" data-gradient-property="color" spellcheck="false" aria-label="第 ${index + 1} 个颜色值" /><label class="gradient-stop-position"><input type="number" min="0" max="100" value="${stop.position}" data-gradient-index="${index}" data-gradient-property="position" aria-label="第 ${index + 1} 个颜色位置" /><span>%</span></label><button class="design-remove-button" type="button" data-design-action="gradient-remove-stop" data-gradient-index="${index}" ${stops.length <= 2 ? 'disabled' : ''} aria-label="删除第 ${index + 1} 个颜色节点">×</button></div>`;
    }).join('');
    stopCount.textContent = `${stops.length} / 5`;
  };
  const setStatus = (value, className = '') => { status.textContent = value; status.className = `design-status ${className}`.trim(); };
  const render = () => {
    const gradientType = type.value;
    const angleNumber = Math.max(0, Math.min(360, Math.trunc(Number(angle.value) || 0)));
    angle.value = String(angleNumber);
    angleValue.textContent = `${angleNumber}°`;
    angleField.hidden = gradientType === 'radial';
    const ordered = stops.map((stop, index) => ({ ...stop, index, position: Math.max(0, Math.min(100, Number(stop.position) || 0)) })).sort((left, right) => left.position - right.position);
    const invalid = ordered.find((stop) => !parseColorValue(stop.color));
    if (invalid) {
      currentCss = '';
      preview.style.background = 'var(--bg-soft)';
      cssOutput.textContent = '请输入有效的颜色值';
      meta.textContent = '颜色格式有误';
      setStatus('输入有误', 'is-error');
      return;
    }
    const colors = ordered.map((stop) => `${stop.color.trim()} ${stop.position}%`).join(', ');
    currentCss = gradientType === 'radial' ? `radial-gradient(circle, ${colors})` : `${gradientType}-gradient(${angleNumber}deg, ${colors})`;
    preview.style.background = currentCss;
    cssOutput.textContent = `background: ${currentCss};`;
    meta.textContent = `${stops.length} 个颜色节点`;
    setStatus('预览已更新', 'is-success');
  };
  const reset = () => { stops = [{ color: '#6366f1', position: 0 }, { color: '#a855f7', position: 48 }, { color: '#ec4899', position: 100 }]; type.value = 'linear'; syncBtSelect(type); angle.value = '135'; renderStops(); render(); };
  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-design-action]');
    if (!button) return;
    const action = button.dataset.designAction;
    if (action === 'gradient-copy') { if (!currentCss) { showToast('没有可复制的 CSS'); return; } copyText(`background: ${currentCss};`).then(() => showToast('渐变 CSS 已复制')); }
    if (action === 'gradient-apply') render();
    if (action === 'gradient-reset') reset();
    if (action === 'gradient-add-stop' && stops.length < 5) { stops.splice(stops.length - 1, 0, { color: '#f97316', position: 75 }); renderStops(); render(); }
    if (action === 'gradient-remove-stop' && stops.length > 2) { stops.splice(Number(button.dataset.gradientIndex), 1); renderStops(); render(); }
  });
  content.addEventListener('input', (event) => {
    const field = event.target;
    if (field.matches('#gradient-angle')) { render(); return; }
    const index = Number(field.dataset.gradientIndex);
    if (!Number.isInteger(index) || !stops[index]) return;
    if (field.dataset.gradientPicker) { stops[index].color = field.value; const textField = stopsNode.querySelector(`[data-gradient-index="${index}"][data-gradient-property="color"]`); if (textField) textField.value = field.value; }
    else if (field.dataset.gradientProperty === 'color') stops[index].color = field.value;
    else if (field.dataset.gradientProperty === 'position') stops[index].position = field.value;
    render();
  });
  type.addEventListener('change', render); renderStops(); render();
}

function bindShadowWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const layersNode = content.querySelector('#shadow-layers');
  const layerCount = content.querySelector('#shadow-layer-count');
  const radius = content.querySelector('#shadow-radius');
  const radiusValue = content.querySelector('#shadow-radius-value');
  const preview = content.querySelector('#shadow-preview');
  const cssOutput = content.querySelector('#shadow-css');
  const status = content.querySelector('#shadow-status');
  const meta = content.querySelector('#shadow-output-meta');
  let layers = [{ x: 0, y: 12, blur: 26, spread: -6, color: '#111827', opacity: 0.18, inset: false }];
  let currentCss = '';
  const renderLayers = () => {
    layersNode.innerHTML = layers.map((layer, index) => `<div class="shadow-layer" data-shadow-index="${index}"><div class="shadow-layer-head"><strong>图层 ${index + 1}</strong><button class="design-remove-button" type="button" data-design-action="shadow-remove-layer" data-shadow-index="${index}" ${layers.length <= 1 ? 'disabled' : ''} aria-label="删除第 ${index + 1} 个阴影图层">×</button></div><div class="shadow-field-grid"><label class="design-field"><span>X 偏移</span><input type="number" value="${layer.x}" data-shadow-index="${index}" data-shadow-property="x" /></label><label class="design-field"><span>Y 偏移</span><input type="number" value="${layer.y}" data-shadow-index="${index}" data-shadow-property="y" /></label><label class="design-field"><span>模糊</span><input type="number" min="0" value="${layer.blur}" data-shadow-index="${index}" data-shadow-property="blur" /></label><label class="design-field"><span>扩散</span><input type="number" value="${layer.spread}" data-shadow-index="${index}" data-shadow-property="spread" /></label></div><div class="shadow-color-row"><label class="design-field"><span>阴影颜色</span><div class="design-color-input"><input type="color" value="${designColorPickerValue(layer.color, '#111827')}" data-shadow-index="${index}" data-shadow-picker="true" aria-label="选择第 ${index + 1} 个阴影颜色" /><input type="text" value="${escapeHtml(layer.color)}" data-shadow-index="${index}" data-shadow-property="color" spellcheck="false" aria-label="输入第 ${index + 1} 个阴影颜色" /></div></label><label class="design-field"><span>透明度 <b>${Math.round(layer.opacity * 100)}%</b></span><input type="range" min="0" max="1" step="0.01" value="${layer.opacity}" data-shadow-index="${index}" data-shadow-property="opacity" /></label><label class="shadow-inset-field"><input type="checkbox" ${layer.inset ? 'checked' : ''} data-shadow-index="${index}" data-shadow-property="inset" /><span>内阴影</span></label></div></div>`).join('');
    layerCount.textContent = `${layers.length} LAYER${layers.length > 1 ? 'S' : ''}`;
  };
  const setStatus = (value, className = '') => { status.textContent = value; status.className = `design-status ${className}`.trim(); };
  const shadowCss = (layer) => `${layer.inset ? 'inset ' : ''}${Math.trunc(Number(layer.x) || 0)}px ${Math.trunc(Number(layer.y) || 0)}px ${Math.max(0, Math.trunc(Number(layer.blur) || 0))}px ${Math.trunc(Number(layer.spread) || 0)}px ${designRgba(layer.color, layer.opacity)}`;
  const render = () => {
    const radiusNumber = Math.max(0, Math.min(48, Math.trunc(Number(radius.value) || 0)));
    radius.value = String(radiusNumber); radiusValue.textContent = `${radiusNumber}px`;
    currentCss = layers.map(shadowCss).join(', ');
    preview.style.boxShadow = currentCss;
    preview.style.borderRadius = `${radiusNumber}px`;
    cssOutput.textContent = `box-shadow: ${currentCss};\nborder-radius: ${radiusNumber}px;`;
    meta.textContent = `${layers.length} 层阴影 · 圆角 ${radiusNumber}px`;
    setStatus('预览已更新', 'is-success');
  };
  const reset = () => { layers = [{ x: 0, y: 12, blur: 26, spread: -6, color: '#111827', opacity: 0.18, inset: false }]; radius.value = '16'; renderLayers(); render(); };
  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-design-action]');
    if (!button) return;
    const action = button.dataset.designAction;
    if (action === 'shadow-copy') { copyText(`box-shadow: ${currentCss};\nborder-radius: ${radius.value}px;`).then(() => showToast('阴影 CSS 已复制')); }
    if (action === 'shadow-apply') render();
    if (action === 'shadow-reset') reset();
    if (action === 'shadow-add-layer' && layers.length < 3) { layers.push({ x: 0, y: 4, blur: 10, spread: 0, color: '#6366f1', opacity: 0.14, inset: false }); renderLayers(); render(); }
    if (action === 'shadow-remove-layer' && layers.length > 1) { layers.splice(Number(button.dataset.shadowIndex), 1); renderLayers(); render(); }
  });
  content.addEventListener('input', (event) => {
    const field = event.target;
    if (field.matches('#shadow-radius')) { render(); return; }
    const index = Number(field.dataset.shadowIndex);
    if (!Number.isInteger(index) || !layers[index]) return;
    const property = field.dataset.shadowProperty;
    if (field.dataset.shadowPicker) { layers[index].color = field.value; const textField = layersNode.querySelector(`[data-shadow-index="${index}"][data-shadow-property="color"]`); if (textField) textField.value = field.value; }
    else if (property === 'inset') layers[index].inset = field.checked;
    else layers[index][property] = field.value;
    render();
  });
  content.addEventListener('change', (event) => { if (event.target.dataset.shadowProperty === 'inset') { const index = Number(event.target.dataset.shadowIndex); layers[index].inset = event.target.checked; render(); } });
  renderLayers(); render();
}

function contrastLuminance(color) {
  const channel = (value) => { const normalized = value / 255; return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrastRatioValue(foreground, background) {
  const first = contrastLuminance(foreground);
  const second = contrastLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function bindContrastWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const foreground = content.querySelector('#contrast-foreground');
  const background = content.querySelector('#contrast-background');
  const foregroundPicker = content.querySelector('#contrast-foreground-picker');
  const backgroundPicker = content.querySelector('#contrast-background-picker');
  const textSize = content.querySelector('#contrast-text-size');
  const preview = content.querySelector('#contrast-preview');
  const previewCaption = content.querySelector('#contrast-preview-caption');
  const ratioOutput = content.querySelector('#contrast-ratio');
  const ratioNote = content.querySelector('#contrast-ratio-note');
  const results = content.querySelector('#contrast-results');
  const status = content.querySelector('#contrast-status');
  const meta = content.querySelector('#contrast-output-meta');
  let currentReport = '';
  const resultItem = (label, ratio, threshold) => { const passed = ratio >= threshold; return `<div class="contrast-result-item"><div><span>${label}</span><strong>${ratio.toFixed(2)}:1</strong></div><b class="contrast-result-badge ${passed ? 'is-pass' : 'is-fail'}">${passed ? '通过' : '未通过'}</b><small>要求 ≥ ${threshold.toFixed(1)}:1</small></div>`; };
  const render = () => {
    const foregroundColor = parseColorValue(foreground.value);
    const backgroundColor = parseColorValue(background.value);
    if (!foregroundColor || !backgroundColor) { preview.style.color = 'var(--text-secondary)'; preview.style.background = 'var(--bg-soft)'; previewCaption.textContent = '请输入有效颜色'; ratioOutput.textContent = '--'; ratioNote.textContent = '支持 HEX、RGB 和 HSL'; results.innerHTML = '<div class="special-empty"><span class="special-empty-icon">Aa</span><strong>颜色值格式有误</strong><small>请检查文字颜色和背景颜色</small></div>'; status.textContent = '输入有误'; status.className = 'design-status is-error'; meta.textContent = ''; currentReport = ''; return; }
    const ratio = contrastRatioValue(foregroundColor, backgroundColor);
    const large = textSize.value === 'large';
    const foregroundCss = designRgba(foreground.value, foregroundColor.a);
    const backgroundCss = designRgba(background.value, backgroundColor.a);
    preview.style.color = foregroundCss; preview.style.background = backgroundCss; preview.classList.toggle('is-large', large);
    previewCaption.textContent = large ? '当前为大号文本预览' : '当前为普通文本预览'; ratioOutput.textContent = `${ratio.toFixed(2)}:1`; ratioNote.textContent = ratio >= 7 ? '高对比度，满足 AAA' : ratio >= 4.5 ? '满足普通文本 AA' : ratio >= 3 ? '仅满足大号文本 AA' : '低于 WCAG AA';
    results.innerHTML = `${resultItem('普通文本 · AA', ratio, 4.5)}${resultItem('普通文本 · AAA', ratio, 7)}${resultItem('大号文本 · AA', ratio, 3)}${resultItem('大号文本 · AAA', ratio, 4.5)}`;
    currentReport = `文字颜色：${foreground.value}\n背景颜色：${background.value}\n对比度：${ratio.toFixed(2)}:1\n普通文本 AA：${ratio >= 4.5 ? '通过' : '未通过'}\n普通文本 AAA：${ratio >= 7 ? '通过' : '未通过'}\n大号文本 AA：${ratio >= 3 ? '通过' : '未通过'}\n大号文本 AAA：${ratio >= 4.5 ? '通过' : '未通过'}`;
    status.textContent = '检查完成'; status.className = 'design-status is-success'; meta.textContent = ratio >= 4.5 ? '普通文本达到 AA' : '建议提高颜色对比度';
  };
  const syncPicker = (input, picker) => { const value = designColorPickerValue(input.value, picker.value); picker.value = value; };
  const reset = () => { foreground.value = '#111827'; background.value = '#ffffff'; textSize.value = 'normal'; syncBtSelect(textSize); render(); };
  content.addEventListener('click', (event) => { const button = event.target.closest('[data-design-action]'); if (!button) return; const action = button.dataset.designAction; if (action === 'contrast-swap') { [foreground.value, background.value] = [background.value, foreground.value]; syncPicker(foreground, foregroundPicker); syncPicker(background, backgroundPicker); render(); } if (action === 'contrast-copy') { if (!currentReport) { showToast('没有可复制的检查报告'); return; } copyText(currentReport).then(() => showToast('对比度报告已复制')); } if (action === 'contrast-reset') reset(); });
  content.addEventListener('input', (event) => { if (event.target === foreground) { syncPicker(foreground, foregroundPicker); render(); } else if (event.target === background) { syncPicker(background, backgroundPicker); render(); } else if (event.target === foregroundPicker) { foreground.value = foregroundPicker.value; render(); } else if (event.target === backgroundPicker) { background.value = backgroundPicker.value; render(); } });
  textSize.addEventListener('change', render); render();
}

function paletteColorFromHsl(hue, saturation, lightness) { return rgbToHex({ ...hslToRgb(hue, saturation, lightness), a: 1 }); }

function buildPaletteColors(base, scheme, count) {
  const hsl = rgbToHsl(base);
  if (scheme === 'scale') {
    const levels = count === 11 ? [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] : Array.from({ length: count }, (_, index) => index + 1);
    return levels.map((level, index) => ({ label: count === 11 ? String(level) : `色阶 ${index + 1}`, value: paletteColorFromHsl(hsl.h, Math.max(18, hsl.s), 97 - index * (86 / Math.max(1, count - 1))) }));
  }
  const offsets = scheme === 'complementary' ? [0, 180] : scheme === 'analogous' ? [-30, -15, 0, 15, 30] : [0, 120, 240];
  return Array.from({ length: count }, (_, index) => {
    const hue = hsl.h + offsets[index % offsets.length];
    const cycle = Math.floor(index / offsets.length);
    const lightness = Math.max(18, Math.min(82, hsl.l + (cycle % 2 ? 12 : cycle ? -12 : 0)));
    return { label: `色 ${index + 1}`, value: paletteColorFromHsl(hue, Math.max(28, hsl.s), lightness) };
  });
}

function bindPaletteWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const picker = content.querySelector('#palette-picker');
  const baseInput = content.querySelector('#palette-base');
  const scheme = content.querySelector('#palette-scheme');
  const countInput = content.querySelector('#palette-count');
  const swatches = content.querySelector('#palette-swatches');
  const cssOutput = content.querySelector('#palette-css');
  const countLabel = content.querySelector('#palette-count-label');
  const status = content.querySelector('#palette-status');
  const meta = content.querySelector('#palette-output-meta');
  let currentColors = [];
  let currentCss = '';
  const render = () => {
    const parsed = parseColorValue(baseInput.value);
    if (!parsed) { swatches.innerHTML = '<div class="special-empty"><span class="special-empty-icon">●</span><strong>基础颜色格式有误</strong><small>请输入有效的 HEX、RGB 或 HSL 颜色</small></div>'; cssOutput.textContent = '等待有效颜色'; countLabel.textContent = '0 COLORS'; status.textContent = '输入有误'; status.className = 'design-status is-error'; meta.textContent = ''; currentColors = []; currentCss = ''; return; }
    const count = Number(countInput.value) || 7;
    currentColors = buildPaletteColors(parsed, scheme.value, count);
    swatches.innerHTML = currentColors.map((item, index) => `<button class="palette-swatch" type="button" data-palette-value="${item.value}" title="复制 ${item.value}"><i style="background:${item.value}"></i><span>${escapeHtml(item.label)}</span><code>${item.value}</code></button>`).join('');
    currentCss = currentColors.map((item, index) => `  --color-${index + 1}: ${item.value};`).join('\n');
    cssOutput.textContent = `:root {\n${currentCss}\n}`;
    picker.value = designColorPickerValue(baseInput.value); countLabel.textContent = `${count} COLORS`; status.textContent = '生成完成'; status.className = 'design-status is-success'; meta.textContent = `${scheme.options[scheme.selectedIndex].text} · ${count} 个颜色`;
  };
  const reset = () => { baseInput.value = '#6366f1'; picker.value = '#6366f1'; scheme.value = 'scale'; countInput.value = '7'; syncBtSelect(scheme); syncBtSelect(countInput); render(); };
  content.addEventListener('click', (event) => { const button = event.target.closest('[data-design-action], [data-palette-value]'); if (!button) return; if (button.dataset.paletteValue) { copyText(button.dataset.paletteValue).then(() => showToast(`${button.dataset.paletteValue} 已复制`)); return; } const action = button.dataset.designAction; if (action === 'palette-generate') render(); if (action === 'palette-copy') { if (!currentCss) { showToast('没有可复制的 CSS'); return; } copyText(`:root {\n${currentCss}\n}`).then(() => showToast('调色板 CSS 已复制')); } if (action === 'palette-export') { if (!currentColors.length) { showToast('没有可导出的调色板'); return; } downloadTextFile(JSON.stringify({ base: baseInput.value, scheme: scheme.value, colors: currentColors }, null, 2), 'byetools-palette.json', 'application/json;charset=utf-8'); showToast('调色板 JSON 已导出'); } if (action === 'palette-reset') reset(); });
  content.addEventListener('input', (event) => { if (event.target === baseInput) { picker.value = designColorPickerValue(baseInput.value, picker.value); render(); } });
  picker.addEventListener('input', () => { baseInput.value = picker.value; render(); }); scheme.addEventListener('change', render); countInput.addEventListener('change', render); render();
}

function pxRemFormat(value, precision) { return Number(Number(value).toFixed(precision)).toString(); }

function bindPxRemWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const valueInput = content.querySelector('#px-rem-value');
  const unitInput = content.querySelector('#px-rem-unit');
  const rootInput = content.querySelector('#px-rem-root');
  const precisionInput = content.querySelector('#px-rem-precision');
  const results = content.querySelector('#px-rem-results');
  const cssOutput = content.querySelector('#px-rem-css');
  const status = content.querySelector('#px-rem-status');
  const meta = content.querySelector('#px-rem-output-meta');
  let copyValues = [];
  const render = () => {
    const value = Number(valueInput.value);
    const root = Number(rootInput.value);
    const precision = Number(precisionInput.value);
    if (!Number.isFinite(value) || !Number.isFinite(root) || root <= 0) { results.innerHTML = '<div class="special-empty"><span class="special-empty-icon">px</span><strong>请输入有效的数值</strong><small>根字号必须大于 0</small></div>'; cssOutput.textContent = '等待有效数值'; status.textContent = '输入有误'; status.className = 'design-status is-error'; meta.textContent = ''; copyValues = []; return; }
    const px = unitInput.value === 'px' ? value : value * root;
    const rem = px / root;
    const em = px / root;
    const values = [{ label: 'PX', value: `${pxRemFormat(px, precision)}px`, hint: '绝对像素尺寸' }, { label: 'REM', value: `${pxRemFormat(rem, precision)}rem`, hint: `相对于根字号 ${root}px` }, { label: 'EM', value: `${pxRemFormat(em, precision)}em`, hint: '相对于当前元素字号' }];
    copyValues = values.map((item) => item.value);
    results.innerHTML = values.map((item) => `<button class="px-rem-result-row" type="button" data-px-rem-copy="${item.value}"><span class="px-rem-result-label">${item.label}</span><strong>${item.value}</strong><small>${item.hint}</small><b>复制</b></button>`).join('');
    cssOutput.textContent = `font-size: ${values[1].value};\n/* 换算：${values[0].value} = ${values[2].value} */`;
    status.textContent = '计算完成'; status.className = 'design-status is-success'; meta.textContent = `根字号 ${root}px · 保留 ${precision} 位小数`;
  };
  const reset = () => { valueInput.value = '16'; unitInput.value = 'px'; rootInput.value = '16'; precisionInput.value = '2'; syncBtSelect(unitInput); syncBtSelect(precisionInput); render(); };
  content.addEventListener('click', (event) => { const button = event.target.closest('[data-design-action], [data-px-rem-quick], [data-px-rem-copy]'); if (!button) return; if (button.dataset.pxRemQuick) { valueInput.value = button.dataset.pxRemQuick; render(); return; } if (button.dataset.pxRemCopy) { copyText(button.dataset.pxRemCopy).then(() => showToast(`${button.dataset.pxRemCopy} 已复制`)); return; } const action = button.dataset.designAction; if (action === 'px-copy') { if (!copyValues.length) { showToast('没有可复制的换算结果'); return; } copyText(copyValues.join('\n')).then(() => showToast('换算结果已复制')); } if (action === 'px-reset') reset(); });
  content.addEventListener('input', render); content.addEventListener('change', render); render();
}

function parseIpAddress(value) {
  const input = value.trim();
  if (!input) return null;
  const ipv4 = input.match(/^((?:\d{1,3}\.){3}\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4[1].split('.').map(Number);
    if (octets.some((item) => item > 255)) return null;
    const [first, second] = octets;
    let scope = '公网地址';
    if (first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)) scope = '私有地址';
    if (first === 127) scope = '回环地址';
    if (first === 169 && second === 254) scope = '链路本地地址';
    return { version: 'IPv4', scope, normalized: octets.join('.'), valid: true };
  }
  if (/^[0-9a-f:]+$/i.test(input) && input.includes(':') && input.length <= 39) {
    const lower = input.toLowerCase();
    let scope = '公网地址';
    if (lower === '::1') scope = '回环地址';
    else if (lower.startsWith('fc') || lower.startsWith('fd')) scope = '私有地址';
    else if (lower.startsWith('fe80:')) scope = '链路本地地址';
    return { version: 'IPv6', scope, normalized: lower, valid: true };
  }
  return null;
}

function bindIpWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#ip-input');
  const result = content.querySelector('#ip-result');
  const status = content.querySelector('#ip-status');
  const queryButton = content.querySelector('[data-tool-action="ip-query"]');
  let requestController = null;
  const fetchLocation = async (address, signal) => {
    const providers = [
      {
        name: 'IPQuery',
        url: `https://api.ipquery.io/${encodeURIComponent(address)}`,
        normalize: (payload) => ({
          country: payload.location?.country,
          region: payload.location?.state,
          city: payload.location?.city,
          latitude: payload.location?.latitude,
          longitude: payload.location?.longitude,
          timezone: { id: payload.location?.timezone },
          connection: { asn: String(payload.isp?.asn || '').replace(/^AS/i, ''), isp: payload.isp?.isp, org: payload.isp?.org },
        }),
      },
      {
        name: 'FreeIPAPI',
        url: `https://free.freeipapi.com/api/json/${encodeURIComponent(address)}`,
        normalize: (payload) => ({
          country: payload.countryName,
          region: payload.regionName,
          city: payload.cityName,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timezone: { id: Array.isArray(payload.timeZones) && payload.timeZones.length === 1 ? payload.timeZones[0] : '' },
          connection: { asn: payload.asn, isp: payload.asnOrganization, org: payload.asnOrganization },
        }),
      },
    ];
    const errors = [];
    for (const provider of providers) {
      try {
        const response = await fetch(provider.url, { signal, referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const location = provider.normalize(payload);
        if (!location.country && !location.region && !location.city) throw new Error('响应缺少归属地信息');
        return { ...location, provider: provider.name };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        errors.push(`${provider.name}: ${error.message}`);
      }
    }
    throw new Error(errors.join('；'));
  };
  const renderEmpty = () => {
    const parsed = parseIpAddress(input.value);
    if (!parsed) {
      status.textContent = input.value.trim() ? '地址格式有误' : '等待查询';
      status.className = input.value.trim() ? 'crypto-status-error' : '';
      result.innerHTML = `<div class="special-empty"><span class="special-empty-icon">IP</span><strong>${input.value.trim() ? '请输入有效的 IPv4 或 IPv6 地址' : '输入地址开始查询'}</strong><small>地址识别在当前设备完成</small></div>`;
      return null;
    }
    return parsed;
  };
  const renderResult = (parsed, location = null, note = '') => {
    const locationLabel = location ? [location.country, location.region, location.city].filter(Boolean).join(' · ') || '未知' : parsed.scope === '公网地址' ? '点击查询获取' : '不适用于本地地址';
    const provider = location?.connection?.isp || location?.connection?.org || '未知';
    const asn = location?.connection?.asn ? `AS${location.connection.asn}` : '未知';
    const timezone = location?.timezone?.id ? `${location.timezone.id}${location.timezone.utc ? ` · UTC${location.timezone.utc}` : ''}` : '未知';
    const coordinates = Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude) ? `${location.latitude}, ${location.longitude}` : '未知';
    const extraRows = location ? `<div><span>运营商</span><b>${escapeHtml(provider)}</b></div><div><span>ASN</span><b>${escapeHtml(asn)}</b></div><div><span>时区</span><b>${escapeHtml(timezone)}</b></div><div><span>坐标</span><b>${escapeHtml(coordinates)}</b></div>` : '';
    result.innerHTML = `<div class="ip-hero"><span class="ip-hero-label">${escapeHtml(parsed.version)}</span><strong>${escapeHtml(parsed.normalized)}</strong><span class="ip-scope ip-scope-${parsed.scope === '公网地址' ? 'public' : 'private'}">${escapeHtml(parsed.scope)}</span></div><div class="ip-detail-grid"><div><span>地址版本</span><b>${escapeHtml(parsed.version)}</b></div><div><span>地址范围</span><b>${escapeHtml(parsed.scope)}</b></div><div><span>归属地</span><b>${escapeHtml(locationLabel)}</b></div><div><span>处理方式</span><b>${location ? '联网查询' : '本地识别'}</b></div>${extraRows}</div><div class="ip-result-note">${escapeHtml(note || (parsed.scope === '公网地址' ? '点击“查询地址”获取公网归属地和网络信息。' : '本地地址不会发送到外部归属地服务。'))}</div>`;
  };
  const renderPreview = () => {
    requestController?.abort();
    requestController = null;
    queryButton.disabled = false;
    const parsed = renderEmpty();
    if (!parsed) return;
    status.textContent = parsed.scope === '公网地址' ? '等待联网查询' : '本地识别完成';
    status.className = parsed.scope === '公网地址' ? '' : 'crypto-status-success';
    renderResult(parsed);
  };
  const query = async () => {
    requestController?.abort();
    requestController = null;
    queryButton.disabled = false;
    const parsed = renderEmpty();
    if (!parsed) return;
    if (parsed.scope !== '公网地址') {
      status.textContent = '本地识别完成';
      status.className = 'crypto-status-success';
      renderResult(parsed);
      return;
    }
    requestController = new AbortController();
    const controller = requestController;
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    queryButton.disabled = true;
    status.textContent = '正在查询';
    status.className = '';
    renderResult(parsed, null, '正在获取归属地和网络信息…');
    try {
      const location = await fetchLocation(parsed.normalized, controller.signal);
      if (requestController !== controller) return;
      status.textContent = '查询完成';
      status.className = 'crypto-status-success';
      renderResult(parsed, location, `归属地来自 ${location.provider}，仅供网络排查参考，不能用于精确定位。`);
    } catch (error) {
      if (requestController !== controller) return;
      const message = error.name === 'AbortError' ? '查询超时，请稍后重试' : error.message;
      status.textContent = '查询失败';
      status.className = 'crypto-status-error';
      renderResult(parsed, null, `归属地查询失败：${message}`);
    } finally {
      window.clearTimeout(timeoutId);
      if (requestController === controller) {
        requestController = null;
        queryButton.disabled = false;
      }
    }
  };
  queryButton.addEventListener('click', query);
  content.querySelector('[data-tool-action="ip-clear"]').addEventListener('click', () => { input.value = ''; renderPreview(); input.focus(); });
  input.addEventListener('input', renderPreview);
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') query(); });
  renderPreview();
  activeWorkspaceCleanup = () => requestController?.abort();
}

function messageQueueTargetMarkup(broker) {
  if (broker === 'kafka') return `<div class="mq-target-grid"><label class="mq-field mq-field-wide"><span>Topic</span><input id="mq-topic" type="text" value="byetools.events" spellcheck="false" placeholder="输入 Kafka Topic" /></label><label class="mq-field"><span>Group ID</span><input id="mq-group" type="text" value="byetools-consumer" spellcheck="false" placeholder="可选" /></label><label class="mq-field"><span>Partition</span><input id="mq-partition" type="number" min="0" value="0" inputmode="numeric" placeholder="自动分配" /></label></div>`;
  if (broker === 'rabbitmq') return `<div class="mq-target-grid"><label class="mq-field"><span>Exchange</span><input id="mq-exchange" type="text" value="byetools.exchange" spellcheck="false" placeholder="输入 Exchange" /></label><label class="mq-field"><span>Queue</span><input id="mq-queue" type="text" value="byetools.queue" spellcheck="false" placeholder="输入 Queue" /></label><label class="mq-field mq-field-wide"><span>Routing Key</span><input id="mq-routing-key" type="text" value="byetools.event" spellcheck="false" placeholder="输入 Routing Key" /></label></div>`;
  if (broker === 'rocketmq') return `<div class="mq-target-grid"><label class="mq-field mq-field-wide"><span>Topic</span><input id="mq-topic" type="text" value="ByeToolsTopic" spellcheck="false" placeholder="输入 RocketMQ Topic" /></label><label class="mq-field"><span>Tag / 订阅表达式</span><input id="mq-tag" type="text" value="*" spellcheck="false" placeholder="*、TagA 或 TagA || TagB" /></label><label class="mq-field"><span>Consumer Group</span><input id="mq-group" type="text" value="byetools-consumer" spellcheck="false" placeholder="输入消费组" /></label></div>`;
  return `<div class="mq-target-grid"><label class="mq-field mq-field-wide"><span>Topic</span><input id="mq-topic" type="text" value="byetools/demo" spellcheck="false" placeholder="输入 MQTT Topic" /></label><label class="mq-field"><span>QoS</span><select id="mq-qos" aria-label="MQTT 服务质量"><option value="0" data-icon="0" data-label="QoS 0" data-description="最多一次，不等待确认">QoS 0</option><option value="1" data-icon="1" data-label="QoS 1" data-description="至少一次，可能重复">QoS 1</option><option value="2" data-icon="2" data-label="QoS 2" data-description="恰好一次，完整确认">QoS 2</option></select></label><label class="mq-switch-field"><input id="mq-retain" type="checkbox" /><span><b>保留消息</b><small>让 Broker 保存最后一条消息</small></span></label></div>`;
}

function bindMessageQueueWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const broker = content.querySelector('#mq-broker');
  const targetFields = content.querySelector('#mq-target-fields');
  const targetCaption = content.querySelector('#mq-target-caption');
  const targetBadge = content.querySelector('#mq-target-badge');
  const message = content.querySelector('#mq-message');
  const messageBadge = content.querySelector('#mq-message-badge');
  const messageStatus = content.querySelector('#mq-message-status');
  const connectionStatus = content.querySelector('#mq-connection-status');
  const logBody = content.querySelector('#mq-log-body');
  const configName = content.querySelector('#mq-config-name');
  const configList = content.querySelector('#mq-config-list');
  const addressLabel = content.querySelector('#mq-address-label');
  const usernameLabel = content.querySelector('#mq-username-label');
  const passwordLabel = content.querySelector('#mq-password-label');
  const startButton = content.querySelector('[data-mq-action="consume-start"]');
  const stopButton = content.querySelector('[data-mq-action="consume-stop"]');
  let messageFormat = 'text';
  let consuming = false;
  let logs = [];
  const desktopMq = Boolean(storage?.isDesktop && storage?.desktopInvoke);
  let consumerSessionId = '';
  let consumerConfig = null;
  let unlistenMqEvent = null;

  const brokerLabels = { mqtt: 'MQTT', kafka: 'Kafka', rabbitmq: 'RabbitMQ', rocketmq: 'RocketMQ' };
  const brokerCaptions = { mqtt: ['MQTT Topic 与服务质量', 'TOPIC'], kafka: ['Kafka Topic、分区与消费组', 'TOPIC'], rabbitmq: ['RabbitMQ Exchange、Queue 与路由键', 'QUEUE'], rocketmq: ['RocketMQ 5.x Topic、Tag 与消费组', 'TOPIC'] };
  const defaultPorts = { mqtt: '1883', kafka: '9092', rabbitmq: '5672', rocketmq: '8081' };
  let previousBroker = broker.value;

  const renderStatus = (title, detail, tone = '') => {
    connectionStatus.className = `mq-status-panel${tone ? ` is-${tone}` : ''}`;
    connectionStatus.innerHTML = `<span class="mq-status-dot"></span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></div>`;
  };

  const desktopErrorMessage = (error, fallback) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return fallback;
  };

  const handleDesktopEvent = (event) => {
    const payload = event?.payload || event;
    if (!payload || payload.sessionId !== consumerSessionId) return;
    const config = consumerConfig || collectConfig();
    if (payload.event === 'message') {
      const body = payload.body || '';
      const summary = `${payload.target || targetSummary(config)} · ${body.replace(/\s+/g, ' ').slice(0, 72) || '(空消息)'}`;
      addLog('消费', '已接收', config, summary, body);
      renderStatus('消费中', `${payload.broker} 已收到消息：${payload.target || targetSummary(config)}`, 'success');
      return;
    }
    if (payload.event === 'error') {
      consuming = false;
      startButton.disabled = false;
      stopButton.disabled = true;
      addLog('消费', '失败', config, payload.detail || '消费者发生错误');
      renderStatus('消费失败', payload.detail || '消费者发生错误', 'error');
      showToast(payload.detail || '消费者发生错误');
      return;
    }
    if (payload.event === 'stopped') {
      consuming = false;
      consumerSessionId = '';
      consumerConfig = null;
      startButton.disabled = false;
      stopButton.disabled = true;
      renderStatus('消费已停止', payload.detail || '消费者已停止', 'pending');
    }
  };

  const listenDesktopEvents = async () => {
    const listen = globalThis.__TAURI__?.event?.listen;
    if (!desktopMq || typeof listen !== 'function') return;
    try {
      unlistenMqEvent = await listen('mq://event', handleDesktopEvent);
    } catch (error) {
      showToast(`桌面事件监听失败：${desktopErrorMessage(error, '未知错误')}`);
    }
  };

  const renderTargets = () => {
    const current = broker.value;
    targetFields.innerHTML = messageQueueTargetMarkup(current);
    const caption = brokerCaptions[current] || brokerCaptions.mqtt;
    targetCaption.textContent = caption[0];
    targetBadge.textContent = caption[1];
    enhanceBtSelects(targetFields);
  };

  const renderConnectionLabels = () => {
    const rocketmq = broker.value === 'rocketmq';
    addressLabel.textContent = rocketmq ? 'Proxy Endpoint' : 'Broker 地址';
    usernameLabel.textContent = rocketmq ? 'AccessKey' : '用户名';
    passwordLabel.textContent = rocketmq ? 'SecretKey' : '密码';
    content.querySelector('#mq-address').placeholder = rocketmq ? '例如 rocketmq.example.com' : '例如 mq.example.com';
  };

  const collectConfig = () => {
    const current = broker.value;
    const fields = {
      broker: current,
      address: content.querySelector('#mq-address')?.value.trim() || '',
      port: content.querySelector('#mq-port')?.value.trim() || '',
      username: content.querySelector('#mq-username')?.value.trim() || '',
      password: content.querySelector('#mq-password')?.value || '',
      tls: Boolean(content.querySelector('#mq-tls')?.checked),
    };
    if (current === 'mqtt') Object.assign(fields, { topic: content.querySelector('#mq-topic')?.value.trim() || '', qos: content.querySelector('#mq-qos')?.value || '0', retain: Boolean(content.querySelector('#mq-retain')?.checked) });
    if (current === 'kafka') Object.assign(fields, { topic: content.querySelector('#mq-topic')?.value.trim() || '', group: content.querySelector('#mq-group')?.value.trim() || '', partition: content.querySelector('#mq-partition')?.value.trim() || '' });
    if (current === 'rabbitmq') Object.assign(fields, { exchange: content.querySelector('#mq-exchange')?.value.trim() || '', queue: content.querySelector('#mq-queue')?.value.trim() || '', routingKey: content.querySelector('#mq-routing-key')?.value.trim() || '' });
    if (current === 'rocketmq') Object.assign(fields, { topic: content.querySelector('#mq-topic')?.value.trim() || '', tag: content.querySelector('#mq-tag')?.value.trim() || '*', group: content.querySelector('#mq-group')?.value.trim() || '' });
    return fields;
  };

  const targetSummary = (config) => config.broker === 'rabbitmq' ? `${config.exchange || '(未填写)'} / ${config.queue || '(未填写)'}` : `${config.topic || '(未填写)'}${config.broker === 'kafka' && config.group ? ` · ${config.group}` : ''}${config.broker === 'rocketmq' ? ` · ${config.tag || '*'}${config.group ? ` · ${config.group}` : ''}` : ''}`;
  const validateConfig = () => {
    const config = collectConfig();
    if (!config.address) return { config, error: '请先填写 Broker 地址' };
    if (!config.port || Number(config.port) < 1 || Number(config.port) > 65535) return { config, error: '端口范围应为 1-65535' };
    if (config.password && !config.username) return { config, error: '填写密码时必须同时填写用户名' };
    if (['kafka', 'rocketmq'].includes(config.broker) && config.username && !config.password) return { config, error: `${brokerLabels[config.broker]} 填写用户名时必须同时填写密码` };
    if (config.broker === 'rocketmq' && config.username && !config.password) return { config, error: 'RocketMQ 使用 AccessKey 时必须同时填写 SecretKey' };
    const target = config.broker === 'rabbitmq' ? config.queue : config.topic;
    if (!target) return { config, error: config.broker === 'rabbitmq' ? '请先填写 Queue' : '请先填写 Topic' };
    if (config.broker === 'rocketmq' && !config.group) return { config, error: '请先填写 Consumer Group' };
    return { config, error: '' };
  };

  const renderLogs = () => {
    if (!logs.length) { logBody.innerHTML = '<tr class="mq-log-empty"><td colspan="5">暂无操作日志</td></tr>'; return; }
    logBody.innerHTML = logs.map((item) => `<tr class="mq-log-row"><td>${escapeHtml(item.time)}</td><td><span class="mq-log-direction mq-log-direction-${item.direction === '发送' ? 'out' : item.direction === '消费' ? 'in' : 'connect'}">${escapeHtml(item.direction)}</span></td><td><span class="mq-log-state">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.broker)}</td><td title="${escapeHtml(item.summary)}">${escapeHtml(item.summary)}</td></tr>`).join('');
  };

  const persistConfigList = async () => {
    const safeConfigs = state.messageQueue.configs.map(({ password, ...config }) => config);
    try { await storage?.setSetting('mq-configs', safeConfigs); } catch (error) { showToast(`配置保存失败：${error.message}`); }
  };

  const renderConfigList = () => {
    const configs = state.messageQueue.configs;
    configList.innerHTML = configs.length ? configs.map((config) => `<div class="mq-config-item" data-mq-config-id="${escapeHtml(config.id)}"><div class="mq-config-item-copy"><strong>${escapeHtml(config.name)}</strong><small>${escapeHtml(brokerLabels[config.broker] || config.broker)} · ${escapeHtml(config.address)}:${escapeHtml(config.port)} · ${escapeHtml(targetSummary(config))}</small></div><div class="mq-config-item-actions"><button class="text-button" type="button" data-mq-config-action="apply" data-mq-config-id="${escapeHtml(config.id)}">应用</button><button class="text-button" type="button" data-mq-config-action="delete" data-mq-config-id="${escapeHtml(config.id)}">删除</button></div></div>`).join('') : '<div class="mq-config-empty">还没有保存的配置</div>';
    configList.hidden = false;
  };

  const applyConfig = (config) => {
    broker.value = config.broker || 'mqtt';
    previousBroker = broker.value;
    syncBtSelect(broker);
    renderTargets();
    renderConnectionLabels();
    const setValue = (id, value) => { const field = content.querySelector(`#${id}`); if (!field) return; if (field.type === 'checkbox') field.checked = Boolean(value); else field.value = value ?? ''; if (field.tagName === 'SELECT') syncBtSelect(field); };
    setValue('mq-address', config.address);
    setValue('mq-port', config.port);
    setValue('mq-username', config.username);
    setValue('mq-password', config.password || '');
    setValue('mq-tls', config.tls);
    setValue('mq-topic', config.topic);
    setValue('mq-qos', config.qos);
    setValue('mq-retain', config.retain);
    setValue('mq-group', config.group);
    setValue('mq-tag', config.tag);
    setValue('mq-partition', config.partition);
    setValue('mq-exchange', config.exchange);
    setValue('mq-queue', config.queue);
    setValue('mq-routing-key', config.routingKey);
    configName.value = config.name || '';
    renderStatus('配置已应用', `${config.name} 已载入，${config.password ? '当前会话密码已恢复' : '密码未保存，请重新填写密码'}`, 'pending');
    showToast(`已应用配置：${config.name}`);
  };

  const addLog = (direction, status, config, summary, body = '') => {
    logs = [{ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), direction, status, broker: brokerLabels[config.broker], summary, body }, ...logs].slice(0, 30);
    renderLogs();
  };

  const updateMessageStatus = () => {
    const value = message.value;
    if (messageFormat === 'json') {
      try { JSON.parse(value || 'null'); messageStatus.textContent = `JSON 格式有效 · ${value.length} 字符`; messageStatus.className = 'mq-message-status is-valid'; }
      catch (error) { messageStatus.textContent = `JSON 格式有误 · ${error.message}`; messageStatus.className = 'mq-message-status is-error'; }
    } else { messageStatus.textContent = `文本消息 · ${value.length} 字符`; messageStatus.className = 'mq-message-status'; }
  };

  const setMessageFormat = (format) => {
    messageFormat = format;
    content.querySelectorAll('[data-mq-format]').forEach((button) => { const active = button.dataset.mqFormat === format; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    messageBadge.textContent = format === 'json' ? 'JSON' : 'TEXT';
    message.placeholder = format === 'json' ? '{"event":"message","data":{}}' : '输入要发送的消息…';
    updateMessageStatus();
  };

  const requestDesktop = async (action) => {
    const checked = validateConfig();
    if (checked.error) { renderStatus('配置不完整', checked.error, 'error'); showToast(checked.error); return null; }
    const config = checked.config;
    if (!desktopMq) {
      if (action === 'test') { renderStatus('等待桌面端接入', `已校验 ${brokerLabels[config.broker]} 配置：${targetSummary(config)}，当前不会建立真实连接`, 'pending'); addLog('连接', '待桌面端', config, targetSummary(config)); showToast('真实 MQ 连接需要桌面端能力'); return config; }
      if (action === 'send') { renderStatus('发送待桌面端接入', `消息已准备发送到 ${targetSummary(config)}，当前不会提交到 Broker`, 'pending'); addLog('发送', '待桌面端', config, `${targetSummary(config)} · ${message.value.trim().replace(/\s+/g, ' ').slice(0, 72) || '(空消息)'}`, message.value); showToast('发送功能将在桌面端接入'); return config; }
      if (action === 'consume-start') { consuming = true; startButton.disabled = true; stopButton.disabled = false; renderStatus('消费待桌面端接入', `已准备监听 ${targetSummary(config)}，当前不会启动真实消费者`, 'pending'); addLog('消费', '待桌面端', config, `监听 ${targetSummary(config)}`, ''); showToast('消费功能将在桌面端接入'); return config; }
      return config;
    }
    try {
      if (action === 'test') {
        renderStatus('正在测试连接', `正在连接 ${brokerLabels[config.broker]}：${targetSummary(config)}`, 'pending');
        const result = await storage.desktopInvoke('mq_test_connection', { config });
        renderStatus('连接成功', result?.detail || `已连接 ${targetSummary(config)}`, 'success');
        addLog('连接', '已连接', config, result?.detail || targetSummary(config));
        showToast('MQ 连接成功');
        return config;
      }
      if (action === 'send') {
        renderStatus('正在发送', `正在发送消息到 ${targetSummary(config)}`, 'pending');
        const result = await storage.desktopInvoke('mq_send_message', { config, message: message.value });
        renderStatus('发送成功', result?.detail || `消息已发送到 ${targetSummary(config)}`, 'success');
        addLog('发送', '已发送', config, `${targetSummary(config)} · ${message.value.trim().replace(/\s+/g, ' ').slice(0, 72) || '(空消息)'}`, message.value);
        showToast('消息已发送');
        return config;
      }
      if (action === 'consume-start') {
        if (consumerSessionId) await storage.desktopInvoke('mq_stop_consumer', { sessionId: consumerSessionId }).catch(() => {});
        renderStatus('正在启动消费', `正在监听 ${targetSummary(config)}`, 'pending');
        const result = await storage.desktopInvoke('mq_start_consumer', { config });
        consumerSessionId = result?.sessionId || '';
        consumerConfig = { ...config };
        consuming = true;
        startButton.disabled = true;
        stopButton.disabled = !consumerSessionId;
        renderStatus('消费中', result?.detail || `已开始监听 ${targetSummary(config)}`, 'success');
        addLog('消费', '消费中', config, `监听 ${targetSummary(config)}`);
        showToast('已开始消费');
        return config;
      }
    } catch (error) {
      const detail = desktopErrorMessage(error, '桌面端 MQ 操作失败');
      renderStatus('操作失败', detail, 'error');
      addLog(action === 'test' ? '连接' : action === 'send' ? '发送' : '消费', '失败', config, detail);
      showToast(detail);
    }
    return config;
  };

  broker.addEventListener('change', () => {
    const current = broker.value;
    const portField = content.querySelector('#mq-port');
    if (portField && (!portField.value || portField.value === defaultPorts[previousBroker])) portField.value = defaultPorts[current];
    previousBroker = current;
    renderTargets();
    renderConnectionLabels();
    renderStatus('等待操作', `已切换到 ${brokerLabels[current]}，请填写目标参数`);
  });
  message.addEventListener('input', updateMessageStatus);
  content.querySelectorAll('[data-mq-format]').forEach((button) => button.addEventListener('click', () => setMessageFormat(button.dataset.mqFormat)));
  content.querySelector('[data-mq-action="test"]').addEventListener('click', () => requestDesktop('test'));
  content.querySelector('[data-mq-action="send"]').addEventListener('click', () => { if (messageFormat === 'json') { try { JSON.parse(message.value || 'null'); } catch (error) { updateMessageStatus(); showToast('请先修正 JSON 消息格式'); return; } } requestDesktop('send'); });
  startButton.addEventListener('click', () => requestDesktop('consume-start'));
  stopButton.addEventListener('click', async () => {
    if (desktopMq && consumerSessionId) {
      try { await storage.desktopInvoke('mq_stop_consumer', { sessionId: consumerSessionId }); } catch (error) { showToast(desktopErrorMessage(error, '停止消费者失败')); }
      consumerSessionId = '';
      consumerConfig = null;
    }
    consuming = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    renderStatus('消费已停止', desktopMq ? '已请求桌面端停止消费者' : '未建立真实 MQ 连接，仅停止本地消费状态', 'pending');
  });
  content.querySelector('[data-mq-action="format"]').addEventListener('click', () => { try { message.value = JSON.stringify(JSON.parse(message.value || 'null'), null, 2); setMessageFormat('json'); showToast('JSON 已格式化'); } catch (error) { setMessageFormat('json'); updateMessageStatus(); showToast('当前内容不是有效 JSON'); } });
  content.querySelector('[data-mq-action="clear-message"]').addEventListener('click', () => { message.value = ''; updateMessageStatus(); message.focus(); });
  content.querySelector('[data-mq-action="copy-message"]').addEventListener('click', () => copyText(message.value).then(() => showToast('消息内容已复制')));
  content.querySelector('[data-mq-action="clear"]').addEventListener('click', () => { message.value = ''; setMessageFormat('text'); renderStatus('等待操作', '配置仍保留，消息内容已清空'); message.focus(); });
  content.querySelector('[data-mq-action="clear-log"]').addEventListener('click', () => { logs = []; renderLogs(); showToast('消息日志已清空'); });
  content.querySelector('[data-mq-action="export-consumed"]').addEventListener('click', () => {
    const consumed = logs.filter((item) => item.direction === '消费');
    if (!consumed.length) { showToast('暂无可导出的消费消息'); return; }
    const rows = consumed.map((item) => [item.time, item.broker, item.status, item.summary, item.body || '']);
    downloadExcelFile(['时间', '中间件', '状态', '目标', '消息内容'], rows, 'byetools-consumed-messages.xls', '消费消息 Excel 已导出');
  });
  content.querySelector('[data-mq-action="save-config"]').addEventListener('click', async () => {
    const checked = validateConfig();
    if (checked.error) { renderStatus('配置不完整', checked.error, 'error'); showToast(checked.error); return; }
    const name = configName.value.trim();
    if (!name) { showToast('请先填写配置名称'); configName.focus(); return; }
    const record = { id: `mq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, ...checked.config, savedAt: Date.now() };
    state.messageQueue.configs = [record, ...state.messageQueue.configs.filter((item) => item.name !== name)].slice(0, 20);
    await persistConfigList();
    renderConfigList();
    renderStatus('配置已保存', `${name} 已保存，可在配置列表中应用；密码不会持久化`, 'pending');
    showToast('消息队列配置已保存');
  });
  content.querySelector('[data-mq-action="query-configs"]').addEventListener('click', () => { if (configList.hidden) renderConfigList(); else configList.hidden = true; });
  configList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-mq-config-action]');
    if (!button) return;
    const id = button.dataset.mqConfigId;
    const config = state.messageQueue.configs.find((item) => item.id === id);
    if (!config) return;
    if (button.dataset.mqConfigAction === 'apply') applyConfig(config);
    if (button.dataset.mqConfigAction === 'delete') { state.messageQueue.configs = state.messageQueue.configs.filter((item) => item.id !== id); await persistConfigList(); renderConfigList(); showToast(`已删除配置：${config.name}`); }
  });
  renderTargets();
  renderConnectionLabels();
  setMessageFormat('text');
  renderLogs();
  renderStatus('等待操作', desktopMq ? '桌面端会使用当前配置连接 Broker。' : 'Web 端不会建立真实 MQ 连接，请使用桌面客户端执行操作。');
  listenDesktopEvents();
  activeWorkspaceCleanup = () => {
    if (typeof unlistenMqEvent === 'function') unlistenMqEvent();
    if (desktopMq && consumerSessionId) storage.desktopInvoke('mq_stop_consumer', { sessionId: consumerSessionId }).catch(() => {});
    consumerSessionId = '';
    consumerConfig = null;
  };
}

function shellTokens(value) {
  const tokens = [];
  const matcher = /"((?:\\.|[^"\\])*)"|'([^']*)'|([^\s]+)/g;
  let match;
  while ((match = matcher.exec(value))) tokens.push(match[1] ?? match[2] ?? match[3]);
  return tokens;
}

function parseCurlCommand(value) {
  const tokens = shellTokens(value.trim());
  if (tokens[0]?.toLowerCase() === 'curl') tokens.shift();
  const parsed = { url: '', method: '', headers: [], body: '', insecure: false };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '-H' || token === '--header') {
      const header = tokens[++index] || '';
      const separator = header.indexOf(':');
      if (separator > 0) parsed.headers.push([header.slice(0, separator).trim(), header.slice(separator + 1).trim()]);
    } else if (['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'].includes(token)) {
      parsed.body = tokens[++index] || '';
      if (!parsed.method) parsed.method = 'POST';
    } else if (token === '-X' || token === '--request') {
      parsed.method = (tokens[++index] || 'GET').toUpperCase();
    } else if (token === '--url') {
      parsed.url = tokens[++index] || '';
    } else if (token === '-k' || token === '--insecure') {
      parsed.insecure = true;
    } else if (!token.startsWith('-') && !parsed.url) {
      parsed.url = token;
    }
  }
  parsed.method = parsed.method || 'GET';
  return parsed;
}

function quoteJs(value) { return JSON.stringify(value); }
function quotePython(value) { return JSON.stringify(value); }

function curlCode(parsed, language) {
  const headers = Object.fromEntries(parsed.headers);
  const headerJson = JSON.stringify(headers, null, 2);
  const body = parsed.body ? `,\n  body: ${quoteJs(parsed.body)}` : '';
  if (language === 'axios') return `import axios from 'axios';\n\nconst response = await axios({\n  method: ${quoteJs(parsed.method)},\n  url: ${quoteJs(parsed.url)},\n  headers: ${headerJson}${parsed.body ? `,\n  data: ${quoteJs(parsed.body)}` : ''}\n});\n\nconsole.log(response.data);`;
  if (language === 'python') return `import requests\n\nresponse = requests.request(\n    ${quotePython(parsed.method)},\n    ${quotePython(parsed.url)},\n    headers=${JSON.stringify(headers)},${parsed.body ? `\n    data=${quotePython(parsed.body)},` : ''}\n)\n\nprint(response.text)`;
  if (language === 'go') return `package main\n\nimport (\n    "fmt"\n    "net/http"\n    "strings"\n)\n\nfunc main() {\n    request, _ := http.NewRequest(${quoteJs(parsed.method)}, ${quoteJs(parsed.url)}, strings.NewReader(${quoteJs(parsed.body)}))\n${parsed.headers.map(([key, value]) => `    request.Header.Set(${quoteJs(key)}, ${quoteJs(value)})`).join('\n')}\n    response, _ := http.DefaultClient.Do(request)\n    defer response.Body.Close()\n    fmt.Println(response.Status)\n}`;
  return `const response = await fetch(${quoteJs(parsed.url)}, {\n  method: ${quoteJs(parsed.method)},\n  headers: ${headerJson}${body}\n});\n\nconst data = await response.json();\nconsole.log(data);`;
}

function bindCurlWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#curl-input');
  const output = content.querySelector('#curl-output');
  const language = content.querySelector('#curl-language');
  const caption = content.querySelector('#curl-output-caption');
  const languageBadge = content.querySelector('#curl-output-language');
  const status = content.querySelector('#curl-status');
  const summary = content.querySelector('#curl-summary');
  let parsed = parseCurlCommand(input.value);
  const languageLabels = { fetch: ['Fetch 请求', 'JS'], axios: ['Axios 请求', 'JS'], python: ['Python Requests', 'PY'], go: ['Go net/http', 'GO'] };
  const render = () => {
    parsed = parseCurlCommand(input.value);
    const current = languageLabels[language.value];
    caption.textContent = current[0];
    languageBadge.textContent = current[1];
    output.textContent = parsed.url ? curlCode(parsed, language.value) : '请输入包含 URL 的 Curl 命令';
    status.textContent = parsed.url ? '解析完成' : '等待有效命令';
    status.className = parsed.url ? 'crypto-status-success' : 'crypto-status-error';
    summary.innerHTML = parsed.url ? `<span><b>${escapeHtml(parsed.method)}</b> ${escapeHtml(parsed.url)}</span><span>${parsed.headers.length} 个请求头${parsed.body ? ' · 含请求体' : ''}</span>` : '';
  };
  content.querySelectorAll('[data-tool-action="curl-parse"]').forEach((button) => button.addEventListener('click', render));
  content.querySelectorAll('[data-tool-action="curl-copy"]').forEach((button) => button.addEventListener('click', () => copyText(output.textContent).then(() => showToast('代码已复制'))));
  content.querySelector('[data-tool-action="curl-clear"]').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  language.addEventListener('change', render);
  input.addEventListener('input', render);
  render();
}

function encodeHtmlEntities(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function decodeHtmlEntities(value) {
  const area = document.createElement('textarea');
  area.innerHTML = value;
  return area.value;
}

function bindHtmlWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#html-input');
  const output = content.querySelector('#html-output');
  const status = content.querySelector('#html-status');
  const caption = content.querySelector('#html-output-caption');
  const execute = (action) => {
    const value = input.value;
    output.textContent = action === 'html-decode' ? decodeHtmlEntities(value) : encodeHtmlEntities(value);
    caption.textContent = action === 'html-decode' ? '实体解码结果' : '实体编码结果';
    status.textContent = `已处理 ${value.length} 个字符`;
    status.className = 'crypto-status-success';
  };
  content.querySelector('[data-tool-action="html-encode"]').addEventListener('click', () => execute('html-encode'));
  content.querySelector('[data-tool-action="html-decode"]').addEventListener('click', () => execute('html-decode'));
  content.querySelector('[data-tool-action="html-clear"]').addEventListener('click', () => { input.value = ''; output.textContent = ''; caption.textContent = '等待操作'; status.textContent = '输入内容后选择转换方式'; status.className = ''; input.focus(); });
  content.querySelectorAll('[data-tool-action="html-copy"]').forEach((button) => button.addEventListener('click', () => copyText(output.textContent).then(() => showToast('转换结果已复制'))));
  execute('html-encode');
}

function setFormatterStatus(node, message, detail, type = '') {
  if (!node) return;
  node.className = `formatter-status${type ? ` is-${type}` : ''}`;
  const main = node.querySelector('span:nth-child(2)');
  const meta = node.querySelector('small');
  if (main) main.textContent = message;
  if (meta) meta.textContent = detail;
}

function formatterFullscreen(node) {
  const target = node.closest('.formatter-workbench');
  if (!target) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else target.requestFullscreen?.();
}

function parseXmlDocument(source) {
  const value = String(source || '').trim();
  if (!value) throw new Error('请输入 XML 内容');
  const documentNode = new DOMParser().parseFromString(value, 'application/xml');
  const parserError = documentNode.querySelector('parsererror');
  if (parserError) {
    const detail = parserError.textContent.replace(/\s+/g, ' ').trim();
    const line = detail.match(/line\s+(\d+)/i)?.[1];
    throw new Error(`${line ? `第 ${line} 行：` : ''}${detail || 'XML 结构不合法'}`);
  }
  return documentNode;
}

function prettyXml(source) {
  const documentNode = parseXmlDocument(source);
  const serialized = new XMLSerializer().serializeToString(documentNode);
  const compact = serialized.replace(/>\s+</g, '><').replace(/>\s*([^<\s][^<]*?)\s*</g, '>$1<');
  const tokens = compact.replace(/(>)(<)(\/?)/g, '$1\n$2$3').split('\n').filter((line) => line.trim());
  let depth = 0;
  return tokens.map((token) => {
    const line = token.trim();
    if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
    const output = `${'  '.repeat(depth)}${line}`;
    if (/^<[^!?/][^>]*[^/]?>$/.test(line) && !/<\/[^>]+>$/.test(line)) depth += 1;
    return output;
  }).join('\n');
}

function compactXml(source) {
  const documentNode = parseXmlDocument(source);
  return new XMLSerializer().serializeToString(documentNode).replace(/>\s+</g, '><').trim();
}

function xmlName(node, stripNamespace) {
  const name = node.localName || node.nodeName;
  return stripNamespace ? name.split(':').pop() : name;
}

function xmlElementValue(element, options) {
  const children = [...element.children];
  const attributes = options.ignoreAttributes ? [] : [...element.attributes];
  const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE).map((node) => node.nodeValue.trim()).filter(Boolean).join(' ');
  if (!children.length && !attributes.length) return text;
  const result = {};
  attributes.forEach((attribute) => { const key = `${options.attributePrefix}${xmlName(attribute, options.stripNamespace)}`; result[key] = attribute.value; });
  if (text) result['#text'] = text;
  children.forEach((child) => {
    const key = xmlName(child, options.stripNamespace);
    const value = xmlElementValue(child, options);
    if (Object.prototype.hasOwnProperty.call(result, key)) result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
    else result[key] = options.forceArray ? [value] : value;
  });
  return result;
}

function xmlToObject(source, options) {
  const documentNode = parseXmlDocument(source);
  const root = documentNode.documentElement;
  return { [xmlName(root, options.stripNamespace)]: xmlElementValue(root, options) };
}

function yamlScalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  const text = String(value);
  return text && /^[A-Za-z0-9_./-]+$/.test(text) ? text : JSON.stringify(text);
}

function yamlKey(value) {
  return /^[A-Za-z_][\w-]*$/.test(value) ? value : JSON.stringify(value);
}

function objectToYaml(value, indent = '  ', level = 0) {
  const pad = indent.repeat(level);
  if (Array.isArray(value)) {
    if (!value.length) return `${pad}[]`;
    return value.map((item) => {
      if (item && typeof item === 'object') {
        const nested = objectToYaml(item, indent, level + 1).split('\n');
        return `${pad}- ${nested[0].trim()}${nested.length > 1 ? `\n${nested.slice(1).join('\n')}` : ''}`;
      }
      return `${pad}- ${yamlScalar(item)}`;
    }).join('\n');
  }
  if (!value || typeof value !== 'object') return `${pad}${yamlScalar(value)}`;
  const entries = Object.entries(value);
  if (!entries.length) return `${pad}{}`;
  return entries.map(([key, item]) => {
    if (item && typeof item === 'object') return `${pad}${yamlKey(key)}:\n${objectToYaml(item, indent, level + 1)}`;
    return `${pad}${yamlKey(key)}: ${yamlScalar(item)}`;
  }).join('\n');
}

function javascriptValue(value, indent = '  ', level = 0) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value !== 'object') return String(value);
  const pad = indent.repeat(level);
  const childPad = indent.repeat(level + 1);
  const entries = Array.isArray(value) ? value.map((item) => javascriptValue(item, indent, level + 1)) : Object.entries(value).map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${javascriptValue(item, indent, level + 1)}`);
  if (!entries.length) return Array.isArray(value) ? '[]' : '{}';
  return Array.isArray(value) ? `[\n${entries.map((item) => `${childPad}${item}`).join(',\n')}\n${pad}]` : `{\n${entries.map((item) => `${childPad}${item}`).join(',\n')}\n${pad}}`;
}

function phpValue(value, indent = '    ', level = 0) {
  if (value === null) return 'null';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value !== 'object') return String(value);
  const pad = indent.repeat(level);
  const childPad = indent.repeat(level + 1);
  const entries = Object.entries(value).map(([key, item]) => `${childPad}${Array.isArray(value) ? '' : `'${key.replace(/'/g, "\\'")}' => `}${phpValue(item, indent, level + 1)}`);
  if (!entries.length) return '[]';
  return `[\n${entries.join(',\n')}\n${pad}]`;
}

function objectToToml(value, indent = '  ') {
  const lines = [];
  const scalar = (item) => Array.isArray(item) ? `[${item.map((entry) => typeof entry === 'object' ? JSON.stringify(entry) : yamlScalar(entry)).join(', ')}]` : typeof item === 'string' ? JSON.stringify(item) : yamlScalar(item);
  const visit = (node, path = []) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const entries = Object.entries(node);
    const simple = entries.filter(([, item]) => !item || typeof item !== 'object' || Array.isArray(item));
    if (path.length && simple.length) lines.push(`[${path.join('.')}]`);
    simple.forEach(([key, item]) => lines.push(`${key} = ${scalar(item)}`));
    entries.filter(([, item]) => item && typeof item === 'object' && !Array.isArray(item)).forEach(([key, item]) => visit(item, [...path, key]));
  };
  visit(value);
  return lines.join('\n') || '# 空对象';
}

function xmlConverterOutput(value, format, indentSize) {
  const indent = indentSize === 'tab' ? '\t' : ' '.repeat(Number(indentSize) || 2);
  if (format === 'yaml') return objectToYaml(value, indent);
  if (format === 'toml') return objectToToml(value, indent);
  if (format === 'javascript') return `const data = ${javascriptValue(value, indent)};`;
  if (format === 'php') return `<?php\n$data = ${phpValue(value, indent)};`;
  return JSON.stringify(value, null, indent);
}

function bindXmlFormatWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.querySelector('.xml-format-workbench');
  const input = content.querySelector('#xml-format-input');
  const output = content.querySelector('#xml-format-output');
  const status = content.querySelector('#xml-format-status');
  const inputMeta = content.querySelector('#xml-format-input-meta');
  const outputMeta = content.querySelector('#xml-format-output-meta');
  const render = (action = 'format') => {
    inputMeta.textContent = `${input.value.length} 个字符`;
    try {
      const result = action === 'minify' ? compactXml(input.value) : prettyXml(input.value);
      output.textContent = result;
      outputMeta.textContent = action === 'minify' ? '已压缩 XML' : '已格式化 XML';
      setFormatterStatus(status, action === 'minify' ? '压缩完成' : '格式有效', `输出 ${result.length} 个字符`, 'success');
    } catch (error) {
      output.textContent = `XML 解析失败：${error.message}`;
      outputMeta.textContent = '请检查标签和属性';
      setFormatterStatus(status, 'XML 无效', error.message, 'error');
    }
  };
  input.addEventListener('input', () => { inputMeta.textContent = `${input.value.length} 个字符`; setFormatterStatus(status, '等待操作', '输入变化后重新格式化'); });
  content.querySelector('[data-tool-action="xml-format"]').addEventListener('click', () => render('format'));
  content.querySelector('[data-tool-action="xml-minify"]').addEventListener('click', () => render('minify'));
  content.querySelector('[data-tool-action="xml-sample"]').addEventListener('click', () => { input.value = '<catalog>\n  <book id="bk101"><title>ByeTools</title><author>ByeTools</author></book>\n</catalog>'; render('format'); });
  content.querySelector('[data-tool-action="xml-clear"]').addEventListener('click', () => { input.value = ''; output.textContent = ''; inputMeta.textContent = '0 个字符'; outputMeta.textContent = '等待操作'; setFormatterStatus(status, '等待输入', 'XML · UTF-8'); input.focus(); });
  content.querySelectorAll('[data-tool-action="xml-copy"]').forEach((button) => button.addEventListener('click', () => copyText(output.textContent).then(() => showToast('XML 结果已复制'))));
  content.querySelector('[data-tool-action="xml-download"]').addEventListener('click', () => { if (!output.textContent) { showToast('请先格式化 XML'); return; } downloadTextFile(output.textContent, 'byetools-format.xml', 'application/xml;charset=utf-8'); showToast('XML 文件已下载'); });
  content.querySelector('[data-tool-action="xml-fullscreen"]').addEventListener('click', () => formatterFullscreen(workbench));
  content.querySelector('#xml-format-file').addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (!file) return; input.value = await file.text(); render('format'); showToast(`已打开 ${file.name}`); event.target.value = ''; });
  render('format');
}

function bindXmlConverterWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.querySelector('.xml-converter-workbench');
  const input = content.querySelector('#xml-converter-input');
  const output = content.querySelector('#xml-converter-output');
  const status = content.querySelector('#xml-converter-status');
  const format = content.querySelector('#xml-converter-format');
  const formatLabels = { json: ['JSON 对象', 'JSON'], yaml: ['YAML 文档', 'YAML'], toml: ['TOML 文档', 'TOML'], javascript: ['JavaScript 对象', 'JS'], php: ['PHP 数组', 'PHP'] };
  const render = () => {
    const selected = formatLabels[format.value];
    content.querySelector('#xml-converter-output-caption').textContent = selected[0];
    content.querySelector('#xml-converter-output-badge').textContent = selected[1];
    content.querySelector('#xml-converter-input-meta').textContent = `${input.value.length} 个字符`;
    try {
      const value = xmlToObject(input.value, { ignoreAttributes: content.querySelector('#xml-ignore-attributes').checked, stripNamespace: content.querySelector('#xml-strip-namespace').checked, forceArray: content.querySelector('#xml-force-array').checked, attributePrefix: content.querySelector('#xml-attribute-prefix').value || '@' });
      const result = xmlConverterOutput(value, format.value, content.querySelector('#xml-converter-indent').value);
      output.textContent = result;
      content.querySelector('#xml-converter-output-meta').textContent = `已生成 ${result.length} 个字符`;
      setFormatterStatus(status, '转换完成', `XML → ${selected[0]}`, 'success');
    } catch (error) {
      output.textContent = `转换失败：${error.message}`;
      content.querySelector('#xml-converter-output-meta').textContent = '请检查 XML 内容';
      setFormatterStatus(status, 'XML 无效', error.message, 'error');
    }
  };
  [input, format, content.querySelector('#xml-ignore-attributes'), content.querySelector('#xml-strip-namespace'), content.querySelector('#xml-force-array'), content.querySelector('#xml-attribute-prefix'), content.querySelector('#xml-converter-indent')].forEach((node) => node.addEventListener('input', render));
  format.addEventListener('change', render);
  content.querySelector('[data-tool-action="xml-convert"]').addEventListener('click', render);
  content.querySelector('[data-tool-action="xml-converter-sample"]').addEventListener('click', () => { input.value = '<user id="42">\n  <name>ByeTools</name>\n  <roles>developer</roles>\n  <roles>designer</roles>\n</user>'; render(); });
  content.querySelector('[data-tool-action="xml-converter-clear"]').addEventListener('click', () => { input.value = ''; output.textContent = ''; content.querySelector('#xml-converter-input-meta').textContent = '0 个字符'; content.querySelector('#xml-converter-output-meta').textContent = '等待转换'; setFormatterStatus(status, '等待输入', `XML → ${formatLabels[format.value][0]}`); input.focus(); });
  content.querySelectorAll('[data-tool-action="xml-converter-copy"]').forEach((button) => button.addEventListener('click', () => copyText(output.textContent).then(() => showToast('转换结果已复制'))));
  content.querySelector('[data-tool-action="xml-converter-download"]').addEventListener('click', () => { if (!output.textContent) { showToast('请先转换 XML'); return; } const extension = { json: 'json', yaml: 'yaml', toml: 'toml', javascript: 'js', php: 'php' }[format.value]; downloadTextFile(output.textContent, `byetools-xml.${extension}`, 'text/plain;charset=utf-8'); showToast('转换文件已下载'); });
  content.querySelector('[data-tool-action="xml-converter-fullscreen"]').addEventListener('click', () => formatterFullscreen(workbench));
  content.querySelector('#xml-converter-file').addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (!file) return; input.value = await file.text(); render(); showToast(`已打开 ${file.name}`); event.target.value = ''; });
  render();
}

function protectSqlSegments(source) {
  const segments = [];
  const marker = (index) => `\uE100${index}\uE101`;
  const pattern = /(--[^\r\n]*|\/\*[\s\S]*?\*\/|'(?:''|\\.|[^'])*'|"(?:""|\\.|[^"])*"|`(?:``|[^`])*`)/g;
  const value = String(source || '').replace(pattern, (match) => { const index = segments.push(match) - 1; return marker(index); });
  return { value, restore: (input) => input.replace(/\uE100(\d+)\uE101/g, (_, index) => segments[Number(index)] || '') };
}

function sqlKeywordCase(source, mode) {
  if (mode === 'original') return source;
  const words = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT', 'RIGHT', 'FULL', 'INNER', 'OUTER', 'CROSS', 'ON', 'UNION', 'ALL', 'VALUES', 'SET', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'RETURNING', 'WITH', 'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'NULL', 'IS', 'NOT', 'IN', 'EXISTS', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX'];
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  return source.replace(pattern, (word) => mode === 'upper' ? word.toUpperCase() : word.toLowerCase());
}

function formatSql(source, options = {}) {
  const protectedSource = protectSqlSegments(source);
  let value = protectedSource.value.replace(/\s+/g, ' ').trim();
  value = value.replace(/\s*([(),;])\s*/g, '$1');
  value = value.replace(/\s*(=|<>|<=|>=|\+|-|\*|\/|%)\s*/g, options.compactOperators ? '$1' : ' $1 ');
  value = value.replace(/\s*,\s*/g, ', ');
  value = value.replace(/\)(?=[A-Za-z_])/g, ') ');
  const clauses = ['LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN', 'CROSS JOIN', 'GROUP BY', 'ORDER BY', 'UNION ALL', 'RETURNING', 'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET', 'VALUES', 'SET', 'JOIN', 'UNION'];
  const clausePattern = new RegExp(`\\s+(${clauses.sort((a, b) => b.length - a.length).map((item) => item.replace(/ /g, '\\s+')).join('|')})\\b`, 'gi');
  value = value.replace(clausePattern, '\n$1');
  if (options.breakLogic) value = value.replace(/\s+(AND|OR)\s+/gi, '\n$1 ');
  value = value.replace(/;\s*/g, ';\n');
  const indent = options.indent === 'tab' ? '\t' : ' '.repeat(Number(options.indent) || 2);
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => index === 0 || /^(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|UNION)/i.test(line) ? line : `${indent}${line}`);
  let result = sqlKeywordCase(lines.join('\n'), options.keywordCase || 'upper');
  if (options.blankLines) result = result.replace(/;\n(?=\S)/g, ';\n\n');
  return protectedSource.restore(result).trim();
}

function minifySql(source, options = {}) {
  const protectedSource = protectSqlSegments(source);
  let value = protectedSource.value.replace(/\s+/g, ' ').trim().replace(/\s*([(),;])\s*/g, '$1');
  if (options.compactOperators) value = value.replace(/\s*(=|<>|<=|>=|\+|-|\*|\/|%)\s*/g, '$1');
  return protectedSource.restore(sqlKeywordCase(value, options.keywordCase || 'upper'));
}

function bindSqlFormatWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.querySelector('.sql-format-workbench');
  const input = content.querySelector('#sql-format-input');
  const output = content.querySelector('#sql-format-output');
  const status = content.querySelector('#sql-format-status');
  const readOptions = () => ({ keywordCase: content.querySelector('#sql-keyword-case').value, indent: content.querySelector('#sql-indent').value, breakLogic: content.querySelector('#sql-break-logic').checked, blankLines: content.querySelector('#sql-blank-lines').checked, compactOperators: content.querySelector('#sql-compact-operators').checked });
  const render = (action = 'format') => {
    content.querySelector('#sql-format-input-meta').textContent = `${input.value.length} 个字符`;
    const options = readOptions();
    const result = action === 'minify' ? minifySql(input.value, options) : formatSql(input.value, options);
    output.textContent = result;
    content.querySelector('#sql-format-output-meta').textContent = `${action === 'minify' ? '已压缩' : '已格式化'} · ${result.length} 个字符`;
    setFormatterStatus(status, action === 'minify' ? '压缩完成' : '格式化完成', `${result.split('\n').length} 行 · ${content.querySelector('#sql-dialect').value}`, 'success');
  };
  input.addEventListener('input', () => { content.querySelector('#sql-format-input-meta').textContent = `${input.value.length} 个字符`; setFormatterStatus(status, '等待操作', '修改选项后点击格式化'); });
  content.querySelector('[data-tool-action="sql-format"]').addEventListener('click', () => render('format'));
  content.querySelector('[data-tool-action="sql-minify"]').addEventListener('click', () => render('minify'));
  content.querySelector('[data-tool-action="sql-sample"]').addEventListener('click', () => { input.value = 'WITH active_users AS (SELECT id,name FROM users WHERE status = \'active\') SELECT u.name,COUNT(o.id) AS orders FROM active_users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.name HAVING COUNT(o.id) > 0 ORDER BY orders DESC;'; render('format'); });
  content.querySelector('[data-tool-action="sql-clear"]').addEventListener('click', () => { input.value = ''; output.textContent = ''; content.querySelector('#sql-format-input-meta').textContent = '0 个字符'; content.querySelector('#sql-format-output-meta').textContent = '等待操作'; setFormatterStatus(status, '等待输入', 'SQL · 本地格式化'); input.focus(); });
  content.querySelectorAll('[data-tool-action="sql-copy"]').forEach((button) => button.addEventListener('click', () => copyText(output.textContent).then(() => showToast('SQL 结果已复制'))));
  content.querySelector('[data-tool-action="sql-download"]').addEventListener('click', () => { if (!output.textContent) { showToast('请先格式化 SQL'); return; } downloadTextFile(output.textContent, 'byetools-format.sql', 'text/plain;charset=utf-8'); showToast('SQL 文件已下载'); });
  content.querySelector('[data-tool-action="sql-fullscreen"]').addEventListener('click', () => formatterFullscreen(workbench));
  ['#sql-dialect', '#sql-keyword-case', '#sql-indent', '#sql-break-logic', '#sql-blank-lines', '#sql-compact-operators'].forEach((selector) => content.querySelector(selector).addEventListener('change', () => render('format')));
  render('format');
}

const mindmapTemplatePresets = {
  basic: {
    label: '基础示例',
    content: '# 365 工具箱\n\n## 文本工具\n- JSON 解析\n- 正则测试\n- 字数统计\n- 文本去重\n\n## 图像工具\n- 图片压缩\n- 格式转换\n- EXIF 清理\n\n## 开发工具\n- 时间戳\n- Base64\n- JWT 解析\n- 思维导图',
  },
  reading: {
    label: '读书笔记',
    content: '# 读书笔记\n\n## 核心观点\n- 先建立整体框架\n- 用问题驱动阅读\n- 通过实践检验理解\n\n## 金句摘录\n- 知行合一，持续复盘\n- 把复杂问题拆成小步骤\n\n## 行动计划\n- 每周整理一次笔记\n- 将观点应用到工作中',
  },
  architecture: {
    label: '技术架构',
    content: '# 应用系统\n\n## 前端\n- Vue / React\n- 状态管理\n- 组件库\n\n## 服务端\n- API 网关\n- 业务服务\n- 消息队列\n\n## 数据层\n- PostgreSQL\n- Redis\n- 对象存储',
  },
  product: {
    label: '产品规划',
    content: '# 产品规划\n\n## 用户问题\n- 信息分散\n- 上手成本高\n\n## 解决方案\n- 统一工作台\n- 模板化流程\n- 数据本地处理\n\n## 版本节奏\n- MVP 验证\n- 体验优化\n- 团队协作',
  },
  learning: {
    label: '学习路线',
    content: '# 前端学习路线\n\n## 基础\n- HTML / CSS\n- JavaScript\n- Git\n\n## 进阶\n- TypeScript\n- 工程化\n- 性能优化\n\n## 实战\n- 独立项目\n- 自动化测试\n- 部署上线',
  },
  meeting: {
    label: '会议纪要',
    content: '# 周会纪要\n\n## 本周进展\n- 完成核心页面\n- 修复交互问题\n\n## 讨论事项\n- 下阶段排期\n- 发布检查清单\n\n## 待办事项\n- @产品：确认需求\n- @研发：补充测试\n- @设计：更新资源',
  },
  okr: {
    label: 'OKR 拆解',
    content: '# Q4 目标\n\n## O1 提升产品质量\n- KR1：核心流程成功率达到 99%\n- KR2：线上故障减少 30%\n\n## O2 扩大用户覆盖\n- KR1：新增 10 个重点客户\n- KR2：月活用户达到 5 万\n\n## O3 提高团队效率\n- KR1：自动化测试覆盖率达到 80%\n- KR2：交付周期缩短 20%',
  },
};

function mindmapWorkbenchMarkup() {
  const templateButtons = Object.entries(mindmapTemplatePresets).map(([id, preset], index) => `<button class="mindmap-template-button ${index === 0 ? 'is-active' : ''}" type="button" data-mindmap-template="${id}" aria-selected="${index === 0 ? 'true' : 'false'}">${preset.label}</button>`).join('');
  return `<div class="special-workbench mindmap-workbench">
    <div class="mindmap-template-bar" role="tablist" aria-label="思维导图模板"><span class="mindmap-template-label">模板：</span>${templateButtons}</div>
    <div class="mindmap-layout">
      <section class="workspace-card mindmap-editor-card">
        <div class="workspace-card-head"><div><strong>Markdown 大纲</strong><small>使用标题和列表组织节点层级</small></div><div class="mindmap-editor-actions"><button class="secondary-button" type="button" data-mindmap-action="copy" title="复制 Markdown"><span aria-hidden="true">▣</span> MD</button><button class="secondary-button" type="button" data-mindmap-action="link" title="插入链接"><span aria-hidden="true">↗</span> 链接</button><button class="secondary-button" type="button" data-mindmap-action="clear">清空</button></div></div>
        <textarea id="mindmap-input" spellcheck="false" aria-label="Markdown 大纲编辑区">${mindmapTemplatePresets.basic.content}</textarea>
        <div class="workspace-card-foot"><span id="mindmap-input-meta">实时解析 · Markdown</span><span>本地处理</span></div>
      </section>
      <section class="workspace-card mindmap-preview-card">
        <div class="workspace-card-head"><div><strong>思维导图</strong><small>根据大纲自动布局，可拖动和滚轮缩放</small></div><div class="mindmap-preview-actions"><button class="secondary-button" type="button" data-mindmap-action="fit"><span aria-hidden="true">⊡</span> 自适应</button><button class="secondary-button" type="button" data-mindmap-action="download-svg"><span aria-hidden="true">↓</span> SVG</button><button class="secondary-button" type="button" data-mindmap-action="download-png"><span aria-hidden="true">↓</span> PNG</button><label class="mindmap-transparent-toggle"><input id="mindmap-transparent" type="checkbox" /><span>透明底</span></label></div></div>
        <div class="mindmap-preview" id="mindmap-preview" tabindex="0" aria-label="思维导图预览"></div>
        <div class="workspace-card-foot"><span id="mindmap-status">准备就绪</span><span>SVG · PNG</span></div>
      </section>
    </div>
  </div>`;
}

function parseMindmapMarkdown(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const nodes = [];
  let currentHeadingLevel = 0;
  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const list = line.match(/^(\s*)(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/);
    const plain = !heading && !list ? line.match(/^\s*(.+?)\s*$/) : null;
    if (!heading && !list && !plain) return;
    let level;
    let label;
    let kind;
    if (heading) {
      level = heading[1].length;
      label = heading[2];
      kind = 'heading';
      currentHeadingLevel = level;
    } else if (list) {
      const indent = Math.floor(list[1].replace(/\t/g, '  ').length / 2);
      level = Math.max(2, (currentHeadingLevel || 1) + 1 + indent);
      label = list[2];
      kind = 'list';
    } else {
      level = currentHeadingLevel ? currentHeadingLevel + 1 : 1;
      label = plain[1];
      kind = 'text';
    }
    label = label.replace(/^\[([ xX])\]\s+/, '').trim();
    if (label) nodes.push({ id: `mindmap-node-${lineIndex}`, label, level, kind });
  });
  if (!nodes.length) return { root: { id: 'mindmap-root', label: '思维导图', level: 1, kind: 'root', children: [] }, count: 1 };
  const firstLevel = Math.min(...nodes.map((node) => node.level));
  nodes.forEach((node) => { node.level = Math.max(1, node.level - firstLevel + 1); node.children = []; });
  let root = nodes[0];
  if (root.level !== 1) { root = { id: 'mindmap-root', label: '思维导图', level: 1, kind: 'root', children: [] }; }
  const stack = root.id === 'mindmap-root' ? [root] : [root];
  if (root.id !== 'mindmap-root') root.children = [];
  nodes.forEach((node, index) => {
    if (node === root) return;
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    const parent = stack[stack.length - 1] || root;
    parent.children.push(node);
    stack.push(node);
    if (index === 0 && root.id === 'mindmap-root') stack.splice(0, stack.length, root, node);
  });
  if (root.id === 'mindmap-root' && !root.children.length) root.children = nodes;
  const count = nodes.length + (root.id === 'mindmap-root' ? 1 : 0);
  return { root, count };
}

function renderMindmapSvg(source, options = {}) {
  const graph = parseMindmapMarkdown(source);
  const root = graph.root;
  const leaves = [];
  const visitLeaves = (node) => { if (!node.children.length) leaves.push(node); else node.children.forEach(visitLeaves); };
  visitLeaves(root);
  const leafGap = 58;
  const levelGap = 218;
  const top = 58;
  const left = 92;
  const right = 54;
  const height = Math.max(360, top * 2 + Math.max(1, leaves.length - 1) * leafGap + 70);
  const depthMap = new Map();
  const positions = new Map();
  const labelWidth = (label) => Math.min(260, Math.max(72, [...label].length * 14 + 28));
  let leafIndex = 0;
  const place = (node, depth) => {
    depthMap.set(node, Math.max(depthMap.get(node) || 0, depth));
    const x = left + depth * levelGap;
    if (!node.children.length) {
      const y = top + leafIndex * leafGap + 26;
      leafIndex += 1;
      positions.set(node, { x, y, width: labelWidth(node.label), depth });
      return y;
    }
    const childYs = node.children.map((child) => place(child, depth + 1));
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positions.set(node, { x, y, width: labelWidth(node.label), depth });
    return y;
  };
  place(root, 0);
  const maxDepth = Math.max(...[...positions.values()].map((item) => item.depth), 0);
  const width = Math.max(760, left + (maxDepth + 1) * levelGap + right);
  const background = options.transparent ? '' : `<rect width="100%" height="100%" fill="${options.background || '#ffffff'}" />`;
  const palette = ['#3182ce', '#f97316', '#16a34a', '#e11d48', '#8b5cf6', '#0891b2', '#ca8a04'];
  const textColor = options.textColor || '#273248';
  const lines = [];
  const nodes = [];
  const add = (node, branchColor) => {
    const from = positions.get(node);
    node.children.forEach((child, childIndex) => {
      const to = positions.get(child);
      const color = node === root ? palette[childIndex % palette.length] : branchColor;
      const startX = from.x + from.width * 0.45;
      const endX = to.x - to.width * 0.48;
      const bend = Math.max(34, (endX - startX) * 0.42);
      lines.push(`<path d="M ${startX.toFixed(1)} ${from.y.toFixed(1)} C ${(startX + bend).toFixed(1)} ${from.y.toFixed(1)}, ${(endX - bend).toFixed(1)} ${to.y.toFixed(1)}, ${endX.toFixed(1)} ${to.y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" />`);
      add(child, color);
    });
    const point = positions.get(node);
    const fontSize = node === root ? 22 : node.kind === 'heading' ? 17 : 15;
    const weight = node === root || node.kind === 'heading' ? 600 : 450;
    const color = node === root ? textColor : branchColor || textColor;
    const underline = node === root ? '' : `<line x1="${(point.x - point.width * 0.46).toFixed(1)}" y1="${(point.y + 9).toFixed(1)}" x2="${(point.x + point.width * 0.46).toFixed(1)}" y2="${(point.y + 9).toFixed(1)}" stroke="${color}" stroke-width="2" opacity=".86" />`;
    const circle = node.children.length ? `<circle cx="${(point.x + point.width * 0.46).toFixed(1)}" cy="${point.y.toFixed(1)}" r="${node === root ? 8 : 6}" fill="#fff" stroke="${color}" stroke-width="2.6" />` : '';
    nodes.push(`${underline}${circle}<text x="${point.x.toFixed(1)}" y="${(point.y + (node === root ? 7 : 5)).toFixed(1)}" text-anchor="middle" fill="${color}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif" font-size="${fontSize}" font-weight="${weight}">${escapeHtml(node.label)}</text>`);
  };
  add(root, palette[0]);
  return { graph, svg: `<svg xmlns="http://www.w3.org/2000/svg" class="mindmap-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="思维导图"><title>${escapeHtml(root.label)}</title>${background}${lines.join('')}${nodes.join('')}</svg>` };
}

function bindMindmapWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#mindmap-input');
  const preview = content.querySelector('#mindmap-preview');
  const status = content.querySelector('#mindmap-status');
  const meta = content.querySelector('#mindmap-input-meta');
  const transparent = content.querySelector('#mindmap-transparent');
  let currentSvg = '';
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStart = null;
  const getColors = () => {
    const styles = getComputedStyle(document.documentElement);
    return { background: styles.getPropertyValue('--panel').trim() || '#ffffff', textColor: styles.getPropertyValue('--text').trim() || '#273248' };
  };
  const applyTransform = () => {
    const svg = preview.querySelector('svg');
    if (!svg) return;
    svg.style.transformOrigin = 'center center';
    svg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  };
  const render = () => {
    const parsed = renderMindmapSvg(input.value, { ...getColors(), transparent: transparent.checked });
    currentSvg = parsed.svg;
    preview.innerHTML = currentSvg;
    applyTransform();
    status.textContent = `已生成 · ${parsed.graph.count} 个节点`;
    status.className = 'crypto-status-success';
    meta.textContent = `${input.value.length} 字符 · 实时解析`;
  };
  const fit = () => { scale = 1; panX = 0; panY = 0; applyTransform(); };
  content.querySelectorAll('[data-mindmap-template]').forEach((button) => button.addEventListener('click', () => {
    const preset = mindmapTemplatePresets[button.dataset.mindmapTemplate];
    if (!preset) return;
    input.value = preset.content;
    content.querySelectorAll('[data-mindmap-template]').forEach((item) => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-selected', item === button ? 'true' : 'false'); });
    fit();
    render();
  }));
  content.querySelector('[data-mindmap-action="copy"]').addEventListener('click', () => copyText(input.value).then(() => showToast('Markdown 大纲已复制')));
  content.querySelector('[data-mindmap-action="link"]').addEventListener('click', () => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end) || '链接文本';
    const snippet = `[${selected}](https://example.com)`;
    input.setRangeText(snippet, start, end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
  content.querySelector('[data-mindmap-action="clear"]').addEventListener('click', () => { input.value = ''; fit(); render(); input.focus(); });
  content.querySelector('[data-mindmap-action="fit"]').addEventListener('click', fit);
  content.querySelector('[data-mindmap-action="download-svg"]').addEventListener('click', () => downloadTextFile(currentSvg, 'byetools-mindmap.svg', 'image/svg+xml;charset=utf-8'));
  content.querySelector('[data-mindmap-action="download-png"]').addEventListener('click', async () => {
    const svgNode = preview.querySelector('svg');
    if (!svgNode) return;
    const match = currentSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const width = Number(match?.[1]) || 1200;
    const height = Number(match?.[2]) || 600;
    const blobUrl = URL.createObjectURL(new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = blobUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      const ratio = 2;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const context = canvas.getContext('2d');
      context.scale(ratio, ratio);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((png) => { if (png) { downloadBlob(png, 'byetools-mindmap.png'); showToast('PNG 已导出'); } else showToast('PNG 导出失败'); });
    } catch (error) {
      showToast(`PNG 导出失败：${error.message}`);
    } finally { URL.revokeObjectURL(blobUrl); }
  });
  transparent.addEventListener('change', render);
  input.addEventListener('input', render);
  preview.addEventListener('wheel', (event) => { event.preventDefault(); scale = Math.min(2.4, Math.max(.55, scale * (event.deltaY < 0 ? 1.08 : .92))); applyTransform(); }, { passive: false });
  preview.addEventListener('pointerdown', (event) => { dragging = true; dragStart = { x: event.clientX - panX, y: event.clientY - panY }; preview.setPointerCapture(event.pointerId); preview.classList.add('is-dragging'); });
  preview.addEventListener('pointermove', (event) => { if (!dragging) return; panX = event.clientX - dragStart.x; panY = event.clientY - dragStart.y; applyTransform(); });
  preview.addEventListener('pointerup', () => { dragging = false; preview.classList.remove('is-dragging'); });
  preview.addEventListener('pointercancel', () => { dragging = false; preview.classList.remove('is-dragging'); });
  render();
  activeWorkspaceCleanup = () => { dragging = false; };
}

function parseMermaidSource(source) {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const direction = (lines[0]?.match(/(?:flowchart|graph)\s+(LR|RL|TB|BT)/i)?.[1] || 'LR').toUpperCase();
  const nodes = [];
  const labels = {};
  const edges = [];
  lines.forEach((line) => {
    const nodePattern = /([A-Za-z][\w-]*)(?:\s*\[([^\]]+)\]|\s*\(([^)]+)\)|\s*\{([^}]+)\})?/g;
    let match;
    while ((match = nodePattern.exec(line))) {
      const id = match[1];
      if (['flowchart', 'graph', 'subgraph', 'end', 'LR', 'RL', 'TB', 'BT'].includes(id)) continue;
      if (!nodes.includes(id)) nodes.push(id);
      labels[id] = match[2] || match[3] || match[4] || labels[id] || id;
    }
    const edgePattern = /([A-Za-z][\w-]*)[^\n]*?(?:-->|---|-.->)[^\n]*?([A-Za-z][\w-]*)/g;
    let edge;
    while ((edge = edgePattern.exec(line))) edges.push([edge[1], edge[2]]);
  });
  if (!nodes.length) nodes.push('A');
  return { direction, nodes, labels, edges: edges.filter(([from, to]) => nodes.includes(from) && nodes.includes(to)) };
}

function renderMermaidSvg(source) {
  const graph = parseMermaidSource(source);
  const horizontal = ['LR', 'RL'].includes(graph.direction);
  const width = horizontal ? Math.max(680, graph.nodes.length * 190) : 760;
  const height = horizontal ? 300 : Math.max(280, graph.nodes.length * 120);
  const positions = {};
  graph.nodes.forEach((id, index) => {
    positions[id] = horizontal ? { x: 80 + index * 180, y: 125 } : { x: 280, y: 45 + index * 105 };
  });
  const edgeMarkup = graph.edges.map(([from, to]) => {
    const start = positions[from];
    const end = positions[to];
    const x1 = horizontal ? start.x + 128 : start.x + 72;
    const y1 = horizontal ? start.y + 24 : start.y + 48;
    const x2 = horizontal ? end.x : end.x + 72;
    const y2 = horizontal ? end.y + 24 : end.y;
    return `<path d="M ${x1} ${y1} L ${x2} ${y2}" class="mermaid-edge" marker-end="url(#arrow)" />`;
  }).join('');
  const nodeMarkup = graph.nodes.map((id) => {
    const point = positions[id];
    return `<g class="mermaid-node"><rect x="${point.x}" y="${point.y}" width="128" height="48" rx="9" /><text x="${point.x + 64}" y="${point.y + 29}" text-anchor="middle">${escapeHtml(graph.labels[id])}</text></g>`;
  }).join('');
  return `<svg class="mermaid-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Mermaid 图表"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" class="mermaid-arrow" /></marker></defs><text x="28" y="30" class="mermaid-direction">${escapeHtml(graph.direction)} · ${graph.nodes.length} 个节点</text>${edgeMarkup}${nodeMarkup}</svg>`;
}

function bindMermaidWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#mermaid-input');
  const preview = content.querySelector('#mermaid-preview');
  const status = content.querySelector('#mermaid-status');
  const render = () => {
    preview.innerHTML = renderMermaidSvg(input.value);
    status.textContent = `已渲染 · ${parseMermaidSource(input.value).nodes.length} 个节点`;
    status.className = 'crypto-status-success';
  };
  content.querySelectorAll('[data-tool-action="mermaid-render"]').forEach((button) => button.addEventListener('click', render));
  content.querySelector('[data-tool-action="mermaid-copy"]').addEventListener('click', () => copyText(preview.innerHTML).then(() => showToast('SVG 已复制')));
  content.querySelector('[data-tool-action="mermaid-download"]').addEventListener('click', () => downloadTextFile(preview.innerHTML, 'byetools-diagram.svg', 'image/svg+xml;charset=utf-8'));
  input.addEventListener('input', render);
  render();
}

function renderMarkdown(value) {
  const codeBlocks = [];
  const tableBlocks = [];
  const token = (type, index) => `\uE000${type}${index}\uE001`;
  let html = escapeHtml(String(value ?? '').replace(/\r\n?/g, '\n'));
  html = html.replace(/^```(?:([\w+-]+))?\n([\s\S]*?)^```\s*$/gm, (_, language, code) => {
    const index = codeBlocks.push(`<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ''}>${code.replace(/\n$/, '')}</code></pre>`) - 1;
    return token('code', index);
  });
  const sourceLines = html.split('\n');
  const renderedLines = [];
  const splitTableRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const isTableDivider = (line) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  for (let index = 0; index < sourceLines.length; index += 1) {
    const header = sourceLines[index];
    if (header.includes('|') && isTableDivider(sourceLines[index + 1] || '')) {
      const rows = [splitTableRow(header)];
      index += 2;
      while (index < sourceLines.length && sourceLines[index].includes('|') && sourceLines[index].trim()) { rows.push(splitTableRow(sourceLines[index])); index += 1; }
      const columns = Math.max(...rows.map((row) => row.length));
      const cells = (row, tag) => Array.from({ length: columns }, (_, cellIndex) => `<${tag}>${row[cellIndex] || ''}</${tag}>`).join('');
      const indexToken = tableBlocks.push(`<table><thead><tr>${cells(rows[0], 'th')}</tr></thead><tbody>${rows.slice(1).map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody></table>`) - 1;
      renderedLines.push(token('table', indexToken));
      index -= 1;
    } else renderedLines.push(header);
  }
  html = renderedLines.join('\n');
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>').replace(/^##### (.+)$/gm, '<h5>$1</h5>').replace(/^#### (.+)$/gm, '<h4>$1</h4>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/((?:^&gt; ?.+(?:\n|$))+)/gm, (block) => `<blockquote>${block.split('\n').filter(Boolean).map((line) => line.replace(/^&gt; ?/, '')).join('<br />')}</blockquote>`);
  html = html.replace(/^[-*] \[([ xX])\] (.+)$/gm, (_, checked, text) => `<li class="markdown-task"><input type="checkbox" ${checked.toLowerCase() === 'x' ? 'checked ' : ''}disabled>${text}</li>`);
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li data-ordered="true">$2</li>');
  html = html.replace(/((?:<li(?: class="markdown-task")?>.*<\/li>\n?)+)/g, (list) => `<ul>${list}</ul>`);
  html = html.replace(/((?:<li data-ordered="true">.*<\/li>\n?)+)/g, (list) => `<ol>${list.replace(/ data-ordered="true"/g, '')}</ol>`);
  html = html.replace(/^---+$/gm, '<hr />');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+|data:image\/[a-z0-9.+-]+;base64,[^\s)]+)\)/gi, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\$\$([^$\n]+)\$\$/g, (_, formula) => `<div class="markdown-math-block">$$${formula}$$</div>`).replace(/\$([^$\n]+)\$/g, (_, formula) => `<span class="markdown-math">$${formula}$</span>`);
  html = html.split(/\n{2,}/).map((block) => /^(?:<(?:h[1-6]|ul|ol|blockquote|pre|hr|table|div class="markdown-math-block")|\uE000)/.test(block) ? block : `<p>${block.replace(/\n/g, '<br />')}</p>`).join('');
  return html.replace(/\uE000code(\d+)\uE001/g, (_, index) => codeBlocks[Number(index)] || '').replace(/\uE000table(\d+)\uE001/g, (_, index) => tableBlocks[Number(index)] || '');
}

function markdownThemeColors(theme) {
  return { midnight: ['#101a2e', '#f5f8ff', '#8fb7ff', '#253655'], paper: ['#fffdf7', '#263238', '#496b5a', '#e3e0d6'], mint: ['#e8f8f1', '#19352d', '#247d64', '#b9e4d0'] }[theme] || ['#101a2e', '#f5f8ff', '#8fb7ff', '#253655'];
}

function exportMarkdownPng(value, theme, size) {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const lines = value.split(/\r?\n/);
  const lineHeight = Number(size) * 1.65;
  const padding = 58;
  canvas.width = 1200 * scale;
  canvas.height = Math.max(420, padding * 2 + lines.length * lineHeight + 24) * scale;
  const context = canvas.getContext('2d');
  const [background, foreground, accent] = markdownThemeColors(theme);
  context.scale(scale, scale);
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
  context.fillStyle = accent;
  context.fillRect(padding, 42, 46, 5);
  context.font = `700 ${Number(size) * 1.65}px ${getComputedStyle(document.body).fontFamily}`;
  context.fillStyle = foreground;
  lines.forEach((line, index) => {
    const clean = line.replace(/^#{1,3}\s*/, '').replace(/^[-*]\s*/, '• ');
    context.font = `${/^#/.test(line) ? '700' : '400'} ${Number(size) * (/^# /.test(line) ? 1.7 : 1)}px ${getComputedStyle(document.body).fontFamily}`;
    context.fillText(clean, padding, padding + 28 + index * lineHeight);
  });
  canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'byetools-markdown.png'; link.click(); URL.revokeObjectURL(url); showToast('PNG 已导出'); }, 'image/png');
}

function bindMarkdownImageWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#markdown-input');
  const preview = content.querySelector('#markdown-preview');
  const theme = content.querySelector('#markdown-theme');
  const size = content.querySelector('#markdown-size');
  const status = content.querySelector('#markdown-status');
  const render = () => {
    preview.innerHTML = renderMarkdown(input.value);
    preview.dataset.theme = theme.value;
    preview.style.setProperty('--markdown-size', `${size.value}px`);
    status.textContent = `${input.value.length} 个字符 · 实时排版`;
  };
  content.querySelector('[data-tool-action="markdown-render"]').addEventListener('click', render);
  content.querySelector('[data-tool-action="markdown-export"]').addEventListener('click', () => exportMarkdownPng(input.value, theme.value, size.value));
  input.addEventListener('input', render);
  theme.addEventListener('change', render);
  size.addEventListener('change', render);
  render();
}

function markdownEditorSafeFilename(value) {
  const normalized = String(value || '').trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  if (!normalized) return 'untitled.md';
  return normalized.toLowerCase().endsWith('.md') || normalized.toLowerCase().endsWith('.markdown') ? normalized : `${normalized}.md`;
}

function markdownFromHtml(root) {
  const inline = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\u00a0/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const content = [...node.childNodes].map(inline).join('');
    const tag = node.tagName.toLowerCase();
    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') return `**${content}**`;
    if (tag === 'em' || tag === 'i') return `*${content}*`;
    if (tag === 'del' || tag === 's' || tag === 'strike') return `~~${content}~~`;
    if (tag === 'code' && node.parentElement?.tagName.toLowerCase() !== 'pre') return `\`${content}\``;
    if (tag === 'a') return `[${content}](${node.getAttribute('href') || 'https://example.com'})`;
    if (tag === 'img') return `![${node.getAttribute('alt') || '图片'}](${node.getAttribute('src') || ''})`;
    return content;
  };
  const block = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.trim();
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag.slice(1)))} ${inline(node).trim()}\n\n`;
    if (tag === 'p' || tag === 'div') return `${inline(node).trim()}\n\n`;
    if (tag === 'blockquote') return `${inline(node).split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
    if (tag === 'pre') return `\`\`\`\n${node.textContent.replace(/\n+$/, '')}\n\`\`\`\n\n`;
    if (tag === 'hr') return '---\n\n';
    if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      return [...node.children].filter((child) => child.tagName.toLowerCase() === 'li').map((item, index) => {
        const checkbox = item.querySelector(':scope > input[type="checkbox"]');
        const text = [...item.childNodes].filter((child) => child !== checkbox).map(inline).join('').trim();
        return `${ordered ? `${index + 1}.` : '-'} ${checkbox ? `[${checkbox.checked ? 'x' : ' '}] ` : ''}${text}`;
      }).join('\n') + '\n\n';
    }
    if (tag === 'table') {
      const rows = [...node.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => inline(cell).replace(/\|/g, '\\|').trim()));
      if (!rows.length) return '';
      const columns = rows[0].length;
      const divider = Array.from({ length: columns }, () => '---');
      return `| ${rows[0].join(' | ')} |\n| ${divider.join(' | ')} |\n${rows.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
    }
    return inline(node).trim() ? `${inline(node).trim()}\n\n` : '';
  };
  return [...root.childNodes].map(block).join('').replace(/\n{3,}/g, '\n\n').trim();
}

function bindMarkdownEditorWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.closest('.markdown-editor-workbench');
  const layout = content.querySelector('[data-markdown-editor-layout]');
  const input = content.querySelector('#markdown-editor-input');
  const visual = content.querySelector('#markdown-editor-visual');
  const preview = content.querySelector('#markdown-editor-preview');
  const lineNumbers = content.querySelector('#markdown-editor-line-numbers');
  const count = content.querySelector('#markdown-editor-count');
  const fileInput = content.querySelector('#markdown-editor-file-input');
  const filename = content.querySelector('#markdown-editor-filename');
  const heading = content.querySelector('#markdown-editor-heading');
  const status = content.querySelector('#markdown-editor-status');
  const previewMeta = content.querySelector('#markdown-editor-preview-meta');
  let draftTimer = null;
  let dirty = false;
  let userInteracted = false;
  let loadToken = 0;
  let activeView = 'split';
  const setStatus = (value, stateClass = '') => { status.textContent = value; status.className = `markdown-editor-status ${stateClass}`.trim(); };
  const updateLineNumbers = () => {
    const lines = input.value.split(/\r?\n/).length;
    lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join('\n');
    count.textContent = `${input.value.length} 字符 · ${lines} 行`;
  };
  const render = ({ syncVisual = false } = {}) => {
    preview.innerHTML = renderMarkdown(input.value);
    updateLineNumbers();
    previewMeta.textContent = `${input.value.length} 字符 · 实时更新`;
    if (syncVisual) visual.innerHTML = renderMarkdown(input.value);
  };
  const persistDraft = () => {
    if (!storage) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => storage.setDraft('markdown-editor', { draft: input.value, filename: markdownEditorSafeFilename(filename.value) }).catch(() => {}), 180);
  };
  const markDirty = () => {
    userInteracted = true;
    dirty = true;
    setStatus('有未保存修改', 'is-warning');
    render();
    persistDraft();
  };
  const applyText = (value, name = filename.value, sourceLabel = '') => {
    input.value = String(value ?? '');
    filename.value = markdownEditorSafeFilename(name);
    dirty = false;
    render({ syncVisual: activeView === 'edit' });
    setStatus(sourceLabel ? `已打开 · ${sourceLabel}` : '本地草稿', 'is-success');
    persistDraft();
  };
  const insertSourceFormat = (format) => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end) || (format === 'link' ? '链接文字' : format === 'image' ? '图片描述' : '文本');
    const headingLevel = Math.max(1, Math.min(6, Number(heading?.value || 1)));
    const wrappers = { bold: ['**', '**'], italic: ['*', '*'], strike: ['~~', '~~'], code: ['`', '`'], link: ['[', '](https://example.com)'], image: ['![', '](https://example.com/image.png)'], math: ['$', '$'] };
    let replacement = '';
    if (format === 'heading') replacement = selected.split('\n').map((line) => `${'#'.repeat(headingLevel)} ${line.replace(/^#{1,6}\s*/, '')}`).join('\n');
    else if (format === 'unordered') replacement = selected.split('\n').map((line) => `- ${line.replace(/^[-*]\s*/, '')}`).join('\n');
    else if (format === 'ordered') replacement = selected.split('\n').map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, '')}`).join('\n');
    else if (format === 'task') replacement = selected.split('\n').map((line) => `- [ ] ${line.replace(/^[-*]\s*(?:\[[ xX]\]\s*)?/, '')}`).join('\n');
    else if (format === 'quote') replacement = selected.split('\n').map((line) => `> ${line.replace(/^>\s?/, '')}`).join('\n');
    else if (format === 'code-block') replacement = `\`\`\`text\n${selected}\n\`\`\``;
    else if (format === 'table') replacement = '| 项目 | 说明 |\n| --- | --- |\n| 内容 | 在这里填写 |';
    else if (format === 'hr') replacement = '---';
    else replacement = `${wrappers[format][0]}${selected}${wrappers[format][1]}`;
    input.setRangeText(replacement, start, end, 'select');
    input.focus();
    markDirty();
  };
  const syncSourceFromVisual = () => {
    input.value = markdownFromHtml(visual);
    dirty = true;
    userInteracted = true;
    setStatus('有未保存修改', 'is-warning');
    render();
    persistDraft();
  };
  const insertVisualFormat = (format) => {
    visual.focus();
    const commandMap = { bold: 'bold', italic: 'italic', strike: 'strikeThrough', unordered: 'insertUnorderedList', ordered: 'insertOrderedList', quote: 'formatBlock' };
    if (commandMap[format]) {
      if (format === 'quote') document.execCommand(commandMap[format], false, 'blockquote');
      else document.execCommand(commandMap[format], false);
    } else if (format === 'heading') document.execCommand('formatBlock', false, `h${Math.max(1, Math.min(6, Number(heading?.value || 1)))}`);
    else if (format === 'link') document.execCommand('createLink', false, 'https://example.com');
    else if (format === 'image') document.execCommand('insertHTML', false, '<img src="https://example.com/image.png" alt="图片描述" />');
    else if (format === 'table') document.execCommand('insertHTML', false, '<table><thead><tr><th>项目</th><th>说明</th></tr></thead><tbody><tr><td>内容</td><td>在这里填写</td></tr></tbody></table>');
    else if (format === 'hr') document.execCommand('insertHorizontalRule', false);
    else if (format === 'code-block') document.execCommand('formatBlock', false, 'pre');
    else if (format === 'task') document.execCommand('insertText', false, '☐ ');
    else if (format === 'math') document.execCommand('insertText', false, '$x^2$');
    else if (format === 'code') document.execCommand('insertHTML', false, `<code>${escapeHtml(window.getSelection()?.toString() || '文本')}</code>`);
    syncSourceFromVisual();
  };
  const applyFormat = (format) => { if (activeView === 'edit') insertVisualFormat(format); else insertSourceFormat(format); };
  const setView = (view) => {
    if (!['edit', 'source', 'split', 'preview'].includes(view)) return;
    activeView = view;
    layout.dataset.markdownView = view;
    content.querySelectorAll('[data-markdown-editor-view]').forEach((button) => {
      const selected = button.dataset.markdownEditorView === view;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    if (view === 'edit') visual.innerHTML = renderMarkdown(input.value);
    render();
  };
  const save = () => {
    const name = markdownEditorSafeFilename(filename.value);
    filename.value = name;
    downloadTextFile(input.value, name, 'text/markdown;charset=utf-8');
    dirty = false;
    setStatus(`已保存 · ${name}`, 'is-success');
    persistDraft();
    showToast(`Markdown 文件已保存：${name}`);
  };
  const openFile = async (file) => {
    if (!file) return;
    userInteracted = true;
    const token = ++loadToken;
    try {
      const text = await file.text();
      if (token !== loadToken) return;
      applyText(text, file.name, file.name);
      setStatus(`已打开 · ${file.name}`, 'is-success');
    } catch (error) {
      setStatus(`打开失败：${error.message}`, 'is-error');
      showToast(`Markdown 文件打开失败：${error.message}`);
    }
  };
  const restoreDraft = async () => {
    if (!storage) return;
    try {
      const record = await storage.getDraft('markdown-editor');
      const payload = record?.payload;
      if (!userInteracted && payload && typeof payload === 'object' && typeof payload.draft === 'string' && payload.draft) applyText(payload.draft, payload.filename || 'untitled.md');
    } catch (error) {
      setStatus('本地草稿读取失败', 'is-error');
    }
  };
  const toggleFullscreen = () => {
    const fullscreen = workbench.classList.toggle('is-fullscreen');
    setStatus(fullscreen ? '已进入全屏' : (dirty ? '有未保存修改' : '本地草稿'), fullscreen ? 'is-success' : dirty ? 'is-warning' : '');
  };
  const onDocumentKeydown = (event) => { if (event.key === 'Escape' && workbench.classList.contains('is-fullscreen')) { workbench.classList.remove('is-fullscreen'); setStatus(dirty ? '有未保存修改' : '本地草稿', dirty ? 'is-warning' : ''); } };
  input.addEventListener('input', markDirty);
  input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
  visual.addEventListener('input', syncSourceFromVisual);
  filename.addEventListener('change', () => { userInteracted = true; filename.value = markdownEditorSafeFilename(filename.value); if (dirty) setStatus('有未保存修改', 'is-warning'); });
  heading?.addEventListener('change', () => applyFormat('heading'));
  fileInput.addEventListener('change', () => { openFile(fileInput.files?.[0]); fileInput.value = ''; });
  content.addEventListener('click', (event) => {
    const view = event.target.closest('[data-markdown-editor-view]')?.dataset.markdownEditorView;
    if (view) { setView(view); return; }
    const format = event.target.closest('[data-markdown-editor-format]')?.dataset.markdownEditorFormat;
    if (format) { applyFormat(format); return; }
    const action = event.target.closest('[data-markdown-editor-action]')?.dataset.markdownEditorAction;
    if (!action) return;
    if (action === 'save') save();
    if (action === 'copy-html') copyText(preview.innerHTML).then(() => showToast('预览 HTML 已复制'));
    if (action === 'copy-markdown') copyText(input.value).then(() => showToast('Markdown 源码已复制'));
    if (action === 'fullscreen') toggleFullscreen();
    if (action === 'clear') { userInteracted = true; input.value = ''; dirty = true; render({ syncVisual: activeView === 'edit' }); setStatus('有未保存修改', 'is-warning'); persistDraft(); input.focus(); }
    if (action === 'new') { userInteracted = true; input.value = ''; filename.value = 'untitled.md'; dirty = true; render({ syncVisual: activeView === 'edit' }); setStatus('新建文档', 'is-warning'); persistDraft(); input.focus(); }
  });
  content.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); fileInput.click(); }
  });
  document.addEventListener('keydown', onDocumentKeydown);
  setView('split');
  render();
  restoreDraft();
  activeWorkspaceCleanup = () => { clearTimeout(draftTimer); loadToken += 1; document.removeEventListener('keydown', onDocumentKeydown); };
}

const imageToolModes = [
  ['compress', '图片压缩', '按质量减小体积'],
  ['resize', '尺寸调整', '按像素缩放图片'],
  ['crop', '图片裁剪', '精确裁剪图片区域'],
  ['format', '格式转换', 'PNG、JPEG、WebP 互转'],
  ['base64', 'Base64 互转', '图片与文本双向转换'],
];

const imageCropAspectPresets = [
  ['free', '自由', null],
  ['original', '原始', 'original'],
  ['1:1', '1:1', 1],
  ['4:3', '4:3', 4 / 3],
  ['3:4', '3:4', 3 / 4],
  ['16:9', '16:9', 16 / 9],
  ['9:16', '9:16', 9 / 16],
  ['3:2', '3:2', 3 / 2],
  ['2:3', '2:3', 2 / 3],
  ['custom', '自定义', 'custom'],
];

const imageCropShapes = [
  ['rectangle', '矩形', '□'],
  ['rounded', '圆角', '▢'],
  ['circle', '圆形', '○'],
  ['oval', '椭圆', '⬭'],
  ['triangle', '三角形', '△'],
  ['diamond', '菱形', '◇'],
  ['pentagon', '五边形', '⬠'],
  ['hexagon', '六边形', '⬡'],
  ['star', '五角星', '☆'],
  ['heart', '心形', '♡'],
];

function fileModeTabsMarkup(id, modes, active) {
  return `<div class="file-mode-tabs" id="${id}" role="tablist">${modes.map(([value, label, hint], index) => `<button class="file-mode-tab ${value === active ? 'is-active' : ''}" type="button" role="tab" aria-selected="${value === active}" data-file-mode="${value}"><b>${label}</b><small>${hint}</small></button>`).join('')}</div>`;
}

function fileDropzoneMarkup(inputId, dropzoneId, acceptText) {
  return `<input class="file-native-input" id="${inputId}" type="file" accept="${acceptText}" /><label class="file-dropzone" id="${dropzoneId}" for="${inputId}"><span class="file-dropzone-icon">＋</span><strong>选择文件或拖拽到这里</strong><small>文件只在当前设备处理，不会上传</small></label>`;
}

const qrBarcodeModes = [
  ['qr-generate', '二维码生成', '文本生成二维码'],
  ['qr-recognize', '二维码识别', '从图片读取二维码'],
  ['barcode-generate', '条形码生成', '生成常用一维码'],
  ['barcode-recognize', '条形码识别', '从图片读取条形码'],
];

function qrBarcodeWorkbenchMarkup() {
  return `<div class="file-workbench qr-barcode-workbench">
    ${fileModeTabsMarkup('qr-barcode-mode-tabs', qrBarcodeModes, 'qr-generate')}
    <div class="qr-barcode-layout">
      <section class="workspace-card qr-barcode-config-card"><div class="workspace-card-head"><div><strong id="qrbc-config-title">二维码内容</strong><small id="qrbc-config-caption">输入文本后生成二维码图片</small></div><span class="code-badge" id="qrbc-config-badge">QR CODE</span></div><div class="file-settings" id="qrbc-settings"></div><div class="file-action-row" id="qrbc-actions"></div></section>
      <section class="workspace-card qr-barcode-preview-card"><div class="workspace-card-head"><div><strong id="qrbc-result-title">二维码预览</strong><small id="qrbc-result-caption">生成结果会显示在这里</small></div><span class="file-status" id="qrbc-status">准备就绪</span></div><div class="qrbc-result-stage" id="qrbc-result-stage"><div class="file-empty"><span>QR</span><strong>输入内容开始生成</strong><small>结果仅在当前设备处理</small></div></div></section>
    </div>
  </div>`;
}

function qrBarcodeGenerateSettingsMarkup(mode) {
  if (mode === 'qr-generate') return `<label class="file-field"><span>二维码内容</span><textarea id="qrbc-qr-text" rows="8" spellcheck="false" placeholder="输入网址、文本或联系方式">https://byetools.local</textarea></label><div class="file-field-grid"><label class="file-field"><span>纠错等级</span><select id="qrbc-qr-level"><option value="L">L · 约 7%</option><option value="M" selected>M · 约 15%</option><option value="Q">Q · 约 25%</option><option value="H">H · 约 30%</option></select></label><label class="file-field"><span>边距</span><input id="qrbc-qr-margin" type="number" min="0" max="20" value="4" /></label></div><div class="file-field-grid"><label class="file-field"><span>尺寸（像素）</span><input id="qrbc-qr-size" type="number" min="128" max="2048" value="360" /></label><label class="file-field"><span>前景色</span><input id="qrbc-qr-dark" type="color" value="#111827" /></label></div><label class="file-field"><span>背景色</span><input id="qrbc-qr-light" type="color" value="#ffffff" /></label><p class="file-form-hint">支持纯文本、URL、JSON 等内容，二维码生成完全离线。</p>`;
  return `<label class="file-field"><span>条形码内容</span><input id="qrbc-barcode-text" type="text" value="BYETOOLS-2026" spellcheck="false" placeholder="输入要编码的数字或文本" /></label><div class="file-field-grid"><label class="file-field"><span>条码格式</span><select id="qrbc-barcode-format"><option value="code128" selected>Code 128 · 通用</option><option value="code39">Code 39 · 字母数字</option><option value="ean13">EAN-13 · 商品码</option><option value="ean8">EAN-8 · 商品码</option><option value="upca">UPC-A · 商品码</option><option value="itf14">ITF-14 · 物流码</option><option value="codabar">Codabar · 旧式码</option></select></label><label class="file-field"><span>缩放倍数</span><input id="qrbc-barcode-scale" type="number" min="1" max="8" value="3" /></label></div><div class="file-field-grid"><label class="file-field"><span>条码高度</span><input id="qrbc-barcode-height" type="number" min="5" max="200" value="15" /></label><label class="file-field"><span>条码颜色</span><input id="qrbc-barcode-foreground" type="color" value="#111827" /></label></div><div class="file-field-grid"><label class="file-field"><span>背景颜色</span><input id="qrbc-barcode-background" type="color" value="#ffffff" /></label><label class="file-check qrbc-check-field"><input id="qrbc-barcode-includetext" type="checkbox" checked /><span>显示文本</span></label></div><p class="file-form-hint">不同格式对内容有长度和字符限制，生成失败时会显示具体原因。</p>`;
}

function qrBarcodeRecognizeSettingsMarkup(mode) {
  const title = mode === 'qr-recognize' ? '二维码图片' : '条形码图片';
  return `<div class="qrbc-recognize-copy"><strong>${title}</strong><small>支持 PNG、JPEG、WebP、GIF 等常见图片格式</small></div>${fileDropzoneMarkup('qrbc-file-input', 'qrbc-dropzone', 'image/*')}<div class="file-source-meta" id="qrbc-file-meta">尚未选择图片</div><div class="qrbc-recognize-preview" id="qrbc-recognize-preview"><div class="file-empty"><span>${mode === 'qr-recognize' ? 'QR' : 'BAR'}</span><strong>选择图片开始识别</strong><small>识别在本地完成，不会上传文件</small></div></div><div class="qrbc-recognize-note"><span>i</span><p>建议使用清晰、完整且对比度较高的码图，倾斜或模糊图片可能无法识别。</p></div>`;
}

function qrBarcodeActionsMarkup(mode) {
  if (mode === 'qr-generate' || mode === 'barcode-generate') return `<button class="primary-button" type="button" data-qrbc-action="generate">生成${mode === 'qr-generate' ? '二维码' : '条形码'}</button><button class="secondary-button" type="button" data-qrbc-action="download" disabled>下载 PNG</button><button class="secondary-button" type="button" data-qrbc-action="copy" disabled>复制内容</button><button class="secondary-button" type="button" data-qrbc-action="clear">清空</button>`;
  return `<button class="primary-button" type="button" data-qrbc-action="recognize">识别图片</button><button class="secondary-button" type="button" data-qrbc-action="copy-result" disabled>复制结果</button><button class="secondary-button" type="button" data-qrbc-action="clear">清空</button>`;
}

function renderQrBarcodeMode(content, mode) {
  const isGenerate = mode.endsWith('generate');
  const isQr = mode.startsWith('qr-');
  const title = mode === 'qr-generate' ? '二维码内容' : mode === 'barcode-generate' ? '条形码内容' : isQr ? '二维码识别' : '条形码识别';
  const caption = mode === 'qr-generate' ? '输入文本后生成二维码图片' : mode === 'barcode-generate' ? '选择格式并生成条形码图片' : '上传图片后在本地解析编码内容';
  const resultTitle = isGenerate ? `${isQr ? '二维码' : '条形码'}预览` : '识别结果';
  const resultCaption = isGenerate ? '生成结果会显示在这里' : '识别出的文本会显示在这里';
  content.querySelector('#qrbc-config-title').textContent = title;
  content.querySelector('#qrbc-config-caption').textContent = caption;
  content.querySelector('#qrbc-config-badge').textContent = isGenerate ? (isQr ? 'QR CODE' : 'BARCODE') : (isQr ? 'QR IMAGE' : 'BARCODE IMAGE');
  content.querySelector('#qrbc-result-title').textContent = resultTitle;
  content.querySelector('#qrbc-result-caption').textContent = resultCaption;
  content.querySelector('#qrbc-settings').innerHTML = isGenerate ? qrBarcodeGenerateSettingsMarkup(mode) : qrBarcodeRecognizeSettingsMarkup(mode);
  content.querySelector('#qrbc-actions').innerHTML = qrBarcodeActionsMarkup(mode);
  content.querySelector('#qrbc-result-stage').innerHTML = isGenerate ? '<div class="file-empty"><span>QR</span><strong>输入内容开始生成</strong><small>结果仅在当前设备处理</small></div>' : '<div class="qrbc-recognize-result is-empty"><span>RESULT</span><strong>等待识别结果</strong><small>上传图片后点击识别</small></div>';
}

function bindQrBarcodeWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const tabs = [...content.querySelectorAll('[data-file-mode]')];
  const settings = content.querySelector('#qrbc-settings');
  const actions = content.querySelector('#qrbc-actions');
  const resultStage = content.querySelector('#qrbc-result-stage');
  const status = content.querySelector('#qrbc-status');
  let mode = 'qr-generate';
  let generatedBlob = null;
  let generatedName = '';
  let currentFile = null;
  let currentDataUrl = '';
  let recognitionText = '';
  let operationToken = 0;

  const setStatus = (value, stateClass = '') => {
    status.textContent = value;
    status.className = `file-status ${stateClass}`.trim();
  };
  const setGeneratedButtons = (enabled) => {
    actions.querySelector('[data-qrbc-action="download"]')?.toggleAttribute('disabled', !enabled);
    actions.querySelector('[data-qrbc-action="copy"]')?.toggleAttribute('disabled', !enabled);
  };
  const setRecognitionButtons = (enabled) => actions.querySelector('[data-qrbc-action="copy-result"]')?.toggleAttribute('disabled', !enabled);
  const resetOutput = () => {
    generatedBlob = null;
    generatedName = '';
    recognitionText = '';
    setGeneratedButtons(false);
    setRecognitionButtons(false);
    resultStage.innerHTML = mode.endsWith('generate') ? '<div class="file-empty"><span>QR</span><strong>输入内容开始生成</strong><small>结果仅在当前设备处理</small></div>' : '<div class="qrbc-recognize-result is-empty"><span>RESULT</span><strong>等待识别结果</strong><small>上传图片后点击识别</small></div>';
    setStatus('准备就绪');
  };
  const renderPreview = (imageUrl, file) => {
    const preview = content.querySelector('#qrbc-recognize-preview');
    const meta = content.querySelector('#qrbc-file-meta');
    if (!preview || !meta) return;
    if (!imageUrl || !file) {
      preview.innerHTML = `<div class="file-empty"><span>${mode === 'qr-recognize' ? 'QR' : 'BAR'}</span><strong>选择图片开始识别</strong><small>识别在本地完成，不会上传文件</small></div>`;
      meta.textContent = '尚未选择图片';
      return;
    }
    preview.innerHTML = `<img class="file-preview-image" src="${imageUrl}" alt="待识别的${mode === 'qr-recognize' ? '二维码' : '条形码'}图片" />`;
    meta.textContent = `${file.name} · ${formatFileSize(file.size)}`;
  };
  const setFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('请选择图片文件', 'is-error'); return; }
    const token = ++operationToken;
    try {
      currentFile = file;
      currentDataUrl = await readFileDataUrl(file);
      if (token !== operationToken) return;
      await loadImageElement(currentDataUrl);
      renderPreview(currentDataUrl, file);
      resetOutput();
      setStatus('图片已就绪', 'is-success');
    } catch (error) {
      currentFile = null;
      currentDataUrl = '';
      renderPreview('', null);
      setStatus(error.message, 'is-error');
    }
  };
  const bindFileInput = () => {
    const fileInput = content.querySelector('#qrbc-file-input');
    const dropzone = content.querySelector('#qrbc-dropzone');
    fileInput?.addEventListener('change', () => setFile(fileInput.files?.[0]));
    if (!dropzone) return;
    ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); if (eventName === 'drop') setFile(event.dataTransfer.files?.[0]); }));
  };
  const generateQr = async () => {
    const text = settings.querySelector('#qrbc-qr-text')?.value || '';
    if (!text.trim()) throw new Error('请输入二维码内容');
    const size = Math.min(2048, Math.max(128, Number(settings.querySelector('#qrbc-qr-size').value) || 360));
    const dataUrl = await QRCode.toDataURL(text, { width: size, margin: Math.max(0, Number(settings.querySelector('#qrbc-qr-margin').value) || 0), errorCorrectionLevel: settings.querySelector('#qrbc-qr-level').value, color: { dark: settings.querySelector('#qrbc-qr-dark').value, light: settings.querySelector('#qrbc-qr-light').value } });
    generatedBlob = dataUrlToBlob(dataUrl);
    generatedName = 'byetools-qrcode.png';
    resultStage.innerHTML = `<div class="qrbc-generated-output"><img class="qrbc-generated-image" src="${dataUrl}" alt="生成的二维码" /><div class="qrbc-output-meta"><strong>${size} × ${size}</strong><span>PNG · ${formatFileSize(generatedBlob.size)}</span></div></div>`;
    setGeneratedButtons(true);
    setStatus('生成完成', 'is-success');
  };
  const generateBarcode = async () => {
    const text = settings.querySelector('#qrbc-barcode-text')?.value || '';
    if (!text.trim()) throw new Error('请输入条形码内容');
    const canvas = document.createElement('canvas');
    const bcid = settings.querySelector('#qrbc-barcode-format').value;
    bwipjs.toCanvas(canvas, { bcid, text, scale: Math.min(8, Math.max(1, Number(settings.querySelector('#qrbc-barcode-scale').value) || 3)), height: Math.min(200, Math.max(5, Number(settings.querySelector('#qrbc-barcode-height').value) || 15)), includetext: settings.querySelector('#qrbc-barcode-includetext').checked, textxalign: 'center', backgroundcolor: settings.querySelector('#qrbc-barcode-background').value.replace('#', ''), barcolor: settings.querySelector('#qrbc-barcode-foreground').value.replace('#', '') });
    generatedBlob = await canvasToBlob(canvas, 'image/png');
    generatedName = `byetools-${bcid}.png`;
    resultStage.innerHTML = '<div class="qrbc-generated-output"><div class="qrbc-barcode-canvas" id="qrbc-barcode-canvas"></div><div class="qrbc-output-meta"><strong></strong><span></span></div></div>';
    resultStage.querySelector('#qrbc-barcode-canvas').append(canvas);
    resultStage.querySelector('.qrbc-output-meta strong').textContent = `${canvas.width} × ${canvas.height}`;
    resultStage.querySelector('.qrbc-output-meta span').textContent = `PNG · ${formatFileSize(generatedBlob.size)}`;
    setGeneratedButtons(true);
    setStatus('生成完成', 'is-success');
  };
  const generate = async () => {
    try {
      setStatus('正在生成');
      if (mode === 'qr-generate') await generateQr(); else await generateBarcode();
    } catch (error) {
      generatedBlob = null;
      setGeneratedButtons(false);
      setStatus(`生成失败：${error.message}`, 'is-error');
      showToast(`生成失败：${error.message}`);
    }
  };
  const recognize = async () => {
    if (!currentDataUrl || !currentFile) throw new Error('请先选择一张图片');
    const token = ++operationToken;
    setStatus('正在识别');
    try {
      const image = await loadImageElement(currentDataUrl);
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageElement(image);
      if (token !== operationToken) return;
      recognitionText = result.getText() || '';
      const format = String(result.getBarcodeFormat?.() || '').replace(/^.*\./, '') || '未知格式';
      resultStage.innerHTML = `<div class="qrbc-recognize-result"><div class="qrbc-recognize-result-head"><span>识别成功</span><b>${escapeHtml(format)}</b></div><textarea id="qrbc-recognized-text" readonly>${escapeHtml(recognitionText)}</textarea><small>内容长度 ${recognitionText.length} 个字符</small></div>`;
      setRecognitionButtons(true);
      setStatus('识别完成', 'is-success');
    } catch (error) {
      if (token !== operationToken) return;
      recognitionText = '';
      resultStage.innerHTML = '<div class="qrbc-recognize-result is-error"><span>未识别</span><strong>没有找到可读取的编码</strong><small>请更换清晰、完整且对比度较高的图片</small></div>';
      setRecognitionButtons(false);
      setStatus('识别失败', 'is-error');
    }
  };
  const renderMode = (nextMode) => {
    mode = nextMode;
    operationToken += 1;
    tabs.forEach((tab) => { const active = tab.dataset.fileMode === mode; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
    currentFile = null;
    currentDataUrl = '';
    renderQrBarcodeMode(content, mode);
    resetOutput();
    bindFileInput();
  };
  content.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-file-mode]');
    if (tab && content.contains(tab)) { renderMode(tab.dataset.fileMode); return; }
    const action = event.target.closest('[data-qrbc-action]')?.dataset.qrbcAction;
    if (!action) return;
    if (action === 'generate') { generate(); return; }
    if (action === 'recognize') { recognize().catch((error) => setStatus(error.message, 'is-error')); return; }
    if (action === 'download' && generatedBlob) { downloadBlob(generatedBlob, generatedName); return; }
    if (action === 'copy') { copyText(mode === 'qr-generate' ? settings.querySelector('#qrbc-qr-text').value : settings.querySelector('#qrbc-barcode-text').value).then(() => showToast('内容已复制')); return; }
    if (action === 'copy-result' && recognitionText) { copyText(recognitionText).then(() => showToast('识别结果已复制')); return; }
    if (action === 'clear') {
      currentFile = null;
      currentDataUrl = '';
      operationToken += 1;
      const fileInput = content.querySelector('#qrbc-file-input');
      if (fileInput) fileInput.value = '';
      renderPreview('', null);
      resetOutput();
    }
  });
  renderMode(mode);
  activeWorkspaceCleanup = () => { operationToken += 1; generatedBlob = null; currentFile = null; currentDataUrl = ''; };
}

function imageToolsWorkbenchMarkup() {
  return `<div class="file-workbench image-workbench">
    ${fileModeTabsMarkup('image-mode-tabs', imageToolModes, 'compress')}
    <div class="file-tool-layout">
      <section class="workspace-card file-source-card"><div class="workspace-card-head"><div><strong>源图片</strong><small id="image-source-caption">支持 PNG、JPEG、WebP、GIF、AVIF</small></div><span class="code-badge">IMAGE</span></div>${fileDropzoneMarkup('image-file-input', 'image-dropzone', 'image/*')}<div class="file-source-meta" id="image-file-meta">尚未选择图片</div><div class="file-preview-frame" id="image-source-preview"><div class="file-empty"><span>IMG</span><strong>选择图片开始处理</strong><small>支持点击选择或直接拖放</small></div></div></section>
      <section class="workspace-card file-settings-card"><div class="workspace-card-head"><div><strong>处理设置</strong><small id="image-settings-caption">调整参数后生成本地结果</small></div><span class="file-status" id="image-status">等待输入</span></div><div class="file-settings" id="image-settings"></div><div class="file-action-row"><button class="primary-button" type="button" data-file-action="image-process">处理图片</button><button class="secondary-button" type="button" data-file-action="image-download" disabled>下载结果</button><button class="secondary-button" type="button" data-file-action="image-clear">清空</button></div></section>
    </div>
    <section class="workspace-card file-result-card"><div class="workspace-card-head"><div><strong>处理结果</strong><small id="image-result-caption">生成结果会显示在这里</small></div><span class="code-badge" id="image-result-badge">OUTPUT</span></div><div class="file-result-stage" id="image-result-stage"><div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成处理后可预览和下载</small></div></div></section>
  </div>`;
}

function imageSettingsMarkup(mode) {
  if (mode === 'compress') return `<div class="file-field-grid"><label class="file-field"><span>输出格式</span><select id="image-output-format"><option value="source">保持原格式</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label><label class="file-field"><span>压缩质量 <b id="image-quality-value">82</b></span><input id="image-quality" type="range" min="10" max="100" value="82" /></label></div><p class="file-form-hint">质量越低，文件越小；PNG 输出使用无损格式。</p>`;
  if (mode === 'resize') return `<div class="file-field-grid"><label class="file-field"><span>宽度（像素）</span><input id="image-width" type="number" min="1" max="12000" value="1200" /></label><label class="file-field"><span>高度（像素）</span><input id="image-height" type="number" min="1" max="12000" value="800" /></label></div><div class="file-inline-options"><label class="file-check"><input id="image-lock-ratio" type="checkbox" checked /><span>锁定宽高比</span></label><label class="file-field file-field-inline"><span>缩放方式</span><select id="image-fit"><option value="contain">完整保留</option><option value="cover">覆盖裁切</option><option value="fill">拉伸填充</option></select></label></div><p class="file-form-hint">输入任一边尺寸后，锁定比例会自动同步另一边。</p>`;
  if (mode === 'crop') return `<div class="image-crop-settings">
    <section class="image-crop-section"><div class="image-crop-section-head"><strong>裁剪比例</strong><small id="image-crop-ratio-label">自由选择</small></div><div class="image-crop-preset-grid">${imageCropAspectPresets.map(([value, label]) => `<button class="image-crop-preset ${value === 'free' ? 'is-active' : ''}" type="button" data-crop-aspect="${value}">${label}</button>`).join('')}</div><div class="image-crop-custom" id="image-crop-custom" hidden><label class="file-field"><span>宽</span><input id="image-crop-custom-width" type="number" min="1" value="4" /></label><b>:</b><label class="file-field"><span>高</span><input id="image-crop-custom-height" type="number" min="1" value="3" /></label></div></section>
    <section class="image-crop-section"><div class="image-crop-section-head"><strong>旋转与翻转</strong><small id="image-crop-angle-value">0°</small></div><div class="image-crop-action-grid"><button class="secondary-button" type="button" data-crop-action="rotate-left">↶ 向左旋转</button><button class="secondary-button" type="button" data-crop-action="rotate-right">↷ 向右旋转</button><button class="secondary-button" type="button" data-crop-action="flip-x">↔ 水平翻转</button><button class="secondary-button" type="button" data-crop-action="flip-y">↕ 垂直翻转</button></div><div class="image-crop-range"><input id="image-crop-angle" type="range" min="-180" max="180" value="0" step="1" /><button class="text-button" type="button" data-crop-action="reset-angle">归零</button></div></section>
    <section class="image-crop-section"><div class="image-crop-section-head"><strong>裁剪形状</strong><small>结果会保留透明区域</small></div><div class="image-crop-shape-grid">${imageCropShapes.map(([value, label, icon]) => `<button class="image-crop-shape is-${value === 'rectangle' ? 'active' : ''}" type="button" data-crop-shape="${value}"><b>${icon}</b><span>${label}</span></button>`).join('')}</div></section>
    <section class="image-crop-section"><div class="image-crop-section-head"><strong>裁剪框（像素）</strong><small>可用方向键移动</small></div><div class="file-field-grid image-crop-frame-fields"><label class="file-field"><span>X</span><input id="image-crop-x" type="number" min="0" value="0" /></label><label class="file-field"><span>Y</span><input id="image-crop-y" type="number" min="0" value="0" /></label><label class="file-field"><span>宽</span><input id="image-crop-width" type="number" min="1" value="800" /></label><label class="file-field"><span>高</span><input id="image-crop-height" type="number" min="1" value="600" /></label></div></section>
    <section class="image-crop-section"><div class="image-crop-section-head"><strong>导出尺寸</strong><small id="image-crop-output-caption">保持裁剪尺寸</small></div><div class="image-crop-output-grid">${[['source', '原尺寸'], ['128', '128'], ['256', '256'], ['512', '512'], ['1024', '1024']].map(([value, label]) => `<button class="image-crop-output-size ${value === 'source' ? 'is-active' : ''}" type="button" data-crop-output="${value}">${label}</button>`).join('')}</div><label class="file-field"><span>导出宽度（像素）</span><input id="image-crop-output-width" type="number" min="1" max="12000" placeholder="保持裁剪宽度" /></label><label class="file-field"><span>输出格式</span><select id="image-output-format"><option value="source">保持原格式</option><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label></section>
  </div>`;
  if (mode === 'format') return `<div class="file-field-grid"><label class="file-field"><span>目标格式</span><select id="image-output-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp" selected>WebP</option><option value="image/avif">AVIF</option></select></label><label class="file-field"><span>输出质量 <b id="image-quality-value">90</b></span><input id="image-quality" type="range" min="10" max="100" value="90" /></label></div><p class="file-form-hint">AVIF 是否可用取决于当前浏览器；不支持时会自动回退为 PNG。</p>`;
  return `<label class="file-field"><span>转换方向</span><select id="image-base64-direction"><option value="image-to-base64">图片转 Base64</option><option value="base64-to-image">Base64 转图片</option></select></label><label class="file-field image-base64-input-field" id="image-base64-input-field" hidden><span>Base64 内容</span><textarea id="image-base64-input" rows="9" spellcheck="false" placeholder="粘贴 data:image/...;base64,... 或纯 Base64 文本"></textarea></label><p class="file-form-hint">图片转 Base64 会输出可直接用于 HTML、CSS 的 data URL。</p>`;
}

function imageMimeExtension(type, fallback = 'png') {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[type] || fallback);
}

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片无法解析，请确认文件格式有效'));
    image.src = source;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('当前浏览器不支持该输出格式')), type, quality);
  });
}

function cropShapePath(context, shape, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  const polygon = (sides, rotation = -Math.PI / 2) => {
    context.beginPath();
    for (let index = 0; index < sides; index += 1) {
      const angle = rotation + (Math.PI * 2 * index) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
  };
  if (shape === 'rounded') {
    context.beginPath();
    context.roundRect(0, 0, width, height, Math.min(width, height) * .16);
  } else if (shape === 'circle') {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  } else if (shape === 'oval') {
    context.beginPath();
    context.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'triangle') polygon(3);
  else if (shape === 'diamond') polygon(4, 0);
  else if (shape === 'pentagon') polygon(5);
  else if (shape === 'hexagon') polygon(6);
  else if (shape === 'star') {
    context.beginPath();
    const innerRadius = radius * .42;
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * index) / 5;
      const currentRadius = index % 2 === 0 ? radius : innerRadius;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
  } else if (shape === 'heart') {
    context.beginPath();
    context.moveTo(centerX, height * .9);
    context.bezierCurveTo(width * .07, height * .55, width * .02, height * .2, width * .25, height * .12);
    context.bezierCurveTo(width * .39, height * .07, centerX, height * .2, centerX, height * .32);
    context.bezierCurveTo(centerX, height * .2, width * .61, height * .07, width * .75, height * .12);
    context.bezierCurveTo(width * .98, height * .2, width * .93, height * .55, centerX, height * .9);
    context.closePath();
  } else {
    context.beginPath();
    context.rect(0, 0, width, height);
  }
}

function createCropCanvas(image, settings) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const cropWidth = Math.max(1, Math.min(Math.round(Number(settings.width) || sourceWidth), sourceWidth));
  const cropHeight = Math.max(1, Math.min(Math.round(Number(settings.height) || sourceHeight), sourceHeight));
  const x = Math.max(0, Math.min(Math.round(Number(settings.x) || 0), sourceWidth - cropWidth));
  const y = Math.max(0, Math.min(Math.round(Number(settings.y) || 0), sourceHeight - cropHeight));
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropContext = cropCanvas.getContext('2d');
  cropContext.save();
  cropContext.translate(cropWidth / 2, cropHeight / 2);
  cropContext.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
  cropContext.drawImage(image, x, y, cropWidth, cropHeight, -cropWidth / 2, -cropHeight / 2, cropWidth, cropHeight);
  cropContext.restore();

  const radians = (Number(settings.angle) || 0) * Math.PI / 180;
  const sine = Math.abs(Math.sin(radians));
  const cosine = Math.abs(Math.cos(radians));
  const rotatedWidth = Math.max(1, Math.ceil(cropWidth * cosine + cropHeight * sine));
  const rotatedHeight = Math.max(1, Math.ceil(cropWidth * sine + cropHeight * cosine));
  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  const rotatedContext = rotatedCanvas.getContext('2d');
  rotatedContext.save();
  cropShapePath(rotatedContext, settings.shape || 'rectangle', rotatedWidth, rotatedHeight);
  rotatedContext.clip();
  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(cropCanvas, -cropWidth / 2, -cropHeight / 2);
  rotatedContext.restore();

  const outputWidth = Number(settings.outputWidth);
  if (!outputWidth || outputWidth === rotatedWidth) return rotatedCanvas;
  const outputHeight = Math.max(1, Math.round(rotatedHeight * outputWidth / rotatedWidth));
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = Math.max(1, Math.round(outputWidth));
  outputCanvas.height = outputHeight;
  outputCanvas.getContext('2d').drawImage(rotatedCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
  return outputCanvas;
}

function createImageCanvas(image, mode, settings) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (mode === 'crop') {
    const width = Math.max(1, Math.min(Number(settings.width) || sourceWidth, sourceWidth));
    const height = Math.max(1, Math.min(Number(settings.height) || sourceHeight, sourceHeight));
    const x = Math.max(0, Math.min(Number(settings.x) || 0, sourceWidth - width));
    const y = Math.max(0, Math.min(Number(settings.y) || 0, sourceHeight - height));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, width, height);
    return canvas;
  }
  if (mode === 'resize') {
    const requestedWidth = Math.max(1, Number(settings.width) || sourceWidth);
    const requestedHeight = Math.max(1, Number(settings.height) || sourceHeight);
    let width = requestedWidth;
    let height = requestedHeight;
    if (settings.fit === 'contain') {
      const scale = Math.min(requestedWidth / sourceWidth, requestedHeight / sourceHeight);
      width = Math.max(1, Math.round(sourceWidth * scale));
      height = Math.max(1, Math.round(sourceHeight * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (settings.fit === 'cover') {
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    } else context.drawImage(image, 0, 0, width, height);
    return canvas;
  }
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas;
}

function parseImageBase64(value) {
  const normalized = value.trim().replace(/\s+/g, '');
  if (!normalized) throw new Error('请输入 Base64 内容');
  if (normalized.startsWith('data:image/')) return normalized;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error('Base64 内容格式不正确');
  return `data:image/png;base64,${normalized}`;
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/);
  if (!match) throw new Error('图片 Data URL 格式不正确');
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: match[1] || 'image/png' });
}

function imageCropEditorMarkup() {
  return `<div class="image-crop-editor" id="image-crop-editor"><div class="image-crop-stage" id="image-crop-stage"><canvas id="image-crop-canvas"></canvas><div class="image-crop-frame is-rectangle" id="image-crop-frame" tabindex="0" role="slider" aria-label="裁剪框"><span class="image-crop-dimension" id="image-crop-dimension"></span><i class="image-crop-handle is-nw" data-crop-handle="nw"></i><i class="image-crop-handle is-n" data-crop-handle="n"></i><i class="image-crop-handle is-ne" data-crop-handle="ne"></i><i class="image-crop-handle is-e" data-crop-handle="e"></i><i class="image-crop-handle is-se" data-crop-handle="se"></i><i class="image-crop-handle is-s" data-crop-handle="s"></i><i class="image-crop-handle is-sw" data-crop-handle="sw"></i><i class="image-crop-handle is-w" data-crop-handle="w"></i></div></div><div class="image-crop-editor-foot"><span>拖动裁剪框选择区域</span><span>方向键微调 · Shift 加速</span></div></div>`;
}

function bindImageToolsWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const tabs = content.querySelector('#image-mode-tabs');
  const settingsPanel = content.querySelector('#image-settings');
  const sourcePreview = content.querySelector('#image-source-preview');
  const resultStage = content.querySelector('#image-result-stage');
  const fileInput = content.querySelector('#image-file-input');
  const dropzone = content.querySelector('#image-dropzone');
  const fileMeta = content.querySelector('#image-file-meta');
  const status = content.querySelector('#image-status');
  const resultCaption = content.querySelector('#image-result-caption');
  const resultBadge = content.querySelector('#image-result-badge');
  const processButton = content.querySelector('[data-file-action="image-process"]');
  const downloadButton = content.querySelector('[data-file-action="image-download"]');
  let mode = 'compress';
  let currentFile = null;
  let currentDataUrl = '';
  let currentImage = null;
  let resultBlob = null;
  let resultUrl = '';
  let resultName = '';
  let fileLoadPromise = null;
  const workbench = content.querySelector('.image-workbench');
  const cropState = { x: 0, y: 0, width: 0, height: 0, aspect: 'free', customWidth: 4, customHeight: 3, shape: 'rectangle', angle: 0, flipX: false, flipY: false, outputWidth: 0, sourceFile: null };
  let cropDisplay = null;
  let cropDrag = null;
  let cropResizeFrame = 0;

  const cropAspectRatio = () => {
    if (!currentImage) return null;
    if (cropState.aspect === 'original') return currentImage.naturalWidth / currentImage.naturalHeight;
    if (cropState.aspect === 'custom') return Math.max(1, Number(cropState.customWidth) || 4) / Math.max(1, Number(cropState.customHeight) || 3);
    const preset = imageCropAspectPresets.find((item) => item[0] === cropState.aspect);
    return typeof preset?.[2] === 'number' ? preset[2] : null;
  };
  const clampCropRect = (x, y, width, height, keepRatio = true) => {
    if (!currentImage) return;
    const maxWidth = currentImage.naturalWidth;
    const maxHeight = currentImage.naturalHeight;
    let nextWidth = Math.max(20, Math.min(Math.round(Number(width) || 20), maxWidth));
    let nextHeight = Math.max(20, Math.min(Math.round(Number(height) || 20), maxHeight));
    const ratio = keepRatio ? cropAspectRatio() : null;
    if (ratio) {
      if (nextWidth / nextHeight > ratio) nextHeight = Math.max(20, Math.round(nextWidth / ratio));
      else nextWidth = Math.max(20, Math.round(nextHeight * ratio));
      if (nextWidth > maxWidth) { nextWidth = maxWidth; nextHeight = Math.max(20, Math.round(nextWidth / ratio)); }
      if (nextHeight > maxHeight) { nextHeight = maxHeight; nextWidth = Math.max(20, Math.round(nextHeight * ratio)); }
    }
    cropState.width = Math.min(maxWidth, nextWidth);
    cropState.height = Math.min(maxHeight, nextHeight);
    cropState.x = Math.max(0, Math.min(Math.round(Number(x) || 0), maxWidth - cropState.width));
    cropState.y = Math.max(0, Math.min(Math.round(Number(y) || 0), maxHeight - cropState.height));
  };
  const initializeCropState = () => {
    if (!currentImage || cropState.sourceFile === currentFile) return;
    cropState.sourceFile = currentFile;
    cropState.aspect = 'free';
    cropState.customWidth = 4;
    cropState.customHeight = 3;
    cropState.shape = 'rectangle';
    cropState.angle = 0;
    cropState.flipX = false;
    cropState.flipY = false;
    cropState.outputWidth = 0;
    clampCropRect(currentImage.naturalWidth * .1, currentImage.naturalHeight * .1, currentImage.naturalWidth * .8, currentImage.naturalHeight * .8, false);
  };
  const syncCropFields = () => {
    if (mode !== 'crop') return;
    const setValue = (selector, value) => { const field = settingsPanel.querySelector(selector); if (field && document.activeElement !== field) field.value = value; };
    setValue('#image-crop-x', cropState.x);
    setValue('#image-crop-y', cropState.y);
    setValue('#image-crop-width', cropState.width || '');
    setValue('#image-crop-height', cropState.height || '');
    setValue('#image-crop-output-width', cropState.outputWidth || '');
    const angle = settingsPanel.querySelector('#image-crop-angle');
    const angleValue = settingsPanel.querySelector('#image-crop-angle-value');
    if (angle && document.activeElement !== angle) angle.value = cropState.angle;
    if (angleValue) angleValue.textContent = `${cropState.angle}°`;
    const ratioLabel = settingsPanel.querySelector('#image-crop-ratio-label');
    if (ratioLabel) ratioLabel.textContent = cropState.aspect === 'free' ? '自由选择' : cropState.aspect === 'original' ? '原始比例' : cropState.aspect === 'custom' ? `${cropState.customWidth}:${cropState.customHeight}` : cropState.aspect;
    settingsPanel.querySelectorAll('[data-crop-aspect]').forEach((button) => button.classList.toggle('is-active', button.dataset.cropAspect === cropState.aspect));
    settingsPanel.querySelectorAll('[data-crop-shape]').forEach((button) => button.classList.toggle('is-active', button.dataset.cropShape === cropState.shape));
    settingsPanel.querySelectorAll('[data-crop-output]').forEach((button) => button.classList.toggle('is-active', (button.dataset.cropOutput === 'source' && !cropState.outputWidth) || Number(button.dataset.cropOutput) === cropState.outputWidth));
    const custom = settingsPanel.querySelector('#image-crop-custom');
    if (custom) custom.hidden = cropState.aspect !== 'custom';
    const caption = settingsPanel.querySelector('#image-crop-output-caption');
    if (caption) caption.textContent = cropState.outputWidth ? `输出宽度 ${cropState.outputWidth}px` : '保持裁剪尺寸';
  };
  const renderCropEditor = () => {
    if (mode !== 'crop' || !currentImage) return;
    const editor = sourcePreview.querySelector('#image-crop-editor');
    const stage = sourcePreview.querySelector('#image-crop-stage');
    const canvas = sourcePreview.querySelector('#image-crop-canvas');
    const frame = sourcePreview.querySelector('#image-crop-frame');
    if (!editor || !stage || !canvas || !frame) return;
    const maxWidth = Math.max(220, editor.clientWidth - 28);
    const maxHeight = Math.max(260, editor.clientHeight - 46);
    const scale = Math.min(maxWidth / currentImage.naturalWidth, maxHeight / currentImage.naturalHeight);
    const displayWidth = currentImage.naturalWidth * scale;
    const displayHeight = currentImage.naturalHeight * scale;
    cropDisplay = { scale, width: displayWidth, height: displayHeight };
    stage.style.width = `${displayWidth}px`;
    stage.style.height = `${displayHeight}px`;
    canvas.width = currentImage.naturalWidth;
    canvas.height = currentImage.naturalHeight;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((cropState.angle * Math.PI) / 180);
    context.scale(cropState.flipX ? -1 : 1, cropState.flipY ? -1 : 1);
    context.drawImage(currentImage, -canvas.width / 2, -canvas.height / 2);
    context.restore();
    frame.style.left = `${cropState.x * scale}px`;
    frame.style.top = `${cropState.y * scale}px`;
    frame.style.width = `${cropState.width * scale}px`;
    frame.style.height = `${cropState.height * scale}px`;
    frame.className = `image-crop-frame is-${cropState.shape}`;
    frame.tabIndex = 0;
    frame.setAttribute('aria-valuetext', `${cropState.width} × ${cropState.height}`);
    const dimension = frame.querySelector('#image-crop-dimension');
    if (dimension) dimension.textContent = `${cropState.width} × ${cropState.height}`;
  };
  const queueCropRender = () => {
    if (cropResizeFrame) cancelAnimationFrame(cropResizeFrame);
    cropResizeFrame = requestAnimationFrame(() => { cropResizeFrame = 0; renderCropEditor(); });
  };
  const pointerToImage = (event) => {
    const stage = sourcePreview.querySelector('#image-crop-stage');
    if (!stage || !cropDisplay) return { x: cropState.x, y: cropState.y };
    const rect = stage.getBoundingClientRect();
    return { x: Math.max(0, Math.min(currentImage.naturalWidth, (event.clientX - rect.left) / cropDisplay.scale)), y: Math.max(0, Math.min(currentImage.naturalHeight, (event.clientY - rect.top) / cropDisplay.scale)) };
  };
  const resizeCropFromPointer = (handle, dx, dy) => {
    const initial = cropDrag.initial;
    let left = initial.x;
    let top = initial.y;
    let right = initial.x + initial.width;
    let bottom = initial.y + initial.height;
    if (handle.includes('w')) left += dx;
    if (handle.includes('e')) right += dx;
    if (handle.includes('n')) top += dy;
    if (handle.includes('s')) bottom += dy;
    const ratio = cropAspectRatio();
    if (ratio) {
      let width = Math.abs(right - left);
      let height = Math.abs(bottom - top);
      if (handle === 'e' || handle === 'w') height = width / ratio;
      else if (handle === 'n' || handle === 's') width = height * ratio;
      else { width = Math.max(width, height * ratio); height = width / ratio; }
      if (handle.includes('w')) left = initial.x + initial.width - width;
      else right = initial.x + width;
      if (handle.includes('n')) top = initial.y + initial.height - height;
      else bottom = initial.y + height;
    }
    clampCropRect(left, top, right - left, bottom - top, Boolean(ratio));
  };
  const bindCropEditor = () => {
    const frame = sourcePreview.querySelector('#image-crop-frame');
    if (!frame || frame.dataset.bound === 'true') return;
    frame.dataset.bound = 'true';
    frame.addEventListener('pointerdown', (event) => {
      if (!currentImage || !cropDisplay || event.button !== 0) return;
      const handle = event.target.closest('[data-crop-handle]')?.dataset.cropHandle || 'move';
      cropDrag = { handle, start: pointerToImage(event), initial: { ...cropState } };
      frame.setPointerCapture?.(event.pointerId);
      frame.focus();
      event.preventDefault();
    });
    frame.addEventListener('pointermove', (event) => {
      if (!cropDrag) return;
      const point = pointerToImage(event);
      const dx = point.x - cropDrag.start.x;
      const dy = point.y - cropDrag.start.y;
      if (cropDrag.handle === 'move') clampCropRect(cropDrag.initial.x + dx, cropDrag.initial.y + dy, cropDrag.initial.width, cropDrag.initial.height, false);
      else resizeCropFromPointer(cropDrag.handle, dx, dy);
      syncCropFields();
      queueCropRender();
      event.preventDefault();
    });
    const finishDrag = () => { cropDrag = null; };
    frame.addEventListener('pointerup', finishDrag);
    frame.addEventListener('pointercancel', finishDrag);
    frame.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 10 : 1;
      const offsets = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const offset = offsets[event.key];
      if (!offset) return;
      clampCropRect(cropState.x + offset[0], cropState.y + offset[1], cropState.width, cropState.height, false);
      syncCropFields();
      queueCropRender();
      event.preventDefault();
    });
  };

  const setStatus = (value, stateClass = '') => { status.textContent = value; status.className = `file-status ${stateClass}`.trim(); };
  const revokeResult = () => { if (resultUrl) URL.revokeObjectURL(resultUrl); resultUrl = ''; resultBlob = null; downloadButton.disabled = true; };
  const renderSource = () => {
    if (!currentImage) {
      dropzone.hidden = mode === 'base64';
      sourcePreview.innerHTML = '<div class="file-empty"><span>IMG</span><strong>选择图片开始处理</strong><small>支持点击选择或直接拖放</small></div>';
      fileMeta.textContent = '尚未选择图片';
      return;
    }
    if (mode === 'crop') {
      dropzone.hidden = true;
      sourcePreview.innerHTML = imageCropEditorMarkup();
      bindCropEditor();
      initializeCropState();
      queueCropRender();
      fileMeta.textContent = `${currentFile.name} · ${currentImage.naturalWidth} × ${currentImage.naturalHeight} · ${formatFileSize(currentFile.size)}`;
      return;
    }
    dropzone.hidden = mode === 'base64';
    sourcePreview.innerHTML = `<img class="file-preview-image" src="${currentDataUrl}" alt="源图片预览" /><div class="file-preview-overlay"><span>${currentImage.naturalWidth} × ${currentImage.naturalHeight}</span><span>${escapeHtml(currentFile.name)}</span></div>`;
    fileMeta.textContent = `${currentFile.name} · ${currentImage.naturalWidth} × ${currentImage.naturalHeight} · ${formatFileSize(currentFile.size)}`;
  };
  const renderSettings = () => {
    settingsPanel.innerHTML = imageSettingsMarkup(mode);
    if (mode === 'resize' && currentImage) {
      settingsPanel.querySelector('#image-width').value = currentImage.naturalWidth;
      settingsPanel.querySelector('#image-height').value = currentImage.naturalHeight;
    }
    if (mode === 'crop') {
      initializeCropState();
      syncCropFields();
      settingsPanel.querySelectorAll('[data-crop-aspect]').forEach((button) => button.addEventListener('click', () => {
        cropState.aspect = button.dataset.cropAspect;
        clampCropRect(cropState.x, cropState.y, cropState.width || currentImage?.naturalWidth, cropState.height || currentImage?.naturalHeight, true);
        syncCropFields();
        queueCropRender();
      }));
      settingsPanel.querySelectorAll('[data-crop-shape]').forEach((button) => button.addEventListener('click', () => { cropState.shape = button.dataset.cropShape; syncCropFields(); queueCropRender(); }));
      settingsPanel.querySelectorAll('[data-crop-output]').forEach((button) => button.addEventListener('click', () => { cropState.outputWidth = button.dataset.cropOutput === 'source' ? 0 : Number(button.dataset.cropOutput); syncCropFields(); }));
      settingsPanel.querySelectorAll('[data-crop-action]').forEach((button) => button.addEventListener('click', () => {
        const action = button.dataset.cropAction;
        if (action === 'rotate-left') cropState.angle = Math.max(-180, cropState.angle - 90);
        if (action === 'rotate-right') cropState.angle = Math.min(180, cropState.angle + 90);
        if (action === 'flip-x') cropState.flipX = !cropState.flipX;
        if (action === 'flip-y') cropState.flipY = !cropState.flipY;
        if (action === 'reset-angle') cropState.angle = 0;
        syncCropFields();
        queueCropRender();
      }));
      settingsPanel.querySelector('#image-crop-angle')?.addEventListener('input', (event) => { cropState.angle = Number(event.target.value) || 0; syncCropFields(); queueCropRender(); });
      settingsPanel.querySelector('#image-crop-custom-width')?.addEventListener('input', (event) => { cropState.customWidth = Math.max(1, Number(event.target.value) || 1); if (cropState.aspect === 'custom') clampCropRect(cropState.x, cropState.y, cropState.width, cropState.height, true); syncCropFields(); queueCropRender(); });
      settingsPanel.querySelector('#image-crop-custom-height')?.addEventListener('input', (event) => { cropState.customHeight = Math.max(1, Number(event.target.value) || 1); if (cropState.aspect === 'custom') clampCropRect(cropState.x, cropState.y, cropState.width, cropState.height, true); syncCropFields(); queueCropRender(); });
      settingsPanel.querySelectorAll('.image-crop-frame-fields input').forEach((field) => field.addEventListener('input', () => {
        const x = Number(settingsPanel.querySelector('#image-crop-x')?.value) || 0;
        const y = Number(settingsPanel.querySelector('#image-crop-y')?.value) || 0;
        const width = Number(settingsPanel.querySelector('#image-crop-width')?.value) || cropState.width;
        const height = Number(settingsPanel.querySelector('#image-crop-height')?.value) || cropState.height;
        clampCropRect(x, y, width, height, field.id.includes('width') || field.id.includes('height'));
        syncCropFields();
        queueCropRender();
      }));
      settingsPanel.querySelector('#image-crop-output-width')?.addEventListener('input', (event) => { cropState.outputWidth = Math.max(0, Number(event.target.value) || 0); syncCropFields(); });
    }
    if (mode === 'base64') syncBase64Direction();
    settingsPanel.querySelector('#image-quality')?.addEventListener('input', (event) => { settingsPanel.querySelector('#image-quality-value').textContent = event.target.value; });
    settingsPanel.querySelector('#image-lock-ratio')?.addEventListener('change', () => {});
    settingsPanel.querySelector('#image-width')?.addEventListener('input', (event) => {
      const lock = settingsPanel.querySelector('#image-lock-ratio')?.checked;
      if (lock && currentImage) settingsPanel.querySelector('#image-height').value = Math.max(1, Math.round(Number(event.target.value || 1) * currentImage.naturalHeight / currentImage.naturalWidth));
    });
    settingsPanel.querySelector('#image-height')?.addEventListener('input', (event) => {
      const lock = settingsPanel.querySelector('#image-lock-ratio')?.checked;
      if (lock && currentImage) settingsPanel.querySelector('#image-width').value = Math.max(1, Math.round(Number(event.target.value || 1) * currentImage.naturalWidth / currentImage.naturalHeight));
    });
    settingsPanel.querySelector('#image-base64-direction')?.addEventListener('change', syncBase64Direction);
  };
  const syncBase64Direction = () => {
    const direction = settingsPanel.querySelector('#image-base64-direction')?.value;
    const inputField = settingsPanel.querySelector('#image-base64-input-field');
    const sourceCaption = content.querySelector('#image-source-caption');
    if (inputField) inputField.hidden = direction !== 'base64-to-image';
    if (sourceCaption) sourceCaption.textContent = direction === 'base64-to-image' ? '无需选择文件，粘贴 Base64 内容' : '支持 PNG、JPEG、WebP、GIF、AVIF';
  };
  const setMode = (nextMode) => {
    mode = nextMode;
    tabs.querySelectorAll('[data-file-mode]').forEach((tab) => { const selected = tab.dataset.fileMode === mode; tab.classList.toggle('is-active', selected); tab.setAttribute('aria-selected', String(selected)); });
    workbench.classList.toggle('is-crop-mode', mode === 'crop');
    fileInput.hidden = mode === 'base64';
    dropzone.hidden = mode === 'base64';
    renderSettings();
    renderSource();
    revokeResult();
    resultStage.innerHTML = '<div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成处理后可预览和下载</small></div>';
    setStatus('等待输入');
  };
  const setFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('请选择图片文件', 'is-error'); return; }
    fileLoadPromise = (async () => {
      try {
        currentFile = file;
        currentDataUrl = await readFileDataUrl(file);
        currentImage = await loadImageElement(currentDataUrl);
        renderSource();
        renderSettings();
        revokeResult();
        setStatus('图片已就绪', 'is-success');
      } catch (error) { currentFile = null; currentImage = null; setStatus(error.message, 'is-error'); }
    })();
    fileLoadPromise.finally(() => { fileLoadPromise = null; });
    return fileLoadPromise;
  };
  const processImage = async () => {
    try {
      if (fileLoadPromise) await fileLoadPromise;
      if (mode === 'base64' && settingsPanel.querySelector('#image-base64-direction')?.value === 'base64-to-image') {
        const dataUrl = parseImageBase64(settingsPanel.querySelector('#image-base64-input').value);
        revokeResult();
        currentDataUrl = dataUrl;
        currentImage = await loadImageElement(dataUrl);
        resultBlob = dataUrlToBlob(dataUrl);
        currentFile = new File([resultBlob], `base64-image.${imageMimeExtension(resultBlob.type)}`, { type: resultBlob.type || 'image/png' });
        resultUrl = URL.createObjectURL(resultBlob);
        resultName = `byetools-base64-image.${imageMimeExtension(resultBlob.type)}`;
        renderSource();
        resultStage.innerHTML = `<div class="file-output-preview"><img class="file-preview-image" src="${resultUrl}" alt="Base64 图片预览" /><div class="file-output-meta"><strong>${currentImage.naturalWidth} × ${currentImage.naturalHeight}</strong><span>${resultBlob.type || 'image/png'} · ${formatFileSize(resultBlob.size)}</span></div></div>`;
        resultCaption.textContent = 'Base64 已还原为图片';
        resultBadge.textContent = 'IMAGE';
        downloadButton.disabled = false;
        setStatus('转换完成', 'is-success');
        return;
      }
      if (!currentImage || !currentFile) throw new Error('请先选择一张图片');
      if (mode === 'base64') {
        const base64 = currentDataUrl;
        resultStage.innerHTML = `<div class="file-text-output"><textarea id="image-base64-output" readonly>${escapeHtml(base64)}</textarea><button class="secondary-button" type="button" data-file-action="image-copy-base64">复制 Base64</button></div>`;
        resultCaption.textContent = `Base64 输出 · ${base64.length} 个字符`;
        resultBadge.textContent = 'BASE64';
        resultBlob = new Blob([base64], { type: 'text/plain;charset=utf-8' });
        resultName = `${currentFile.name.replace(/\.[^.]+$/, '') || 'image'}.base64.txt`;
        resultUrl = URL.createObjectURL(resultBlob);
        downloadButton.disabled = false;
        setStatus('转换完成', 'is-success');
        content.querySelector('[data-file-action="image-copy-base64"]')?.addEventListener('click', () => copyText(base64).then(() => showToast('Base64 已复制')));
        return;
      }
      const values = mode === 'crop'
        ? { ...cropState, outputWidth: Number(settingsPanel.querySelector('#image-crop-output-width')?.value) || cropState.outputWidth }
        : { width: settingsPanel.querySelector('#image-width')?.value, height: settingsPanel.querySelector('#image-height')?.value, fit: settingsPanel.querySelector('#image-fit')?.value };
      const canvas = mode === 'crop' ? createCropCanvas(currentImage, values) : createImageCanvas(currentImage, mode, values);
      const outputType = settingsPanel.querySelector('#image-output-format')?.value || 'source';
      const mime = outputType === 'source' ? currentFile.type || 'image/png' : outputType;
      const quality = Number(settingsPanel.querySelector('#image-quality')?.value || 90) / 100;
      let nextBlob;
      try { nextBlob = await canvasToBlob(canvas, mime, quality); } catch (error) { nextBlob = await canvasToBlob(canvas, 'image/png'); }
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = '';
      resultBlob = nextBlob;
      resultUrl = URL.createObjectURL(resultBlob);
      resultName = `${currentFile.name.replace(/\.[^.]+$/, '') || 'image'}.${imageMimeExtension(resultBlob.type)}`;
      resultStage.innerHTML = `<div class="file-output-preview"><img class="file-preview-image" src="${resultUrl}" alt="处理结果预览" /><div class="file-output-meta"><strong>${canvas.width} × ${canvas.height}</strong><span>${resultBlob.type} · ${formatFileSize(resultBlob.size)}</span></div></div>`;
      resultCaption.textContent = `${canvas.width} × ${canvas.height} · ${formatFileSize(resultBlob.size)}`;
      resultBadge.textContent = imageMimeExtension(resultBlob.type).toUpperCase();
      downloadButton.disabled = false;
      setStatus('处理完成', 'is-success');
    } catch (error) { setStatus(error.message, 'is-error'); showToast(error.message); }
  };
  tabs.querySelectorAll('[data-file-mode]').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.fileMode)));
  fileInput.addEventListener('change', () => setFile(fileInput.files?.[0]));
  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); if (eventName === 'drop') setFile(event.dataTransfer.files?.[0]); }));
  processButton.addEventListener('click', processImage);
  downloadButton.addEventListener('click', () => { if (resultBlob) downloadBlob(resultBlob, resultName); });
  content.querySelector('[data-file-action="image-clear"]').addEventListener('click', () => { currentFile = null; currentImage = null; currentDataUrl = ''; cropState.sourceFile = null; cropDisplay = null; fileInput.value = ''; revokeResult(); renderSource(); resultStage.innerHTML = '<div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成处理后可预览和下载</small></div>'; setStatus('等待输入'); });
  window.addEventListener('resize', queueCropRender);
  renderSettings();
  activeWorkspaceCleanup = () => { if (resultUrl) URL.revokeObjectURL(resultUrl); window.removeEventListener('resize', queueCropRender); };
}

function faviconWorkbenchMarkup() {
  const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
  return `<div class="file-workbench favicon-workbench"><div class="file-tool-layout"><section class="workspace-card file-source-card"><div class="workspace-card-head"><div><strong>源图片</strong><small>建议使用正方形 PNG 或 SVG 截图</small></div><span class="code-badge">FAVICON</span></div>${fileDropzoneMarkup('favicon-file-input', 'favicon-dropzone', 'image/*')}<div class="file-source-meta" id="favicon-file-meta">尚未选择图片</div><div class="file-preview-frame" id="favicon-source-preview"><div class="file-empty"><span>★</span><strong>选择 Logo 或图片</strong><small>生成网站图标套件</small></div></div></section><section class="workspace-card file-settings-card"><div class="workspace-card-head"><div><strong>图标设置</strong><small>生成常用网站和移动端尺寸</small></div><span class="file-status" id="favicon-status">等待输入</span></div><div class="file-settings"><div class="file-field-grid"><label class="file-field"><span>形状</span><select id="favicon-shape"><option value="square">方形</option><option value="rounded">圆角</option><option value="circle">圆形</option></select></label><label class="file-field"><span>背景颜色</span><input id="favicon-bg" type="color" value="#6366f1" /></label></div><div class="file-inline-options"><label class="file-check"><input id="favicon-transparent" type="checkbox" checked /><span>透明背景</span></label><label class="file-field file-field-inline"><span>内边距 <b id="favicon-padding-value">12%</b></span><input id="favicon-padding" type="range" min="0" max="30" value="12" /></label></div><div class="file-size-heading"><span>输出尺寸</span><small>可同时生成 PNG 和 ICO</small></div><div class="favicon-size-grid">${sizes.map((size) => `<label class="file-check favicon-size-option"><input type="checkbox" value="${size}" ${[16, 32, 48, 180, 192, 512].includes(size) ? 'checked' : ''} /><span>${size} × ${size}</span></label>`).join('')}</div></div><div class="file-action-row"><button class="primary-button" type="button" data-file-action="favicon-generate">生成图标</button><button class="secondary-button" type="button" data-file-action="favicon-clear">清空</button></div></section></div><section class="workspace-card file-result-card"><div class="workspace-card-head"><div><strong>生成结果</strong><small id="favicon-result-caption">等待生成图标</small></div><button class="secondary-button" type="button" data-file-action="favicon-download-ico" disabled>下载 favicon.ico</button></div><div class="favicon-result-grid" id="favicon-results"><div class="file-empty"><span>★</span><strong>选择图片后生成图标</strong><small>每个尺寸都可以单独下载</small></div></div><div class="file-snippet"><div class="file-size-heading"><span>HTML 引用片段</span><button class="text-button" type="button" data-file-action="favicon-copy" disabled>复制</button></div><textarea id="favicon-snippet" readonly placeholder="生成后显示 HTML 引用"></textarea></div></section></div>`;
}

function drawFaviconCanvas(image, size, options) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const radius = options.shape === 'circle' ? size / 2 : options.shape === 'rounded' ? size * .2 : 0;
  context.save();
  if (radius) {
    context.beginPath();
    if (options.shape === 'circle') context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else { const r = Math.min(radius, size / 2); context.roundRect(0, 0, size, size, r); }
    context.clip();
  }
  if (!options.transparent) { context.fillStyle = options.background; context.fillRect(0, 0, size, size); }
  const padding = size * options.padding / 100;
  const available = size - padding * 2;
  const scale = Math.min(available / image.naturalWidth, available / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  context.restore();
  return canvas;
}

async function canvasPngBlob(canvas) { return canvasToBlob(canvas, 'image/png'); }

async function buildIcoBlob(entries) {
  const usable = entries.filter((entry) => entry.size <= 256);
  const pngBuffers = await Promise.all(usable.map((entry) => entry.blob.arrayBuffer()));
  const header = new ArrayBuffer(6);
  const headerView = new DataView(header);
  headerView.setUint16(0, 0, true);
  headerView.setUint16(2, 1, true);
  headerView.setUint16(4, usable.length, true);
  const directory = new ArrayBuffer(16 * usable.length);
  const directoryView = new DataView(directory);
  let offset = 6 + directory.byteLength;
  usable.forEach((entry, index) => {
    const base = index * 16;
    directoryView.setUint8(base, entry.size >= 256 ? 0 : entry.size);
    directoryView.setUint8(base + 1, entry.size >= 256 ? 0 : entry.size);
    directoryView.setUint8(base + 2, 0);
    directoryView.setUint8(base + 3, 0);
    directoryView.setUint16(base + 4, 1, true);
    directoryView.setUint16(base + 6, 32, true);
    directoryView.setUint32(base + 8, pngBuffers[index].byteLength, true);
    directoryView.setUint32(base + 12, offset, true);
    offset += pngBuffers[index].byteLength;
  });
  return new Blob([header, directory, ...pngBuffers], { type: 'image/x-icon' });
}

function bindFaviconWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const fileInput = content.querySelector('#favicon-file-input');
  const dropzone = content.querySelector('#favicon-dropzone');
  const sourcePreview = content.querySelector('#favicon-source-preview');
  const fileMeta = content.querySelector('#favicon-file-meta');
  const status = content.querySelector('#favicon-status');
  const resultCaption = content.querySelector('#favicon-result-caption');
  const results = content.querySelector('#favicon-results');
  const snippet = content.querySelector('#favicon-snippet');
  const copyButton = content.querySelector('[data-file-action="favicon-copy"]');
  const icoButton = content.querySelector('[data-file-action="favicon-download-ico"]');
  let currentFile = null;
  let currentDataUrl = '';
  let currentImage = null;
  let entries = [];
  let icoBlob = null;
  let fileLoadPromise = null;
  const setStatus = (value, stateClass = '') => { status.textContent = value; status.className = `file-status ${stateClass}`.trim(); };
  const revokeEntries = () => { entries.forEach((entry) => URL.revokeObjectURL(entry.url)); entries = []; icoBlob = null; icoButton.disabled = true; copyButton.disabled = true; };
  const renderSource = () => {
    if (!currentImage) { sourcePreview.innerHTML = '<div class="file-empty"><span>★</span><strong>选择 Logo 或图片</strong><small>生成网站图标套件</small></div>'; fileMeta.textContent = '尚未选择图片'; return; }
    sourcePreview.innerHTML = `<img class="file-preview-image" src="${currentDataUrl}" alt="Favicon 源图预览" /><div class="file-preview-overlay"><span>${currentImage.naturalWidth} × ${currentImage.naturalHeight}</span><span>${escapeHtml(currentFile.name)}</span></div>`;
    fileMeta.textContent = `${currentFile.name} · ${currentImage.naturalWidth} × ${currentImage.naturalHeight} · ${formatFileSize(currentFile.size)}`;
  };
  const setFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('请选择图片文件', 'is-error'); return; }
    fileLoadPromise = (async () => {
      try { currentFile = file; currentDataUrl = await readFileDataUrl(file); currentImage = await loadImageElement(currentDataUrl); renderSource(); setStatus('图片已就绪', 'is-success'); } catch (error) { currentFile = null; currentImage = null; setStatus(error.message, 'is-error'); }
    })();
    fileLoadPromise.finally(() => { fileLoadPromise = null; });
    return fileLoadPromise;
  };
  const generate = async () => {
    try {
      if (fileLoadPromise) await fileLoadPromise;
      if (!currentImage) throw new Error('请先选择一张图片');
      const sizes = [...content.querySelectorAll('.favicon-size-option input:checked')].map((input) => Number(input.value)).filter(Boolean).sort((a, b) => a - b);
      if (!sizes.length) throw new Error('请至少选择一个输出尺寸');
      revokeEntries();
      const options = { shape: content.querySelector('#favicon-shape').value, background: content.querySelector('#favicon-bg').value, transparent: content.querySelector('#favicon-transparent').checked, padding: Number(content.querySelector('#favicon-padding').value) };
      entries = [];
      for (const size of sizes) {
        const blob = await canvasPngBlob(drawFaviconCanvas(currentImage, size, options));
        entries.push({ size, blob, url: URL.createObjectURL(blob) });
      }
      icoBlob = await buildIcoBlob(entries);
      icoButton.disabled = false;
      copyButton.disabled = false;
      const publicEntries = entries.filter((entry) => [16, 32, 48, 180, 192, 512].includes(entry.size));
      const lines = ['<link rel="icon" href="/favicon.ico" sizes="any">', ...publicEntries.map((entry) => `<link rel="icon" type="image/png" sizes="${entry.size}x${entry.size}" href="/favicon-${entry.size}x${entry.size}.png">`)];
      snippet.value = lines.join('\n');
      results.innerHTML = entries.map((entry, index) => `<article class="favicon-result-item"><img src="${entry.url}" alt="${entry.size} 像素图标"><div><strong>${entry.size} × ${entry.size}</strong><small>${formatFileSize(entry.blob.size)}</small></div><button class="secondary-button" type="button" data-favicon-index="${index}">下载</button></article>`).join('');
      results.querySelectorAll('[data-favicon-index]').forEach((button) => button.addEventListener('click', () => { const entry = entries[Number(button.dataset.faviconIndex)]; if (entry) downloadBlob(entry.blob, `favicon-${entry.size}x${entry.size}.png`); }));
      resultCaption.textContent = `已生成 ${entries.length} 个 PNG，并包含 ${icoBlob ? 'favicon.ico' : '无 ICO'}`;
      setStatus('生成完成', 'is-success');
    } catch (error) { setStatus(error.message, 'is-error'); showToast(error.message); }
  };
  fileInput.addEventListener('change', () => setFile(fileInput.files?.[0]));
  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); if (eventName === 'drop') setFile(event.dataTransfer.files?.[0]); }));
  content.querySelector('[data-file-action="favicon-generate"]').addEventListener('click', generate);
  content.querySelector('#favicon-padding').addEventListener('input', (event) => { content.querySelector('#favicon-padding-value').textContent = `${event.target.value}%`; });
  icoButton.addEventListener('click', () => { if (icoBlob) downloadBlob(icoBlob, 'favicon.ico'); });
  copyButton.addEventListener('click', () => copyText(snippet.value).then(() => showToast('HTML 片段已复制')));
  content.querySelector('[data-file-action="favicon-clear"]').addEventListener('click', () => { currentFile = null; currentImage = null; currentDataUrl = ''; fileInput.value = ''; revokeEntries(); snippet.value = ''; results.innerHTML = '<div class="file-empty"><span>★</span><strong>选择图片后生成图标</strong><small>每个尺寸都可以单独下载</small></div>'; renderSource(); setStatus('等待输入'); });
  activeWorkspaceCleanup = () => { revokeEntries(); };
}

const pdfToolModes = [
  ['merge', 'PDF 合并', '多个文件合成一个'],
  ['split', 'PDF 拆分', '按页码导出新文件'],
  ['watermark', 'PDF 水印', '添加文字水印'],
  ['organize', 'PDF 整理', '拖拽前的页码重排'],
  ['to-image', 'PDF 转图片', '渲染页面为 PNG'],
];

function pdfToolsWorkbenchMarkup() {
  return `<div class="file-workbench pdf-workbench">
    ${fileModeTabsMarkup('pdf-mode-tabs', pdfToolModes, 'merge')}
    <div class="file-tool-layout">
      <section class="workspace-card file-source-card"><div class="workspace-card-head"><div><strong>PDF 文件</strong><small id="pdf-source-caption">合并模式支持选择多个 PDF</small></div><span class="code-badge">PDF</span></div>${fileDropzoneMarkup('pdf-file-input', 'pdf-dropzone', 'application/pdf,.pdf')}<div class="file-source-meta" id="pdf-file-meta">尚未选择 PDF</div><div class="pdf-file-list" id="pdf-file-list"><div class="file-empty"><span>PDF</span><strong>选择 PDF 文件</strong><small>文件只在当前设备处理</small></div></div></section>
      <section class="workspace-card file-settings-card"><div class="workspace-card-head"><div><strong>处理设置</strong><small id="pdf-settings-caption">选择操作后配置参数</small></div><span class="file-status" id="pdf-status">等待输入</span></div><div class="file-settings" id="pdf-settings"></div><div class="file-action-row"><button class="primary-button" type="button" data-file-action="pdf-process">开始处理</button><button class="secondary-button" type="button" data-file-action="pdf-download" disabled>下载结果</button><button class="secondary-button" type="button" data-file-action="pdf-clear">清空</button></div></section>
    </div>
    <section class="workspace-card file-result-card"><div class="workspace-card-head"><div><strong>处理结果</strong><small id="pdf-result-caption">生成结果会显示在这里</small></div><span class="code-badge" id="pdf-result-badge">OUTPUT</span></div><div class="pdf-result-stage" id="pdf-result-stage"><div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成操作后可预览和下载</small></div></div></section>
  </div>`;
}

function pdfSettingsMarkup(mode, pageCount = 1) {
  if (mode === 'merge') return '<p class="file-form-hint">按文件列表顺序合并页面。可以一次选择多个 PDF，也可以重复选择补充文件。</p>';
  if (mode === 'split') return `<label class="file-field"><span>导出页码</span><input id="pdf-page-selection" type="text" value="1" placeholder="例如：1-3,5" /></label><p class="file-form-hint">当前文件共 ${pageCount} 页，支持单页、范围和逗号组合。</p>`;
  if (mode === 'watermark') return `<label class="file-field"><span>水印文字</span><input id="pdf-watermark-text" type="text" value="仅供内部使用" maxlength="80" /></label><div class="file-field-grid"><label class="file-field"><span>字体大小</span><input id="pdf-watermark-size" type="number" min="8" max="120" value="40" /></label><label class="file-field"><span>透明度 <b id="pdf-watermark-opacity-value">35%</b></span><input id="pdf-watermark-opacity" type="range" min="5" max="100" value="35" /></label></div><div class="file-field-grid"><label class="file-field"><span>颜色</span><input id="pdf-watermark-color" type="color" value="#64748b" /></label><label class="file-field"><span>旋转角度</span><input id="pdf-watermark-rotation" type="number" min="-180" max="180" value="-25" /></label></div><p class="file-form-hint">水印会以居中、半透明文字绘制到每一页。</p>`;
  if (mode === 'organize') return `<label class="file-field"><span>新页码顺序</span><input id="pdf-page-selection" type="text" value="${Array.from({ length: pageCount }, (_, index) => index + 1).join(',')}" placeholder="例如：2,1,3-5" /></label><p class="file-form-hint">支持重排、重复和删除页面。未填写的页码不会出现在结果中。</p>`;
  return `<div class="file-field-grid"><label class="file-field"><span>渲染页码</span><input id="pdf-page-selection" type="text" value="1" placeholder="例如：1-2,5" /></label><label class="file-field"><span>缩放倍数</span><select id="pdf-render-scale"><option value="1">1× 标准</option><option value="1.5" selected>1.5× 清晰</option><option value="2">2× 高清</option><option value="3">3× 超清</option></select></label></div><p class="file-form-hint">每页生成一张 PNG，页码支持单页、范围和逗号组合。</p>`;
}

function parsePageSelection(value, pageCount) {
  const result = [];
  const tokens = String(value || '').split(',').map((token) => token.trim()).filter(Boolean);
  if (!tokens.length) throw new Error('请输入要处理的页码');
  tokens.forEach((token) => {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < start || end > pageCount) throw new Error(`页码范围 ${token} 超出 1-${pageCount}`);
      for (let page = start; page <= end; page += 1) if (!result.includes(page - 1)) result.push(page - 1);
      return;
    }
    const page = Number(token);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) throw new Error(`页码 ${token} 超出 1-${pageCount}`);
    if (!result.includes(page - 1)) result.push(page - 1);
  });
  return result;
}

function pdfColorFromHex(value) {
  const normalized = String(value || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return rgb(.39, .45, .55);
  return rgb(Number.parseInt(normalized.slice(0, 2), 16) / 255, Number.parseInt(normalized.slice(2, 4), 16) / 255, Number.parseInt(normalized.slice(4, 6), 16) / 255);
}

function renderPdfResultLinks(entries) {
  return entries.map((entry, index) => `<article class="pdf-result-item"><div class="pdf-result-thumb">${entry.previewUrl ? `<img src="${entry.previewUrl}" alt="${escapeHtml(entry.name)} 预览">` : '<span>PDF</span>'}</div><div class="pdf-result-copy"><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.meta || '')}</small></div><button class="secondary-button" type="button" data-pdf-result-index="${index}">下载</button></article>`).join('');
}

function bindPdfToolsWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const tabs = content.querySelector('#pdf-mode-tabs');
  const settingsPanel = content.querySelector('#pdf-settings');
  const fileInput = content.querySelector('#pdf-file-input');
  const dropzone = content.querySelector('#pdf-dropzone');
  const fileMeta = content.querySelector('#pdf-file-meta');
  const fileList = content.querySelector('#pdf-file-list');
  const status = content.querySelector('#pdf-status');
  const resultCaption = content.querySelector('#pdf-result-caption');
  const resultBadge = content.querySelector('#pdf-result-badge');
  const resultStage = content.querySelector('#pdf-result-stage');
  const processButton = content.querySelector('[data-file-action="pdf-process"]');
  const downloadButton = content.querySelector('[data-file-action="pdf-download"]');
  let mode = 'merge';
  let documents = [];
  let resultEntries = [];
  let resultBlob = null;
  let resultName = '';
  const setStatus = (value, stateClass = '') => { status.textContent = value; status.className = `file-status ${stateClass}`.trim(); };
  const revokeResults = () => { resultEntries.forEach((entry) => { if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl); }); resultEntries = []; resultBlob = null; downloadButton.disabled = true; };
  const renderFileList = () => {
    if (!documents.length) { fileList.innerHTML = '<div class="file-empty"><span>PDF</span><strong>选择 PDF 文件</strong><small>文件只在当前设备处理</small></div>'; fileMeta.textContent = '尚未选择 PDF'; return; }
    fileList.innerHTML = documents.map((document, index) => `<div class="pdf-file-item"><span class="pdf-file-index">${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(document.file.name)}</strong><small>${document.pageCount} 页 · ${formatFileSize(document.file.size)}</small></div><button class="icon-button" type="button" data-pdf-remove="${index}" title="移除文件" aria-label="移除 ${escapeHtml(document.file.name)}">×</button></div>`).join('');
    fileList.querySelectorAll('[data-pdf-remove]').forEach((button) => button.addEventListener('click', () => { documents.splice(Number(button.dataset.pdfRemove), 1); renderFileList(); updateSettings(); }));
    fileMeta.textContent = `${documents.length} 个 PDF · ${documents.reduce((sum, document) => sum + document.pageCount, 0)} 页`;
  };
  const updateSettings = () => {
    settingsPanel.innerHTML = pdfSettingsMarkup(mode, documents[0]?.pageCount || 1);
    content.querySelector('#pdf-source-caption').textContent = mode === 'merge' ? '合并模式支持选择多个 PDF' : '当前模式使用第一个 PDF';
    if (mode === 'watermark') content.querySelector('#pdf-watermark-opacity')?.addEventListener('input', (event) => { content.querySelector('#pdf-watermark-opacity-value').textContent = `${event.target.value}%`; });
  };
  const setMode = (nextMode) => {
    mode = nextMode;
    tabs.querySelectorAll('[data-file-mode]').forEach((tab) => { const selected = tab.dataset.fileMode === mode; tab.classList.toggle('is-active', selected); tab.setAttribute('aria-selected', String(selected)); });
    fileInput.multiple = mode === 'merge';
    revokeResults();
    resultStage.innerHTML = '<div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成操作后可预览和下载</small></div>';
    updateSettings();
    setStatus('等待输入');
  };
  const setFiles = async (files) => {
    const selected = [...files].filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!selected.length) { setStatus('请选择 PDF 文件', 'is-error'); return; }
    const filesToLoad = mode === 'merge' ? selected : selected.slice(0, 1);
    try {
      const loaded = [];
      for (const file of filesToLoad) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const source = await PDFDocument.load(bytes);
        loaded.push({ file, bytes, pageCount: source.getPageCount() });
      }
      documents = mode === 'merge' ? [...documents, ...loaded] : loaded;
      renderFileList();
      updateSettings();
      setStatus('PDF 已就绪', 'is-success');
    } catch (error) { setStatus(`读取失败：${error.message}`, 'is-error'); showToast(`PDF 读取失败：${error.message}`); }
  };
  const makePdfBlob = async (build) => { const document = await PDFDocument.create(); await build(document); return new Blob([await document.save()], { type: 'application/pdf' }); };
  const processPdf = async () => {
    try {
      if (!documents.length) throw new Error('请先选择 PDF 文件');
      revokeResults();
      if (mode === 'merge') {
        if (documents.length < 2) throw new Error('合并至少需要选择两个 PDF');
        resultBlob = await makePdfBlob(async (target) => { for (const document of documents) { const source = await PDFDocument.load(document.bytes); const pages = await target.copyPages(source, source.getPageIndices()); pages.forEach((page) => target.addPage(page)); } });
        resultName = 'byetools-merged.pdf';
        resultEntries = [{ name: resultName, meta: `${documents.length} 个文件 · ${documents.reduce((sum, document) => sum + document.pageCount, 0)} 页` }];
      } else if (mode === 'split' || mode === 'organize') {
        const sourceInfo = documents[0];
        const selection = parsePageSelection(settingsPanel.querySelector('#pdf-page-selection').value, sourceInfo.pageCount);
        resultBlob = await makePdfBlob(async (target) => { const source = await PDFDocument.load(sourceInfo.bytes); const pages = await target.copyPages(source, selection); pages.forEach((page) => target.addPage(page)); });
        resultName = mode === 'split' ? 'byetools-split.pdf' : 'byetools-organized.pdf';
        resultEntries = [{ name: resultName, meta: `${selection.length} 页 · 原文件 ${sourceInfo.pageCount} 页` }];
      } else if (mode === 'watermark') {
        const sourceInfo = documents[0];
        const text = settingsPanel.querySelector('#pdf-watermark-text').value.trim();
        if (!text) throw new Error('请输入水印文字');
        resultBlob = await makePdfBlob(async (target) => {
          const source = await PDFDocument.load(sourceInfo.bytes);
          const size = Number(settingsPanel.querySelector('#pdf-watermark-size').value) || 40;
          const opacity = Number(settingsPanel.querySelector('#pdf-watermark-opacity').value) / 100;
          const color = settingsPanel.querySelector('#pdf-watermark-color').value;
          const rotation = Number(settingsPanel.querySelector('#pdf-watermark-rotation').value) || 0;
          const watermarkCanvas = document.createElement('canvas');
          const watermarkContext = watermarkCanvas.getContext('2d');
          watermarkContext.font = `700 ${size * 2}px Arial, sans-serif`;
          const textWidth = Math.ceil(watermarkContext.measureText(text).width);
          watermarkCanvas.width = Math.max(180, textWidth + size * 2);
          watermarkCanvas.height = Math.max(80, size * 3);
          watermarkContext.font = `700 ${size * 2}px Arial, sans-serif`;
          watermarkContext.textAlign = 'center';
          watermarkContext.textBaseline = 'middle';
          watermarkContext.fillStyle = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
          watermarkContext.fillText(text, watermarkCanvas.width / 2, watermarkCanvas.height / 2);
          const watermarkImage = await target.embedPng(watermarkCanvas.toDataURL('image/png'));
          const pages = await target.copyPages(source, source.getPageIndices());
          pages.forEach((page) => { target.addPage(page); const pageSize = page.getSize(); const scale = Math.min((pageSize.width * .72) / watermarkCanvas.width, (pageSize.height * .72) / watermarkCanvas.height); const width = watermarkCanvas.width * scale; const height = watermarkCanvas.height * scale; page.drawImage(watermarkImage, { x: (pageSize.width - width) / 2, y: (pageSize.height - height) / 2, width, height, rotate: degrees(rotation) }); });
        });
        resultName = 'byetools-watermarked.pdf';
        resultEntries = [{ name: resultName, meta: `${sourceInfo.pageCount} 页 · 已添加文字水印` }];
      } else {
        const sourceInfo = documents[0];
        const selection = parsePageSelection(settingsPanel.querySelector('#pdf-page-selection').value, sourceInfo.pageCount);
        const scale = Number(settingsPanel.querySelector('#pdf-render-scale').value) || 1.5;
        const loadingTask = pdfjsLib.getDocument({ data: sourceInfo.bytes.slice() });
        const pdf = await loadingTask.promise;
        resultEntries = [];
        for (const pageIndex of selection) {
          const page = await pdf.getPage(pageIndex + 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          const blob = await canvasPngBlob(canvas);
          resultEntries.push({ blob, previewUrl: URL.createObjectURL(blob), name: `page-${pageIndex + 1}.png`, meta: `${canvas.width} × ${canvas.height}` });
        }
        resultName = resultEntries.length === 1 ? `byetools-page-${selection[0] + 1}.png` : '';
      }
      if (mode === 'to-image') {
        resultStage.innerHTML = renderPdfResultLinks(resultEntries);
        resultStage.querySelectorAll('[data-pdf-result-index]').forEach((button) => button.addEventListener('click', () => { const entry = resultEntries[Number(button.dataset.pdfResultIndex)]; if (entry?.blob) downloadBlob(entry.blob, entry.name); }));
        resultCaption.textContent = `已生成 ${resultEntries.length} 张 PNG`;
        resultBadge.textContent = 'PNG';
        downloadButton.disabled = resultEntries.length === 0;
      } else {
        resultStage.innerHTML = renderPdfResultLinks(resultEntries);
        resultCaption.textContent = resultEntries[0].meta;
        resultBadge.textContent = 'PDF';
        downloadButton.disabled = !resultBlob;
      }
      setStatus('处理完成', 'is-success');
    } catch (error) { setStatus(error.message, 'is-error'); showToast(error.message); }
  };
  tabs.querySelectorAll('[data-file-mode]').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.fileMode)));
  fileInput.addEventListener('change', () => setFiles(fileInput.files));
  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); if (eventName === 'drop') setFiles(event.dataTransfer.files); }));
  processButton.addEventListener('click', processPdf);
  downloadButton.addEventListener('click', () => { if (mode === 'to-image') resultEntries.forEach((entry) => { if (entry.blob) downloadBlob(entry.blob, entry.name); }); else if (resultBlob) downloadBlob(resultBlob, resultName); });
  content.querySelector('[data-file-action="pdf-clear"]').addEventListener('click', () => { documents = []; fileInput.value = ''; revokeResults(); renderFileList(); updateSettings(); resultStage.innerHTML = '<div class="file-empty"><span>↗</span><strong>等待处理结果</strong><small>完成操作后可预览和下载</small></div>'; setStatus('等待输入'); });
  fileInput.multiple = true;
  updateSettings();
  activeWorkspaceCleanup = () => { revokeResults(); };
}

function diffLineRows(leftLines, rightLines) {
  const rows = [];
  const table = Array.from({ length: leftLines.length + 1 }, () => Array(rightLines.length + 1).fill(0));
  for (let left = leftLines.length - 1; left >= 0; left -= 1) for (let right = rightLines.length - 1; right >= 0; right -= 1) table[left][right] = leftLines[left] === rightLines[right] ? table[left + 1][right + 1] + 1 : Math.max(table[left + 1][right], table[left][right + 1]);
  let left = 0;
  let right = 0;
  while (left < leftLines.length || right < rightLines.length) {
    if (left < leftLines.length && right < rightLines.length && leftLines[left] === rightLines[right]) { rows.push({ kind: 'same', left: leftLines[left], right: rightLines[right], leftNo: left + 1, rightNo: right + 1 }); left += 1; right += 1; }
    else if (right < rightLines.length && (left === leftLines.length || table[left][right + 1] >= table[left + 1][right])) { rows.push({ kind: 'added', left: '', right: rightLines[right], leftNo: '', rightNo: right + 1 }); right += 1; }
    else { rows.push({ kind: 'removed', left: leftLines[left], right: '', leftNo: left + 1, rightNo: '' }); left += 1; }
  }
  return rows;
}

function bindDiffWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const leftInput = content.querySelector('#diff-left');
  const rightInput = content.querySelector('#diff-right');
  const result = content.querySelector('#diff-result');
  const stats = content.querySelector('#diff-stats');
  const status = content.querySelector('#diff-status');
  const render = () => {
    const rows = diffLineRows(leftInput.value.split(/\r?\n/), rightInput.value.split(/\r?\n/));
    const removed = rows.filter((row) => row.kind === 'removed').length;
    const added = rows.filter((row) => row.kind === 'added').length;
    const same = rows.filter((row) => row.kind === 'same').length;
    stats.innerHTML = `<span class="diff-stat-same">${same} 行未变化</span><span class="diff-stat-removed">${removed} 行删除</span><span class="diff-stat-added">${added} 行新增</span>`;
    result.innerHTML = rows.map((row) => `<div class="diff-row diff-row-${row.kind}"><span class="diff-line-number">${row.leftNo}</span><code>${escapeHtml(row.left)}</code><span class="diff-line-number">${row.rightNo}</span><code>${escapeHtml(row.right)}</code></div>`).join('');
    status.textContent = `${added + removed} 处差异`;
    status.className = added + removed ? 'crypto-status-warning' : 'crypto-status-success';
  };
  content.querySelector('[data-tool-action="diff-compare"]').addEventListener('click', render);
  content.querySelector('[data-tool-action="diff-swap"]').addEventListener('click', () => { const value = leftInput.value; leftInput.value = rightInput.value; rightInput.value = value; render(); });
  content.querySelector('[data-tool-action="diff-clear"]').addEventListener('click', () => { leftInput.value = ''; rightInput.value = ''; render(); leftInput.focus(); });
  content.querySelector('[data-tool-action="diff-copy"]').addEventListener('click', () => copyText(result.innerText).then(() => showToast('对比结果已复制')));
  leftInput.addEventListener('input', render);
  rightInput.addEventListener('input', render);
  render();
}

function downloadTextFile(value, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(headers, rows, name, message) {
  const content = '\ufeff' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  downloadTextFile(content, name, 'text/csv;charset=utf-8');
  if (message) showToast(message);
}

function excelXmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

function downloadExcelFile(headers, rows, name, message) {
  const headerRow = `<Row ss:StyleID="Header">${headers.map((value) => `<Cell><Data ss:Type="String">${excelXmlEscape(value)}</Data></Cell>`).join('')}</Row>`;
  const bodyRows = rows.map((row) => `<Row>${row.map((value) => `<Cell><Data ss:Type="String">${excelXmlEscape(value)}</Data></Cell>`).join('')}</Row>`).join('');
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" /></Style></Styles><Worksheet ss:Name="消费消息"><Table>${headerRow}${bodyRows}</Table></Worksheet></Workbook>`;
  downloadTextFile(`\ufeff${workbook}`, name, 'application/vnd.ms-excel;charset=utf-8');
  if (message) showToast(message);
}

function cronParseParts(expression) {
  const tokens = expression.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 5) return ['0', ...tokens, '-'];
  if (tokens.length === 6) return [...tokens, '-'];
  if (tokens.length === 7) return tokens;
  throw new Error('请输入 5、6 或 7 个字段的 Cron 表达式');
}

function cronValidateToken(token, field, index) {
  if (field.key === 'year' && (!token || token === '-')) return;
  if (!token || !/^[0-9A-Z,*?\-/]+$/i.test(token)) throw new Error(`${field.label}字段包含无法识别的字符`);
  if (token.includes('?') && !['day', 'week'].includes(field.key)) throw new Error('问号只能用于日或周字段');
  token.split(',').forEach((segment) => {
    const [base, step] = segment.split('/');
    if (segment.split('/').length > 2 || (step && (!/^\d+$/.test(step) || Number(step) < 1))) throw new Error(`${field.label}字段的步长必须是正整数`);
    if (base === '*' || base === '?') return;
    const range = base.split('-');
    if (range.length > 2) throw new Error(`${field.label}字段的范围格式不正确`);
    range.forEach((value) => {
      const number = cronValueNumber(value, field.key);
      if (!Number.isInteger(number) || number < field.min || number > field.max) throw new Error(`${field.label}字段应在 ${field.min} - ${field.max} 范围内`);
    });
  });
  if (field.key === 'day' && token === '?' && index !== 3) throw new Error('日字段格式不正确');
}

function cronValidateParts(parts) {
  parts.forEach((token, index) => cronValidateToken(token, cronFieldDefinitions[index], index));
  if (parts[3] === '?' && parts[5] === '?') throw new Error('日和周字段不能同时使用 ?');
}

function cronValueNumber(value, fieldKey) {
  const upper = String(value).toUpperCase();
  const monthNames = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  const weekNames = { SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7 };
  if (fieldKey === 'month' && monthNames[upper]) return monthNames[upper];
  if (fieldKey === 'week' && weekNames[upper]) return weekNames[upper];
  return Number(value);
}

function cronTokenValues(token, min, max, fieldKey) {
  const text = String(token || '').trim().toUpperCase();
  if (!text || text === '-') return [];
  if (text === '*' || text === '?') return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const values = new Set();
  text.split(',').forEach((segment) => {
    const [base, stepText] = segment.split('/');
    const step = stepText ? Math.max(1, Number(stepText)) : 1;
    let start = min;
    let end = max;
    if (base && base !== '*' && base !== '?') {
      if (base.includes('-')) {
        const [from, to] = base.split('-').map((item) => cronValueNumber(item, fieldKey));
        start = Number.isFinite(from) ? from : min;
        end = Number.isFinite(to) ? to : max;
      } else {
        start = cronValueNumber(base, fieldKey);
        end = stepText ? max : start;
      }
    }
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    for (let current = start; current <= end; current += step) if (current >= min && current <= max) values.add(current);
  });
  return [...values].sort((a, b) => a - b);
}

function cronFieldMatches(value, token, field) {
  if (field.key === 'year' && (!token || token === '-')) return true;
  return cronTokenValues(token, field.min, field.max, field.key).includes(value);
}

function cronModeForToken(token) {
  if (token === '*' || token === '?') return 'every';
  if (token.includes('/')) return 'step';
  if (token.includes('-')) return 'range';
  return 'specific';
}

function cronRangeValues(token, field) {
  const first = String(token || '').split('/')[0];
  const [start, end] = first.split('-').map((item) => cronValueNumber(item, field.key));
  return { start: Number.isFinite(start) ? start : field.min, end: Number.isFinite(end) ? end : field.max };
}

function cronStepValues(token, field) {
  const [base, step] = String(token || '').split('/');
  const parsed = cronRangeValues(base === '*' || base === '?' ? `${field.min}-${field.max}` : base, field);
  const start = base === '*' || base === '?' ? field.min : parsed.start;
  return { start, step: Number.isFinite(Number(step)) ? Number(step) : 1 };
}

function cronSpecificMarkup(index, field, token) {
  if (field.key === 'year') return `<input class="cron-inline-input cron-year-input" type="text" data-cron-input="specific" data-cron-field="${index}" value="${escapeHtml(token === '-' ? '' : token)}" placeholder="例如 2026 或 2026-2030" />`;
  const selected = new Set(cronTokenValues(token, field.min, field.max, field.key));
  const values = Array.from({ length: field.max - field.min + 1 }, (_, offset) => field.min + offset);
  return `<div class="cron-value-grid">${values.map((value) => `<label class="cron-value-option"><input type="checkbox" data-cron-specific="true" data-cron-field="${index}" value="${value}" ${selected.has(value) ? 'checked' : ''} /><span>${value}</span></label>`).join('')}</div>`;
}

function cronRenderTabs(content, selected) {
  const hasYear = (content.querySelector('#cron-expression')?.value.trim().split(/\s+/).filter(Boolean).length || 6) === 7;
  content.querySelector('#cron-field-tabs').innerHTML = cronFieldDefinitions.map((field, index) => `<button class="cron-field-tab ${index === selected ? 'is-active' : ''} ${index === 6 && !hasYear ? 'is-optional' : ''}" type="button" role="tab" data-cron-field="${index}" aria-selected="${index === selected}">${field.label}${index === 6 ? '<small>可选</small>' : ''}</button>`).join('');
}

function cronRenderConfig(content, state) {
  const index = state.selected;
  const field = cronFieldDefinitions[index];
  const token = state.parts[index] || (index === 6 ? '-' : '*');
  const mode = cronModeForToken(token);
  const range = cronRangeValues(token, field);
  const step = cronStepValues(token, field);
  const everyText = index === 0 ? '每秒执行' : field.every;
  content.querySelector('#cron-field-config').innerHTML = `<div class="cron-config-head"><div><strong>${field.label}字段</strong><small>范围 ${field.min} - ${field.max} · 当前值 <code>${escapeHtml(token)}</code></small></div><span class="cron-field-token">${escapeHtml(token)}</span></div><div class="cron-mode-list"><label class="cron-mode-row"><input type="radio" name="cron-mode-${index}" data-cron-mode="every" data-cron-field="${index}" ${mode === 'every' ? 'checked' : ''} /><span><b>${everyText}</b><small>使用通配符 ${index === 5 ? '?' : '*'}</small></span></label><label class="cron-mode-row"><input type="radio" name="cron-mode-${index}" data-cron-mode="range" data-cron-field="${index}" ${mode === 'range' ? 'checked' : ''} /><span class="cron-mode-copy"><b>周期范围</b><small>在指定范围内执行</small></span><span class="cron-inline-controls"><input type="number" min="${field.min}" max="${field.max}" data-cron-input="range-start" data-cron-field="${index}" value="${range.start}" /><em>到</em><input type="number" min="${field.min}" max="${field.max}" data-cron-input="range-end" data-cron-field="${index}" value="${range.end}" /><em>${field.unit}</em></span></label><label class="cron-mode-row"><input type="radio" name="cron-mode-${index}" data-cron-mode="step" data-cron-field="${index}" ${mode === 'step' ? 'checked' : ''} /><span class="cron-mode-copy"><b>从某值开始，每隔某值执行</b><small>从起始值按步长递增</small></span><span class="cron-inline-controls"><input type="number" min="${field.min}" max="${field.max}" data-cron-input="step-start" data-cron-field="${index}" value="${step.start}" /><em>开始，每隔</em><input type="number" min="1" max="${field.max - field.min + 1}" data-cron-input="step-size" data-cron-field="${index}" value="${step.step}" /><em>${field.unit}</em></span></label><label class="cron-mode-row cron-specific-row"><input type="radio" name="cron-mode-${index}" data-cron-mode="specific" data-cron-field="${index}" ${mode === 'specific' ? 'checked' : ''} /><span class="cron-mode-copy"><b>指定值</b><small>选择一个或多个执行值</small></span></label><div class="cron-specific-values ${mode === 'specific' ? 'is-visible' : ''}">${cronSpecificMarkup(index, field, token)}</div></div>`;
}

function cronRenderExpressionTable(content, parts) {
  const visible = parts.length === 7 ? parts : [...parts, '-'];
  content.querySelector('#cron-expression-table').innerHTML = `<table><thead><tr>${cronFieldDefinitions.map((field) => `<th>${field.label}</th>`).join('')}</tr></thead><tbody><tr>${visible.map((part) => `<td><code>${escapeHtml(part)}</code></td>`).join('')}</tr></tbody></table>`;
}

function cronDescribe(parts) {
  const [second, minute, hour, day, month, week, year] = parts;
  const exactHour = /^\d+$/.test(hour) && /^\d+$/.test(minute) && (day === '*' || day === '?') && (month === '*' || month === '?') && (week === '*' || week === '?');
  if (exactHour) return `每天 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} 执行`;
  const minuteStep = minute.match(/^\*\/(\d+)$/);
  if (minuteStep && (hour === '*' || hour === '?')) return `每隔 ${minuteStep[1]} 分钟执行一次`;
  if (hour.match(/^\*\/(\d+)$/) && (day === '*' || day === '?')) return `每隔 ${hour.slice(2)} 小时执行一次`;
  return `按 ${parts.slice(0, 6).join(' ')} 的条件执行${year && year !== '-' ? `，限定年份 ${year}` : ''}`;
}

function cronFormatDate(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${weekdays[date.getDay()]}`;
}

function cronNextRuns(parts, count = 15) {
  const fields = cronFieldDefinitions;
  const seconds = cronTokenValues(parts[0], 0, 59, 'second');
  const runs = [];
  const now = new Date();
  const cursor = new Date(now);
  cursor.setSeconds(0, 0);
  for (let minuteOffset = 0; minuteOffset < 1051200 && runs.length < count; minuteOffset += 1) {
    const minuteCursor = new Date(cursor.getTime() + minuteOffset * 60000);
    for (const second of seconds.length ? seconds : [0]) {
      const candidate = new Date(minuteCursor);
      candidate.setSeconds(second, 0);
      if (candidate <= now) continue;
      const monthOk = cronFieldMatches(candidate.getMonth() + 1, parts[4], fields[4]);
      const hourOk = cronFieldMatches(candidate.getHours(), parts[2], fields[2]);
      const minuteOk = cronFieldMatches(candidate.getMinutes(), parts[1], fields[1]);
      const secondOk = cronFieldMatches(candidate.getSeconds(), parts[0], fields[0]);
      const dayOk = cronFieldMatches(candidate.getDate(), parts[3], fields[3]);
      const weekValue = candidate.getDay() + 1;
      const weekOk = cronFieldMatches(weekValue, parts[5], fields[5]);
      const dayToken = parts[3];
      const weekToken = parts[5];
      const dayMatches = dayToken === '?' ? weekOk : weekToken === '?' ? dayOk : dayToken === '*' ? weekOk : weekToken === '*' ? dayOk : dayOk || weekOk;
      const yearOk = cronFieldMatches(candidate.getFullYear(), parts[6] || '-', fields[6]);
      if (monthOk && hourOk && minuteOk && secondOk && dayMatches && yearOk) runs.push(candidate);
    }
  }
  return runs;
}

function cronRenderExplanation(content, parts) {
  content.querySelector('#cron-explanation-text').innerHTML = `<strong>${escapeHtml(cronDescribe(parts))}</strong><span>字段：${parts.slice(0, 6).map((part, index) => `${cronFieldDefinitions[index].label} ${escapeHtml(part)}`).join(' · ')}</span>`;
  const runs = cronNextRuns(parts);
  content.querySelector('#cron-now-label').textContent = `从 ${new Date().toLocaleString('zh-CN')} 起计算`;
  content.querySelector('#cron-runs').innerHTML = runs.length ? runs.map((date) => `<div class="cron-run"><span class="cron-run-check">✓</span><code>${cronFormatDate(date)}</code></div>`).join('') : '<div class="special-empty"><strong>暂无可计算的执行时间</strong><small>请检查字段范围或年份限制</small></div>';
}

function cronRenderExamples(content) {
  content.querySelector('#cron-examples').innerHTML = cronExamples.map(([expression, description]) => `<button class="cron-example" type="button" data-cron-example="${escapeHtml(expression)}"><code>${escapeHtml(expression)}</code><span>${escapeHtml(description)}</span></button>`).join('');
}

function cronRenderHistory(content, history) {
  content.querySelector('#cron-history').innerHTML = history.length ? history.map((item) => `<button class="cron-history-item" type="button" data-cron-example="${escapeHtml(item.expression)}"><code>${escapeHtml(item.expression)}</code><span>${escapeHtml(item.description)}</span></button>`).join('') : '<div class="cron-history-empty"><span class="cron-history-empty-icon">◌</span><strong>暂无历史记录</strong><small>保存后的表达式会显示在这里</small></div>';
}

function bindCronWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const expression = content.querySelector('#cron-expression');
  const state = { parts: cronParseParts(expression.value), selected: 0, history: [] };
  const renderData = () => {
    cronRenderTabs(content, state.selected);
    cronRenderConfig(content, state);
    cronRenderExpressionTable(content, state.parts);
    cronRenderExplanation(content, state.parts);
    cronRenderExamples(content);
    cronRenderHistory(content, state.history);
  };
  if (storage) storage.getToolHistory('cron').then((history) => { state.history = Array.isArray(history) ? history : []; cronRenderHistory(content, state.history); }).catch(() => {});
  const syncExpression = () => { expression.value = state.parts.join(' ').replace(/ -$/, ''); };
  const parseCurrent = (showMessage = false) => {
    try {
      state.parts = cronParseParts(expression.value);
      cronValidateParts(state.parts);
      content.querySelector('#cron-expression-status').textContent = state.parts.length === 7 && state.parts[6] !== '-' ? 'Quartz 7 字段' : 'Quartz 6 字段';
      content.querySelector('#cron-expression-status').className = 'cron-expression-status is-valid';
      renderData();
      if (showMessage) showToast('Cron 表达式解析完成');
      return true;
    } catch (error) {
      content.querySelector('#cron-expression-status').textContent = error.message;
      content.querySelector('#cron-expression-status').className = 'cron-expression-status is-error';
      if (showMessage) showToast(error.message);
      return false;
    }
  };
  const updateField = (index, mode, values = {}) => {
    const field = cronFieldDefinitions[index];
    if (mode === 'every') state.parts[index] = index === 5 ? '?' : index === 6 ? '-' : '*';
    if (mode === 'range') {
      const start = Math.min(field.max, Math.max(field.min, Number(values.start) || field.min));
      const end = Math.min(field.max, Math.max(start, Number(values.end) || field.max));
      state.parts[index] = `${start}-${end}`;
    }
    if (mode === 'step') {
      const start = Math.min(field.max, Math.max(field.min, Number(values.start) || field.min));
      const step = Math.max(1, Number(values.step) || 1);
      state.parts[index] = `${start}/${step}`;
    }
    if (mode === 'specific' && values.value) state.parts[index] = values.value;
    syncExpression();
    parseCurrent();
  };
  expression.addEventListener('input', () => { parseCurrent(); });
  content.querySelector('[data-tool-action="cron-parse"]').addEventListener('click', () => parseCurrent(true));
  content.querySelector('[data-tool-action="cron-copy"]').addEventListener('click', () => copyText(expression.value).then(() => showToast('Cron 表达式已复制')));
  content.querySelector('[data-tool-action="cron-save"]').addEventListener('click', () => {
    if (!parseCurrent(true)) return;
    const item = { expression: expression.value, description: cronDescribe(state.parts), savedAt: Date.now() };
    state.history = [item, ...state.history.filter((entry) => entry.expression !== item.expression)].slice(0, 8);
    if (storage) storage.replaceToolHistory('cron', state.history).catch((error) => showToast(`历史保存失败：${error.message}`));
    cronRenderHistory(content, state.history);
    showToast('表达式已保存');
  });
  content.addEventListener('click', (event) => {
    const target = event.target.closest('[data-cron-field], [data-cron-example], [data-tool-action="cron-help"], [data-tool-action="cron-clear-history"]');
    if (!target) return;
    if (target.dataset.cronExample) {
      expression.value = target.dataset.cronExample;
      parseCurrent(true);
      return;
    }
    if (target.dataset.toolAction === 'cron-help') { showToast('Cron 字段顺序：秒 分 时 日 月 周 年'); return; }
    if (target.dataset.toolAction === 'cron-clear-history') { state.history = []; if (storage) storage.clearToolHistory('cron').catch((error) => showToast(`历史清理失败：${error.message}`)); cronRenderHistory(content, state.history); showToast('历史记录已清空'); return; }
    if (target.dataset.cronField && !target.dataset.cronMode && !target.dataset.cronInput && !target.dataset.cronSpecific) {
      state.selected = Number(target.dataset.cronField);
      renderData();
    }
  });
  content.addEventListener('change', (event) => {
    const target = event.target;
    const index = Number(target.dataset.cronField);
    if (!Number.isInteger(index)) return;
    if (target.dataset.cronMode) { updateField(index, target.dataset.cronMode); return; }
    if (target.dataset.cronSpecific) {
      const values = [...content.querySelectorAll(`[data-cron-specific="true"][data-cron-field="${index}"]:checked`)].map((node) => node.value);
      updateField(index, 'specific', { value: values.join(',') || String(cronFieldDefinitions[index].min) });
      return;
    }
    if (target.dataset.cronInput) {
      const values = {};
      content.querySelectorAll(`[data-cron-input][data-cron-field="${index}"]`).forEach((node) => { values[node.dataset.cronInput.replace('range-', '').replace('step-', '')] = node.value; });
      updateField(index, target.dataset.cronInput.startsWith('range') ? 'range' : target.dataset.cronInput.startsWith('step') ? 'step' : 'specific', { start: values.start, end: values.end, step: values.size, value: target.value });
    }
  });
  content.addEventListener('input', (event) => {
    if (event.target.dataset.cronInput === 'specific') {
      updateField(Number(event.target.dataset.cronField), 'specific', { value: event.target.value.trim() || '-' });
    }
  });
  renderData();
}

function cryptoDigestOptions(tool) {
  const options = tool.id === 'sha2'
    ? [['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']]
    : tool.id === 'sha3'
      ? [['SHA3-256', 'SHA3-256'], ['SHA3-384', 'SHA3-384'], ['SHA3-512', 'SHA3-512']]
      : [[tool.name.replace(' 摘要', ''), tool.id === 'md5' ? 'MD5' : 'SM3']];
  return options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function cryptoModeOptions(tool) {
  const options = {
    aes: [['GCM', 'AES-GCM'], ['CBC', 'AES-CBC'], ['CTR', 'AES-CTR'], ['CFB', 'AES-CFB'], ['OFB', 'AES-OFB'], ['ECB', 'AES-ECB（不推荐）']],
    sm4: [['CBC', 'SM4-CBC'], ['ECB', 'SM4-ECB'], ['CTR', 'SM4-CTR'], ['CFB', 'SM4-CFB'], ['OFB', 'SM4-OFB']],
    des: [['CBC', 'DES-CBC'], ['ECB', 'DES-ECB']],
    '3des': [['CBC', '3DES-CBC'], ['ECB', '3DES-ECB']],
    rsa: [['RSA-OAEP', 'RSA-OAEP'], ['RSAES-PKCS1-v1_5', 'RSAES-PKCS#1 v1.5']],
  };
  return (options[tool.id] || []).map(([value, label], index) => `<option value="${value}" ${index === 0 ? 'selected' : ''}>${label}</option>`).join('');
}

function cryptoPaddingOptions(tool, mode) {
  if (tool.id === 'aes') {
    if (mode === 'CBC') return '<option value="PKCS7" selected>PKCS#7</option>';
    if (mode === 'ECB') return '<option value="PKCS7" selected>PKCS#7</option><option value="NONE">NoPadding</option>';
    return '<option value="NONE" selected>NoPadding</option>';
  }
  if (tool.id === 'sm4') return ['ECB', 'CBC'].includes(mode) ? '<option value="PKCS7" selected>PKCS#7</option><option value="NONE">NoPadding</option>' : '<option value="NONE" selected>NoPadding</option>';
  return '<option value="PKCS5" selected>PKCS#5 / PKCS#7</option><option value="NONE">NoPadding</option>';
}

function cryptoModeHint(tool, mode) {
  const hints = {
    aes: { GCM: ['Nonce', '建议 12 字节', 'NoPadding'], CBC: ['IV', '16 字节', 'PKCS#7'], CTR: ['计数器', '16 字节', 'NoPadding'], CFB: ['IV', '16 字节', 'NoPadding'], OFB: ['IV', '16 字节', 'NoPadding'], ECB: ['无需 IV', '分组模式', 'PKCS#7 / NoPadding'] },
    sm4: { ECB: ['无需 IV', '分组模式', 'PKCS#7'], CBC: ['IV', '16 字节', 'PKCS#7'], CTR: ['计数器', '16 字节', 'NoPadding'], CFB: ['IV', '16 字节', 'NoPadding'], OFB: ['IV', '16 字节', 'NoPadding'] },
    des: { ECB: ['无需 IV', '分组模式', 'PKCS#5 / PKCS#7'], CBC: ['IV', '8 字节', 'PKCS#5 / PKCS#7'] },
    '3des': { ECB: ['无需 IV', '分组模式', 'PKCS#5 / PKCS#7'], CBC: ['IV', '8 字节', 'PKCS#5 / PKCS#7'] },
    rsa: { 'RSA-OAEP': ['无需 IV', '公钥加密 / 私钥解密', '由 RSA 算法处理'], 'RSAES-PKCS1-v1_5': ['无需 IV', '兼容旧系统', 'PKCS#1 v1.5'] },
  };
  return hints[tool.id]?.[mode] || ['IV / Nonce', '按算法规范填写', '按算法规范填写'];
}

function cryptoModeCapability(tool, mode) {
  if (tool.id === 'aes' && ['GCM', 'CBC', 'CTR', 'CFB', 'OFB', 'ECB'].includes(mode)) return 'ready';
  if (tool.id === 'sm4' && ['CBC', 'ECB', 'CTR', 'CFB', 'OFB'].includes(mode)) return 'ready';
  if (tool.id === '3des' && ['CBC', 'ECB'].includes(mode)) return 'ready';
  if (tool.id === 'rsa' && ['RSA-OAEP', 'RSAES-PKCS1-v1_5'].includes(mode)) return 'ready';
  return tool.capability === 'deprecated' ? 'deprecated' : 'library';
}

function cryptoModeCapabilityLabel(capability) {
  return capability === 'ready' ? '浏览器可运行' : capability === 'deprecated' ? '不推荐' : '需密码库';
}

function cryptoDefaultIv(mode) {
  return mode === 'GCM' ? 'ByeToolsIV12' : 'ByeToolsIV123456';
}

function cryptoAlgorithmOptions(selectedId) {
  return tools.filter((tool) => tool.category === 'crypto').map((tool) => `<option value="${tool.id}" ${tool.id === selectedId ? 'selected' : ''}>${tool.name}</option>`).join('');
}

function cryptoAlgorithmDescription(tool) {
  const descriptions = {
    md5: '快速摘要 · 不推荐安全用途',
    sha2: 'SHA-256 / SHA-384 / SHA-512 摘要',
    sha3: 'SHA3-256 / SHA3-384 / SHA3-512 摘要',
    sm2: '国密非对称加密与签名',
    sm3: '国密摘要算法',
    sm4: '国密对称加密',
    aes: 'AES-GCM / CBC / CTR 加密',
    des: '单密钥分组加密 · 不推荐',
    '3des': '三重 DES 分组加密 · 仅兼容旧系统',
    rsa: 'RSA-OAEP / PKCS#1 v1.5 非对称加密',
  };
  return descriptions[tool.id] || tool.description;
}

const btSelectIconDefinitions = {
  'environment-filter': ['◎', 'icon-time'],
  'sort-filter': ['≡', 'icon-sha3'],
  'json-sort-select': ['{ }', 'icon-json'],
  'time-timestamp-unit': ['◷', 'icon-time'],
  'time-reference': ['TZ', 'icon-time'],
  'time-duration-from': ['↗', 'icon-time'],
  'time-duration-to': ['↘', 'icon-time'],
  'timezone-source': ['TZ', 'icon-time'],
  'timezone-target': ['TZ', 'icon-time'],
  'datecalc-operation': ['±', 'icon-time'],
  'datecalc-unit': ['◷', 'icon-time'],
  'world-clock-city-select': ['⌖', 'icon-time'],
  'case-mode': ['Aa', 'icon-regex'],
  'clean-newline': ['↵', 'icon-regex'],
  'line-operation': ['☷', 'icon-regex'],
  'curl-language': ['↯', 'icon-random'],
  'mq-broker': ['MQ', 'icon-message-queue'],
  'mq-qos': ['Q', 'icon-message-queue'],
  'markdown-theme': ['M', 'icon-html'],
  'markdown-size': ['Aa', 'icon-html'],
  'random-type': ['⌁', 'icon-random'],
  'qrbc-qr-level': ['QR', 'icon-qr-barcode'],
  'qrbc-barcode-format': ['BAR', 'icon-qr-barcode'],
  'random-charset': ['Aa', 'icon-random'],
  'random-uuid-case': ['ID', 'icon-random'],
  'uuid-case': ['ID', 'icon-random'],
  'slug-separator': ['—', 'icon-random'],
  'fake-data-type': ['{}', 'icon-random'],
  'gradient-type': ['∿', 'icon-color'],
  'contrast-text-size': ['Aa', 'icon-color'],
  'palette-scheme': ['●', 'icon-color'],
  'palette-count': ['#', 'icon-color'],
  'px-rem-unit': ['px', 'icon-color'],
  'px-rem-precision': ['0.0', 'icon-color'],
  'crypto-mode': ['◇', 'icon-aes'],
  'crypto-variant': ['◆', 'icon-sha'],
  'crypto-key-length': ['K', 'icon-aes'],
  'crypto-padding': ['▤', 'icon-aes'],
  'crypto-ctr-length': ['#', 'icon-aes'],
  'crypto-gcm-tag-length': ['✓', 'icon-aes'],
  'crypto-format': ['⇩', 'icon-aes'],
  'crypto-key-encoding': ['K', 'icon-aes'],
  'crypto-iv-encoding': ['IV', 'icon-aes'],
};

const btSelectDescriptionDefinitions = {
  'environment-filter': { all: '显示全部工具', local: '优先浏览器本地执行', desktop: '需要桌面能力增强' },
  'sort-filter': { default: '按产品推荐顺序展示', name: '按工具名称排序', category: '按工具分类排序' },
  'json-sort-select': { default: '保留输入中的键顺序', asc: '按键名从小到大排序', desc: '按键名从大到小排序' },
  'time-timestamp-unit': { auto: '按数字位数自动识别', second: 'Unix 秒级时间戳', millisecond: 'Unix 毫秒级时间戳' },
  'time-reference': { local: '使用当前设备时区', utc: '使用协调世界时' },
  'time-duration-from': { day: '作为换算的原始单位', hour: '作为换算的原始单位' },
  'time-duration-to': { hour: '作为换算后的目标单位', day: '作为换算后的目标单位' },
  'datecalc-operation': { add: '在基准日期上增加时长', subtract: '在基准日期上减少时长' },
  'datecalc-unit': { day: '按自然日计算', week: '按周计算', month: '按月计算', year: '按年计算', hour: '按小时计算', minute: '按分钟计算', second: '按秒计算' },
  'case-mode': { lower: '转换为小写命名风格', upper: '转换为大写命名风格', sentence: '转换为句首大写', title: '转换为标题格式', camel: '转换为小驼峰命名', pascal: '转换为大驼峰命名', snake: '转换为下划线命名', kebab: '转换为短横线命名', 'screaming-snake': '转换为常量命名', dot: '转换为点号命名', path: '转换为路径命名' },
  'clean-newline': { lf: 'Unix / Linux 换行格式', crlf: 'Windows 换行格式' },
  'line-operation': { dedupe: '删除重复的文本行', 'sort-asc': '按字典顺序升序排列', 'sort-desc': '按字典顺序降序排列', reverse: '反转当前行顺序', number: '为每行添加序号', 'remove-empty': '删除空白行', filter: '保留匹配筛选内容的行' },
  'curl-language': { fetch: '生成浏览器 Fetch 代码', axios: '生成 Axios 请求代码', python: '生成 Python Requests 代码', go: '生成 Go net/http 代码' },
  'mq-broker': { mqtt: '轻量发布与订阅协议', kafka: '主题生产与消费平台', rabbitmq: '交换机与队列消息服务', rocketmq: 'RocketMQ 5.x Proxy 消息服务' },
  'mq-qos': { 0: '最多一次，不等待确认', 1: '至少一次，可能重复', 2: '恰好一次，完整确认' },
  'markdown-theme': { midnight: '深色背景的分享主题', paper: '浅色纸张风格主题', mint: '清新的薄荷绿色主题' },
  'markdown-size': { 16: '适合紧凑内容排版', 18: '适合常规分享排版', 20: '适合较大屏幕阅读', 24: '适合标题和演示排版' },
  'random-type': { integer: '生成安全随机整数', decimal: '生成安全随机小数', boolean: '生成随机布尔值', uuid: '生成 UUID v4 标识符', hex: '生成十六进制令牌', base64: '生成 Base64 令牌', string: '按字符集生成随机字符串', color: '生成随机颜色值', date: '生成随机日期时间', ip: '生成随机 IPv4 地址', binary: '生成随机二进制内容' },
  'random-charset': { mixed: '包含字母和数字', letters: '只使用英文字母', numbers: '只使用数字字符' },
  'random-uuid-case': { lower: '使用小写十六进制字母', upper: '使用大写十六进制字母' },
  'uuid-case': { lower: '使用小写十六进制字母', upper: '使用大写十六进制字母' },
  'slug-separator': { '-': '使用短横线连接单词', _: '使用下划线连接单词', '.': '使用点号连接单词' },
  'fake-data-type': { user: '生成用户测试数据', address: '生成地址测试数据', company: '生成公司测试数据', product: '生成商品测试数据', order: '生成订单测试数据' },
  'gradient-type': { linear: '沿直线方向过渡颜色', radial: '从中心向外过渡颜色', conic: '沿圆锥角度过渡颜色' },
  'contrast-text-size': { normal: '按普通文本对比度标准检查', large: '按大号文本对比度标准检查' },
  'palette-scheme': { scale: '从基础色生成明度色阶', complementary: '生成互补色配色关系', analogous: '生成相邻色配色关系', triadic: '生成三角色配色关系' },
  'palette-count': { 5: '生成 5 个颜色节点', 7: '生成 7 个颜色节点', 9: '生成 9 个颜色节点', 11: '生成 11 个颜色节点' },
  'px-rem-unit': { px: '按像素单位输入数值', rem: '按 rem 单位输入数值', em: '按 em 单位输入数值' },
  'px-rem-precision': { 0: '结果保留 0 位小数', 1: '结果保留 1 位小数', 2: '结果保留 2 位小数', 3: '结果保留 3 位小数', 4: '结果保留 4 位小数' },
  'crypto-mode': { GCM: '带认证标签的现代模式', CBC: '分组链接模式', CTR: '计数器模式', ECB: '独立分组模式' },
  'crypto-variant': { 'SHA-256': 'SHA-2 256 位摘要', 'SHA-384': 'SHA-2 384 位摘要', 'SHA-512': 'SHA-2 512 位摘要', 'SHA3-256': 'SHA-3 256 位摘要', 'SHA3-384': 'SHA-3 384 位摘要', 'SHA3-512': 'SHA-3 512 位摘要', SM3: '国密 SM3 摘要' },
  'crypto-key-length': { 128: '使用 128 位密钥', 192: '使用 192 位密钥', 256: '使用 256 位密钥' },
  'crypto-padding': { PKCS5: '按 PKCS#5 / PKCS#7 填充', PKCS7: '按 PKCS#7 填充', NONE: '不添加填充内容' },
  'crypto-ctr-length': { 32: '使用 32 位计数器', 64: '使用 64 位计数器', 128: '使用 128 位计数器' },
  'crypto-gcm-tag-length': { 32: '使用 32 位认证标签', 64: '使用 64 位认证标签', 96: '使用 96 位认证标签', 104: '使用 104 位认证标签', 112: '使用 112 位认证标签', 120: '使用 120 位认证标签', 128: '使用 128 位认证标签' },
  'crypto-format': { hex: '以十六进制文本输出', base64: '以 Base64 文本输出' },
  'crypto-key-encoding': { utf8: '按 UTF-8 文本读取', hex: '按十六进制字节读取', base64: '按 Base64 字节读取' },
  'crypto-iv-encoding': { utf8: '按 UTF-8 文本读取', hex: '按十六进制字节读取', base64: '按 Base64 字节读取' },
};

let btSelectSequence = 0;
let btSelectEventsBound = false;

function btSelectFieldLabel(select) {
  const label = select.closest('label');
  if (!label) return select.getAttribute('aria-label') || '';
  const directText = [...label.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).filter(Boolean).join(' ');
  const span = label.querySelector(':scope > span');
  return span?.textContent.trim() || directText || select.getAttribute('aria-label') || '';
}

function btSelectOptionParts(select, option) {
  const raw = option?.textContent.trim() || option?.value || '未选择';
  const separator = raw.indexOf('·');
  const title = option?.dataset.label || (separator >= 0 ? raw.slice(0, separator).trim() : raw);
  const mappedDescription = btSelectDescriptionDefinitions[select.id]?.[option?.value];
  const description = option?.dataset.description || mappedDescription || (separator >= 0 ? raw.slice(separator + 1).trim() : `用于${btSelectFieldLabel(select) || '当前工具'}设置`);
  return { title, description };
}

function btSelectIconMarkup(select, option) {
  const definition = btSelectIconDefinitions[select.id] || ['≡', 'icon-sha3'];
  const icon = option?.dataset.icon || definition[0];
  return `<span class="tool-icon bt-select-icon ${definition[1]}">${escapeHtml(icon)}</span>`;
}

function btSelectClose(wrapper) {
  if (!wrapper) return;
  const menu = wrapper.querySelector('[data-bt-select-menu]');
  const trigger = wrapper.querySelector('[data-bt-select-toggle]');
  if (!menu || !trigger) return;
  menu.hidden = true;
  wrapper.classList.remove('is-open');
  trigger.setAttribute('aria-expanded', 'false');
}

function btSelectCloseAll(except = null) {
  document.querySelectorAll('.bt-select.is-open').forEach((wrapper) => { if (wrapper !== except) btSelectClose(wrapper); });
}

function btSelectPositionMenu(wrapper) {
  const trigger = wrapper?.querySelector('[data-bt-select-toggle]');
  const menu = wrapper?.querySelector('[data-bt-select-menu]');
  if (!trigger || !menu || menu.hidden) return;
  const rect = trigger.getBoundingClientRect();
  const viewportPadding = 10;
  const width = Math.min(Math.max(rect.width, 220), Math.max(220, window.innerWidth - viewportPadding * 2));
  const left = Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding);
  menu.style.width = `${width}px`;
  menu.style.left = `${left}px`;
  let top = rect.bottom + 7;
  const menuHeight = Math.min(menu.scrollHeight, Math.floor(window.innerHeight * 0.58));
  if (top + menuHeight > window.innerHeight - viewportPadding && rect.top > menuHeight + 7) top = rect.top - menuHeight - 7;
  menu.style.top = `${Math.max(viewportPadding, top)}px`;
}

function btSelectFocusOption(wrapper, offset = 0) {
  const select = wrapper?.querySelector('select');
  const options = [...(wrapper?.querySelectorAll('[data-bt-select-option]:not([disabled])') || [])];
  if (!select || !options.length) return;
  const activeIndex = options.indexOf(document.activeElement);
  const selectedIndex = options.findIndex((option) => option.dataset.btSelectValue === select.value);
  const baseIndex = activeIndex >= 0 ? activeIndex : selectedIndex >= 0 ? selectedIndex : 0;
  options[(baseIndex + offset + options.length) % options.length].focus();
}

function btSelectRender(wrapper) {
  const select = wrapper?.querySelector('select');
  const trigger = wrapper?.querySelector('[data-bt-select-toggle]');
  const menu = wrapper?.querySelector('[data-bt-select-menu]');
  if (!select || !trigger || !menu) return;
  const selected = select.options[select.selectedIndex] || select.options[0];
  const selectedParts = btSelectOptionParts(select, selected);
  const label = select.getAttribute('aria-label') || btSelectFieldLabel(select) || '选择选项';
  trigger.innerHTML = `${btSelectIconMarkup(select, selected)}<span class="bt-select-trigger-copy"><b>${escapeHtml(selectedParts.title)}</b><small>${escapeHtml(selectedParts.description)}</small></span><span class="bt-select-chevron" aria-hidden="true">⌄</span>`;
  trigger.disabled = select.disabled;
  trigger.setAttribute('aria-label', label);
  wrapper.toggleAttribute('data-select-disabled', select.disabled);
  menu.innerHTML = [...select.options].map((option) => {
    const parts = btSelectOptionParts(select, option);
    const selectedOption = option === selected;
    return `<button class="bt-select-option ${selectedOption ? 'is-selected' : ''}" type="button" role="option" aria-selected="${selectedOption}" data-bt-select-option data-bt-select-value="${escapeHtml(option.value)}" ${option.disabled ? 'disabled aria-disabled="true"' : ''}>${btSelectIconMarkup(select, option)}<span class="bt-select-option-copy"><b>${escapeHtml(parts.title)}</b><small>${escapeHtml(parts.description)}</small></span><span class="bt-select-option-check" aria-hidden="true">✓</span></button>`;
  }).join('');
}

function syncBtSelect(select) {
  const wrapper = select?.closest('.bt-select');
  if (wrapper) btSelectRender(wrapper);
}

function btSelectChoose(wrapper, option) {
  const select = wrapper?.querySelector('select');
  if (!select || !option || option.disabled) return;
  const value = option.dataset.btSelectValue;
  if (select.value !== value) {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  btSelectRender(wrapper);
  btSelectClose(wrapper);
  wrapper.querySelector('[data-bt-select-toggle]')?.focus();
}

function bindBtSelectEvents() {
  if (btSelectEventsBound) return;
  btSelectEventsBound = true;
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest('[data-bt-select-toggle]');
    if (toggle) {
      const wrapper = toggle.closest('.bt-select');
      if (!wrapper || toggle.disabled) return;
      const menu = wrapper.querySelector('[data-bt-select-menu]');
      if (menu?.hidden) { btSelectCloseAll(wrapper); menu.hidden = false; wrapper.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); btSelectPositionMenu(wrapper); btSelectFocusOption(wrapper); }
      else btSelectClose(wrapper);
      return;
    }
    const option = event.target.closest('[data-bt-select-option]');
    if (option) { btSelectChoose(option.closest('.bt-select'), option); return; }
    if (!event.target.closest('.bt-select')) btSelectCloseAll();
  });
  document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest('[data-bt-select-toggle]');
    if (trigger) {
      const wrapper = trigger.closest('.bt-select');
      if (event.key === 'Escape') { event.preventDefault(); btSelectClose(wrapper); return; }
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); const menu = wrapper?.querySelector('[data-bt-select-menu]'); if (menu?.hidden) { btSelectCloseAll(wrapper); menu.hidden = false; wrapper.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); btSelectPositionMenu(wrapper); btSelectFocusOption(wrapper, event.key === 'ArrowUp' ? -1 : 0); } return; }
    }
    const option = event.target.closest('[data-bt-select-option]');
    if (!option) { if (event.key === 'Escape') btSelectCloseAll(); return; }
    const wrapper = option.closest('.bt-select');
    if (event.key === 'ArrowDown') { event.preventDefault(); btSelectFocusOption(wrapper, 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); btSelectFocusOption(wrapper, -1); }
    else if (event.key === 'Home') { event.preventDefault(); wrapper?.querySelector('[data-bt-select-option]:not([disabled])')?.focus(); }
    else if (event.key === 'End') { event.preventDefault(); [...(wrapper?.querySelectorAll('[data-bt-select-option]:not([disabled])') || [])].at(-1)?.focus(); }
    else if (event.key === 'Escape') { event.preventDefault(); btSelectClose(wrapper); wrapper?.querySelector('[data-bt-select-toggle]')?.focus(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); btSelectChoose(wrapper, option); }
  });
  window.addEventListener('resize', () => document.querySelectorAll('.bt-select.is-open').forEach(btSelectPositionMenu));
  document.addEventListener('scroll', () => document.querySelectorAll('.bt-select.is-open').forEach(btSelectPositionMenu), true);
}

function enhanceBtSelect(select) {
  if (!(select instanceof HTMLSelectElement) || select.multiple || select.dataset.btEnhanced === 'true' || select.closest('.crypto-algorithm-picker')) return;
  select.dataset.btEnhanced = 'true';
  const wrapper = document.createElement('div');
  const sequence = ++btSelectSequence;
  wrapper.className = 'bt-select';
  wrapper.dataset.btSelect = select.id || `select-${sequence}`;
  const triggerId = `bt-select-trigger-${sequence}`;
  const menuId = `bt-select-menu-${sequence}`;
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add('bt-select-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  wrapper.insertAdjacentHTML('beforeend', `<button class="bt-select-trigger" id="${triggerId}" type="button" data-bt-select-toggle aria-haspopup="listbox" aria-expanded="false" aria-controls="${menuId}"></button><div class="bt-select-menu" id="${menuId}" role="listbox" data-bt-select-menu aria-labelledby="${triggerId}" hidden></div>`);
  select.addEventListener('change', () => { btSelectRender(wrapper); btSelectClose(wrapper); });
  btSelectRender(wrapper);
}

function enhanceBtSelects(root = document) {
  const candidates = root instanceof HTMLSelectElement ? [root] : [...(root.querySelectorAll?.('select') || [])];
  candidates.forEach(enhanceBtSelect);
  bindBtSelectEvents();
}

function startBtSelectObserver() {
  enhanceBtSelects(document);
  if (typeof MutationObserver === 'undefined' || !document.body) return;
  const observer = new MutationObserver((mutations) => {
    const candidates = new Set();
    mutations.forEach((mutation) => {
      if (mutation.target instanceof HTMLSelectElement) candidates.add(mutation.target);
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches('select')) candidates.add(node);
        node.querySelectorAll?.('select').forEach((select) => candidates.add(select));
      });
    });
    candidates.forEach(enhanceBtSelect);
    candidates.forEach((select) => { const wrapper = select.closest('.bt-select'); if (wrapper) btSelectRender(wrapper); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function cryptoAlgorithmPickerMarkup(selectedId) {
  const algorithms = tools.filter((tool) => tool.category === 'crypto');
  const selected = algorithms.find((tool) => tool.id === selectedId) || algorithms[0];
  const selectedDescription = cryptoAlgorithmDescription(selected);
  const options = algorithms.map((item) => `<button class="crypto-algorithm-option ${item.id === selected.id ? 'is-selected' : ''}" type="button" role="option" aria-selected="${item.id === selected.id}" data-algorithm-option="${item.id}">${iconMarkup(item)}<span class="crypto-algorithm-option-copy"><b>${item.name}</b><small>${cryptoAlgorithmDescription(item)}</small></span><span class="crypto-algorithm-option-check" aria-hidden="true">✓</span></button>`).join('');
  return `<div class="crypto-algorithm-picker" data-algorithm-picker>
    <select id="crypto-algorithm" class="crypto-algorithm-native" aria-label="算法" tabindex="-1">${cryptoAlgorithmOptions(selected.id)}</select>
    <button class="crypto-algorithm-trigger" type="button" data-algorithm-toggle aria-haspopup="listbox" aria-expanded="false" aria-controls="crypto-algorithm-menu">${iconMarkup(selected)}<span class="crypto-algorithm-trigger-copy"><b>${selected.name}</b><small>${selectedDescription}</small></span><span class="crypto-algorithm-chevron" aria-hidden="true">⌄</span></button>
    <div class="crypto-algorithm-menu" id="crypto-algorithm-menu" role="listbox" hidden>${options}</div>
  </div>`;
}

function cryptoWorkbenchMarkup(tool) {
  const isDigest = tool.cryptoType === 'digest';
  const isAsymmetric = tool.cryptoType === 'asymmetric';
  const isRsa = tool.id === 'rsa';
  const isAes = tool.id === 'aes';
  const isExecutable = tool.capability === 'ready' || ['md5', 'des'].includes(tool.id);
  const initialMode = isDigest || (isAsymmetric && !isRsa) ? '' : cryptoModeOptions(tool).match(/value="([^"]+)"/)?.[1] || 'CBC';
  const modeHint = initialMode ? cryptoModeHint(tool, initialMode) : ['IV / Nonce', '按算法规范填写', '按算法规范填写'];
  const initialModeCapability = initialMode ? cryptoModeCapability(tool, initialMode) : '';
  const modeMarkup = isDigest || (isAsymmetric && !isRsa) ? '' : `<label class="crypto-field"><span>${isRsa ? 'RSA 加密方案' : '加密模式'}</span><select id="crypto-mode">${cryptoModeOptions(tool)}</select></label>`;
  const modeCapabilityMarkup = isDigest || (isAsymmetric && !isRsa) ? '' : `<span class="crypto-mode-capability crypto-mode-capability-${initialModeCapability}" id="crypto-mode-capability"><i></i>${cryptoModeCapabilityLabel(initialModeCapability)}</span>`;
  const symmetricKeyHint = tool.id === 'aes' ? '16 / 24 / 32 字节（128 / 192 / 256 bit）' : tool.id === 'sm4' ? '固定 16 字节（128 bit）' : tool.id === 'des' ? '固定 8 字节（64 bit）' : tool.id === '3des' ? '固定 24 字节（192 bit）' : '16 或 24 字节（128 或 192 bit）';
  const sm4EncodingOptions = '<option value="utf8" selected>UTF-8</option><option value="hex">Hex</option><option value="base64">Base64</option>';
  const sm4KeyMarkup = `<div class="crypto-field crypto-key-field crypto-secret-field" data-crypto-secret="key"><div class="crypto-secret-head"><label class="crypto-secret-label" for="crypto-key"><span>密钥 <small>KEY</small></span></label><span class="crypto-secret-length" id="crypto-key-length" data-crypto-length="key">需 16 字节</span><label class="crypto-secret-encoding"><span class="sr-only">密钥编码</span><select id="crypto-key-encoding" aria-label="密钥编码">${sm4EncodingOptions}</select></label><button class="secondary-button crypto-random-button" type="button" data-crypto-random="key" title="随机生成 16 字节密钥">随机</button></div><input id="crypto-key" type="text" spellcheck="false" autocomplete="off" placeholder="输入 UTF-8 原文密钥…" /></div>`;
  const sm4IvMarkup = `<div class="crypto-field crypto-secret-field" id="crypto-iv-field" data-crypto-secret="iv"><div class="crypto-secret-head"><label class="crypto-secret-label" for="crypto-iv"><span><b id="crypto-iv-label">偏移量 IV</b> <small id="crypto-iv-hint">${modeHint[1]}</small></span></label><span class="crypto-secret-length" id="crypto-iv-length" data-crypto-length="iv">需 16 字节</span><label class="crypto-secret-encoding"><span class="sr-only">IV 编码</span><select id="crypto-iv-encoding" aria-label="IV 编码">${sm4EncodingOptions}</select></label><button class="secondary-button crypto-random-button" type="button" data-crypto-random="iv" title="随机生成 16 字节 IV">随机</button></div><input id="crypto-iv" type="text" spellcheck="false" autocomplete="off" placeholder="输入 UTF-8 原文 IV…" value="" /></div>`;
  const sm2KeyMarkup = `<section class="crypto-sm2-key-panel crypto-key-field" data-sm2-key-panel><div class="crypto-sm2-panel-head"><div class="crypto-sm2-panel-title"><strong>SM2 密钥对</strong><span>Hex</span></div><div class="crypto-sm2-key-actions"><button class="secondary-button" type="button" data-sm2-key-action="derive">由私钥推导公钥</button><button class="primary-button" type="button" data-sm2-key-action="generate">生成密钥对</button></div></div><div class="crypto-sm2-key-grid"><div class="crypto-sm2-key-field"><div class="crypto-sm2-key-field-head"><label for="crypto-key">公钥 <small>04 + X + Y，130 位</small></label><button class="secondary-button" type="button" data-sm2-key-action="copy-public">复制</button></div><textarea id="crypto-key" spellcheck="false" autocomplete="off" placeholder="输入 04 开头的公钥…"></textarea><span class="crypto-sm2-key-status" id="crypto-sm2-public-status">等待输入</span></div><div class="crypto-sm2-key-field"><div class="crypto-sm2-key-field-head"><label for="crypto-private-key">私钥 <small>64 位</small></label><button class="secondary-button" type="button" data-sm2-key-action="copy-private">复制</button></div><textarea id="crypto-private-key" spellcheck="false" autocomplete="off" placeholder="输入 64 位私钥…"></textarea><span class="crypto-sm2-key-status" id="crypto-sm2-private-status">等待输入</span></div></div></section>`;
  const sm2CompatibilityMarkup = `<section class="crypto-sm2-compatibility"><div class="crypto-sm2-compatibility-grid"><label class="crypto-field"><span>密文排列</span><select id="sm2-cipher-mode"><option value="1" selected>C1C3C2 · 现行国标</option><option value="0">C1C2C3 · 兼容旧系统</option></select></label><div class="crypto-sm2-compatibility-options"><strong>兼容选项</strong><label><input id="sm2-cipher-prefix" type="checkbox" />密文加 04 前缀</label><label><input id="sm2-cipher-der" type="checkbox" />ASN.1 DER 密文</label></div></div><div class="crypto-sm2-compatibility-note">解密时 <b>04 前缀</b>会自动识别，带不带都能解；若报错，多半是“密文排列”选反了，对调 C1C3C2 / C1C2C3 再试。</div></section>`;
  const rsaKeyMarkup = `<section class="crypto-rsa-key-panel crypto-key-field" data-rsa-key-panel><div class="crypto-rsa-panel-head"><div class="crypto-rsa-panel-title"><strong>RSA 密钥对</strong><span>PEM / 2048 bit</span></div><div class="crypto-rsa-key-actions"><button class="secondary-button" type="button" data-rsa-key-action="copy-public">复制公钥</button><button class="secondary-button" type="button" data-rsa-key-action="copy-private">复制私钥</button><button class="primary-button" type="button" data-rsa-key-action="generate">生成密钥对</button></div></div><div class="crypto-rsa-key-grid"><div class="crypto-rsa-key-field"><div class="crypto-rsa-key-field-head"><label for="crypto-rsa-public-key">公钥 <small>SPKI PEM · 用于加密</small></label><span id="crypto-rsa-public-status">等待生成</span></div><textarea id="crypto-rsa-public-key" spellcheck="false" autocomplete="off" placeholder="点击“生成密钥对”，或粘贴 -----BEGIN PUBLIC KEY----- …"></textarea></div><div class="crypto-rsa-key-field"><div class="crypto-rsa-key-field-head"><label for="crypto-rsa-private-key">私钥 <small>PKCS#8 PEM · 用于解密</small></label><span id="crypto-rsa-private-status">等待生成</span></div><textarea id="crypto-rsa-private-key" spellcheck="false" autocomplete="off" placeholder="点击“生成密钥对”，或粘贴 -----BEGIN PRIVATE KEY----- …"></textarea></div></div></section>`;
  const keyMarkup = !isDigest ? tool.id === 'sm4' ? sm4KeyMarkup : tool.id === 'sm2' ? sm2KeyMarkup : isRsa ? rsaKeyMarkup : `<label class="crypto-field crypto-key-field"><span>${isAsymmetric ? 'Hex 密钥' : '密钥'} <small>${isAsymmetric ? '公钥 130 位或私钥 64 位 Hex' : symmetricKeyHint}</small></span><input id="crypto-key" type="text" spellcheck="false" autocomplete="off" placeholder="${isAsymmetric ? '输入 04 开头的公钥或 64 位私钥…' : '输入原文密钥…'}" value="${isAes ? 'ByeToolsKey12345' : ''}" /></label>` : '';
  const ivMarkup = !isDigest && !isAsymmetric ? tool.id === 'sm4' ? sm4IvMarkup : `<label class="crypto-field" id="crypto-iv-field"><span><b id="crypto-iv-label">${modeHint[0]}</b> <small id="crypto-iv-hint">${modeHint[1]}</small></span><input id="crypto-iv" type="text" spellcheck="false" autocomplete="off" placeholder="输入原文 ${modeHint[0]}…" value="${isAes ? 'ByeToolsIV12' : ''}" /></label>` : '';
  const paddingMarkup = !isDigest && !isAsymmetric ? `<label class="crypto-field"><span>填充方式</span><select id="crypto-padding">${cryptoPaddingOptions(tool, initialMode)}</select></label>` : '';
  const ctrLengthMarkup = tool.id === 'aes' ? '<label class="crypto-field crypto-ctr-length-field" id="crypto-ctr-length-field" hidden><span>计数器长度</span><select id="crypto-ctr-length"><option value="64" selected>64 bit</option><option value="32">32 bit</option><option value="128">128 bit</option></select></label>' : '';
  const gcmTagMarkup = tool.id === 'aes' ? '<label class="crypto-field crypto-gcm-tag-field" id="crypto-gcm-tag-field" hidden><span>认证标签</span><select id="crypto-gcm-tag-length"><option value="128" selected>128 bit</option><option value="120">120 bit</option><option value="112">112 bit</option><option value="104">104 bit</option><option value="96">96 bit</option><option value="64">64 bit</option><option value="32">32 bit</option></select></label>' : '';
  const keyLengthMarkup = isAes ? '<label class="crypto-field"><span>密钥长度</span><select id="crypto-key-length"><option value="128">128 bit</option><option value="192">192 bit</option><option value="256">256 bit</option></select></label>' : '';
  const variantMarkup = isDigest ? `<label class="crypto-field"><span>摘要算法</span><select id="crypto-variant">${cryptoDigestOptions(tool)}</select></label>` : isRsa ? '<label class="crypto-field"><span>RSA 哈希算法</span><select id="crypto-rsa-hash"><option value="SHA-256" selected>SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select></label>' : '';
  const statusText = tool.capabilityLabel;
  const note = tool.capability === 'ready'
    ? `${tool.name} 可在当前浏览器本地执行，结果不会上传。`
    : tool.capability === 'deprecated'
      ? `${tool.name} 仅建议用于历史系统兼容性处理，不适合新系统的密码、签名或安全存储。`
      : `${tool.name} 已加入工具目录，正式执行需要接入经过审查的密码库。`;
  const operationButtons = isDigest ? '<button class="primary-button" data-tool-action="crypto-execute">计算摘要</button>' : '<div class="crypto-operation-buttons" role="group" aria-label="加密操作"><button class="crypto-operation-button is-active" type="button" data-crypto-operation="encrypt" aria-pressed="true">加密</button><button class="crypto-operation-button" type="button" data-crypto-operation="decrypt" aria-pressed="false">解密</button></div>';
  return `<div class="crypto-workbench" data-crypto-id="${tool.id}">
    <div class="crypto-toolbar">
      <div class="crypto-field crypto-algorithm-field"><span>算法</span>${cryptoAlgorithmPickerMarkup(tool.id)}</div>
      ${variantMarkup}
      ${modeMarkup}
      ${modeCapabilityMarkup}
      ${keyLengthMarkup}
      <span class="crypto-capability crypto-capability-${tool.capability}"><i></i>${statusText}</span>
    </div>
    <div class="crypto-config-grid">
      ${keyMarkup}
      ${ivMarkup}
      ${paddingMarkup}
      ${ctrLengthMarkup}
      ${gcmTagMarkup}
      ${tool.id === 'sm2' ? sm2CompatibilityMarkup : ''}
      <label class="crypto-field"><span>输出格式</span><select id="crypto-format"><option value="hex" ${isDigest ? 'selected' : ''}>Hex</option><option value="base64" ${isDigest ? '' : 'selected'}>Base64</option></select></label>
    </div>
    <div class="crypto-action-bar"><div class="crypto-action-main">${operationButtons}</div><div class="crypto-action-secondary"><button class="secondary-button" type="button" data-tool-action="crypto-clear">清空</button><button class="secondary-button" type="button" data-tool-action="copy-crypto-output">复制结果</button></div><div class="crypto-config-actions" aria-label="加密配置"><button class="secondary-button" type="button" data-crypto-config-action="save">保存配置</button><button class="secondary-button" type="button" data-crypto-config-action="history">配置历史</button></div></div>
    <div class="crypto-panel-grid">
      <section class="workspace-card crypto-input-card"><div class="workspace-card-head"><span>输入内容</span><span id="crypto-input-meta">${isDigest ? 'UTF-8 文本' : 'UTF-8 明文'}</span></div><textarea id="crypto-input" spellcheck="false" placeholder="${isDigest ? '输入要计算摘要的文本…' : '输入要加密的明文…'}">ByeTools 本地优先</textarea></section>
      <section class="workspace-card crypto-output-card"><div class="workspace-card-head"><span>输出结果</span><span id="crypto-status">${isExecutable ? '等待操作' : statusText}</span></div><pre id="crypto-output" aria-live="polite">${isExecutable ? isDigest ? '点击“计算摘要”生成结果…' : '点击“加密”或“解密”生成结果…' : '当前能力尚未接入，暂不生成结果。'}</pre></section>
    </div>
    <div class="crypto-note"><span class="crypto-note-icon">i</span><span>${note}</span></div>
  </div>`;
}

function jsonToggleMarkup(key, label) {
  return `<button class="json-toggle ${state.json[key] ? 'is-on' : ''}" type="button" data-json-action="toggle" data-json-key="${key}" aria-pressed="${state.json[key]}"><span class="json-toggle-track"><i></i></span><span>${label}</span></button>`;
}

function getTool(id) { return tools.find((tool) => tool.id === id); }
function setRoute(path, options = {}) {
  const nextHash = `#${path}`;
  if (window.location.hash === nextHash) return;
  window.history[options.replace ? 'replaceState' : 'pushState']({}, '', nextHash);
}
function renderCurrentRoute() {
  const segments = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
  if (segments[0] === 'tool' && getTool(segments[1])) {
    openTool(segments[1], { updateRoute: false });
    return;
  }
  if (segments[0] === 'category') {
    renderHome({ showOverview: false, updateRoute: false });
    state.activeFilter = segments[1] || 'all';
    document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === state.activeFilter));
    setActiveNav(state.activeFilter);
    renderTools();
    return;
  }
  if (segments[0] === 'view' && ['all', 'common'].includes(segments[1])) {
    const view = segments[1];
    renderHome({ showOverview: view === 'common', updateRoute: false });
    state.activeFilter = view === 'common' ? 'recent' : 'all';
    document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === state.activeFilter));
    setActiveNav(view);
    renderTools();
    return;
  }
  if (['favorites', 'history'].includes(segments[0])) {
    showUtility(segments[0], { updateRoute: false });
    return;
  }
  renderHome({ updateRoute: false });
}
function iconMarkup(tool) { return `<span class="tool-icon ${tool.iconClass}">${escapeHtml(tool.icon)}</span>`; }
function favoriteMarkup(tool) { return `<button class="favorite-toggle ${state.favorites.has(tool.id) ? 'is-favorite' : ''}" type="button" data-action="favorite" data-tool-id="${tool.id}" title="${state.favorites.has(tool.id) ? '取消收藏' : '收藏工具'}">${state.favorites.has(tool.id) ? '★' : '☆'}</button>`; }
function toolCardMarkup(tool, featuredCard = false) { const capability = tool.capability ? `<span class="tool-card-status tool-card-status-${tool.capability}"><i></i>${tool.capabilityLabel}</span>` : ''; return `<article class="${featuredCard ? 'featured-card' : 'tool-card'}" data-action="open-tool" data-tool-id="${tool.id}">${iconMarkup(tool)}<div class="tool-card-copy"><h3 class="tool-card-title">${tool.name}</h3><p class="tool-card-description">${tool.description}</p>${capability}</div>${favoriteMarkup(tool)}</article>`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }

function configRandomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(6)) : new Uint8Array(6);
  return `config-${Date.now()}-${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function configBytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function configBase64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function getConfigEncryptionKey() {
  if (!window.crypto?.subtle) throw new Error('当前浏览器不支持本地加密存储');
  if (!storage) throw new Error('本地存储服务未就绪');
  await storage.ready;
  const legacySecret = await storage.getLegacyValue(CONFIG_SECRET_KEY);
  return storage.getOrCreateConfigKey(legacySecret);
}

function configAdditionalData(record) {
  return new TextEncoder().encode(JSON.stringify([
    record.id,
    record.toolId,
    record.name,
    record.payloadVersion || 1,
    record.cryptoVersion || CONFIG_CRYPTO_VERSION,
  ]));
}

async function encryptConfigPayload(record, key) {
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));
  const source = new TextEncoder().encode(JSON.stringify(record.payload));
  const metadata = { ...record, payloadVersion: 1, cryptoVersion: CONFIG_CRYPTO_VERSION };
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: configAdditionalData(metadata) }, key, source);
  return { payload: configBytesToBase64(new Uint8Array(encrypted)), nonce: configBytesToBase64(nonce), payloadVersion: 1, cryptoVersion: CONFIG_CRYPTO_VERSION, aadVersion: 1 };
}

async function decryptConfigPayload(record, key) {
  const algorithm = { name: 'AES-GCM', iv: configBase64ToBytes(record.nonce) };
  if (record.aadVersion === 1) algorithm.additionalData = configAdditionalData(record);
  const decrypted = await window.crypto.subtle.decrypt(algorithm, key, configBase64ToBytes(record.payload));
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function readToolConfigRecords(toolId = '') {
  let encryptedRecords = [];
  let legacyRecords = false;
  try {
    if (!storage) throw new Error('本地存储服务未就绪');
    await storage.ready;
    if (storage.isDesktop) {
      if (!toolId) throw new Error('桌面版配置查询需要工具 ID');
      return storage.listCryptoConfigs(toolId);
    }
    encryptedRecords = await storage.getCryptoConfigs();
    if (!encryptedRecords.length) {
      const raw = await storage.getLegacyValue(CONFIG_STORAGE_KEY);
      if (raw) {
        const envelope = JSON.parse(raw);
        encryptedRecords = Array.isArray(envelope) ? envelope : envelope.records;
        legacyRecords = Array.isArray(encryptedRecords) && encryptedRecords.length > 0;
      }
    }
    if (!Array.isArray(encryptedRecords)) return [];
    const key = await getConfigEncryptionKey();
    const result = [];
    for (const record of encryptedRecords) {
      try {
        result.push({ ...record, payload: await decryptConfigPayload(record, key) });
      } catch (error) {
        continue;
      }
    }
    if (legacyRecords && result.length) {
      await writeToolConfigRecords(result);
      await storage.removeLegacyValues([CONFIG_STORAGE_KEY, CONFIG_SECRET_KEY]);
    }
    return result;
  } catch (error) {
    return [];
  }
}

async function writeToolConfigRecords(records) {
  const key = await getConfigEncryptionKey();
  const encryptedRecords = [];
  for (const record of records) {
    const encrypted = await encryptConfigPayload(record, key);
    encryptedRecords.push({
      id: record.id,
      toolId: record.toolId,
      name: record.name,
      payload: encrypted.payload,
      nonce: encrypted.nonce,
      payloadVersion: encrypted.payloadVersion,
      cryptoVersion: encrypted.cryptoVersion,
      aadVersion: encrypted.aadVersion,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
  if (!storage) throw new Error('本地存储服务未就绪');
  await storage.replaceCryptoConfigs(encryptedRecords);
}

function configControlKey(node) {
  if (node.id) return node.id;
  if (node.dataset.gradientIndex != null) {
    if (node.dataset.gradientPicker) return `gradient.stop.${node.dataset.gradientIndex}.picker`;
    return `gradient.stop.${node.dataset.gradientIndex}.${node.dataset.gradientProperty}`;
  }
  if (node.dataset.shadowIndex != null) {
    if (node.dataset.shadowPicker) return `shadow.layer.${node.dataset.shadowIndex}.picker`;
    return `shadow.layer.${node.dataset.shadowIndex}.${node.dataset.shadowProperty}`;
  }
  if (node.dataset.cronMode) return `cron.mode.${node.dataset.cronField}`;
  if (node.dataset.cronInput) return `cron.input.${node.dataset.cronField}.${node.dataset.cronInput}`;
  if (node.dataset.cronSpecific) return `cron.specific.${node.dataset.cronField}.${node.value}`;
  return '';
}

function isWorkspaceConfigControl(node) {
  if (node.closest('[data-config-ui]')) return false;
  if (node.disabled || node.closest('[hidden]')) return false;
  if (node.dataset.cronMode || node.dataset.cronInput || node.dataset.cronSpecific) return false;
  if (node.tagName === 'SELECT') return true;
  if (node.tagName === 'TEXTAREA') return configTextFieldIds.has(node.id);
  if (node.tagName !== 'INPUT') return false;
  if (['number', 'range', 'checkbox', 'radio', 'color', 'date', 'datetime-local', 'time'].includes(node.type)) return true;
  return configTextFieldIds.has(node.id) || Boolean(node.dataset.gradientIndex != null || node.dataset.shadowIndex != null || node.dataset.cronInput || node.dataset.cronSpecific || node.dataset.cronMode);
}

function getWorkspaceConfigControls(content) {
  return [...content.querySelectorAll('input, select, textarea')].filter(isWorkspaceConfigControl);
}

function readWorkspaceControlValue(node) {
  if (node.type === 'checkbox' || node.type === 'radio') return node.checked;
  return node.value;
}

function findConfigControl(content, key) {
  const byId = /^[A-Za-z_][A-Za-z0-9_-]*$/.test(key) ? content.querySelector(`#${key}`) : null;
  if (byId) return byId;
  let match = key.match(/^gradient\.stop\.(\d+)\.(picker|color|position)$/);
  if (match) return [...content.querySelectorAll(`[data-gradient-index="${match[1]}"]`)].find((node) => match[2] === 'picker' ? node.dataset.gradientPicker : node.dataset.gradientProperty === match[2]);
  match = key.match(/^shadow\.layer\.(\d+)\.(picker|x|y|blur|spread|color|opacity|inset)$/);
  if (match) return [...content.querySelectorAll(`[data-shadow-index="${match[1]}"]`)].find((node) => match[2] === 'picker' ? node.dataset.shadowPicker : node.dataset.shadowProperty === match[2]);
  match = key.match(/^cron\.mode\.(\d+)$/);
  if (match) return content.querySelector(`[data-cron-mode][data-cron-field="${match[1]}"]`);
  match = key.match(/^cron\.input\.(\d+)\.(.+)$/);
  if (match) return content.querySelector(`[data-cron-input="${match[2]}"][data-cron-field="${match[1]}"]`);
  match = key.match(/^cron\.specific\.(\d+)\.(.+)$/);
  if (match) return [...content.querySelectorAll(`[data-cron-specific="true"][data-cron-field="${match[1]}"]`)].find((node) => node.value === match[2]);
  return null;
}

function setWorkspaceControlValue(node, value) {
  if (node.type === 'checkbox' || node.type === 'radio') node.checked = Boolean(value);
  else node.value = String(value ?? '');
}

function dispatchWorkspaceControlChange(node) {
  const eventName = node.tagName === 'SELECT' || ['checkbox', 'radio'].includes(node.type) ? 'change' : 'input';
  node.dispatchEvent(new Event(eventName, { bubbles: true }));
}

async function applyWorkspaceConfigCustom() {
  await Promise.resolve();
}

function refreshWorkspaceAfterConfig(tool, content) {
  if (tool.category !== 'crypto') return;
  content.querySelector('[data-crypto-operation].is-active')?.click();
  content.querySelector('[data-tool-action="crypto-execute"]')?.click();
}

const cryptoConfigFieldLabels = {
  'crypto-algorithm': '加密方式',
  'crypto-variant': '摘要算法',
  'crypto-mode': '加密模式',
  'crypto-key-length': '密钥长度',
  'crypto-key': '密钥',
  'crypto-private-key': 'SM2 私钥',
  'crypto-rsa-public-key': 'RSA 公钥',
  'crypto-rsa-private-key': 'RSA 私钥',
  'crypto-key-encoding': '密钥编码',
  'crypto-iv': 'IV / Nonce',
  'crypto-iv-encoding': 'IV 编码',
  'sm2-cipher-mode': '密文排列',
  'sm2-cipher-prefix': '密文 04 前缀',
  'sm2-cipher-der': 'ASN.1 DER',
  'crypto-padding': '填充方式',
  'crypto-ctr-length': '计数器长度',
  'crypto-gcm-tag-length': '认证标签',
  'crypto-format': '输出格式',
};

function collectCryptoConfigPayload(tool, content) {
  const fields = getWorkspaceConfigControls(content)
    .map((node) => {
      const key = configControlKey(node);
      const sensitive = ['crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-iv'].includes(key);
      const type = node.tagName === 'SELECT' ? 'select' : sensitive ? 'secret' : node.type === 'number' ? 'number' : node.type === 'checkbox' || node.type === 'radio' ? 'boolean' : 'text';
      return { key, type, value: readWorkspaceControlValue(node), sensitive, required: Boolean(node.required) };
    })
    .filter((field) => field.key);
  const operation = content.querySelector('[data-crypto-operation].is-active')?.dataset.cryptoOperation;
  return { schemaVersion: 1, toolId: tool.id, operation: operation || 'digest', fields };
}

function cryptoConfigFieldValue(payload, key) {
  return payload?.fields?.find((field) => field.key === key)?.value ?? '';
}

function maskCryptoConfigValue(value) {
  const text = String(value || '');
  if (!text) return '未设置';
  if (text.length <= 8) return '••••••••';
  return `${text.slice(0, 4)}••••${text.slice(-4)}`;
}

function cryptoConfigReadableValue(key, value, mask = false, payload = null) {
  if (key === 'crypto-algorithm') return getTool(value)?.name || value || '未设置';
  if (['crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-iv'].includes(key)) return mask ? maskCryptoConfigValue(value) : value || '未设置';
  if (key === 'crypto-mode' && value) {
    const algorithm = cryptoConfigFieldValue(payload, 'crypto-algorithm');
    const prefix = algorithm === 'aes' ? 'AES' : algorithm === 'sm4' ? 'SM4' : algorithm === '3des' ? '3DES' : algorithm === 'des' ? 'DES' : '';
    return String(value).includes('-') || !prefix ? value : `${prefix}-${value}`;
  }
  if (['crypto-key-length', 'crypto-ctr-length', 'crypto-gcm-tag-length'].includes(key) && value) return `${value} bit`;
  if (['crypto-key-encoding', 'crypto-iv-encoding'].includes(key) && value) return value === 'utf8' ? 'UTF-8' : String(value).toUpperCase();
  if (key === 'sm2-cipher-mode') return value === '0' ? 'C1C2C3' : 'C1C3C2';
  if (['sm2-cipher-prefix', 'sm2-cipher-der'].includes(key)) return value ? '启用' : '停用';
  if (key === 'crypto-padding' && value === 'NONE') return 'NoPadding';
  if (key === 'crypto-format' && value) return String(value).toUpperCase();
  return value === '' || value == null ? '未设置' : String(value);
}

function cryptoConfigSummaryMarkup(payload, mask = false) {
  const rows = ['crypto-algorithm', 'crypto-variant', 'crypto-mode', 'crypto-key-length', 'crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-key-encoding', 'crypto-iv', 'crypto-iv-encoding', 'crypto-padding', 'crypto-ctr-length', 'crypto-gcm-tag-length', 'sm2-cipher-mode', 'sm2-cipher-prefix', 'sm2-cipher-der', 'crypto-format']
    .map((key) => {
      const value = cryptoConfigFieldValue(payload, key);
      if (value === '' || value == null) return '';
      const label = payload?.toolId === 'sm2' && key === 'crypto-key' ? 'SM2 公钥' : cryptoConfigFieldLabels[key];
      return `<div class="crypto-config-summary-row"><span>${label}</span><code class="${['crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-iv'].includes(key) ? 'is-secret' : ''}">${escapeHtml(cryptoConfigReadableValue(key, value, mask, payload))}</code></div>`;
    })
    .filter(Boolean)
    .join('');
  const operation = payload?.operation || payload?.custom?.operation;
  const operationRow = operation && operation !== 'digest' ? `<div class="crypto-config-summary-row"><span>当前操作</span><code>${operation === 'decrypt' ? '解密' : '加密'}</code></div>` : '';
  return `<div class="crypto-config-summary">${operationRow}${rows || '<div class="crypto-config-summary-empty">没有可展示的加密参数</div>'}</div>`;
}

function cryptoConfigHasSecret(payload) {
  return ['crypto-key', 'crypto-private-key', 'crypto-rsa-public-key', 'crypto-rsa-private-key', 'crypto-iv'].some((key) => payload?.fields?.some((field) => field.key === key && field.value));
}

function cryptoConfigDate(value) {
  if (!value) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function closeCryptoConfigModal() {
  document.querySelector('[data-crypto-config-modal]')?.remove();
}

async function applyCryptoConfigRecord(tool, content, record) {
  if (!record?.payload || record.toolId !== tool.id) throw new Error('配置与当前加密工具不匹配');
  const payload = storage?.isDesktop && record.desktopSummary
    ? await storage.applyCryptoConfig(tool.id, record.id)
    : record.payload;
  if ((payload.schemaVersion || payload.version) !== 1) throw new Error('配置版本不受支持');
  if (payload.toolId !== tool.id) throw new Error('配置正文与当前加密工具不匹配');
  await applyWorkspaceConfigCustom(tool, content, payload.custom);
  const priority = { 'crypto-algorithm': 0, 'crypto-mode': 1, 'crypto-variant': 1, 'crypto-key-length': 2, 'crypto-padding': 3 };
  const fields = [...(payload.fields || [])].sort((left, right) => (priority[left.key] ?? 4) - (priority[right.key] ?? 4));
  for (const field of fields) {
    const node = findConfigControl(content, field.key);
    if (!node) continue;
    setWorkspaceControlValue(node, field.value);
    if (node.id !== 'crypto-algorithm') dispatchWorkspaceControlChange(node);
  }
  const operation = payload.operation || payload.custom?.operation;
  if (operation && operation !== 'digest') content.querySelector(`[data-crypto-operation="${operation}"]`)?.click();
  refreshWorkspaceAfterConfig(tool, content);
}

async function saveCryptoConfigRecord(tool, content, name, editId = '') {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('请输入配置名称');
  if (normalizedName.length > 40) throw new Error('配置名称不能超过 40 个字符');
  if (/[\u0000-\u001f\u007f]/.test(normalizedName)) throw new Error('配置名称不能包含控制字符');
  const payload = collectCryptoConfigPayload(tool, content);
  const allRecords = await readToolConfigRecords(tool.id);
  const existing = allRecords.find((record) => record.toolId === tool.id && (record.id === editId || record.name === normalizedName));
  if (storage?.isDesktop) {
    const record = existing
      ? await storage.updateCryptoConfig(existing.id, tool.id, normalizedName, payload)
      : await storage.saveCryptoConfig(tool.id, normalizedName, payload);
    pendingCryptoConfigEditId = '';
    return record;
  }
  const now = Date.now();
  const record = { id: existing?.id || configRandomId(), toolId: tool.id, name: normalizedName, payload, createdAt: existing?.createdAt || now, updatedAt: now };
  const nextRecords = allRecords.filter((item) => item.id !== record.id && !(item.toolId === tool.id && item.name === normalizedName));
  await writeToolConfigRecords([...nextRecords, record]);
  pendingCryptoConfigEditId = '';
  return record;
}

async function openCryptoConfigSaveModal(tool, content) {
  closeCryptoConfigModal();
  const records = await readToolConfigRecords(tool.id);
  const editingRecord = records.find((record) => record.toolId === tool.id && record.id === pendingCryptoConfigEditId);
  const payload = collectCryptoConfigPayload(tool, content);
  const modal = document.createElement('div');
  modal.className = 'crypto-config-modal';
  modal.dataset.cryptoConfigModal = 'save';
  const secretHint = cryptoConfigHasSecret(payload) ? tool.id === 'sm2' ? 'SM2 公钥和私钥会随配置正文加密保存' : tool.id === 'rsa' ? 'RSA 公钥和私钥会随配置正文加密保存' : '密钥与 IV 会随配置正文加密保存' : '只保存当前摘要或加密参数，不保存正文和结果';
  const storageHint = storage?.isDesktop ? '桌面版使用 SQLCipher、系统凭证与 AES-256-GCM 加密保存。' : 'Web 版使用本机 IndexedDB 与 AES-GCM 加密保存。';
  modal.innerHTML = `<div class="crypto-config-backdrop" data-crypto-config-close></div><section class="crypto-config-dialog" role="dialog" aria-modal="true" aria-labelledby="crypto-config-dialog-title"><div class="crypto-config-dialog-head"><div><p class="eyebrow">${editingRecord ? 'EDIT CONFIGURATION' : 'SAVE CONFIGURATION'}</p><h2 id="crypto-config-dialog-title">${editingRecord ? '编辑加密配置' : '保存加密配置'}</h2><p>保存当前${escapeHtml(tool.name)}的算法参数，正文和结果不会进入配置。</p></div><button class="icon-button" type="button" data-crypto-config-close aria-label="关闭">×</button></div><label class="crypto-config-name-field"><span>配置名称</span><input id="crypto-config-name" type="text" maxlength="40" autocomplete="off" placeholder="例如：生产接口 AES-GCM" value="${escapeHtml(editingRecord?.name || '')}" /></label><div class="crypto-config-dialog-section"><div class="crypto-config-section-head"><strong>将保存的参数</strong><span>${secretHint}</span></div>${cryptoConfigSummaryMarkup(payload, false)}</div><div class="crypto-config-dialog-note"><span>${storageHint}</span></div><div class="crypto-config-dialog-actions"><button class="secondary-button" type="button" data-crypto-config-close>取消</button><button class="primary-button" type="button" data-crypto-config-modal-action="save">${editingRecord ? '更新配置' : '保存配置'}</button></div></section>`;
  document.body.appendChild(modal);
  const nameInput = modal.querySelector('#crypto-config-name');
  nameInput.focus();
  modal.addEventListener('click', async (event) => {
    if (event.target.closest('[data-crypto-config-close]')) { closeCryptoConfigModal(); return; }
    if (!event.target.closest('[data-crypto-config-modal-action="save"]')) return;
    const button = event.target.closest('[data-crypto-config-modal-action="save"]');
    button.disabled = true;
    try {
      const record = await saveCryptoConfigRecord(tool, content, nameInput.value, editingRecord?.id || '');
      closeCryptoConfigModal();
      showToast(`加密配置“${record.name}”已保存`);
    } catch (error) {
      button.disabled = false;
      const message = modal.querySelector('.crypto-config-dialog-note');
      message.textContent = error.message;
      message.classList.add('is-error');
      nameInput.focus();
    }
  });
}

function cryptoConfigHistoryListMarkup(records) {
  if (!records.length) return '<div class="crypto-config-history-empty"><strong>还没有保存的加密配置</strong><span>点击工作台上的“保存配置”创建第一条配置。</span></div>';
  return `<div class="crypto-config-history-list">${records.map((record) => `<article class="crypto-config-history-item"><div class="crypto-config-history-head"><div><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(getTool(record.toolId)?.name || record.toolId)} · ${cryptoConfigDate(record.updatedAt)}</small></div><span class="crypto-config-encrypted-badge">已加密</span></div>${cryptoConfigSummaryMarkup(record.payload, true)}<div class="crypto-config-history-actions"><button class="secondary-button" type="button" data-crypto-history-action="apply" data-config-id="${escapeHtml(record.id)}">应用</button><button class="secondary-button" type="button" data-crypto-history-action="edit" data-config-id="${escapeHtml(record.id)}">编辑</button><button class="danger-button" type="button" data-crypto-history-action="delete" data-config-id="${escapeHtml(record.id)}">删除</button></div></article>`).join('')}</div>`;
}

async function openCryptoConfigHistoryModal(tool, content) {
  closeCryptoConfigModal();
  const records = (await readToolConfigRecords(tool.id)).filter((record) => record.toolId === tool.id).sort((left, right) => right.updatedAt - left.updatedAt);
  const modal = document.createElement('div');
  modal.className = 'crypto-config-modal';
  modal.dataset.cryptoConfigModal = 'history';
  const historyHint = records.some((record) => cryptoConfigHasSecret(record.payload)) ? `仅显示当前加密工具的配置，${tool.id === 'sm2' || tool.id === 'rsa' ? '公钥和私钥' : '密钥和 IV'} 在列表中以掩码展示。` : '仅显示当前加密工具的配置，列表只展示算法参数。';
  modal.innerHTML = `<div class="crypto-config-backdrop" data-crypto-config-close></div><section class="crypto-config-dialog crypto-config-history-dialog" role="dialog" aria-modal="true" aria-labelledby="crypto-config-history-title"><div class="crypto-config-dialog-head"><div><p class="eyebrow">CONFIGURATION HISTORY</p><h2 id="crypto-config-history-title">${escapeHtml(tool.name)}配置历史</h2><p>${historyHint}</p></div><button class="icon-button" type="button" data-crypto-config-close aria-label="关闭">×</button></div>${cryptoConfigHistoryListMarkup(records)}<div class="crypto-config-dialog-note"><span>配置加密保存在当前设备，并按工具隔离展示。</span></div></section>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', async (event) => {
    if (event.target.closest('[data-crypto-config-close]')) { closeCryptoConfigModal(); return; }
    const button = event.target.closest('[data-crypto-history-action]');
    if (!button) return;
    const record = records.find((item) => item.id === button.dataset.configId);
    if (!record) return;
    const action = button.dataset.cryptoHistoryAction;
    if (action === 'apply') {
      try {
        await applyCryptoConfigRecord(tool, content, record);
        closeCryptoConfigModal();
        showToast(`已应用加密配置“${record.name}”`);
      } catch (error) {
        showToast(`应用失败：${error.message}`);
      }
      return;
    }
    if (action === 'edit') {
      try {
        await applyCryptoConfigRecord(tool, content, record);
        pendingCryptoConfigEditId = record.id;
        closeCryptoConfigModal();
        showToast(`已载入“${record.name}”，修改参数后点击保存配置更新`);
      } catch (error) {
        showToast(`载入失败：${error.message}`);
      }
      return;
    }
    if (action === 'delete' && window.confirm(`确定删除配置“${record.name}”吗？`)) {
      try {
        if (storage?.isDesktop) await storage.deleteCryptoConfig(tool.id, record.id);
        else {
          const allRecords = await readToolConfigRecords(tool.id);
          await writeToolConfigRecords(allRecords.filter((item) => item.id !== record.id));
        }
        button.closest('.crypto-config-history-item')?.remove();
        if (!modal.querySelector('.crypto-config-history-item')) modal.querySelector('.crypto-config-history-list').innerHTML = cryptoConfigHistoryListMarkup([]);
        showToast(`已删除加密配置“${record.name}”`);
      } catch (error) {
        showToast(`删除失败：${error.message}`);
      }
    }
  });
}

function encodePath(path) { return encodeURIComponent(JSON.stringify(path)); }
function decodePath(value) { try { return JSON.parse(decodeURIComponent(value)); } catch (error) { return []; } }
function pathKey(path) { return JSON.stringify(path); }
function getValueAtPath(value, path) { return path.reduce((current, key) => current == null ? undefined : current[key], value); }
function setValueAtPath(value, path, nextValue) {
  if (!path.length) return nextValue;
  const root = JSON.parse(JSON.stringify(value));
  let cursor = root;
  path.slice(0, -1).forEach((key) => { cursor = cursor[key]; });
  cursor[path[path.length - 1]] = nextValue;
  return root;
}

function persist() {
  if (!storage) return;
  const validHistory = state.history.filter((id) => tools.some((tool) => tool.id === id)).slice(0, 12);
  state.history = validHistory;
  storage.setRecentTools(validHistory).catch((error) => showToast(`历史保存失败：${error.message}`));
}

function persistJsonPreferences() {
  if (!storage) return;
  clearTimeout(persistJsonPreferences.timer);
  persistJsonPreferences.timer = setTimeout(() => {
    Promise.all([
      storage.setDraft('json', { draft: state.json.draft, expanded: [...state.json.expanded].slice(0, 80) }),
      storage.setSetting('json-layout', state.json.layout),
      storage.setSetting('json-sort', state.json.sort),
      storage.setSetting('json-lint', state.json.jsonLint),
      storage.setSetting('json-auto-decode', state.json.autoDecode),
      storage.setSetting('json-node-edit', state.json.nodeEdit),
      storage.setSetting('json-nested', state.json.nestedParse),
    ]).catch((error) => showToast(`草稿保存失败：${error.message}`));
  }, 180);
}

function updateFavoriteCounts() {
  document.querySelectorAll('[data-count="favorites"]').forEach((node) => { node.textContent = String(state.favorites.size); });
  document.querySelectorAll('[data-count="tools"]').forEach((node) => { node.textContent = String(tools.length); });
}
function cleanupActiveWorkspace() {
  if (typeof activeWorkspaceCleanup === 'function') activeWorkspaceCleanup();
  activeWorkspaceCleanup = null;
}
function renderFeatured() { refs.featuredGrid.innerHTML = featured.map((tool) => toolCardMarkup(tool, true)).join(''); }

function getVisibleTools() {
  let result = [...tools];
  if (state.activeFilter === 'recent') result = result.filter((tool) => state.history.includes(tool.id));
  else if (state.activeFilter === 'favorites') result = result.filter((tool) => state.favorites.has(tool.id));
  else if (state.activeFilter !== 'all') result = result.filter((tool) => tool.category === state.activeFilter);
  if (state.environment !== 'all') result = result.filter((tool) => state.environment === 'desktop' ? tool.environment === 'desktop' : tool.environment === 'local');
  if (state.query) {
    const query = state.query.toLowerCase();
    result = result.filter((tool) => `${tool.name} ${tool.description} ${tool.keywords}`.toLowerCase().includes(query));
  }
  if (state.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  if (state.sort === 'category') result.sort((a, b) => a.category.localeCompare(b.category));
  return result;
}

function renderTools() {
  const visible = getVisibleTools();
  refs.toolGrid.innerHTML = visible.map((tool) => toolCardMarkup(tool)).join('');
  refs.empty.hidden = visible.length > 0;
  refs.toolGrid.hidden = visible.length === 0;
  refs.summary.textContent = state.query ? `找到 ${visible.length} 个匹配工具` : `${visible.length} 个工具，覆盖开发日常任务`;
  updateFavoriteCounts();
}

function renderHome(options = {}) {
  const showOverview = options.showOverview !== false;
  cleanupActiveWorkspace();
  closeSettings();
  refs.home.hidden = false;
  refs.workspace.hidden = true;
  refs.utility.hidden = true;
  refs.home.classList.toggle('tools-only-view', !showOverview);
  state.activeView = 'home';
  renderTools();
  setActiveNav('home');
  if (options.updateRoute !== false) setRoute('/');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-item').forEach((node) => node.classList.remove('active'));
  const matching = document.querySelector(`[data-view="${view}"], [data-category="${view}"]`);
  matching?.classList.add('active');
}

function openTool(id, options = {}) {
  closeSettings();
  closeCryptoConfigModal();
  const tool = getTool(id);
  if (!tool) return;
  cleanupActiveWorkspace();
  pendingCryptoConfigEditId = '';
  state.currentTool = tool;
  state.history = [id, ...state.history.filter((item) => item !== id)].slice(0, 12);
  persist();
  refs.home.hidden = true;
  refs.utility.hidden = true;
  refs.workspace.hidden = false;
  document.querySelector('#workspace-category').textContent = tool.label;
  document.querySelector('#workspace-icon').className = `workspace-icon ${tool.iconClass}`;
  document.querySelector('#workspace-icon').textContent = tool.icon;
  document.querySelector('#workspace-label').textContent = tool.label.toUpperCase();
  document.querySelector('#workspace-title').textContent = tool.name;
  document.querySelector('#workspace-description').textContent = tool.description;
  const favorite = document.querySelector('.workspace-favorite');
  favorite.textContent = state.favorites.has(id) ? '★' : '☆';
  favorite.classList.toggle('is-favorite', state.favorites.has(id));
  favorite.dataset.toolId = id;
  const workspaceContent = refs.workspace.querySelector('#workspace-content');
  workspaceContent.innerHTML = (workspaceTemplates[id] || workspaceTemplates.default)(tool);
  if (tool.id === 'json') initJsonWorkbench(); else bindWorkspace(tool);
  enhanceBtSelects(workspaceContent);
  setActiveNav(tool.category);
  if (options.updateRoute !== false) setRoute(`/tool/${encodeURIComponent(id)}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showUtility(view, options = {}) {
  cleanupActiveWorkspace();
  closeSettings();
  refs.home.hidden = true;
  refs.workspace.hidden = true;
  refs.utility.hidden = false;
  const title = view === 'history' ? '历史记录' : view === 'settings' ? '设置' : '我的收藏';
  const description = view === 'history' ? '最近打开的工具和工作内容' : view === 'settings' ? '管理主题、隐私和本地偏好' : '快速进入你标记的工具';
  document.querySelector('#utility-title').textContent = title;
  document.querySelector('#utility-description').textContent = description;
  const list = document.querySelector('#utility-list');
  if (view === 'settings') {
    list.innerHTML = `<div class="workspace-card" style="padding:20px;gap:18px"><div class="workspace-card-head"><span>主题模式</span><button class="secondary-button" data-action="appearance">调整外观</button></div><p style="color:var(--text-muted);margin:0">当前主题：${themeModeLabel(refs.root.dataset.themeMode || 'dark')}。偏好保存在当前设备。</p><div class="workspace-card-head"><span>本地优先</span><span style="color:var(--green)">已启用</span></div><p style="color:var(--text-muted);margin:0">工具输入、收藏和历史记录只保存在当前设备。</p></div>`;
  } else {
    const ids = view === 'history' ? state.history : [...state.favorites];
    list.innerHTML = ids.length ? ids.map((id) => getTool(id)).filter(Boolean).map((tool) => toolCardMarkup(tool)).join('') : `<div class="utility-empty">${view === 'history' ? '还没有打开过工具' : '还没有收藏工具'}</div>`;
  }
  state.activeView = view;
  setActiveNav(view);
  if (options.updateRoute !== false) setRoute(`/${view}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bytesToHex(bytes) { return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
function bytesToBase64(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function hexToBytes(value, label) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized || !/^[0-9a-f]+$/i.test(normalized) || normalized.length % 2 !== 0) throw new Error(`${label}必须是偶数位十六进制内容`);
  return Uint8Array.from(normalized.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
}
function cryptoSecretBytes(value, label, acceptedLengths) {
  const text = String(value ?? '');
  const bytes = new TextEncoder().encode(text);
  if (acceptedLengths.includes(bytes.length)) return bytes;
  const legacyHex = text.replace(/\s+/g, '').replace(/^0x/i, '');
  if (/^[0-9a-f]+$/i.test(legacyHex) && legacyHex.length % 2 === 0 && acceptedLengths.includes(legacyHex.length / 2)) return hexToBytes(legacyHex, label);
  const expected = acceptedLengths.length === 1 ? `${acceptedLengths[0]} 字节` : `${acceptedLengths.join('、')} 字节`;
  throw new Error(`${label}请输入原文，UTF-8 编码后应为 ${expected}`);
}
function base64ToBytes(value) {
  if (!value.trim()) throw new Error('请输入 Base64 密文');
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function cryptoSecretBytesByEncoding(value, label, acceptedLengths, encoding = 'utf8') {
  const text = String(value ?? '');
  let bytes;
  if (encoding === 'hex') bytes = hexToBytes(text, label);
  else if (encoding === 'base64') bytes = base64ToBytes(text);
  else bytes = new TextEncoder().encode(text);
  if (acceptedLengths.includes(bytes.length)) return bytes;
  const expected = acceptedLengths.length === 1 ? `${acceptedLengths[0]} 字节` : `${acceptedLengths.join('、')} 字节`;
  const encodingLabel = encoding === 'hex' ? 'Hex' : encoding === 'base64' ? 'Base64' : 'UTF-8';
  throw new Error(`${label}使用 ${encodingLabel} 编码后应为 ${expected}`);
}
function cryptoSecretByteLength(value, encoding = 'utf8') {
  try {
    if (encoding === 'hex') return hexToBytes(String(value ?? ''), '内容').length;
    if (encoding === 'base64') return base64ToBytes(String(value ?? '')).length;
    return new TextEncoder().encode(String(value ?? '')).length;
  } catch (error) {
    return null;
  }
}
function randomCryptoBytes(length) {
  const bytes = new Uint8Array(length);
  if (window.crypto?.getRandomValues) return window.crypto.getRandomValues(bytes);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return bytes;
}
function randomCryptoText(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomCryptoBytes(length);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}
function formatCryptoSecretRandom(encoding, length = 16) {
  if (encoding === 'hex') return bytesToHex(randomCryptoBytes(length));
  if (encoding === 'base64') return bytesToBase64(randomCryptoBytes(length));
  return randomCryptoText(length);
}
function formatCryptoBytes(bytes, format) { return format === 'base64' ? bytesToBase64(bytes) : bytesToHex(bytes); }
function parseCryptoBytes(value, format) { return format === 'base64' ? base64ToBytes(value) : hexToBytes(value, '密文'); }
function normalizeSm2PublicKey(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '').replace(/^0x/i, '').toLowerCase();
  const publicKey = /^[0-9a-f]{128}$/.test(normalized) ? `04${normalized}` : normalized;
  if (/^04[0-9a-f]{128}$/.test(publicKey) && sm2Library.verifyPublicKey(publicKey)) return publicKey;
  throw new Error('SM2 公钥应为 128 位坐标 Hex，或带 04 前缀的 130 位 Hex');
}
function normalizeSm2PrivateKey(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '').replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) throw new Error('SM2 私钥应为 64 位十六进制内容');
  return normalized.toLowerCase();
}

function bytesToPem(bytes, label) {
  const base64 = bytesToBase64(bytes);
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function pemToBytes(value, label) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`请输入 RSA ${label}`);
  const match = text.match(/-----BEGIN [^-]+-----([\s\S]+?)-----END [^-]+-----/);
  const base64 = (match ? match[1] : text).replace(/\s+/g, '');
  return base64ToBytes(base64);
}

function readDerElement(bytes, offset = 0) {
  const tag = bytes[offset];
  const lengthByte = bytes[offset + 1];
  if (tag === undefined || lengthByte === undefined) throw new Error('RSA 私钥格式不完整');
  let length;
  let headerLength = 2;
  if (lengthByte & 0x80) {
    const lengthBytes = lengthByte & 0x7f;
    if (!lengthBytes || lengthBytes > 4 || offset + 2 + lengthBytes > bytes.length) throw new Error('RSA 私钥长度字段无效');
    length = 0;
    for (let index = 0; index < lengthBytes; index += 1) length = (length << 8) | bytes[offset + 2 + index];
    headerLength += lengthBytes;
  } else {
    length = lengthByte;
  }
  const valueStart = offset + headerLength;
  const end = valueStart + length;
  if (end > bytes.length) throw new Error('RSA 私钥内容不完整');
  return { tag, valueStart, end };
}

function rsaPkcs8ToPkcs1Pem(value) {
  const text = String(value ?? '').trim();
  if (/-----BEGIN RSA PRIVATE KEY-----/.test(text)) return text;
  const bytes = pemToBytes(value, '私钥');
  const outer = readDerElement(bytes);
  if (outer.tag !== 0x30) throw new Error('RSA 私钥不是 PKCS#8 格式');
  let offset = outer.valueStart;
  const version = readDerElement(bytes, offset);
  offset = version.end;
  const algorithm = readDerElement(bytes, offset);
  offset = algorithm.end;
  const privateKey = readDerElement(bytes, offset);
  if (privateKey.tag !== 0x04) throw new Error('RSA 私钥内容无效');
  return bytesToPem(bytes.slice(privateKey.valueStart, privateKey.end), 'RSA PRIVATE KEY');
}

function rsaPkcs1ToPkcs8Pem(value) {
  const bytes = pemToBytes(value, '私钥');
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const body = [0x02, 0x01, 0x00, ...algorithm, 0x04, ...sm2DerLengthBytes(bytes.length), ...bytes];
  return bytesToPem(Uint8Array.from([0x30, ...sm2DerLengthBytes(body.length), ...body]), 'PRIVATE KEY');
}

function cryptoWordArrayToBytes(wordArray) {
  const bytes = new Uint8Array(wordArray.sigBytes);
  for (let index = 0; index < wordArray.sigBytes; index += 1) bytes[index] = (wordArray.words[index >>> 2] >>> (24 - (index % 4) * 8)) & 0xff;
  return bytes;
}

function cryptoBytesToWordArray(bytes) {
  return CryptoJS.lib.WordArray.create(bytes);
}

function sm4EncryptBlock(block, key) {
  const result = sm4Library.encrypt([...block], key, { mode: 'ecb', padding: 'none', output: 'array' });
  if (!Array.isArray(result) || result.length !== 16) throw new Error('SM4 单块加密失败');
  return Uint8Array.from(result);
}

function incrementCryptoCounter(counter) {
  for (let index = counter.length - 1; index >= 0; index -= 1) {
    counter[index] = (counter[index] + 1) & 0xff;
    if (counter[index] !== 0) break;
  }
}

function transformSm4Stream(data, key, iv, mode, decrypting) {
  const output = new Uint8Array(data.length);
  let state = Uint8Array.from(iv);
  for (let offset = 0; offset < data.length; offset += 16) {
    if (mode === 'OFB') state = sm4EncryptBlock(state, key);
    const stream = mode === 'OFB' ? state : sm4EncryptBlock(state, key);
    const size = Math.min(16, data.length - offset);
    const source = data.slice(offset, offset + size);
    const target = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) target[index] = source[index] ^ stream[index];
    output.set(target, offset);
    if (mode === 'CTR') incrementCryptoCounter(state);
    if (mode === 'CFB') state = Uint8Array.from(decrypting ? source : target);
  }
  return output;
}

function rsaCryptoAlgorithm(mode, hash) {
  return mode === 'RSA-OAEP' ? { name: mode, hash } : { name: mode };
}

function rsaKeyGenerationAlgorithm(mode, hash) {
  return { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: hash || 'SHA-256' };
}

function sm2DerLengthBytes(length) {
  if (length < 128) return [length];
  const bytes = [];
  let value = length;
  while (value > 0) { bytes.unshift(value & 0xff); value >>>= 8; }
  return [0x80 | bytes.length, ...bytes];
}

function sm2DerTlv(tag, value) { return [tag, ...sm2DerLengthBytes(value.length), ...value]; }

function sm2DerInteger(hex) {
  let bytes = [...hexToBytes(hex, 'SM2 坐标')];
  while (bytes.length > 1 && bytes[0] === 0) bytes.shift();
  if (bytes[0] & 0x80) bytes.unshift(0);
  return sm2DerTlv(0x02, bytes);
}

function sm2DerOctetString(hex, label) { return sm2DerTlv(0x04, [...hexToBytes(hex, label)]); }

function normalizeSm2CipherHex(value) {
  let normalized = String(value ?? '').replace(/\s+/g, '').toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized)) throw new Error('SM2 密文必须是十六进制内容');
  if (normalized.startsWith('04') && normalized.length >= 194) {
    const rawPointValid = sm2Library.verifyPublicKey(`04${normalized.slice(0, 128)}`);
    const prefixedPointValid = sm2Library.verifyPublicKey(`04${normalized.slice(2, 130)}`);
    if (prefixedPointValid && !rawPointValid) normalized = normalized.slice(2);
  }
  return normalized;
}

function sm2CipherHexParts(cipherHex, cipherMode) {
  const normalized = normalizeSm2CipherHex(cipherHex);
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length < 192 || (normalized.length - 192) % 2 !== 0) throw new Error('SM2 密文长度或格式不正确');
  const c1x = normalized.slice(0, 64);
  const c1y = normalized.slice(64, 128);
  const rest = normalized.slice(128);
  const c3 = cipherMode === 0 ? rest.slice(-64) : rest.slice(0, 64);
  const c2 = cipherMode === 0 ? rest.slice(0, -64) : rest.slice(64);
  if (c2.length % 2 !== 0 || c3.length !== 64) throw new Error('SM2 密文长度或格式不正确');
  return { c1x, c1y, c2, c3 };
}

function sm2CipherHexToDer(cipherHex, cipherMode = 1) {
  const { c1x, c1y, c2, c3 } = sm2CipherHexParts(cipherHex, cipherMode);
  const ordered = cipherMode === 0 ? [c2, c3] : [c3, c2];
  const body = [...sm2DerInteger(c1x), ...sm2DerInteger(c1y), ...sm2DerOctetString(ordered[0], 'SM2 摘要'), ...sm2DerOctetString(ordered[1], 'SM2 密文')];
  return bytesToHex(Uint8Array.from(sm2DerTlv(0x30, body)));
}

function sm2ReadDerTlv(bytes, offset) {
  if (offset >= bytes.length) throw new Error('ASN.1 DER 密文不完整');
  const tag = bytes[offset++];
  if (offset >= bytes.length) throw new Error('ASN.1 DER 长度字段不完整');
  const firstLength = bytes[offset++];
  let length = firstLength;
  if (firstLength & 0x80) {
    const lengthBytes = firstLength & 0x7f;
    if (!lengthBytes || lengthBytes > 4 || offset + lengthBytes > bytes.length) throw new Error('ASN.1 DER 长度字段无效');
    length = 0;
    for (let index = 0; index < lengthBytes; index += 1) length = length * 256 + bytes[offset++];
  }
  const end = offset + length;
  if (end > bytes.length) throw new Error('ASN.1 DER 密文长度不完整');
  return { tag, value: bytes.slice(offset, end), next: end };
}

function sm2DerFixedInteger(value, label) {
  let bytes = [...value];
  while (bytes.length > 32 && bytes[0] === 0) bytes.shift();
  if (bytes.length !== 32) throw new Error(`${label}长度不正确`);
  return bytesToHex(Uint8Array.from(bytes));
}

function sm2DerToCipherHex(cipherHex, cipherMode = 1) {
  const bytes = hexToBytes(cipherHex, 'ASN.1 DER 密文');
  const root = sm2ReadDerTlv(bytes, 0);
  if (root.tag !== 0x30 || root.next !== bytes.length) throw new Error('ASN.1 DER 密文应为完整的 SEQUENCE');
  const values = [];
  let offset = 0;
  while (offset < root.value.length) {
    const item = sm2ReadDerTlv(root.value, offset);
    values.push(item);
    offset = item.next;
  }
  if (values.length !== 4 || values[0].tag !== 0x02 || values[1].tag !== 0x02 || values[2].tag !== 0x04 || values[3].tag !== 0x04) throw new Error('ASN.1 DER 密文结构应为 X、Y、摘要和密文');
  const c1x = sm2DerFixedInteger(values[0].value, 'SM2 X 坐标');
  const c1y = sm2DerFixedInteger(values[1].value, 'SM2 Y 坐标');
  const first = bytesToHex(Uint8Array.from(values[2].value));
  const second = bytesToHex(Uint8Array.from(values[3].value));
  const c3 = cipherMode === 0 ? second : first;
  const c2 = cipherMode === 0 ? first : second;
  if (c3.length !== 64 || !c2.length || c2.length % 2 !== 0) throw new Error('ASN.1 DER 密文中的摘要或密文长度不正确');
  return `${c1x}${c1y}${cipherMode === 0 ? c2 + c3 : c3 + c2}`;
}

function bindCryptoWorkspace(tool) {
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#crypto-input');
  const output = content.querySelector('#crypto-output');
  const status = content.querySelector('#crypto-status');
  const format = content.querySelector('#crypto-format');
  const algorithmPicker = content.querySelector('[data-algorithm-picker]');
  const algorithmSelect = content.querySelector('#crypto-algorithm');
  const algorithmTrigger = content.querySelector('[data-algorithm-toggle]');
  const algorithmMenu = content.querySelector('#crypto-algorithm-menu');
  let activeOperation = tool.cryptoType === 'digest' ? 'digest' : 'encrypt';
  const setStatus = (value, stateClass = '') => { status.textContent = value; status.className = stateClass ? `crypto-status-${stateClass}` : ''; };
  const secretFieldInfo = {
    key: { input: '#crypto-key', encoding: '#crypto-key-encoding', length: '#crypto-key-length' },
    iv: { input: '#crypto-iv', encoding: '#crypto-iv-encoding', length: '#crypto-iv-length' },
  };
  const syncSecretLength = (kind) => {
    if (tool.id !== 'sm4') return;
    const info = secretFieldInfo[kind];
    const inputNode = content.querySelector(info.input);
    const encodingNode = content.querySelector(info.encoding);
    const lengthNode = content.querySelector(info.length);
    if (!inputNode || !encodingNode || !lengthNode) return;
    const value = inputNode.value;
    const length = cryptoSecretByteLength(value, encodingNode.value);
    const valid = length === 16;
    lengthNode.className = `crypto-secret-length ${valid ? 'is-valid' : value ? 'is-invalid' : 'is-empty'}`;
    lengthNode.textContent = valid ? '16 字节 ✓' : length == null ? '格式错误' : `${length} 字节 / 需 16`;
  };
  const syncSecretLengths = () => { syncSecretLength('key'); syncSecretLength('iv'); };
  const syncModeOptions = () => {
    const mode = content.querySelector('#crypto-mode')?.value;
    const padding = content.querySelector('#crypto-padding');
    if (padding && mode) padding.innerHTML = cryptoPaddingOptions(tool, mode);
    const hint = cryptoModeHint(tool, mode);
    const ivField = content.querySelector('#crypto-iv-field');
    const ivLabel = content.querySelector('#crypto-iv-label');
    const ivHint = content.querySelector('#crypto-iv-hint');
    const ivInput = content.querySelector('#crypto-iv');
    const counterLengthField = content.querySelector('#crypto-ctr-length-field');
    const tagField = content.querySelector('#crypto-gcm-tag-field');
    const modeCapability = content.querySelector('#crypto-mode-capability');
    if (ivField) ivField.hidden = mode === 'ECB';
    if (ivLabel) ivLabel.textContent = tool.id === 'sm4' && mode !== 'ECB' ? '偏移量 IV' : hint[0];
    if (ivHint) ivHint.textContent = hint[1];
    if (ivInput) {
      if (tool.id === 'aes' && ['101112131415161718191a1b', '101112131415161718191a1b1c1d1e1f', 'ByeToolsIV12', 'ByeToolsIV123456'].includes(ivInput.value)) ivInput.value = cryptoDefaultIv(mode);
      ivInput.placeholder = mode === 'ECB' ? '当前模式无需 IV' : tool.id === 'sm4' ? '输入 UTF-8 原文 IV…' : `输入原文 ${hint[0]}…`;
      ivInput.disabled = mode === 'ECB';
    }
    if (counterLengthField) counterLengthField.hidden = mode !== 'CTR';
    if (tagField) tagField.hidden = mode !== 'GCM';
    if (modeCapability && mode) {
      const capability = cryptoModeCapability(tool, mode);
      modeCapability.className = `crypto-mode-capability crypto-mode-capability-${capability}`;
      modeCapability.replaceChildren(document.createElement('i'), document.createTextNode(cryptoModeCapabilityLabel(capability)));
    }
    syncSecretLengths();
  };
  const syncInputHint = () => {
    if (!input) return;
    const decrypting = activeOperation === 'decrypt';
    input.placeholder = tool.cryptoType === 'digest' ? '输入要计算摘要的文本…' : decrypting ? '输入 Hex 或 Base64 密文…' : '输入要加密的明文…';
    const meta = content.querySelector('#crypto-input-meta');
    if (meta) meta.textContent = tool.cryptoType === 'digest' ? 'UTF-8 文本' : decrypting ? `${format.value.toUpperCase()} 密文` : 'UTF-8 明文';
  };
  const setOperation = (operation) => {
    activeOperation = operation;
    content.querySelectorAll('[data-crypto-operation]').forEach((button) => {
      const selected = button.dataset.cryptoOperation === operation;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    syncInputHint();
  };
  const renderUnavailable = () => {
    const reason = tool.capability === 'deprecated'
      ? `${tool.name} 仅建议用于历史系统兼容性处理，不建议用于新系统的密码存储、签名或安全协议。`
      : `${tool.name} 需要接入经过审查的密码库后才能生成真实结果。当前页面只保存参数，不会伪造输出。`;
    output.textContent = reason;
    setStatus(tool.capability === 'deprecated' ? '不推荐使用' : '待接入密码库', tool.capability === 'deprecated' ? 'warning' : 'pending');
  };
  const executeMd5 = async () => {
    const digestHex = CryptoJS.MD5(input.value).toString(CryptoJS.enc.Hex);
    const bytes = hexToBytes(digestHex, 'MD5 摘要');
    output.textContent = formatCryptoBytes(bytes, format.value);
    setStatus(`已完成 · ${bytes.length} 字节`, 'success');
  };
  const executeSha2 = async () => {
    const variant = content.querySelector('#crypto-variant').value;
    const digest = await window.crypto.subtle.digest(variant, new TextEncoder().encode(input.value));
    const bytes = new Uint8Array(digest);
    output.textContent = formatCryptoBytes(bytes, format.value);
    setStatus(`已完成 · ${bytes.length} 字节`, 'success');
  };
  const executeSha3 = async () => {
    const variant = content.querySelector('#crypto-variant').value;
    const digesters = { 'SHA3-256': sha3_256, 'SHA3-384': sha3_384, 'SHA3-512': sha3_512 };
    const digester = digesters[variant];
    if (!digester) throw new Error('不支持的 SHA-3 摘要变体');
    const bytes = hexToBytes(digester(input.value), 'SHA-3 摘要');
    output.textContent = formatCryptoBytes(bytes, format.value);
    setStatus(`已完成 · ${bytes.length} 字节`, 'success');
  };
  const executeSm3 = async () => {
    const digestHex = sm3Library(input.value);
    const bytes = hexToBytes(digestHex, 'SM3 摘要');
    output.textContent = formatCryptoBytes(bytes, format.value);
    setStatus(`已完成 · ${bytes.length} 字节`, 'success');
  };
  const executeSm2 = async () => {
    const cipherMode = Number(content.querySelector('#sm2-cipher-mode')?.value || 1);
    const useDer = Boolean(content.querySelector('#sm2-cipher-der')?.checked);
    const usePrefix = Boolean(content.querySelector('#sm2-cipher-prefix')?.checked) && !useDer;
    if (activeOperation === 'encrypt') {
      const publicKey = normalizeSm2PublicKey(content.querySelector('#crypto-key').value);
      let cipherHex = sm2Library.doEncrypt(input.value, publicKey, cipherMode);
      if (usePrefix) cipherHex = `04${cipherHex}`;
      if (useDer) cipherHex = sm2CipherHexToDer(cipherHex, cipherMode);
      const bytes = hexToBytes(cipherHex, useDer ? 'ASN.1 DER 密文' : 'SM2 密文');
      output.textContent = formatCryptoBytes(bytes, format.value);
      setStatus(`已完成 · ${bytes.length} 字节`, 'success');
      return;
    }
    const privateKeyInput = content.querySelector('#crypto-private-key')?.value || content.querySelector('#crypto-key').value;
    const privateKey = normalizeSm2PrivateKey(privateKeyInput);
    const inputHex = bytesToHex(parseCryptoBytes(input.value, format.value));
    const cipherHex = useDer
      ? sm2DerToCipherHex(inputHex, cipherMode)
      : (() => {
        const parts = sm2CipherHexParts(inputHex, cipherMode);
        return `${parts.c1x}${parts.c1y}${cipherMode === 0 ? parts.c2 + parts.c3 : parts.c3 + parts.c2}`;
      })();
    const plainBytes = sm2Library.doDecrypt(cipherHex, privateKey, cipherMode, { output: 'array' });
    if (!plainBytes.length && cipherHex.length > 192) throw new Error('SM2 密文校验失败，请确认私钥、密文格式和 C1C3C2 顺序');
    const result = Uint8Array.from(plainBytes);
    output.textContent = new TextDecoder().decode(result);
    setStatus(`已完成 · ${result.length} 字节`, 'success');
  };
  const executeSm4 = async () => {
    const mode = content.querySelector('#crypto-mode').value;
    if (!['CBC', 'ECB', 'CTR', 'CFB', 'OFB'].includes(mode)) throw new Error(`不支持 SM4-${mode} 模式`);
    const keyEncoding = content.querySelector('#crypto-key-encoding')?.value || 'utf8';
    const ivEncoding = content.querySelector('#crypto-iv-encoding')?.value || 'utf8';
    const keyBytes = cryptoSecretBytesByEncoding(content.querySelector('#crypto-key').value, 'SM4 密钥', [16], keyEncoding);
    const keyValue = bytesToHex(keyBytes);
    const paddingValue = content.querySelector('#crypto-padding').value;
    const ivInput = content.querySelector('#crypto-iv');
    const ivBytes = mode === 'ECB' ? null : cryptoSecretBytesByEncoding(ivInput.value, `SM4-${mode} 的 IV`, [16], ivEncoding);
    if (['CTR', 'CFB', 'OFB'].includes(mode)) {
      if (paddingValue !== 'NONE') throw new Error(`SM4-${mode} 应使用 NoPadding`);
      const source = activeOperation === 'encrypt' ? new TextEncoder().encode(input.value) : parseCryptoBytes(input.value, format.value);
      const result = transformSm4Stream(source, keyValue, ivBytes, mode, activeOperation === 'decrypt');
      output.textContent = activeOperation === 'decrypt' ? new TextDecoder().decode(result) : formatCryptoBytes(result, format.value);
      setStatus(`已完成 · ${result.length} 字节`, 'success');
      return;
    }
    const ivValue = mode === 'CBC' ? bytesToHex(ivBytes) : '';
    const options = { mode: mode.toLowerCase(), padding: paddingValue === 'NONE' ? 'none' : 'pkcs#7', output: 'array' };
    if (mode === 'CBC') options.iv = ivValue;
    if (activeOperation === 'encrypt') {
      const plainBytes = new TextEncoder().encode(input.value);
      if (paddingValue === 'NONE' && plainBytes.length % 16 !== 0) throw new Error('SM4 NoPadding 要求明文长度为 16 字节的整数倍');
      const cipherBytes = Uint8Array.from(sm4Library.encrypt(plainBytes, keyValue, options));
      output.textContent = formatCryptoBytes(cipherBytes, format.value);
      setStatus(`已完成 · ${cipherBytes.length} 字节`, 'success');
      return;
    }
    const cipherBytes = parseCryptoBytes(input.value, format.value);
    if (!cipherBytes.length || cipherBytes.length % 16 !== 0) throw new Error('SM4 密文长度应为 16 字节的整数倍');
    const plainBytes = Uint8Array.from(sm4Library.decrypt(cipherBytes, keyValue, options));
    output.textContent = new TextDecoder().decode(plainBytes);
    setStatus(`已完成 · ${plainBytes.length} 字节`, 'success');
  };
  const executeDes = async () => {
    const mode = content.querySelector('#crypto-mode').value;
    if (!['CBC', 'ECB'].includes(mode)) throw new Error(`不支持 DES-${mode} 模式`);
    const keyBytes = cryptoSecretBytes(content.querySelector('#crypto-key').value, 'DES 密钥', [8]);
    const paddingValue = content.querySelector('#crypto-padding').value;
    const ivInput = content.querySelector('#crypto-iv');
    const iv = mode === 'CBC' ? cryptoBytesToWordArray(cryptoSecretBytes(ivInput.value, 'DES-CBC 的 IV', [8])) : undefined;
    const options = { mode: mode === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB, padding: paddingValue === 'NONE' ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7 };
    if (iv) options.iv = iv;
    const key = cryptoBytesToWordArray(keyBytes);
    if (activeOperation === 'encrypt') {
      const plainBytes = new TextEncoder().encode(input.value);
      if (paddingValue === 'NONE' && plainBytes.length % 8 !== 0) throw new Error('DES NoPadding 要求明文长度为 8 字节的整数倍');
      const encrypted = CryptoJS.DES.encrypt(cryptoBytesToWordArray(plainBytes), key, options);
      const cipherBytes = cryptoWordArrayToBytes(encrypted.ciphertext);
      output.textContent = formatCryptoBytes(cipherBytes, format.value);
      setStatus(`已完成 · ${cipherBytes.length} 字节`, 'success');
      return;
    }
    const cipherBytes = parseCryptoBytes(input.value, format.value);
    if (!cipherBytes.length || cipherBytes.length % 8 !== 0) throw new Error('DES 密文长度应为 8 字节的整数倍');
    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: cryptoBytesToWordArray(cipherBytes) });
    const plainBytes = cryptoWordArrayToBytes(CryptoJS.DES.decrypt(cipherParams, key, options));
    output.textContent = new TextDecoder().decode(plainBytes);
    setStatus(`已完成 · ${plainBytes.length} 字节`, 'success');
  };
  const execute3Des = async () => {
    const mode = content.querySelector('#crypto-mode').value;
    if (!['CBC', 'ECB'].includes(mode)) throw new Error(`3DES-${mode} 暂不支持，请使用 CBC 或 ECB 模式`);
    const keyBytes = cryptoSecretBytes(content.querySelector('#crypto-key').value, '3DES 密钥', [24]);
    const paddingValue = content.querySelector('#crypto-padding').value;
    const ivInput = content.querySelector('#crypto-iv');
    const iv = mode === 'CBC' ? cryptoBytesToWordArray(cryptoSecretBytes(ivInput.value, '3DES-CBC 的 IV', [8])) : undefined;
    const options = { mode: mode === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB, padding: paddingValue === 'NONE' ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7 };
    if (iv) options.iv = iv;
    const key = cryptoBytesToWordArray(keyBytes);
    if (activeOperation === 'encrypt') {
      const plainBytes = new TextEncoder().encode(input.value);
      if (paddingValue === 'NONE' && plainBytes.length % 8 !== 0) throw new Error('3DES NoPadding 要求明文长度为 8 字节的整数倍');
      const encrypted = CryptoJS.TripleDES.encrypt(cryptoBytesToWordArray(plainBytes), key, options);
      const cipherBytes = cryptoWordArrayToBytes(encrypted.ciphertext);
      output.textContent = formatCryptoBytes(cipherBytes, format.value);
      setStatus(`已完成 · ${cipherBytes.length} 字节`, 'success');
      return;
    }
    const cipherBytes = parseCryptoBytes(input.value, format.value);
    if (!cipherBytes.length || cipherBytes.length % 8 !== 0) throw new Error('3DES 密文长度应为 8 字节的整数倍');
    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: cryptoBytesToWordArray(cipherBytes) });
    const plainBytes = cryptoWordArrayToBytes(CryptoJS.TripleDES.decrypt(cipherParams, key, options));
    output.textContent = new TextDecoder().decode(plainBytes);
    setStatus(`已完成 · ${plainBytes.length} 字节`, 'success');
  };
  const executeRsa = async () => {
    const mode = content.querySelector('#crypto-mode').value;
    const hash = content.querySelector('#crypto-rsa-hash')?.value || 'SHA-256';
    if (mode === 'RSAES-PKCS1-v1_5') {
      const cipherText = activeOperation === 'decrypt' ? formatCryptoBytes(parseCryptoBytes(input.value, format.value), 'base64') : '';
      const rsa = new JSEncrypt({ default_key_size: 2048, log: false });
      let result;
      if (activeOperation === 'encrypt') {
        rsa.setPublicKey(content.querySelector('#crypto-rsa-public-key').value.trim());
        result = rsa.encrypt(input.value);
        if (!result) throw new Error('RSAES-PKCS1-v1_5 明文过长或公钥格式不正确');
        const resultBytes = parseCryptoBytes(result, 'base64');
        output.textContent = formatCryptoBytes(resultBytes, format.value);
        setStatus(`已完成 · ${resultBytes.length} 字节`, 'success');
        return;
      }
      rsa.setPrivateKey(rsaPkcs8ToPkcs1Pem(content.querySelector('#crypto-rsa-private-key').value.trim()));
      result = rsa.decrypt(cipherText);
      if (result === false || result == null) throw new Error('RSAES-PKCS1-v1_5 解密失败，请确认私钥和密文匹配');
      const resultBytes = new TextEncoder().encode(result);
      output.textContent = result;
      setStatus(`已完成 · ${resultBytes.length} 字节`, 'success');
      return;
    }
    const algorithm = rsaCryptoAlgorithm(mode, hash);
    if (activeOperation === 'encrypt') {
      const publicKey = await window.crypto.subtle.importKey('spki', pemToBytes(content.querySelector('#crypto-rsa-public-key').value, '公钥'), algorithm, false, ['encrypt']);
      const cipherBytes = new Uint8Array(await window.crypto.subtle.encrypt(algorithm, publicKey, new TextEncoder().encode(input.value)));
      output.textContent = formatCryptoBytes(cipherBytes, format.value);
      setStatus(`已完成 · ${cipherBytes.length} 字节`, 'success');
      return;
    }
    const privateKey = await window.crypto.subtle.importKey('pkcs8', pemToBytes(content.querySelector('#crypto-rsa-private-key').value, '私钥'), algorithm, false, ['decrypt']);
    const plainBytes = new Uint8Array(await window.crypto.subtle.decrypt(algorithm, privateKey, parseCryptoBytes(input.value, format.value)));
    output.textContent = new TextDecoder().decode(plainBytes);
    setStatus(`已完成 · ${plainBytes.length} 字节`, 'success');
  };
  const executeAes = async () => {
    const mode = content.querySelector('#crypto-mode').value;
    if (!['GCM', 'CBC', 'CTR', 'CFB', 'OFB', 'ECB'].includes(mode)) throw new Error(`不支持 AES-${mode} 模式`);
    const keyLength = Number(content.querySelector('#crypto-key-length').value) / 8;
    const key = cryptoSecretBytes(content.querySelector('#crypto-key').value, 'AES 密钥', [keyLength]);
    const padding = content.querySelector('#crypto-padding').value;
    const ivInput = content.querySelector('#crypto-iv');
    if (['CFB', 'OFB', 'ECB'].includes(mode)) {
      const iv = mode === 'ECB' ? undefined : cryptoBytesToWordArray(cryptoSecretBytes(ivInput.value, `AES-${mode} 的 IV`, [16]));
      const options = { mode: CryptoJS.mode[mode], padding: padding === 'NONE' ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7 };
      if (iv) options.iv = iv;
      const cryptoKey = cryptoBytesToWordArray(key);
      if (activeOperation === 'encrypt') {
        const plainBytes = new TextEncoder().encode(input.value);
        if (mode === 'ECB' && padding === 'NONE' && plainBytes.length % 16 !== 0) throw new Error('AES-ECB NoPadding 要求明文长度为 16 字节的整数倍');
        const encrypted = CryptoJS.AES.encrypt(cryptoBytesToWordArray(plainBytes), cryptoKey, options);
        const cipherBytes = cryptoWordArrayToBytes(encrypted.ciphertext);
        output.textContent = formatCryptoBytes(cipherBytes, format.value);
        setStatus(`已完成 · ${cipherBytes.length} 字节`, 'success');
        return;
      }
      const cipherBytes = parseCryptoBytes(input.value, format.value);
      if (!cipherBytes.length || (mode === 'ECB' && cipherBytes.length % 16 !== 0)) throw new Error(`AES-${mode} 密文长度不正确`);
      const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: cryptoBytesToWordArray(cipherBytes) });
      const plainBytes = cryptoWordArrayToBytes(CryptoJS.AES.decrypt(cipherParams, cryptoKey, options));
      output.textContent = new TextDecoder().decode(plainBytes);
      setStatus(`已完成 · ${plainBytes.length} 字节`, 'success');
      return;
    }
    const iv = mode === 'ECB' ? null : cryptoSecretBytes(ivInput.value, `AES-${mode} 的 ${mode === 'GCM' ? 'Nonce' : 'IV'}`, mode === 'GCM' ? [12, 13, 14, 15, 16] : [16]);
    if (mode === 'GCM' && (iv.length < 12 || iv.length > 16)) throw new Error('AES-GCM 的 Nonce 建议使用 12 字节，当前支持 12 至 16 字节');
    if (mode === 'CBC' && iv.length !== 16) throw new Error('AES-CBC 的 IV 应为 16 字节');
    if (mode === 'CTR' && iv.length !== 16) throw new Error('AES-CTR 的计数器应为 16 字节');
    if (mode === 'CBC' && padding !== 'PKCS7') throw new Error('浏览器原生 AES-CBC 仅支持 PKCS#7 填充');
    if (mode !== 'CBC' && padding !== 'NONE') throw new Error(`${mode} 模式应使用 NoPadding`);
    const tagLength = Number(content.querySelector('#crypto-gcm-tag-length')?.value || 128);
    const algorithm = mode === 'GCM' ? { name: 'AES-GCM', iv, tagLength } : mode === 'CTR' ? { name: 'AES-CTR', counter: iv, length: Number(content.querySelector('#crypto-ctr-length').value) } : { name: 'AES-CBC', iv };
    const data = activeOperation === 'encrypt' ? new TextEncoder().encode(input.value) : parseCryptoBytes(input.value, format.value);
    const cryptoKey = await window.crypto.subtle.importKey('raw', key, { name: algorithm.name }, false, [activeOperation]);
    const result = new Uint8Array(await window.crypto.subtle[activeOperation](algorithm, cryptoKey, data));
    output.textContent = activeOperation === 'decrypt' ? new TextDecoder().decode(result) : formatCryptoBytes(result, format.value);
    setStatus(`已完成 · ${result.length} 字节`, 'success');
  };
  const execute = async () => {
    try {
      if (tool.id === 'md5') await executeMd5();
      else if (tool.id === 'sha2') await executeSha2();
      else if (tool.id === 'sha3') await executeSha3();
      else if (tool.id === 'sm3') await executeSm3();
      else if (tool.id === 'sm2') await executeSm2();
      else if (tool.id === 'sm4') await executeSm4();
      else if (tool.id === 'des') await executeDes();
      else if (tool.id === '3des') await execute3Des();
      else if (tool.id === 'rsa') await executeRsa();
      else if (tool.id === 'aes') await executeAes();
      else renderUnavailable();
    } catch (error) {
      output.textContent = `处理失败：${error.message}`;
      setStatus('输入有误', 'error');
    }
  };
  const closeAlgorithmMenu = () => {
    if (!algorithmMenu || !algorithmTrigger) return;
    algorithmMenu.hidden = true;
    algorithmTrigger.setAttribute('aria-expanded', 'false');
  };
  const renderAlgorithmPicker = () => {
    if (!algorithmSelect || !algorithmTrigger || !algorithmMenu) return;
    const selected = getTool(algorithmSelect.value) || tool;
    algorithmTrigger.innerHTML = `${iconMarkup(selected)}<span class="crypto-algorithm-trigger-copy"><b>${selected.name}</b><small>${cryptoAlgorithmDescription(selected)}</small></span><span class="crypto-algorithm-chevron" aria-hidden="true">⌄</span>`;
    algorithmMenu.querySelectorAll('[data-algorithm-option]').forEach((option) => {
      const isSelected = option.dataset.algorithmOption === selected.id;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
    });
  };
  const openAlgorithmMenu = () => {
    if (!algorithmMenu || !algorithmTrigger) return;
    algorithmMenu.hidden = false;
    algorithmTrigger.setAttribute('aria-expanded', 'true');
    algorithmMenu.querySelector(`[data-algorithm-option="${algorithmSelect.value}"]`)?.scrollIntoView({ block: 'nearest' });
  };
  const onAlgorithmDocumentClick = (event) => {
    if (algorithmPicker && !algorithmPicker.contains(event.target)) closeAlgorithmMenu();
  };
  const focusAlgorithmOption = (offset) => {
    if (!algorithmMenu) return;
    const options = [...algorithmMenu.querySelectorAll('[data-algorithm-option]')];
    if (!options.length) return;
    const currentIndex = options.indexOf(document.activeElement);
    const selectedIndex = options.findIndex((option) => option.dataset.algorithmOption === algorithmSelect?.value);
    const baseIndex = currentIndex >= 0 ? currentIndex : selectedIndex >= 0 ? selectedIndex : 0;
    options[(baseIndex + offset + options.length) % options.length].focus();
  };
  const chooseAlgorithmOption = (option) => {
    if (!option || !algorithmSelect) return;
    algorithmSelect.value = option.dataset.algorithmOption;
    algorithmSelect.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const onAlgorithmKeydown = (event) => {
    if (event.key === 'Escape') { closeAlgorithmMenu(); algorithmTrigger?.focus(); return; }
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (algorithmMenu?.hidden) { openAlgorithmMenu(); focusAlgorithmOption(0); }
    }
  };
  const onAlgorithmMenuKeydown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); focusAlgorithmOption(1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); focusAlgorithmOption(-1); }
    if (event.key === 'Escape') { event.preventDefault(); closeAlgorithmMenu(); algorithmTrigger?.focus(); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseAlgorithmOption(event.target.closest('[data-algorithm-option]')); }
  };
  algorithmTrigger?.addEventListener('click', () => {
    if (algorithmMenu?.hidden) openAlgorithmMenu(); else closeAlgorithmMenu();
  });
  algorithmTrigger?.addEventListener('keydown', onAlgorithmKeydown);
  algorithmMenu?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-algorithm-option]');
    chooseAlgorithmOption(option);
  });
  algorithmMenu?.addEventListener('keydown', onAlgorithmMenuKeydown);
  algorithmSelect?.addEventListener('change', (event) => {
    renderAlgorithmPicker();
    closeAlgorithmMenu();
    openTool(event.target.value);
  });
  document.addEventListener('click', onAlgorithmDocumentClick);
  content.querySelector('#crypto-mode')?.addEventListener('change', () => { syncModeOptions(); syncInputHint(); });
  format?.addEventListener('change', syncInputHint);
  if (tool.id === 'sm2') {
    const publicKeyInput = content.querySelector('#crypto-key');
    const privateKeyInput = content.querySelector('#crypto-private-key');
    const publicStatus = content.querySelector('#crypto-sm2-public-status');
    const privateStatus = content.querySelector('#crypto-sm2-private-status');
    const syncSm2KeyState = () => {
      const sync = (inputNode, statusNode, normalizer, validText) => {
        if (!inputNode || !statusNode) return;
        const value = inputNode.value.trim();
        statusNode.className = 'crypto-sm2-key-status';
        if (!value) { statusNode.textContent = '等待输入'; return; }
        try { normalizer(value); statusNode.textContent = `${validText} ✓`; statusNode.classList.add('is-valid'); }
        catch (error) { statusNode.textContent = error.message; statusNode.classList.add('is-invalid'); }
      };
      sync(publicKeyInput, publicStatus, normalizeSm2PublicKey, '公钥合法');
      sync(privateKeyInput, privateStatus, normalizeSm2PrivateKey, '私钥合法');
    };
    const syncSm2Compatibility = () => {
      const der = content.querySelector('#sm2-cipher-der');
      const prefix = content.querySelector('#sm2-cipher-prefix');
      if (!der || !prefix) return;
      prefix.disabled = der.checked;
      if (der.checked) prefix.checked = false;
    };
    publicKeyInput?.addEventListener('input', syncSm2KeyState);
    privateKeyInput?.addEventListener('input', syncSm2KeyState);
    content.querySelector('#sm2-cipher-der')?.addEventListener('change', syncSm2Compatibility);
    content.querySelectorAll('[data-sm2-key-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.sm2KeyAction;
      if (action === 'generate') {
        const pair = sm2Library.generateKeyPairHex();
        publicKeyInput.value = pair.publicKey;
        privateKeyInput.value = pair.privateKey;
        publicKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
        privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
        setStatus('已生成 SM2 密钥对', 'success');
        return;
      }
      if (action === 'derive') {
        try {
          const privateKey = normalizeSm2PrivateKey(privateKeyInput.value);
          publicKeyInput.value = sm2Library.getPublicKeyFromPrivateKey(privateKey);
          publicKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
          setStatus('已由私钥推导公钥', 'success');
        } catch (error) {
          privateStatus.textContent = error.message;
          privateStatus.className = 'crypto-sm2-key-status is-invalid';
          setStatus('输入有误', 'error');
        }
        return;
      }
      const source = action === 'copy-public' ? publicKeyInput : privateKeyInput;
      if (!source.value.trim()) { showToast(`请先输入${action === 'copy-public' ? '公钥' : '私钥'}`); return; }
      copyText(source.value.trim()).then(() => showToast(`${action === 'copy-public' ? '公钥' : '私钥'}已复制`));
    }));
    syncSm2Compatibility();
    syncSm2KeyState();
  }
  if (tool.id === 'sm4') {
    content.querySelector('#crypto-key')?.addEventListener('input', () => syncSecretLength('key'));
    content.querySelector('#crypto-iv')?.addEventListener('input', () => syncSecretLength('iv'));
    content.querySelector('#crypto-key-encoding')?.addEventListener('change', () => syncSecretLength('key'));
    content.querySelector('#crypto-iv-encoding')?.addEventListener('change', () => syncSecretLength('iv'));
    content.querySelectorAll('[data-crypto-random]').forEach((button) => button.addEventListener('click', () => {
      const kind = button.dataset.cryptoRandom;
      const info = secretFieldInfo[kind];
      const inputNode = content.querySelector(info?.input);
      const encodingNode = content.querySelector(info?.encoding);
      if (!inputNode || !encodingNode) return;
      inputNode.value = formatCryptoSecretRandom(encodingNode.value, 16);
      inputNode.dispatchEvent(new Event('input', { bubbles: true }));
      setStatus(`已生成随机${kind === 'key' ? '密钥' : 'IV'}`, 'success');
    }));
  }
  if (tool.id === 'rsa') {
    const publicKeyInput = content.querySelector('#crypto-rsa-public-key');
    const privateKeyInput = content.querySelector('#crypto-rsa-private-key');
    const publicStatus = content.querySelector('#crypto-rsa-public-status');
    const privateStatus = content.querySelector('#crypto-rsa-private-status');
    const syncRsaKeyState = () => {
      const publicValue = publicKeyInput?.value.trim() || '';
      const privateValue = privateKeyInput?.value.trim() || '';
      if (publicStatus) publicStatus.textContent = publicValue ? '已填写' : '等待生成';
      if (privateStatus) privateStatus.textContent = privateValue ? '已填写' : '等待生成';
    };
    const generateRsaKeyPair = async () => {
      const mode = content.querySelector('#crypto-mode').value;
      const hash = content.querySelector('#crypto-rsa-hash')?.value || 'SHA-256';
      if (mode === 'RSAES-PKCS1-v1_5') {
        const rsa = new JSEncrypt({ default_key_size: 2048, log: false });
        await new Promise((resolve, reject) => {
          try { rsa.getKey(resolve); } catch (error) { reject(error); }
        });
        publicKeyInput.value = rsa.getPublicKey();
        privateKeyInput.value = rsaPkcs1ToPkcs8Pem(rsa.getPrivateKey());
        publicKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
        privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
        syncRsaKeyState();
        setStatus('已生成 RSA 密钥对', 'success');
        return;
      }
      const pair = await window.crypto.subtle.generateKey(rsaKeyGenerationAlgorithm(mode, hash), true, ['encrypt', 'decrypt']);
      const [publicBytes, privateBytes] = await Promise.all([window.crypto.subtle.exportKey('spki', pair.publicKey), window.crypto.subtle.exportKey('pkcs8', pair.privateKey)]);
      publicKeyInput.value = bytesToPem(new Uint8Array(publicBytes), 'PUBLIC KEY');
      privateKeyInput.value = bytesToPem(new Uint8Array(privateBytes), 'PRIVATE KEY');
      publicKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
      privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
      syncRsaKeyState();
      setStatus('已生成 RSA 密钥对', 'success');
    };
    publicKeyInput?.addEventListener('input', syncRsaKeyState);
    privateKeyInput?.addEventListener('input', syncRsaKeyState);
    content.querySelectorAll('[data-rsa-key-action]').forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.rsaKeyAction;
      if (action === 'generate') {
        try { await generateRsaKeyPair(); } catch (error) { setStatus(`密钥生成失败：${error.message}`, 'error'); }
        return;
      }
      const source = action === 'copy-public' ? publicKeyInput : privateKeyInput;
      if (!source?.value.trim()) { showToast(`请先输入${action === 'copy-public' ? '公钥' : '私钥'}`); return; }
      copyText(source.value.trim()).then(() => showToast(`${action === 'copy-public' ? '公钥' : '私钥'}已复制`));
    }));
    syncRsaKeyState();
  }
  content.querySelectorAll('[data-tool-action]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.toolAction === 'crypto-clear') { input.value = ''; output.textContent = ''; setStatus('等待执行'); return; }
    if (button.dataset.toolAction === 'copy-crypto-output') { copyText(output.textContent || '').then(() => showToast('结果已复制')); return; }
    if (button.dataset.toolAction === 'crypto-execute') execute();
  }));
  content.querySelectorAll('[data-crypto-operation]').forEach((button) => button.addEventListener('click', () => { setOperation(button.dataset.cryptoOperation); execute(); }));
  content.querySelectorAll('[data-crypto-config-action]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.cryptoConfigAction === 'save') openCryptoConfigSaveModal(tool, content);
    if (button.dataset.cryptoConfigAction === 'history') openCryptoConfigHistoryModal(tool, content);
  }));
  syncModeOptions();
  syncInputHint();
  syncSecretLengths();
  renderAlgorithmPicker();
  if (['md5', 'sha2', 'sha3', 'sm3'].includes(tool.id)) execute();
  if (tool.capability !== 'ready' && !['md5', 'des'].includes(tool.id)) renderUnavailable();
  activeWorkspaceCleanup = () => {
    document.removeEventListener('click', onAlgorithmDocumentClick);
    algorithmMenu?.removeEventListener('keydown', onAlgorithmMenuKeydown);
  };
}

function linuxCommandWorkbenchMarkup() {
  return `<div class="linux-command-workbench" id="linux-command-workbench">
    <div class="linux-command-toolbar">
      <label class="linux-command-search" for="linux-command-search">
        <span class="linux-command-search-icon" aria-hidden="true">⌕</span>
        <input id="linux-command-search" type="search" autocomplete="off" spellcheck="false" placeholder="搜索命令、用途或关键词，例如 grep、端口、权限…" />
        <kbd>/</kbd>
      </label>
      <div class="linux-command-count" aria-live="polite"><strong id="linux-command-count">0</strong><span>条匹配命令</span></div>
    </div>
    <div class="linux-command-layout">
      <aside class="linux-command-categories" aria-label="Linux 命令分类">
        <div class="linux-command-panel-head"><strong>命令分类</strong><span>按场景浏览</span></div>
        <div class="linux-command-category-list" id="linux-command-categories"><span class="linux-command-loading">正在加载分类…</span></div>
      </aside>
      <section class="linux-command-results" aria-label="Linux 命令列表">
        <div class="linux-command-panel-head"><strong id="linux-command-result-title">全部命令</strong><span id="linux-command-result-meta">正在加载</span></div>
        <div class="linux-command-list" id="linux-command-list" role="listbox" aria-label="匹配的 Linux 命令"><span class="linux-command-loading">正在载入命令资料…</span></div>
      </section>
      <section class="linux-command-detail" id="linux-command-detail" aria-label="命令详情" aria-live="polite">
        <div class="linux-command-detail-empty"><span>&gt;_</span><strong>正在准备命令详情</strong><p>命令资料仅在当前设备加载。</p></div>
      </section>
    </div>
  </div>`;
}

async function bindLinuxCommandWorkspace() {
  const content = refs.workspace.querySelector('#workspace-content');
  const workbench = content.querySelector('#linux-command-workbench');
  if (!workbench) return;
  const searchInput = workbench.querySelector('#linux-command-search');
  const categoryList = workbench.querySelector('#linux-command-categories');
  const commandList = workbench.querySelector('#linux-command-list');
  const detail = workbench.querySelector('#linux-command-detail');
  const resultTitle = workbench.querySelector('#linux-command-result-title');
  const resultMeta = workbench.querySelector('#linux-command-result-meta');
  const count = workbench.querySelector('#linux-command-count');
  const commandModule = await import('./linux-commands.data.js');
  if (!workbench.isConnected || state.currentTool?.id !== 'linux-commands') return;

  const categories = commandModule.linuxCommandCategories;
  const commands = commandModule.linuxCommands;
  const commandByName = new Map(commands.map((command) => [command.name, command]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const searchIndex = new Map(commands.map((command) => [command.name, [
    command.name,
    command.summary,
    command.syntax,
    command.description,
    categoryById.get(command.category)?.label || '',
    ...(command.tags || []),
    ...(command.related || []),
    ...(command.options || []).flat(),
    ...(command.examples || []).flatMap((example) => [example.command, example.description]),
  ].join(' ').toLocaleLowerCase('zh-CN')]));
  const riskLabels = {
    safe: { label: '安全', title: '常规命令', fallback: '该命令通常用于只读查询或低风险操作，仍建议在执行前确认参数和目标。' },
    caution: { label: '注意', title: '谨慎操作', fallback: '该命令可能修改文件或系统状态，执行前请核对参数、路径和影响范围。' },
    danger: { label: '高风险', title: '危险操作', fallback: '该命令可能造成服务中断或数据丢失，必须确认环境、权限和恢复方案。' },
  };
  let activeCategory = 'all';
  let activeCommand = 'ls';
  let query = '';
  let visibleCommands = [];
  const getVisibleCommands = () => {
    const tokens = query.toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean);
    return commands
      .filter((command) => activeCategory === 'all' || command.category === activeCategory)
      .filter((command) => tokens.every((token) => searchIndex.get(command.name).includes(token)))
      .sort((left, right) => {
        if (!tokens.length) return left.name.localeCompare(right.name, 'en');
        const leftName = left.name.toLowerCase();
        const rightName = right.name.toLowerCase();
        const rank = (name) => tokens.reduce((score, token) => score + (name === token ? 0 : name.startsWith(token) ? 1 : name.includes(token) ? 2 : 4), 0);
        return rank(leftName) - rank(rightName) || left.name.localeCompare(right.name, 'en');
      });
  };
  const renderCategories = () => {
    categoryList.innerHTML = categories.map((category) => {
      const categoryCount = category.id === 'all' ? commands.length : commands.filter((command) => command.category === category.id).length;
      return `<button class="linux-command-category ${category.id === activeCategory ? 'is-active' : ''}" type="button" data-linux-category="${category.id}" aria-pressed="${category.id === activeCategory}">
        <span class="linux-command-category-icon">${escapeHtml(category.icon)}</span>
        <span class="linux-command-category-copy"><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(category.description)}</small></span>
        <span class="linux-command-category-count">${categoryCount}</span>
      </button>`;
    }).join('');
  };
  const renderCommandList = () => {
    const category = categoryById.get(activeCategory) || categories[0];
    resultTitle.textContent = query ? `“${query}” 的结果` : category.label;
    resultMeta.textContent = `${visibleCommands.length} / ${activeCategory === 'all' ? commands.length : commands.filter((command) => command.category === activeCategory).length}`;
    count.textContent = String(visibleCommands.length);
    if (!visibleCommands.length) {
      commandList.innerHTML = `<div class="linux-command-empty"><span>⌕</span><strong>没有找到匹配命令</strong><p>尝试命令名、用途或中文关键词。</p><button class="secondary-button compact" type="button" data-linux-action="clear-search">清空搜索</button></div>`;
      return;
    }
    commandList.innerHTML = visibleCommands.map((command) => `<button class="linux-command-item ${command.name === activeCommand ? 'is-active' : ''}" type="button" role="option" aria-selected="${command.name === activeCommand}" data-linux-command="${escapeHtml(command.name)}">
      <span class="linux-command-item-main"><code>${escapeHtml(command.name)}</code><span>${escapeHtml(command.summary)}</span></span>
      <span class="linux-command-item-risk is-${command.risk}">${riskLabels[command.risk]?.label || '注意'}</span>
    </button>`).join('');
  };
  const renderDetail = () => {
    const command = commandByName.get(activeCommand);
    if (!command || !visibleCommands.some((item) => item.name === command.name)) {
      detail.innerHTML = `<div class="linux-command-detail-empty"><span>⌕</span><strong>没有可显示的命令</strong><p>调整分类或搜索条件后查看命令详情。</p></div>`;
      return;
    }
    const category = categoryById.get(command.category);
    const risk = riskLabels[command.risk] || riskLabels.caution;
    const optionsMarkup = command.options?.length
      ? `<div class="linux-command-section"><div class="linux-command-section-title"><strong>常用参数</strong><span>${command.options.length} 项</span></div><div class="linux-command-option-list">${command.options.map(([option, description]) => `<div class="linux-command-option"><code>${escapeHtml(option)}</code><span>${escapeHtml(description)}</span></div>`).join('')}</div></div>`
      : '';
    const examplesMarkup = command.examples?.length
      ? `<div class="linux-command-section"><div class="linux-command-section-title"><strong>使用示例</strong><span>点击复制后在终端中确认再执行</span></div><div class="linux-command-example-list">${command.examples.map((example) => `<div class="linux-command-example"><div><span>${escapeHtml(example.description)}</span><button type="button" data-linux-copy="${escapeHtml(example.command)}" title="复制命令示例">复制</button></div><code>${escapeHtml(example.command)}</code></div>`).join('')}</div></div>`
      : '';
    const relatedMarkup = command.related?.length
      ? `<div class="linux-command-section"><div class="linux-command-section-title"><strong>相关命令</strong><span>继续查阅</span></div><div class="linux-command-related">${command.related.map((name) => `<button type="button" data-linux-related="${escapeHtml(name)}" ${commandByName.has(name) ? '' : 'disabled'}>${escapeHtml(name)}</button>`).join('')}</div></div>`
      : '';
    detail.innerHTML = `<div class="linux-command-detail-head">
      <div class="linux-command-detail-heading"><span class="linux-command-prompt" aria-hidden="true">$</span><div><div class="linux-command-detail-meta"><span>${escapeHtml(category?.label || '')}</span><span class="linux-command-risk-badge is-${command.risk}">${risk.label}</span></div><h2>${escapeHtml(command.name)}</h2><p>${escapeHtml(command.summary)}</p></div></div>
      <div class="linux-command-tags">${(command.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    </div>
    <div class="linux-command-section linux-command-overview">
      <div class="linux-command-syntax-head"><strong>基础语法</strong><button type="button" data-linux-copy="${escapeHtml(command.syntax)}" title="复制基础语法">复制语法</button></div>
      <code class="linux-command-syntax">${escapeHtml(command.syntax)}</code>
      <p>${escapeHtml(command.description)}</p>
    </div>
    <div class="linux-command-risk-note is-${command.risk}"><span>${risk.label === '安全' ? '✓' : risk.label === '注意' ? '!' : '!!'}</span><div><strong>${risk.title}</strong><p>${escapeHtml(command.riskNote || risk.fallback)}</p></div></div>
    ${optionsMarkup}${examplesMarkup}${relatedMarkup}`;
  };
  const render = () => {
    visibleCommands = getVisibleCommands();
    if (!visibleCommands.some((command) => command.name === activeCommand)) activeCommand = visibleCommands[0]?.name || '';
    renderCategories();
    renderCommandList();
    renderDetail();
  };
  const selectCommandByOffset = (offset) => {
    if (!visibleCommands.length) return;
    const currentIndex = Math.max(0, visibleCommands.findIndex((command) => command.name === activeCommand));
    activeCommand = visibleCommands[Math.min(visibleCommands.length - 1, Math.max(0, currentIndex + offset))].name;
    renderCommandList();
    renderDetail();
    requestAnimationFrame(() => commandList.querySelector(`[data-linux-command="${CSS.escape(activeCommand)}"]`)?.scrollIntoView({ block: 'nearest' }));
  };
  const onWorkbenchClick = (event) => {
    const categoryButton = event.target.closest('[data-linux-category]');
    if (categoryButton) {
      activeCategory = categoryButton.dataset.linuxCategory;
      render();
      return;
    }
    const commandButton = event.target.closest('[data-linux-command]');
    if (commandButton) {
      activeCommand = commandButton.dataset.linuxCommand;
      renderCommandList();
      renderDetail();
      return;
    }
    const copyButton = event.target.closest('[data-linux-copy]');
    if (copyButton) {
      copyText(copyButton.dataset.linuxCopy).then(() => showToast('命令已复制'));
      return;
    }
    const relatedButton = event.target.closest('[data-linux-related]');
    if (relatedButton && !relatedButton.disabled) {
      const relatedCommand = commandByName.get(relatedButton.dataset.linuxRelated);
      if (!relatedCommand) return;
      activeCategory = relatedCommand.category;
      activeCommand = relatedCommand.name;
      query = '';
      searchInput.value = '';
      render();
      return;
    }
    if (event.target.closest('[data-linux-action="clear-search"]')) {
      query = '';
      searchInput.value = '';
      render();
      searchInput.focus();
    }
  };
  const onSearchInput = () => {
    query = searchInput.value.trim();
    render();
  };
  const onSearchKeydown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectCommandByOffset(event.key === 'ArrowDown' ? 1 : -1);
    }
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      query = '';
      searchInput.value = '';
      render();
    }
  };
  const onDocumentKeydown = (event) => {
    const targetTag = event.target instanceof HTMLElement ? event.target.tagName : '';
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) {
      event.preventDefault();
      searchInput.focus();
    }
  };

  workbench.addEventListener('click', onWorkbenchClick);
  searchInput.addEventListener('input', onSearchInput);
  searchInput.addEventListener('keydown', onSearchKeydown);
  document.addEventListener('keydown', onDocumentKeydown);
  render();
  activeWorkspaceCleanup = () => document.removeEventListener('keydown', onDocumentKeydown);
}

function bindWorkspace(tool) {
  if (tool.category === 'crypto') { bindCryptoWorkspace(tool); return; }
  if (tool.id === 'json-to-types') { bindJsonTypesWorkspace(); return; }
  if (tool.id === 'time') { bindTimeWorkspace(); return; }
  if (tool.id === 'color') { bindColorWorkspace(); return; }
  if (tool.id === 'gradient') { bindGradientWorkspace(); return; }
  if (tool.id === 'shadow') { bindShadowWorkspace(); return; }
  if (tool.id === 'contrast') { bindContrastWorkspace(); return; }
  if (tool.id === 'palette') { bindPaletteWorkspace(); return; }
  if (tool.id === 'px-rem') { bindPxRemWorkspace(); return; }
  if (tool.id === 'jwt') { bindJwtWorkspace(); return; }
  if (tool.id === 'timezone') { bindTimezoneWorkspace(); return; }
  if (tool.id === 'date-calculator') { bindDateCalculatorWorkspace(); return; }
  if (tool.id === 'world-clock') { bindWorldClockWorkspace(); return; }
  if (tool.id === 'text-counter') { bindTextCounterWorkspace(); return; }
  if (tool.id === 'case-converter') { bindCaseConverterWorkspace(); return; }
  if (tool.id === 'text-replace') { bindTextReplaceWorkspace(); return; }
  if (tool.id === 'text-cleaner') { bindTextCleanerWorkspace(); return; }
  if (tool.id === 'line-tools') { bindLineToolsWorkspace(); return; }
  if (tool.id === 'invisible') { bindInvisibleWorkspace(); return; }
  if (tool.id === 'random') { bindRandomWorkspace(); return; }
  if (tool.id === 'password') { bindPasswordWorkspace(); return; }
  if (tool.id === 'uuid-generator') { bindUuidGeneratorWorkspace(); return; }
  if (tool.id === 'string-generator') { bindRandomStringWorkspace(); return; }
  if (tool.id === 'slug') { bindSlugWorkspace(); return; }
  if (tool.id === 'fake-data') { bindFakeDataWorkspace(); return; }
  if (tool.id === 'ip') { bindIpWorkspace(); return; }
  if (tool.id === 'message-queue') { bindMessageQueueWorkspace(); return; }
  if (tool.id === 'linux-commands') { bindLinuxCommandWorkspace().catch((error) => {
    const detail = refs.workspace.querySelector('#linux-command-detail');
    if (detail) detail.innerHTML = `<div class="linux-command-detail-empty is-error"><span>!</span><strong>命令资料加载失败</strong><p>${escapeHtml(error.message)}</p></div>`;
    showToast(`Linux 命令资料加载失败：${error.message}`);
  }); return; }
  if (tool.id === 'curl') { bindCurlWorkspace(); return; }
  if (tool.id === 'html') { bindHtmlWorkspace(); return; }
  if (tool.id === 'xml-format') { bindXmlFormatWorkspace(); return; }
  if (tool.id === 'xml-converter') { bindXmlConverterWorkspace(); return; }
  if (tool.id === 'sql-format') { bindSqlFormatWorkspace(); return; }
  if (tool.id === 'mermaid') { bindMermaidWorkspace(); return; }
  if (tool.id === 'markdown-image') { bindMarkdownImageWorkspace(); return; }
  if (tool.id === 'markdown-editor') { bindMarkdownEditorWorkspace(); return; }
  if (tool.id === 'mindmap') { bindMindmapWorkspace(); return; }
  if (tool.id === 'image-tools') { bindImageToolsWorkspace(); return; }
  if (tool.id === 'qr-barcode') { bindQrBarcodeWorkspace(); return; }
  if (tool.id === 'favicon') { bindFaviconWorkspace(); return; }
  if (tool.id === 'pdf-tools') { bindPdfToolsWorkspace(); return; }
  if (tool.id === 'diff') { bindDiffWorkspace(); return; }
  if (tool.id === 'cron') { bindCronWorkspace(); return; }
  const content = refs.workspace.querySelector('#workspace-content');
  const input = content.querySelector('#tool-input');
  const output = content.querySelector('#tool-output');
  const renderOutput = (value, status = '已完成') => { if (output) output.textContent = value; content.querySelector('#tool-status')?.replaceChildren(document.createTextNode(status)); };
  const execute = async (action) => {
    try {
      if (tool.id === 'base64') {
        const value = input?.value || '';
        renderOutput(action === 'base64-decode' ? decodeBase64(value) : encodeBase64(value));
      } else if (tool.id === 'url') {
        const value = input?.value || '';
        renderOutput(action === 'url-decode' ? safeUrlDecode(value) : encodeURIComponent(value));
      } else if (tool.id === 'unicode') {
        const value = input?.value || '';
        renderOutput(action === 'unicode-decode' ? decodeUnicode(value) : encodeUnicode(value));
      } else if (tool.id === 'regex') {
        renderRegex();
      } else if (tool.id === 'hash') {
        await renderHash();
      }
    } catch (error) {
      renderOutput(`处理失败：${error.message}`, '输入有误');
    }
  };
  const renderRegex = () => {
    try {
      const pattern = content.querySelector('#regex-pattern').value;
      const matches = [...input.value.matchAll(new RegExp(pattern, 'g'))];
      renderOutput(matches.length ? matches.map((match, index) => `${index + 1}. ${match[0]}（位置 ${match.index}）`).join('\n') : '没有匹配结果', matches.length ? `匹配 ${matches.length} 处` : '无匹配');
    } catch (error) {
      renderOutput(`正则表达式错误：${error.message}`, '输入有误');
    }
  };
  const renderHash = async () => {
    const value = input?.value || '';
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    const hash = [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    content.querySelector('#hash-result').innerHTML = `<div class="result-line"><span>SHA-256</span><code>${hash}</code></div><div class="result-line"><span>字符数</span><code>${value.length}</code></div>`;
  };
  content.querySelectorAll('[data-tool-action]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.toolAction === 'copy-output') { copyText(output?.textContent || '').then(() => showToast('结果已复制')); return; }
    execute(button.dataset.toolAction);
  }));
  input?.addEventListener('input', () => { if (['base64', 'url', 'unicode', 'regex'].includes(tool.id)) execute(tool.id === 'base64' ? 'base64-encode' : tool.id === 'url' ? 'url-encode' : tool.id === 'unicode' ? 'unicode-encode' : 'regex'); });
  if (tool.id === 'regex') {
    const patternInput = content.querySelector('#regex-pattern');
    const presetButtons = [...content.querySelectorAll('[data-regex-preset]')];
    const updateActivePreset = () => {
      const activePreset = regexPresets.find((preset) => preset.pattern === patternInput?.value);
      presetButtons.forEach((button) => {
        const isActive = button.dataset.regexPreset === activePreset?.id;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    };
    patternInput?.addEventListener('input', () => {
      renderRegex();
      updateActivePreset();
    });
    presetButtons.forEach((button) => button.addEventListener('click', () => {
      const preset = regexPresets.find((item) => item.id === button.dataset.regexPreset);
      if (!preset || !patternInput) return;
      patternInput.value = preset.pattern;
      patternInput.dispatchEvent(new Event('input', { bubbles: true }));
      patternInput.focus();
    }));
    updateActivePreset();
  }
  if (tool.id === 'hash') execute('hash');
  if (tool.id === 'base64') execute('base64-encode');
  if (tool.id === 'url') execute('url-encode');
  if (tool.id === 'unicode') execute('unicode-encode');
}

function encodeBase64(value) { return btoa(unescape(encodeURIComponent(value))); }
function decodeBase64(value) { return decodeURIComponent(escape(atob(value))); }
function safeUrlDecode(value) { try { return decodeURIComponent(value); } catch (error) { return `无法解码：${error.message}`; } }

function initJsonWorkbench() {
  const input = document.querySelector('#json-input');
  if (!input) return;
  input.value = state.json.draft;
  input.addEventListener('input', () => {
    state.json.draft = input.value;
    state.json.extracted = null;
    persistJsonPreferences();
    parseJsonInput();
  });
  ['click', 'keyup', 'select'].forEach((eventName) => input.addEventListener(eventName, renderJsonEditor));
  input.addEventListener('scroll', syncJsonScroll);
  document.querySelector('#json-sort-select')?.addEventListener('change', (event) => {
    state.json.sort = event.target.value;
    persistJsonPreferences();
    if (state.json.valid) {
      const sorted = sortJsonValue(state.json.value, state.json.sort);
      input.value = JSON.stringify(sorted, null, 2);
      state.json.draft = input.value;
      parseJsonInput();
      showToast(state.json.sort === 'default' ? '已恢复原始顺序' : `已按键名${state.json.sort === 'asc' ? '升序' : '降序'}排序`);
    } else {
      renderJsonStatus();
    }
  });
  parseJsonInput();
}

function parseJsonInput() {
  const input = document.querySelector('#json-input');
  if (!input) return;
  const started = performance.now();
  const source = input.value;
  state.json.draft = source;
  try {
    state.json.value = JSON.parse(source);
    state.json.valid = true;
    state.json.error = null;
    state.json.elapsed = performance.now() - started;
    if (!state.json.expanded.size) state.json.expanded.add('[]');
  } catch (error) {
    state.json.value = null;
    state.json.valid = false;
    state.json.error = jsonErrorDetails(error, source);
    state.json.elapsed = performance.now() - started;
  }
  renderJsonEditor();
  renderJsonStatus();
  renderJsonResult();
}

function jsonErrorDetails(error, source) {
  const message = error?.message || 'JSON 格式错误';
  const match = message.match(/position\s+(\d+)/i);
  const offset = match ? Number(match[1]) : source.length;
  const before = source.slice(0, offset);
  return { message: message.replace(/\s+at position\s+\d+/i, ''), offset, line: before.split('\n').length, column: offset - before.lastIndexOf('\n'), preview: source.slice(Math.max(0, offset - 18), Math.min(source.length, offset + 18)) };
}

function renderJsonEditor() {
  const input = document.querySelector('#json-input');
  const numbers = document.querySelector('#json-line-numbers');
  const highlight = document.querySelector('#json-highlight');
  if (!input || !numbers || !highlight) return;
  const source = input.value || '';
  const currentLine = source.slice(0, input.selectionStart || 0).split('\n').length - 1;
  const lines = source.split('\n');
  numbers.innerHTML = lines.map((line, index) => `<span class="json-line-number ${index === currentLine ? 'is-current' : ''}">${index + 1}</span>`).join('');
  highlight.innerHTML = lines.map((line, index) => `<span class="json-code-line ${index === currentLine ? 'is-current' : ''}">${highlightJsonLine(line) || ' '}</span>`).join('\n');
  syncJsonScroll();
}

function syncJsonScroll() {
  const input = document.querySelector('#json-input');
  const numbers = document.querySelector('#json-line-numbers');
  const highlight = document.querySelector('#json-highlight');
  if (!input || !numbers || !highlight) return;
  numbers.style.transform = `translateY(${-input.scrollTop}px)`;
  highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
}

function highlightJsonLine(line) {
  const tokenPattern = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b/g;
  let result = '';
  let cursor = 0;
  for (const match of line.matchAll(tokenPattern)) {
    result += escapeHtml(line.slice(cursor, match.index));
    const token = match[0];
    const type = token.startsWith('"') ? (/\s*:$/.test(line.slice(match.index + token.length)) ? 'key' : 'string') : token === 'true' || token === 'false' ? 'boolean' : token === 'null' ? 'null' : 'number';
    result += `<span class="json-token-${type}">${escapeHtml(token)}</span>`;
    cursor = match.index + token.length;
  }
  return result + escapeHtml(line.slice(cursor));
}

function renderJsonStatus() {
  const strip = document.querySelector('#json-status-strip');
  const text = document.querySelector('#json-status-text');
  const meta = document.querySelector('#json-status-meta');
  const error = document.querySelector('#json-error');
  if (!strip || !text || !meta || !error) return;
  strip.classList.toggle('is-error', !state.json.valid);
  strip.classList.toggle('is-valid', state.json.valid);
  if (state.json.valid) {
    const metrics = jsonMetrics(state.json.value);
    text.textContent = 'JSON 有效，解析完成';
    meta.textContent = `${metrics.nodes} 个节点 · ${metrics.depth} 层 · ${state.json.elapsed.toFixed(1)} ms · 本地解析`;
    error.hidden = true;
    error.innerHTML = '';
  } else {
    text.textContent = state.json.jsonLint ? 'JSON 校验失败' : 'JSON 格式错误';
    meta.textContent = '请根据行号和列号修正输入';
    const details = state.json.error || { line: 1, column: 1, message: '请输入 JSON 数据' };
    error.hidden = false;
    error.innerHTML = `<span class="json-error-icon">!</span><span>第 ${details.line} 行，第 ${details.column} 列：${escapeHtml(details.message)}</span>`;
  }
}

function renderJsonResult() {
  const body = document.querySelector('#json-result-body');
  const caption = document.querySelector('#json-result-caption');
  if (!body || !caption) return;
  if (!state.json.valid) {
    caption.textContent = '等待有效 JSON';
    body.innerHTML = `<div class="json-empty-result"><div class="json-empty-icon">{ }</div><strong>输入有效 JSON 后显示解析结果</strong><span>支持折叠、选择、提取和节点编辑</span></div>`;
    renderJsonExtract();
    return;
  }
  const viewLabels = { tree: 'JSON 树视图', table: '表格视图', metadata: '元数据视图' };
  caption.textContent = viewLabels[state.json.outputView];
  if (state.json.outputView === 'table') body.innerHTML = renderJsonTable(state.json.value);
  else if (state.json.outputView === 'metadata') body.innerHTML = renderJsonMetadata(state.json.value);
  else body.innerHTML = `<div class="json-tree" id="json-tree">${renderJsonNode(state.json.value, [], null, 0)}</div>`;
  renderJsonExtract();
}

function renderJsonNode(value, path, key, depth, options = {}) {
  const type = jsonType(value);
  const isContainer = type === 'object' || type === 'array';
  const encoded = encodePath(path);
  const selected = !options.nested && pathKey(path) === pathKey(state.json.selectedPath);
  const expanded = isContainer && (state.json.expanded.has(pathKey(path)) || depth === 0);
  const label = key === null ? '根节点' : String(key);
  const size = isContainer ? type === 'array' ? value.length : Object.keys(value).length : '';
  const nested = !options.nested && state.json.nestedParse && type === 'string' ? parseNestedJson(value) : null;
  let html = `<div class="json-node ${selected ? 'is-selected' : ''} ${options.nested ? 'is-nested' : ''}" data-path="${encoded}" style="--node-depth:${depth}"><div class="json-tree-row ${isContainer ? 'is-container' : ''}" data-json-action="select-node" data-path="${encoded}">`;
  if (isContainer) html += `<button class="json-expander" type="button" data-json-action="toggle-node" data-path="${encoded}" aria-label="${expanded ? '折叠' : '展开'}${label}">${expanded ? '▾' : '▸'}</button>`;
  else html += '<span class="json-expander-placeholder"></span>';
  html += `<span class="json-tree-key ${key === null ? 'is-root' : ''}">${escapeHtml(label)}</span><span class="json-tree-colon">:</span>`;
  if (isContainer) html += `<span class="json-tree-type ${type}">${type === 'array' ? `[${size}]` : `{${size}}`}</span>`;
  else html += `<button class="json-tree-value json-value-${type}" type="button" data-json-action="select-node" data-path="${encoded}">${jsonValueMarkup(value)}</button>`;
  if (nested) html += '<span class="json-nested-badge">JSON</span>';
  if (state.json.nodeEdit) html += `<button class="json-node-edit" type="button" data-json-action="edit-node" data-path="${encoded}" title="编辑节点">✎</button>`;
  html += '</div>';
  if (isContainer && expanded) {
    const entries = type === 'array' ? value.map((item, index) => [index, item]) : Object.entries(value);
    if (entries.length) html += `<div class="json-tree-children">${entries.map(([childKey, childValue]) => renderJsonNode(childValue, [...path, childKey], childKey, depth + 1)).join('')}</div>`;
    else html += '<div class="json-tree-empty">空容器</div>';
  }
  if (nested) html += `<div class="json-nested-preview"><span>嵌套 JSON</span><pre>${escapeHtml(JSON.stringify(nested, null, 2))}</pre></div>`;
  return html + '</div>';
}

function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value === 'object' ? 'object' : typeof value;
}

function jsonValueMarkup(value) {
  if (typeof value === 'string') {
    const decoded = state.json.autoDecode ? decodeAutoString(value) : value;
    return `<span>${escapeHtml(`"${decoded}"`)}</span>${decoded !== value ? '<em class="json-decoded-badge">已解码</em>' : ''}`;
  }
  return escapeHtml(String(value));
}

function decodeAutoString(value) {
  let result = value.replace(/\\u([0-9a-fA-F]{4})/g, (all, code) => String.fromCharCode(parseInt(code, 16)));
  if (/%[0-9a-fA-F]{2}/.test(result)) result = safeUrlDecode(result);
  return result;
}

function parseNestedJson(value) {
  const text = value.trim();
  if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) ) return null;
  try { return JSON.parse(text); } catch (error) { return null; }
}

function renderJsonTable(value) {
  if (Array.isArray(value)) {
    if (!value.length) return '<div class="json-empty-result"><strong>数组为空</strong><span>没有可展示的行</span></div>';
    const objects = value.every((item) => item && typeof item === 'object' && !Array.isArray(item));
    if (objects) {
      const columns = [...new Set(value.flatMap((item) => Object.keys(item)))];
      return `<div class="json-table-wrap"><table class="json-table"><thead><tr><th>#</th>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${value.map((item, index) => `<tr><td>${index + 1}</td>${columns.map((column) => `<td>${tableValueMarkup(item[column])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    return `<div class="json-table-wrap"><table class="json-table"><thead><tr><th>#</th><th>值</th><th>类型</th></tr></thead><tbody>${value.map((item, index) => `<tr><td>${index + 1}</td><td>${tableValueMarkup(item)}</td><td><span class="json-type-chip ${jsonType(item)}">${jsonType(item)}</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  if (value && typeof value === 'object') return `<div class="json-table-wrap"><table class="json-table"><thead><tr><th>键</th><th>值</th><th>类型</th></tr></thead><tbody>${Object.entries(value).map(([key, item]) => `<tr><td class="json-table-key">${escapeHtml(key)}</td><td>${tableValueMarkup(item)}</td><td><span class="json-type-chip ${jsonType(item)}">${jsonType(item)}</span></td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="json-table-wrap"><table class="json-table"><thead><tr><th>值</th><th>类型</th></tr></thead><tbody><tr><td>${tableValueMarkup(value)}</td><td>${jsonType(value)}</td></tr></tbody></table></div>`;
}

function tableValueMarkup(value) { return `<code class="json-value-${jsonType(value)}">${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : String(value))}</code>`; }

function renderJsonMetadata(value) {
  const metrics = jsonMetrics(value);
  const entries = [['根类型', jsonType(value)], ['节点总数', metrics.nodes], ['对象键数量', metrics.keys], ['数组元素数量', metrics.items], ['最大深度', metrics.depth], ['文本大小', `${new Blob([JSON.stringify(value)]).size} B`], ['解析耗时', `${state.json.elapsed.toFixed(1)} ms`]];
  return `<div class="json-metadata-grid">${entries.map(([label, item]) => `<div class="json-metadata-card"><span>${label}</span><strong>${escapeHtml(item)}</strong></div>`).join('')}</div><div class="json-metadata-note"><span class="json-status-dot"></span>数据只在当前浏览器内处理，未发送到服务器。</div>`;
}

function jsonMetrics(value) {
  let nodes = 0;
  let keys = 0;
  let items = 0;
  let depth = 0;
  const visit = (current, level) => {
    nodes += 1;
    depth = Math.max(depth, level);
    if (Array.isArray(current)) { items += current.length; current.forEach((item) => visit(item, level + 1)); }
    else if (current && typeof current === 'object') { keys += Object.keys(current).length; Object.values(current).forEach((item) => visit(item, level + 1)); }
  };
  visit(value, 0);
  return { nodes, keys, items, depth };
}

function renderJsonExtract() {
  const panel = document.querySelector('#json-extract-panel');
  if (!panel) return;
  if (!state.json.extracted) { panel.hidden = true; panel.innerHTML = ''; return; }
  const { path, value } = state.json.extracted;
  panel.hidden = false;
  panel.innerHTML = `<div><strong>已提取节点</strong><span>${escapeHtml(path.length ? path.join(' / ') : '根节点')}</span><button type="button" data-json-action="close-extract">×</button></div><pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function sortJsonValue(value, mode) {
  if (mode === 'default') return value;
  if (Array.isArray(value)) return value.map((item) => sortJsonValue(item, mode));
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort((a, b) => mode === 'asc' ? a.localeCompare(b, 'zh-CN') : b.localeCompare(a, 'zh-CN')).reduce((result, key) => { result[key] = sortJsonValue(value[key], mode); return result; }, {});
}

function updateJsonText(nextText) {
  const input = document.querySelector('#json-input');
  if (!input) return;
  input.value = nextText;
  state.json.draft = nextText;
  state.json.extracted = null;
  persistJsonPreferences();
  parseJsonInput();
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function saveJsonNode(path, rawValue) {
  const oldValue = getValueAtPath(state.json.value, path);
  let nextValue;
  try {
    if (typeof oldValue === 'string') nextValue = rawValue;
    else nextValue = JSON.parse(rawValue);
    updateJsonText(JSON.stringify(setValueAtPath(state.json.value, path, nextValue), null, 2));
    state.json.selectedPath = path;
    showToast('节点已更新');
  } catch (error) {
    showToast('节点值格式不正确');
  }
}

function startJsonNodeEdit(target) {
  if (!state.json.nodeEdit || !state.json.valid) return;
  const path = decodePath(target.dataset.path);
  const value = getValueAtPath(state.json.value, path);
  const row = target.closest('.json-tree-row');
  if (!row || row.querySelector('.json-inline-editor')) return;
  const editor = document.createElement('div');
  editor.className = 'json-inline-editor';
  editor.innerHTML = '<input type="text" aria-label="编辑节点值"><button type="button" data-json-edit="save">保存</button><button type="button" data-json-edit="cancel">取消</button>';
  const input = editor.querySelector('input');
  input.value = typeof value === 'string' ? value : JSON.stringify(value);
  row.appendChild(editor);
  row.classList.add('is-editing');
  input.focus();
  input.select();
  const save = () => { if (!row.isConnected) return; saveJsonNode(path, input.value); };
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); save(); } if (event.key === 'Escape') { event.preventDefault(); renderJsonResult(); } });
  editor.querySelector('[data-json-edit="save"]').addEventListener('click', save);
  editor.querySelector('[data-json-edit="cancel"]').addEventListener('click', () => renderJsonResult());
}

function toggleJsonNode(path) {
  const key = pathKey(path);
  if (state.json.expanded.has(key)) state.json.expanded.delete(key); else state.json.expanded.add(key);
  persistJsonPreferences();
  renderJsonResult();
}

function setJsonOutputView(view) {
  if (view === 'collapse') {
    state.json.expanded = new Set(['[]']);
    persistJsonPreferences();
    renderJsonResult();
    showToast('已折叠全部节点');
    return;
  }
  state.json.outputView = view;
  renderJsonResult();
}

function encodeUnicode(value) {
  return [...value].map((char) => { const code = char.codePointAt(0); return code > 127 ? [...char].map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`).join('') : char; }).join('');
}
function decodeUnicode(value) { return value.replace(/\\u([0-9a-fA-F]{4})/g, (all, code) => String.fromCharCode(parseInt(code, 16))); }

function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const helper = document.createElement('textarea');
  helper.value = value;
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
  return Promise.resolve();
}

function downloadJson() {
  if (!state.json.valid) { showToast('请先输入有效 JSON'); return; }
  const blob = new Blob([JSON.stringify(sortJsonValue(state.json.value, state.json.sort), null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'byetools-json.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('JSON 文件已下载');
}

function handleJsonAction(target) {
  const action = target.dataset.jsonAction;
  if (!action) return false;
  if (action === 'format' || action === 'minify') {
    if (!state.json.valid) { showToast('请先修正 JSON 格式'); return true; }
    const value = sortJsonValue(state.json.value, state.json.sort);
    updateJsonText(JSON.stringify(value, null, action === 'format' ? 2 : 0));
    showToast(action === 'format' ? 'JSON 已格式化' : 'JSON 已压缩');
  } else if (action === 'layout') {
    state.json.layout = target.dataset.layout;
    document.querySelector('#json-layout')?.classList.toggle('is-stack', state.json.layout === 'stack');
    document.querySelectorAll('[data-json-action="layout"]').forEach((node) => node.classList.toggle('is-active', node.dataset.layout === state.json.layout));
    persistJsonPreferences();
  } else if (action === 'toggle') {
    const key = target.dataset.jsonKey;
    state.json[key] = !state.json[key];
    target.classList.toggle('is-on', state.json[key]);
    target.setAttribute('aria-pressed', String(state.json[key]));
    persistJsonPreferences();
    if (key === 'jsonLint') renderJsonStatus();
    if (key === 'autoDecode' || key === 'nodeEdit' || key === 'nestedParse') renderJsonResult();
  } else if (action === 'unicode-encode') {
    updateJsonText(encodeUnicode(document.querySelector('#json-input')?.value || ''));
    showToast('已完成 Uni 编码');
  } else if (action === 'unicode-decode') {
    updateJsonText(decodeUnicode(document.querySelector('#json-input')?.value || ''));
    showToast('已完成 Uni 解码');
  } else if (action === 'url-decode') {
    updateJsonText(safeUrlDecode(document.querySelector('#json-input')?.value || ''));
    showToast('已完成 URL 解码');
  } else if (action === 'clear-input') {
    updateJsonText('');
  } else if (action === 'select-node') {
    if (target.dataset.path) state.json.selectedPath = decodePath(target.dataset.path);
    renderJsonResult();
  } else if (action === 'toggle-node') {
    toggleJsonNode(decodePath(target.dataset.path));
  } else if (action === 'edit-node') {
    startJsonNodeEdit(target);
  } else if (action === 'tree') {
    setJsonOutputView('tree');
  } else if (action === 'table') {
    setJsonOutputView('table');
  } else if (action === 'metadata') {
    setJsonOutputView('metadata');
  } else if (action === 'collapse') {
    setJsonOutputView('collapse');
  } else if (action === 'copy') {
    if (!state.json.valid) { showToast('请先输入有效 JSON'); return true; }
    const value = state.json.extracted?.value ?? getValueAtPath(state.json.value, state.json.selectedPath);
    copyText(JSON.stringify(value, null, 2)).then(() => showToast(state.json.selectedPath.length ? '已复制选中节点' : '已复制 JSON 结果'));
  } else if (action === 'download') {
    downloadJson();
  } else if (action === 'extract') {
    if (!state.json.valid) { showToast('请先输入有效 JSON'); return true; }
    const path = state.json.selectedPath || [];
    state.json.extracted = { path, value: getValueAtPath(state.json.value, path) };
    renderJsonExtract();
    showToast(`已提取${path.length ? `节点「${path[path.length - 1]}」` : '根节点'}`);
  } else if (action === 'close-extract') {
    state.json.extracted = null;
    renderJsonExtract();
  }
  return true;
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => refs.toast.classList.remove('visible'), 1800);
}

function toggleFavorite(id) {
  let enabled;
  if (state.favorites.has(id)) { state.favorites.delete(id); enabled = false; showToast('已取消收藏'); }
  else { state.favorites.add(id); enabled = true; showToast('已加入收藏'); }
  if (storage) storage.setFavorite(id, enabled).catch((error) => showToast(`收藏保存失败：${error.message}`));
  updateFavoriteCounts();
  renderFeatured();
  renderTools();
  if (state.currentTool?.id === id) { const button = document.querySelector('.workspace-favorite'); button.textContent = state.favorites.has(id) ? '★' : '☆'; button.classList.toggle('is-favorite', state.favorites.has(id)); }
}

function themeModeLabel(mode) { return mode === 'light' ? '浅色' : mode === 'system' ? '跟随系统' : '暗黑'; }
function applyTheme(theme, options = {}) {
  const stored = refs.root.dataset.themeMode || 'dark';
  const mode = ['dark', 'light', 'system'].includes(theme || stored) ? (theme || stored) : 'dark';
  const effective = mode === 'system' && window.matchMedia ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : mode === 'light' ? 'light' : 'dark';
  refs.root.dataset.theme = effective;
  refs.root.dataset.themeMode = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective === 'light' ? '#f8f9fc' : '#080a0d');
  if (storage && options.persist !== false) storage.setSetting('theme-mode', mode).catch((error) => showToast(`主题保存失败：${error.message}`));
  document.querySelectorAll('[data-theme-choice]').forEach((node) => node.classList.toggle('active', node.dataset.themeChoice === mode));
  const current = document.querySelector('#theme-current-label');
  if (current) current.textContent = themeModeLabel(mode);
}
function cycleTheme() { applyTheme(refs.root.dataset.theme === 'light' ? 'dark' : 'light'); showToast(refs.root.dataset.theme === 'light' ? '已切换为浅色主题' : '已切换为暗黑主题'); }
function menuLayoutLabel(layout) { return layout === 'compact' ? '紧凑' : layout === 'icon' ? '图标' : '标准'; }
function densityLabel(density) { return density === 'compact' ? '紧凑' : '舒适'; }
function applyMenuLayout(layout, options = {}) {
  const value = ['standard', 'compact', 'icon'].includes(layout) ? layout : 'standard';
  refs.root.dataset.menuLayout = value;
  if (storage && options.persist !== false) storage.setSetting('menu-layout', value).catch((error) => showToast(`菜单设置保存失败：${error.message}`));
  document.querySelectorAll('[data-menu-layout]').forEach((node) => node.classList.toggle('active', node.dataset.menuLayout === value));
  const current = document.querySelector('#menu-layout-current');
  if (current) current.textContent = menuLayoutLabel(value);
}
function applyDensity(density, options = {}) {
  const value = density === 'compact' ? 'compact' : 'comfortable';
  refs.root.dataset.density = value;
  if (storage && options.persist !== false) storage.setSetting('density', value).catch((error) => showToast(`密度设置保存失败：${error.message}`));
  document.querySelectorAll('[data-density]').forEach((node) => node.classList.toggle('active', node.dataset.density === value));
  const current = document.querySelector('#density-current-label');
  if (current) current.textContent = densityLabel(value);
}
function openSettings(focus) {
  if (!refs.settingsPopover) return;
  refs.settingsPopover.hidden = false;
  document.querySelectorAll('[data-action="settings"], [data-action="appearance"]').forEach((node) => node.setAttribute('aria-expanded', 'true'));
  if (focus === 'theme') document.querySelector('#theme-settings')?.scrollIntoView({ block: 'nearest' });
}
function closeSettings() {
  if (!refs.settingsPopover) return;
  refs.settingsPopover.hidden = true;
  document.querySelectorAll('[data-action="settings"], [data-action="appearance"]').forEach((node) => node.setAttribute('aria-expanded', 'false'));
}
function openPalette() { refs.palette.hidden = false; refs.paletteInput.value = state.query; renderPalette(state.query); refs.paletteInput.focus(); }
function closePalette() { refs.palette.hidden = true; }
function renderPalette(query = '') {
  const normalized = query.trim().toLowerCase();
  const matches = tools.filter((tool) => !normalized || `${tool.name} ${tool.description} ${tool.keywords}`.toLowerCase().includes(normalized));
  refs.paletteResults.innerHTML = matches.length ? matches.map((tool, index) => `<button class="palette-result ${index === 0 ? 'selected' : ''}" type="button" data-action="open-tool" data-tool-id="${tool.id}">${iconMarkup(tool)}<span class="palette-result-copy"><b>${tool.name}</b><small>${tool.description}</small></span></button>`).join('') : '<div class="utility-empty">没有找到工具</div>';
}
function clearFilters() {
  state.activeFilter = 'all'; state.query = ''; state.environment = 'all'; state.sort = 'default';
  refs.globalSearch.value = '';
  const environmentFilter = document.querySelector('#environment-filter');
  const sortFilter = document.querySelector('#sort-filter');
  environmentFilter.value = 'all';
  sortFilter.value = 'default';
  syncBtSelect(environmentFilter);
  syncBtSelect(sortFilter);
  document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === 'all'));
  renderTools();
}

document.addEventListener('click', (event) => {
  if (refs.settingsPopover && !refs.settingsPopover.hidden && !event.target.closest('.settings-popover, [data-action="settings"], [data-action="appearance"]')) closeSettings();
  const target = event.target.closest('[data-json-action], [data-action], [data-view], [data-category], [data-filter], [data-theme], [data-menu-layout], [data-density]');
  if (!target || target === refs.root) return;
  if (target.dataset.jsonAction) { event.stopPropagation(); handleJsonAction(target); return; }
  const action = target.dataset.action;
  if (target.dataset.filter) { state.activeFilter = target.dataset.filter; document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node === target)); renderTools(); return; }
  if (target.dataset.view) { const view = target.dataset.view; if (view === 'home') renderHome({ showOverview: true }); else if (view === 'all' || view === 'common') { renderHome({ showOverview: view === 'common', updateRoute: false }); state.activeFilter = view === 'common' ? 'recent' : 'all'; document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === state.activeFilter)); setActiveNav(view); renderTools(); setRoute(`/view/${view}`); } else showUtility(view); return; }
  if (target.dataset.category) { renderHome({ showOverview: false, updateRoute: false }); state.activeFilter = target.dataset.category; document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === state.activeFilter)); setActiveNav(target.dataset.category); renderTools(); setRoute(`/category/${encodeURIComponent(target.dataset.category)}`); return; }
  if (target.dataset.menuLayout) { applyMenuLayout(target.dataset.menuLayout); showToast(`菜单已切换为${menuLayoutLabel(target.dataset.menuLayout)}展示`); return; }
  if (target.dataset.density) { applyDensity(target.dataset.density); showToast(`内容密度已切换为${densityLabel(target.dataset.density)}`); return; }
  if (action === 'home') renderHome();
  if (action === 'theme') cycleTheme();
  if (action === 'set-theme') { applyTheme(target.dataset.theme); showToast(`已切换为${themeModeLabel(target.dataset.theme)}主题`); }
  if (action === 'appearance') openSettings('theme');
  if (action === 'settings') openSettings();
  if (action === 'close-settings') closeSettings();
  if (action === 'sidebar') refs.sidebar.classList.toggle('is-open');
  if (action === 'favorites') showUtility('favorites');
  if (action === 'history') showUtility('history');
  if (action === 'filter') { refs.filterPanel.hidden = !refs.filterPanel.hidden; target.setAttribute('aria-expanded', String(!refs.filterPanel.hidden)); }
  if (action === 'clear-filter') clearFilters();
  if (action === 'favorite') { event.stopPropagation(); toggleFavorite(target.dataset.toolId); }
  if (action === 'workspace-favorite') toggleFavorite(target.dataset.toolId);
  if (action === 'open-tool') { event.stopPropagation(); closePalette(); openTool(target.dataset.toolId); }
  if (action === 'close-palette') closePalette();
});

refs.globalSearch.addEventListener('input', (event) => { state.query = event.target.value.trim(); state.activeFilter = 'all'; document.querySelectorAll('.filter-tab').forEach((node) => node.classList.toggle('active', node.dataset.filter === 'all')); renderTools(); });
document.querySelector('#environment-filter').addEventListener('change', (event) => { state.environment = event.target.value; renderTools(); });
document.querySelector('#sort-filter').addEventListener('change', (event) => { state.sort = event.target.value; renderTools(); });
refs.paletteInput.addEventListener('input', (event) => renderPalette(event.target.value));
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); }
  if (event.key === 'Escape' && !refs.palette.hidden) closePalette();
  if (event.key === 'Escape' && refs.settingsPopover && !refs.settingsPopover.hidden) closeSettings();
});
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => { if (refs.root.dataset.themeMode === 'system') applyTheme('system'); });
window.addEventListener('popstate', renderCurrentRoute);

applyTheme('dark', { persist: false });
applyMenuLayout('standard', { persist: false });
applyDensity('comfortable', { persist: false });
renderFeatured();
renderTools();
startBtSelectObserver();
hydratePersistedState().then(renderCurrentRoute);
