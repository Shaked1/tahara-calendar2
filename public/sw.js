// public/sw.js
// Service Worker — מציג התראות push על מסך הטלפון

const CACHE_NAME = 'tahara-v1';

// ─── התקנה ───────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// ─── קבלת Push מהשרת ─────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'לוח הטהרה', body: 'התראה חדשה', type: 'general' };

  try {
    data = event.data?.json() ?? data;
  } catch {
    data.body = event.data?.text() ?? data.body;
  }

  // צבע badge לפי סוג
  const badgeColor = {
    hefsek_reminder:     '#10b981', // ירוק
    clean_day_morning:   '#3b82f6', // כחול
    clean_day_afternoon: '#f59e0b', // כתום
    pre_mikvah:          '#8b5cf6', // סגול
    mikvah_day:          '#06b6d4', // תכלת
    veset_start_onah:    '#ef4444', // אדום
    veset_end_onah:      '#6b7280', // אפור
  }[data.type] ?? '#6366f1';

  const options = {
    body:    data.body,
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-72x72.png',
    tag:     data.type,                  // מניעת כפילות
    renotify: true,
    dir:     'rtl',
    lang:    'he',
    vibrate: [200, 100, 200],
    data:    { url: '/calendar', type: data.type },
    actions: [
      { action: 'open',    title: 'פתח לוח שנה' },
      { action: 'dismiss', title: 'סגור'         },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── לחיצה על ההתראה ─────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url ?? '/calendar';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
