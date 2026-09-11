const isTauriDesktop = location.hostname === 'tauri.localhost' || Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);

if (isTauriDesktop && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))),
      caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith('byetools-')).map((name) => caches.delete(name)))),
    ]).catch(() => {});
  });
} else if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      const status = document.querySelector('.local-status');
      if (status) status.title = '本地工具可用，离线缓存暂未启用';
    });
  });
}
