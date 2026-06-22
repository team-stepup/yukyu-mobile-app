// yukyu-app (総務管理アプリ) Service Worker — Web Push 専用。
// 注意: 静的アセットのキャッシュはしない (version.json による更新フローを壊さないため)。
//       push / notificationclick と アプリアイコンバッジ(setAppBadge) のみ担当する。

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ====== Web Push: 前払い/弁当の承認待ち通知 ======
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || '承認待ち';
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: data.url || './' },
    tag: data.tag || 'yukyu-approve',
    renotify: true,
  };
  const tasks = [self.registration.showNotification(title, options)];
  // ホーム画面アイコンのバッジ (対応端末・iOS16.4+のPWA)
  if (self.navigator && 'setAppBadge' in self.navigator) {
    const n = typeof data.badge === 'number' ? data.badge : 1;
    tasks.push(self.navigator.setAppBadge(n).catch(() => {}));
  }
  event.waitUntil(Promise.all(tasks));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { try { c.navigate(target); } catch (e) {} return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
