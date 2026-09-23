import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendPushToStore } from './pushService';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Format a date/time string nicely in Portuguese.
 */
function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoStr;
  }
}

/**
 * Check for follow-ups due within the given time window and send push notifications.
 * @param windowStartMs - start of window relative to now (milliseconds)
 * @param windowEndMs   - end of window relative to now (milliseconds)
 * @param isReminder    - true = 30min reminder, false = exact time alert
 */
async function checkAndNotify(windowStartMs: number, windowEndMs: number, isReminder: boolean) {
  const now = Date.now();
  const from = new Date(now + windowStartMs).toISOString();
  const to   = new Date(now + windowEndMs).toISOString();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, store_id, follow_up_date, follow_up_type, follow_up_notes, delivery_product, delivery_address')
    .not('follow_up_date', 'is', null)
    .gte('follow_up_date', from)
    .lte('follow_up_date', to);

  if (error) {
    console.error('[FollowUpCron] Query error:', error.message);
    return;
  }

  if (!leads || leads.length === 0) return;

  console.log(`[FollowUpCron] ${leads.length} follow-up(s) found for window ${isReminder ? '30min' : 'exact'}`);

  for (const lead of leads) {
    const storeId = lead.store_id;
    if (!storeId) continue;

    const isEntrega = lead.follow_up_type === 'entrega';
    const typeLabel = isEntrega ? '📦 Entrega' : '🔔 Follow Up';
    const formattedDate = formatDateTime(lead.follow_up_date);

    let title: string;
    let body: string;

    if (isReminder) {
      // 30min before
      title = `${typeLabel} em 30 minutos`;
      body = isEntrega
        ? `${lead.name}${lead.delivery_product ? ` — ${lead.delivery_product}` : ''}\n${lead.delivery_address || ''}\n${formattedDate}`
        : `${lead.name}\n${formattedDate}${lead.follow_up_notes ? `\n${lead.follow_up_notes}` : ''}`;
    } else {
      // Exact time
      title = `⏰ ${typeLabel} agora!`;
      body = isEntrega
        ? `${lead.name}${lead.delivery_product ? ` — ${lead.delivery_product}` : ''}\n${lead.delivery_address || ''}`
        : `${lead.name}${lead.follow_up_notes ? `\n${lead.follow_up_notes}` : ''}`;
    }

    await sendPushToStore(storeId, {
      title,
      body: body.trim(),
      tag: `followup-${lead.id}-${isReminder ? '30min' : 'now'}`,
      data: {
        leadId: lead.id,
        type: isEntrega ? 'entrega' : 'followup',
        isReminder,
      },
    });
  }
}

/**
 * Start the follow-up cron job.
 * Runs every minute, checks for:
 *  - Follow-ups due in exactly 30 min (±30s window)
 *  - Follow-ups due right now (±30s window)
 */
export function startFollowUpCron() {
  console.log('[FollowUpCron] Starting — checks every minute for follow-up alerts.');

  cron.schedule('* * * * *', async () => {
    const WINDOW = 30 * 1000; // 30-second window to catch each minute

    // Exact-time alerts: follow_up_date is within [now-30s, now+30s]
    await checkAndNotify(-WINDOW, WINDOW, false);

    // 30-min reminder: follow_up_date is within [now+29.5min, now+30.5min]
    const THIRTY_MIN = 30 * 60 * 1000;
    await checkAndNotify(THIRTY_MIN - WINDOW, THIRTY_MIN + WINDOW, true);
  });
}
