import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nijlwzqxsgmutpstujoz.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pamx3enF4c2dtdXRwc3R1am96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDg0MzAsImV4cCI6MjEwNTE4NDQzMH0.dc7-S9vIX1s5ndIXFy9EYLNxzPqfaZE1-awsFGDZYqc';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://practical-contentment-production-b0e4.up.railway.app';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '4296ef44b1c351a61c016fb652862dae';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Acknowledge webhook immediately
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok' });
  }

  const payload = req.body || {};
  const { event, data, instanceId } = payload;

  console.log(`[Vercel Webhook] Event: ${event} for instance: ${instanceId}`);

  try {
    if (event === 'Connected' || event === 'PairSuccess') {
      if (instanceId) {
        let rawJid: string = data?.jid || data?.ID || '';
        let phone: string | null = null;
        if (rawJid) {
          const cleanNumber = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');
          if (cleanNumber) phone = `+${cleanNumber}`;
        }
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            ...(phone ? { phone } : {}),
            last_connected: 'Agora mesmo',
          })
          .eq('id', instanceId);
      }
    } else if (event === 'LoggedOut') {
      if (instanceId) {
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'disconnected',
            phone: null,
            last_connected: 'Desconectado',
          })
          .eq('id', instanceId);
      }
    } else if (event === 'Message' || event === 'SendMessage') {
      await handleIncomingMessage(instanceId, data);
    }
  } catch (err) {
    console.error('[Vercel Webhook Error]:', err);
  }

  return res.status(200).json({ received: true });
}

async function findLeadByPhone(storeId: string, phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const candidatePhones = new Set<string>();
  candidatePhones.add(`+${digits}`);
  candidatePhones.add(digits);

  // Mozambican country code handling
  if (digits.startsWith('258') && digits.length === 12) {
    const local = digits.slice(3);
    candidatePhones.add(`+${local}`);
    candidatePhones.add(local);
  } else if (digits.length === 9 && digits.startsWith('8')) {
    candidatePhones.add(`+258${digits}`);
    candidatePhones.add(`258${digits}`);
  }

  const phoneArray = Array.from(candidatePhones);

  // 1. Direct match on candidate phone variations
  const { data: directMatches } = await supabase
    .from('leads')
    .select('*')
    .eq('store_id', storeId)
    .in('phone', phoneArray)
    .limit(1);

  if (directMatches && directMatches.length > 0) {
    return directMatches[0];
  }

  // 2. Partial match using the last 9 digits
  if (digits.length >= 9) {
    const suffix = digits.slice(-9);
    const { data: suffixMatches } = await supabase
      .from('leads')
      .select('*')
      .eq('store_id', storeId)
      .ilike('phone', `%${suffix}%`)
      .limit(1);

    if (suffixMatches && suffixMatches.length > 0) {
      return suffixMatches[0];
    }
  }

  return null;
}

