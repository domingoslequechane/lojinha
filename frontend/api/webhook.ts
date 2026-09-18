import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nijlwzqxsgmutpstujoz.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pamx3enF4c2dtdXRwc3R1am96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDg0MzAsImV4cCI6MjEwNTE4NDQzMH0.dc7-S9vIX1s5ndIXFy9EYLNxzPqfaZE1-awsFGDZYqc';

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

async function handleIncomingMessage(instanceId?: string, data?: Record<string, any>) {
  if (!instanceId || !data) return;
  const info = data.Info;
  if (!info || info.IsGroup) return;

  const fromMe: boolean = info.IsFromMe ?? false;
  const chatJid: string = info.Chat || info.Sender || info.RemoteJid || '';

  let directJid = '';
  if (fromMe && info.Recipient && info.Recipient.includes('@s.whatsapp.net')) {
    directJid = info.Recipient;
  } else if (chatJid.includes('@s.whatsapp.net')) {
    directJid = chatJid;
  } else if (!fromMe && info.Sender && info.Sender.includes('@s.whatsapp.net')) {
    directJid = info.Sender;
  }

  let cleanDigits = directJid ? directJid.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
  if (!cleanDigits) {
    cleanDigits = chatJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  }
  if (!cleanDigits) return;

  const phone = `+${cleanDigits}`;
  const contactName = info.PushName || info.FullName || phone;

  // Find store attached to this instance
  const { data: instRow } = await supabase
    .from('whatsapp_instances')
    .select('store_id')
    .eq('id', instanceId)
    .single();

  if (!instRow?.store_id) return;
  const storeId = instRow.store_id;

  // Message content
  const msgObj = data.Message || {};
  let text = msgObj.conversation || msgObj.extendedTextMessage?.text || '';
  let type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';
  let mediaUrl: string | null = null;
  let mediaCaption: string | null = null;

  if (info.MediaType === 'image' || msgObj.imageMessage) {
    type = 'image';
    mediaCaption = msgObj.imageMessage?.caption || null;
    mediaUrl = msgObj.base64 ? `data:${msgObj.imageMessage?.mimetype || 'image/jpeg'};base64,${msgObj.base64}` : msgObj.imageMessage?.url || null;
  } else if (info.MediaType === 'video' || msgObj.videoMessage) {
    type = 'video';
    mediaCaption = msgObj.videoMessage?.caption || null;
    mediaUrl = msgObj.base64 ? `data:${msgObj.videoMessage?.mimetype || 'video/mp4'};base64,${msgObj.base64}` : msgObj.videoMessage?.url || null;
  } else if (info.MediaType === 'audio' || msgObj.audioMessage) {
    type = 'audio';
    mediaUrl = msgObj.base64 ? `data:audio/ogg;base64,${msgObj.base64}` : msgObj.audioMessage?.url || null;
  }

  const ts = info.Timestamp ? new Date(info.Timestamp) : new Date();
  const timeStr = ts.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('pt-PT');

  // Find or create lead
  let leadId: string;
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, unread_count, name')
    .eq('store_id', storeId)
    .eq('phone', phone)
    .single();

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
    const lastMsgPreview = text || (type === 'image' ? 'Foto' : type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Mensagem');

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

  // Insert message into Supabase
  await supabase.from('messages').insert({
    store_id: storeId,
    lead_id: leadId,
    from_me: fromMe,
    type,
    text: text || null,
    media_url: mediaUrl,
    media_caption: mediaCaption,
    timestamp: timeStr,
    full_date: dateStr,
    status: fromMe ? 'sent' : 'delivered',
  });

  // Update lead
  const lastMsgText = text || (type === 'image' ? (fromMe ? 'Foto enviada' : 'Foto recebida') : type === 'video' ? (fromMe ? 'Vídeo enviado' : 'Vídeo recebido') : type === 'audio' ? (fromMe ? 'Áudio enviado' : 'Áudio recebido') : 'Mensagem');
  await supabase
    .from('leads')
    .update({
      last_message: lastMsgText,
      last_message_time: timeStr,
      last_message_timestamp: Date.now(),
      ...(!fromMe ? { unread_count: (existingLead?.unread_count || 0) + 1 } : {}),
    })
    .eq('id', leadId);
}
