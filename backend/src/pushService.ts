import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@lojinha.my',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a single subscription endpoint.
 */
export async function sendPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/favicon-32x32.png',
        tag: payload.tag || 'lojinha-notification',
        data: payload.data || {},
      }),
      { TTL: 60 * 60 * 24 } // 24h TTL
    );
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expired, remove it
    if (err?.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      console.log('[Push] Removed expired subscription:', endpoint.slice(0, 60));
    } else {
      console.error('[Push] Send error:', err?.statusCode, err?.body);
    }
    return false;
  }
}

/**
 * Send a push notification to ALL subscriptions for a given store.
 */
export async function sendPushToStore(storeId: string, payload: PushPayload): Promise<void> {
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('store_id', storeId);

  if (error) {
    console.error('[Push] Failed to fetch subscriptions:', error.message);
    return;
  }

  if (!subs || subs.length === 0) return;

  await Promise.allSettled(
    subs.map(sub => sendPush(sub.endpoint, sub.p256dh, sub.auth, payload))
  );
}
