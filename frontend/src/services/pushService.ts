/**
 * Push Notification Service — Frontend
 * Handles SW registration, permission request, and subscription management.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string || 'https://practical-contentment-production-b0e4.up.railway.app';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

/**
 * Register the service worker and subscribe to push.
 * Saves the subscription to the Railway backend.
 */
export async function subscribeToPush(storeId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[Push] Not supported in this browser.');
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY not set.');
    return false;
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Permission denied:', permission);
      return false;
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 3. Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subJson = subscription.toJSON();
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!p256dh || !auth) {
      console.error('[Push] Subscription keys missing.');
      return false;
    }

    // 4. Save subscription to backend
    const res = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent.slice(0, 200),
      }),
    });

    if (!res.ok) {
      console.error('[Push] Failed to save subscription:', await res.text());
      return false;
    }

    console.log('[Push] Subscribed successfully.');
    return true;
  } catch (err) {
    console.error('[Push] Subscription error:', err);
    return false;
  }
}

/**
 * Unsubscribe from push and remove from backend.
 */
export async function unsubscribeFromPush(storeId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, endpoint }),
    });

    console.log('[Push] Unsubscribed.');
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
  }
}

/**
 * Listen for SW messages to open a specific lead chat.
 */
export function onLeadOpenMessage(callback: (leadId: string) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'OPEN_LEAD' && event.data?.leadId) {
      callback(event.data.leadId);
    }
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
