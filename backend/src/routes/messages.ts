import { Router, Request, Response } from 'express';
import { EvolutionClient } from '../evolutionClient';
import { createClient } from '@supabase/supabase-js';
import { saveBase64Media, deleteMediaFileByUrl } from '../utils/mediaStorage';
import { realtimeBroadcaster } from '../utils/realtimeBroadcaster';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

function getEvolutionClient(): EvolutionClient {
  return new EvolutionClient(
    process.env.EVOLUTION_API_URL!,
    process.env.EVOLUTION_API_KEY!
  );
}

async function getInstanceToken(instanceId: string): Promise<string | null> {
  const { data: row } = await supabase
    .from('whatsapp_instances')
    .select('last_connected')
    .eq('id', instanceId)
    .single();

  if (row?.last_connected && row.last_connected.startsWith('{')) {
    try {
      const parsed = JSON.parse(row.last_connected);
      if (parsed.token) return parsed.token;
    } catch {}
  }

  const evolution = getEvolutionClient();
  try {
    const all = await evolution.getAllInstances();
    const inst = all.find((i) => i.id === instanceId);
    if (inst) return inst.token;
  } catch {}

  return null;
}

// ----------------------------------------------------------------
// POST /api/messages/send-text — envia texto via WhatsApp
// ----------------------------------------------------------------
router.post('/send-text', async (req: Request, res: Response) => {
  const { instanceId, storeId, phone, text } = req.body as {
    instanceId?: string;
    storeId?: string;
    phone: string;
    text: string;
  };

  if (!phone || !text) {
    return res.status(400).json({ error: 'Missing required fields: phone, text' });
  }

  let activeInstanceId = instanceId;

  // Se instanceId não foi especificado, busca a padrão conectada da loja
  if (!activeInstanceId && storeId) {
    const { data: defaultInst } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_default', true)
      .single();

    activeInstanceId = defaultInst?.id;
  }

  if (!activeInstanceId) {
    return res.status(400).json({ error: 'No active WhatsApp instance available to send message' });
  }

  const token = await getInstanceToken(activeInstanceId);
  if (!token) {
    return res.status(404).json({ error: 'Instance token not found' });
  }

  const evolution = getEvolutionClient();

  try {
    const result: any = await evolution.sendText(token, phone, text);
    const waMsgId =
      result?.data?.id ||
      result?.data?.Info?.ID ||
      result?.data?.Key?.ID ||
      result?.id ||
      result?.key?.id ||
      result?.messageId ||
      result?.data?.messageId ||
      null;
    return res.json({ ok: true, result, whatsappMessageId: waMsgId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Messages] sendText error:', msg);
    return res.status(502).json({ error: `Evolution GO error: ${msg}` });
  }
});

// ----------------------------------------------------------------
// POST /api/messages/send-media — envia foto, áudio ou vídeo via WhatsApp
// ----------------------------------------------------------------
router.post('/send-media', async (req: Request, res: Response) => {
  const { instanceId, storeId, phone, mediaUrl, type, caption, mimetype, fileName } = req.body as {
    instanceId?: string;
    storeId?: string;
    phone: string;
    mediaUrl: string;
    type?: 'image' | 'audio' | 'video' | 'document';
    caption?: string;
    mimetype?: string;
    fileName?: string;
  };

  if (!phone || !mediaUrl) {
    return res.status(400).json({ error: 'Missing required fields: phone, mediaUrl' });
  }

  let activeInstanceId = instanceId;

  if (!activeInstanceId && storeId) {
    const { data: defaultInst } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_default', true)
      .single();

    activeInstanceId = defaultInst?.id;
  }

  if (!activeInstanceId) {
    return res.status(400).json({ error: 'No active WhatsApp instance available to send media' });
  }

  const token = await getInstanceToken(activeInstanceId);
  if (!token) {
    return res.status(404).json({ error: 'Instance token not found' });
  }

  const evolution = getEvolutionClient();

  try {
    const result: any = await evolution.sendMedia(
      token,
      phone,
      mediaUrl,
      type || 'image',
      caption,
      mimetype,
      fileName
    );
    const waMsgId =
      result?.data?.id ||
      result?.data?.Info?.ID ||
      result?.data?.Key?.ID ||
      result?.id ||
      result?.key?.id ||
      result?.messageId ||
      result?.data?.messageId ||
      null;

    // Save base64 media to disk and return public static URL for smooth playback
    const publicMediaUrl = saveBase64Media(mediaUrl, type || 'image');

    return res.json({ ok: true, result, mediaUrl: publicMediaUrl, whatsappMessageId: waMsgId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Messages] sendMedia error:', msg);
    return res.status(502).json({ error: `Evolution GO error: ${msg}` });
  }
});

// ----------------------------------------------------------------
// DELETE /api/messages/delete — apaga mensagem para todos (WA + BD)
// ----------------------------------------------------------------
router.delete('/delete', async (req: Request, res: Response) => {
  const { messageDbId, whatsappMessageId, instanceId, storeId } = req.body as {
    messageDbId: string;
    whatsappMessageId?: string;
    instanceId?: string;
    storeId?: string;
  };

  if (!messageDbId) {
    return res.status(400).json({ error: 'Missing required field: messageDbId' });
  }

  // 1. Buscar a mensagem na BD
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .select('id, lead_id, store_id, media_url')
    .eq('id', messageDbId)
    .single();

  if (msgErr || !msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // 2. Buscar o phone do lead
  const { data: lead } = await supabase
    .from('leads')
    .select('phone')
    .eq('id', msg.lead_id)
    .single();

  // 3. Resolver instanceId
  let activeInstanceId = instanceId;
  if (!activeInstanceId) {
    const sid = storeId || msg.store_id;
    if (sid) {
      const { data: defaultInst } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('store_id', sid)
        .eq('is_default', true)
        .single();
      activeInstanceId = defaultInst?.id;
    }
  }

  // 4. Revogar no WhatsApp se houver WhatsApp Message ID e telefone
  const waIdToRevoke = whatsappMessageId;
  if (waIdToRevoke && activeInstanceId && lead?.phone) {
    const token = await getInstanceToken(activeInstanceId);
    if (token) {
      const evolution = getEvolutionClient();
      try {
        await evolution.deleteMessage(token, lead.phone, waIdToRevoke);
        console.log(`[Messages] Revoked WA message ${waIdToRevoke} for ${lead.phone}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('[Messages] deleteMessage WA notice (proceeding with DB delete):', errMsg);
      }
    }
  }

  // 5. Apagar arquivo de mídia do disco (se existir)
  if (msg.media_url) {
    deleteMediaFileByUrl(msg.media_url);
  }

  // 6. Marcar como deletada na BD (status: 'deleted' + limpar mídia e texto)
  const { error: updateErr } = await supabase
    .from('messages')
    .update({
      status: 'deleted',
      text: 'Esta mensagem foi apagada',
      media_url: null,
      media_caption: null,
    })
    .eq('id', messageDbId);

  if (updateErr) {
    console.error('[Messages] Error marking message deleted:', updateErr.message);
    return res.status(500).json({ error: 'Failed to mark message as deleted in DB' });
  }

  // 7. Broadcast delete event to all connected clients instantly
  realtimeBroadcaster.broadcastMessageDeleted(msg.store_id, messageDbId, msg.lead_id);

  return res.json({ ok: true });
});

export default router;
