/* =========================================================
   Lojinha Service Worker — Push Notifications
   ========================================================= */

const APP_URL = self.location.origin;

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Lojinha', body: event.data.text() };
  }

  const {
    title = 'Lojinha',
    body = 'Nova notificação',
    icon = '/icon-192.png',
    badge = '/favicon-32x32.png',
    tag,
    data = {},
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag: tag || 'lojinha-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data,
    actions: data.leadId
      ? [{ action: 'open', title: 'Abrir Chat' }]
      : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { leadId } = event.notification.data || {};

  let targetUrl = APP_URL;
  if (leadId) {
    // Store leadId so the app can open the right chat on focus
    targetUrl = `${APP_URL}/?open_lead=${leadId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and send a message
      for (const client of clientList) {
        if (client.url.startsWith(APP_URL)) {
          client.focus();
          if (leadId) {
            client.postMessage({ type: 'OPEN_LEAD', leadId });
          }
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe when subscription expires
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    })
  );
});
