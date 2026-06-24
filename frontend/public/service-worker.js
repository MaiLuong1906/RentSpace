// RentSpace Service Worker — Sprint 5 Web Push
// Không dùng ESM syntax (plain JS) vì SW chạy ở global scope của browser

self.addEventListener('push', (event) => {
  console.log('[SW] Push event nhận được:', event.data?.text());
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'RentSpace', content: event.data.text(), url: '/app/notifications' };
  }

  const options = {
    body: data.content || '',
    icon: '/logo-192.png',
    badge: '/badge-96.png',
    data: { url: data.url || '/app/notifications' },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RentSpace', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/app/notifications';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus tab đang mở nếu URL khớp
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Không có tab phù hợp — mở tab mới
        return clients.openWindow(targetUrl);
      })
  );
});
