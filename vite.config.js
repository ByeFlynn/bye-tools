import { defineConfig } from 'vite';

export default defineConfig({
  // Tauri 使用本地资源协议，生产资源必须使用相对路径
  base: './',
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
});
