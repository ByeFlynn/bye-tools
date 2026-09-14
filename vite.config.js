import { defineConfig } from 'vite';

const vendorChunkRules = [
  ['vendor-pdfjs', ['/node_modules/pdfjs-dist/']],
  ['vendor-pdf-lib', ['/node_modules/pdf-lib/', '/node_modules/@pdf-lib/']],
  ['vendor-zxing', ['/node_modules/@zxing/']],
  ['vendor-bwip', ['/node_modules/bwip-js/']],
  ['vendor-qrcode', ['/node_modules/qrcode/']],
  ['vendor-crypto', ['/node_modules/crypto-js/', '/node_modules/js-sha3/', '/node_modules/jsencrypt/', '/node_modules/sm-crypto/']],
  ['vendor-editor', ['/node_modules/@codemirror/', '/node_modules/@lezer/', '/node_modules/codemirror/']],
  ['vendor-quicktype', ['/node_modules/quicktype-core/']],
];

function resolveVendorChunk(id) {
  const normalizedId = id.replaceAll('\\', '/');
  if (!normalizedId.includes('/node_modules/')) return undefined;

  return vendorChunkRules.find(([, paths]) => paths.some((path) => normalizedId.includes(path)))?.[0]
    ?? 'vendor-common';
}

export default defineConfig({
  // Tauri 使用本地资源协议，生产资源必须使用相对路径
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
});
