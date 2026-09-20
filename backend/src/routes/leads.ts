import { Router, Request, Response } from 'express';
import { EvolutionClient } from '../evolutionClient';
import { createClient } from '@supabase/supabase-js';
import { realtimeBroadcaster } from '../utils/realtimeBroadcaster';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

const evolutionClient = new EvolutionClient(
  process.env.EVOLUTION_API_URL!,
  process.env.EVOLUTION_API_KEY!
);

/**
 * POST /api/leads/:leadId/refresh-avatar
 *
 * Triggers an on-demand fetch of the WhatsApp profile picture for a lead.
 * Returns immediately with { queued: true } while the fetch runs in the background.
 * When the avatar is found, updates leads.avatar and broadcasts lead:change via Realtime.
 */
router.post('/:leadId/refresh-avatar', async (req: Request, res: Response) => {
  const { leadId } = req.params;

  if (!leadId) {
    res.status(400).json({ error: 'leadId is required' });
    return;
  }

  // Fetch lead to get phone and current avatar
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, phone, avatar, store_id')
    .eq('id', leadId)
    .single();

  if (leadErr || !lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  // If avatar already exists, return it immediately
  if (lead.avatar) {
    res.json({ avatar: lead.avatar, cached: true });
    return;
  }

  // Respond immediately — avatar fetch is async (WhatsApp servers can be slow)
  res.json({ queued: true });

  // Find an active WhatsApp instance for this store
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('store_id', lead.store_id)
    .eq('status', 'connected')
    .limit(1)
    .single();

  if (!instance) {
    console.warn(`[Leads] No connected instance for store ${lead.store_id}, cannot fetch avatar.`);
    return;
  }

  // Non-blocking avatar fetch
  (async () => {
    try {
      console.log(`[Leads] Fetching avatar on-demand for ${lead.phone}...`);
      const allInst = await evolutionClient.getAllInstances();
      const matchedInst = allInst.find((i) => i.id === instance.id);
      const token = matchedInst?.token || instance.id;
      const avatarUrl = await evolutionClient.getContactAvatar(token, lead.phone);
      if (avatarUrl) {
        const { data: updatedLead } = await supabase
          .from('leads')
          .update({ avatar: avatarUrl })
          .eq('id', leadId)
          .select('*')
          .single();
        if (updatedLead) {
          realtimeBroadcaster.broadcastLead(lead.store_id, updatedLead, 'UPDATE');
          console.log(`[Leads] Avatar refreshed for ${lead.phone}: ${avatarUrl}`);
        }
      } else {
        console.log(`[Leads] No avatar found on-demand for ${lead.phone}`);
      }
    } catch (err) {
      console.warn(`[Leads] Avatar refresh failed for ${lead.phone}:`, err);
    }
  })();
});

export default router;
