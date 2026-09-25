/**
 * Push Notification Service — Frontend
 * Handles SW registration, permission request, and subscription management.
 */

import { supabase } from '../lib/supabase';

// VAPID public key — public, safe to embed in client code (not a secret)
// Fallback hardcoded so push works even if Vercel env var is not set
const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) ||
  'BMPkxDQtiyMN9Mn2pweNIhrfjcaywqYZccvlqxOE6rYpWP6HqU_AhbWKtuPhleHzaGodIIF0csbZeTWAM0MjfXs';

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string) ||
  'https://practical-contentment-production-b0e4.up.railway.app';

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
 * Saves the subscription directly to Supabase and the Railway backend.
 */
export async function subscribeToPush(storeId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[Push] Not supported in this browser.');
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID public key not configured.');
    return false;
  }

  try {
    // 1. Request permission if not already granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted:', permission);
      return false;
    }

    // 2. Register Service Worker & ensure it's ready
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 3. Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = subscription.toJSON();
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!p256dh || !auth) {
      console.error('[Push] Subscription keys missing.');
      return false;
    }

    // 4. Save subscription directly into Supabase (instant & resilient)
    const { error: sbError } = await supabase.from('push_subscriptions').upsert(
      {
        store_id: storeId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: 'store_id,endpoint' }
    );

    if (sbError) {
      console.warn('[Push] Supabase direct upsert warning:', sbError.message);
    } else {
      console.log('[Push] Subscription saved directly to Supabase.');
    }

    // 5. Also notify backend in background (non-blocking)
    fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent.slice(0, 200),
      }),
    }).catch((err) => {
      console.warn('[Push] Backend mirror save (non-fatal):', err);
    });

    console.log('[Push] Subscribed successfully for store:', storeId);
    return true;
  } catch (err) {
    console.error('[Push] Subscription error:', err);
    return false;
  }
}

/**
 * Unsubscribe from push and remove from Supabase and backend.
 */
export async function unsubscribeFromPush(storeId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    // Remove from Supabase
    await supabase.from('push_subscriptions').delete()
      .eq('store_id', storeId)
      .eq('endpoint', endpoint);

    // Remove from Backend
    await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, endpoint }),
    }).catch(console.warn);

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