async function handleIncomingMessage(instanceId?: string, data?: Record<string, any>) {
  if (!instanceId || !data) return;
  const info = data.Info;
  if (!info || info.IsGroup) return;

  const fromMe: boolean = info.IsFromMe ?? false;
  const messageSource = info.MessageSource || data.messageSource || {};

  // When fromMe is true: extract ONLY the recipient/chat customer JID. Never use Sender!
  let rawCustomerJid = '';
  if (fromMe) {
    rawCustomerJid =
      info.Recipient ||
      messageSource.Recipient ||
      info.Chat ||
      messageSource.Chat ||
      info.RemoteJid ||
      data.key?.remoteJid ||
      data.recipient ||
      '';
  } else {
    rawCustomerJid =
      info.Sender ||
      messageSource.Sender ||
      info.Chat ||
      messageSource.Chat ||
      info.RemoteJid ||
      data.key?.remoteJid ||
      '';
  }

  // Ignora grupos, status, newsletters
  if (
    info.IsGroup ||
    rawCustomerJid.includes('@g.us') ||
    rawCustomerJid.includes('broadcast') ||
    rawCustomerJid.includes('@newsletter') ||
    rawCustomerJid === 'status@broadcast'
  ) {
    return;
  }

  const cleanDigits = rawCustomerJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  // Rejeita números com tamanho inválido ou LIDs brutos (14-16 dígitos) não mapeados
  if (!cleanDigits || cleanDigits.length < 8 || cleanDigits.length > 13) return;

  const phone = `+${cleanDigits}`;
  const contactName = !fromMe ? (info.PushName || info.FullName || phone) : phone;

  // Find store attached to this instance
  const { data: instRow } = await supabase
    .from('whatsapp_instances')
    .select('store_id')
    .eq('id', instanceId)
    .single();

  if (!instRow?.store_id) return;
  const storeId = instRow.store_id;

  // Extrai e desembrulha o conteúdo da mensagem
  const rawMsg = data.Message || data.message || {};
  let msgObj = rawMsg;
  if (msgObj.ephemeralMessage?.message) msgObj = msgObj.ephemeralMessage.message;
  if (msgObj.viewOnceMessage?.message) msgObj = msgObj.viewOnceMessage.message;
  if (msgObj.viewOnceMessageV2?.message) msgObj = msgObj.viewOnceMessageV2.message;
  if (msgObj.viewOnceMessageV2Extension?.message) msgObj = msgObj.viewOnceMessageV2Extension.message;
  if (msgObj.documentWithCaptionMessage?.message) msgObj = msgObj.documentWithCaptionMessage.message;

  let text = msgObj.conversation || msgObj.extendedTextMessage?.text || '';
  let type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';
  let mediaCaption: string | null = null;
  let audioDuration: string | null = null;
  let isMedia = false;
  let rawBase64: string | null = null;
  let rawMime: string | null = null;
  let directMediaUrl: string | null = null;

  if (info.MediaType === 'image' || msgObj.imageMessage) {
    type = 'image';
    isMedia = true;
    const img = msgObj.imageMessage || {};
    mediaCaption = img.caption || null;
    rawBase64 = img.base64 || msgObj.base64 || null;
    rawMime = img.mimetype || 'image/jpeg';
  } else if (info.MediaType === 'video' || msgObj.videoMessage || msgObj.ptvMessage) {
    type = 'video';
    isMedia = true;
    const vid = msgObj.videoMessage || msgObj.ptvMessage || {};
    mediaCaption = vid.caption || null;
    rawBase64 = vid.base64 || msgObj.base64 || null;
    rawMime = vid.mimetype || 'video/mp4';
  } else if (info.MediaType === 'audio' || msgObj.audioMessage) {
    type = 'audio';
    isMedia = true;
    const aud = msgObj.audioMessage || {};
    const seconds = aud.seconds || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    audioDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
    rawBase64 = aud.base64 || msgObj.base64 || null;
    rawMime = aud.mimetype || 'audio/ogg';
  } else if (info.MediaType === 'document' || msgObj.documentMessage) {
    type = 'document';
    isMedia = true;
    const doc = msgObj.documentMessage || {};
    mediaCaption = doc.fileName || doc.caption || null;
    rawBase64 = doc.base64 || msgObj.base64 || null;
    rawMime = doc.mimetype || 'application/pdf';
  } else if (info.MediaType === 'sticker' || msgObj.stickerMessage) {
    type = 'image';
    isMedia = true;
    const stk = msgObj.stickerMessage || {};
    rawBase64 = stk.base64 || msgObj.base64 || null;
    rawMime = stk.mimetype || 'image/webp';
  }

  // Se for mensagem de mídia e não tiver base64 no webhook, baixa e decifra via Evolution GO
  if (isMedia && !rawBase64) {
    try {
      const resp = await fetch(`${EVOLUTION_API_URL}/message/downloadmedia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ message: rawMsg }),
      });

      if (resp.ok) {
        const d: any = await resp.json();
        const b64 = d?.data?.base64 || d?.base64 || (typeof d?.data === 'string' && d.data.length > 50 ? d.data : null);
        const mime = d?.data?.mimetype || d?.data?.mimeType || d?.mimetype || d?.mimeType;
        if (b64) {
          rawBase64 = b64;
          if (mime) rawMime = mime;
        } else if (d?.data?.url || d?.url) {
          directMediaUrl = d?.data?.url || d?.url;
        }
      }
    } catch (err) {
      console.warn('[Vercel Webhook] Error downloading media:', err);
    }
  }

  let mediaUrl: string | null = null;
  if (rawBase64) {
    const mimePrefix = rawMime || (type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/ogg' : 'image/jpeg');
    mediaUrl = rawBase64.startsWith('data:') ? rawBase64 : `data:${mimePrefix};base64,${rawBase64}`;
  } else if (directMediaUrl && !directMediaUrl.includes('mmg.whatsapp.net')) {
    mediaUrl = directMediaUrl;
  }

  const ts = info.Timestamp ? new Date(info.Timestamp) : new Date();
  const timeStr = ts.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('pt-PT');

  // Find existing lead using robust search
  const existingLead = await findLeadByPhone(storeId, phone);
  let leadId: string;

  if (existingLead) {
    leadId = existingLead.id;
  } else {
    // Get first column
    const { data: firstCol } = await supabase
      .from('kanban_columns')
      .select('id')
      .eq('store_id', storeId)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    const targetColumnId = firstCol?.id || 'col-new';
    const lastMsgPreview = text || (type === 'image' ? (fromMe ? 'Foto enviada' : 'Foto recebida') : type === 'video' ? (fromMe ? 'Vídeo enviado' : 'Vídeo recebido') : type === 'audio' ? (fromMe ? 'Áudio enviado' : 'Áudio recebido') : 'Mensagem');

    const { data: newLead } = await supabase
      .from('leads')
      .insert({
        store_id: storeId,
        name: contactName,
        phone,
        column_id: targetColumnId,
        unread_count: fromMe ? 0 : 1,
        last_message: lastMsgPreview,
        last_message_time: timeStr,
        last_message_timestamp: Date.now(),
        deal_value: 0,
        tags: [],
      })
      .select('id')
      .single();

    if (!newLead) return;
    leadId = newLead.id;
  }

  // Deduplicate recent sent messages
  if (fromMe && text) {
    const tenSecAgo = new Date(Date.now() - 10000).toISOString();
    const { data: recent } = await supabase
      .from('messages')
      .select('id')
      .eq('lead_id', leadId)
      .eq('from_me', true)
      .eq('text', text)
      .gte('created_at', tenSecAgo)
      .limit(1);

    if (recent && recent.length > 0) return;
  }

  // Insert message into Supabase and capture the inserted row
  const { data: insertedMsg } = await supabase.from('messages').insert({
    store_id: storeId,
    lead_id: leadId,
    from_me: fromMe,
    type,
    text: text || null,
    media_url: mediaUrl,
    media_caption: mediaCaption,
    audio_duration: audioDuration,
    timestamp: timeStr,
    full_date: dateStr,
    status: fromMe ? 'sent' : 'delivered',
  }).select('*').single();

  // Update lead
  const lastMsgText = text || (type === 'image' ? (fromMe ? 'Foto enviada' : 'Foto recebida') : type === 'video' ? (fromMe ? 'Vídeo enviado' : 'Vídeo recebido') : type === 'audio' ? (fromMe ? 'Áudio enviado' : 'Áudio recebido') : 'Mensagem');
  const { data: updatedLead } = await supabase
    .from('leads')
    .update({
      last_message: lastMsgText,
      last_message_time: timeStr,
      last_message_timestamp: Date.now(),
      ...(!fromMe ? { unread_count: (existingLead?.unread_count || 0) + 1 } : {}),
    })
    .eq('id', leadId)
    .select('*')
    .single();

  // ⚡ INSTANT BROADCAST via Supabase Realtime
  if (insertedMsg) {
    try {
      const broadcastChannel = supabase.channel('lojinha-realtime-global');
      await broadcastChannel.send({
        type: 'broadcast',
        event: 'message:new',
        payload: {
          storeId,
          message: insertedMsg,
          lead: updatedLead || existingLead,
        },
      });
      supabase.removeChannel(broadcastChannel);
    } catch (broadcastErr) {
      console.warn('[Vercel Webhook] Broadcast failed (non-fatal):', broadcastErr);
    }

    // Broadcast lead update for kanban card refresh
    if (updatedLead) {
      try {
        const leadChannel = supabase.channel('lojinha-realtime-global-lead');
        await leadChannel.send({
          type: 'broadcast',
          event: 'lead:change',
          payload: {
            storeId,
            eventType: existingLead ? 'UPDATE' : 'INSERT',
            lead: updatedLead,
          },
        });
        supabase.removeChannel(leadChannel);
      } catch (e) {
        // non-fatal
      }
    }
  }
}
