import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { saveBase64Media } from './utils/mediaStorage';
import { realtimeBroadcaster } from './utils/realtimeBroadcaster';
import { EvolutionClient } from './evolutionClient';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

const evolutionClient = new EvolutionClient(
  process.env.EVOLUTION_API_URL!,
  process.env.EVOLUTION_API_KEY!
);

interface EvolutionGoWebhookPayload {
  event: string;
  data: Record<string, any>;
  instanceId?: string;
  instanceToken?: string;
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body as EvolutionGoWebhookPayload;

  // Responde imediatamente com 200 para cumprir o SLA de 30s da Evolution GO
  res.status(200).json({ received: true });

  if (!payload || !payload.event) return;

  const { event, data, instanceId } = payload;
  console.log(`[Webhook] Event: ${event} for instance: ${instanceId}`);

  try {
    switch (event) {
      case 'QRCode':
        await handleQrCode(instanceId, data);
        break;

      case 'Connected':
      case 'PairSuccess':
        await handleConnected(instanceId, data);
        break;

      case 'LoggedOut':
        await handleLoggedOut(instanceId);
        break;

      case 'Message':
      case 'SendMessage':
        await handleMessage(instanceId, data);
        break;

      case 'Receipt':
        await handleReceipt(instanceId, data);
        break;

      default:
        // Outros eventos (Receipt, Presence, Call, etc.)
        break;
    }
  } catch (err) {
    console.error(`[Webhook] Error handling event ${event}:`, err);
  }
}

// ----------------------------------------------------------------
// QRCode
// ----------------------------------------------------------------
async function handleQrCode(instanceId?: string, data?: Record<string, any>): Promise<void> {
  if (!instanceId || !data?.qrcode) return;

  // Atualiza status e guarda QR temporariamente no campo last_connected (JSON com timestamp)
  const qrData = JSON.stringify({
    qr: data.qrcode,
    code: data.code ?? '',
    updatedAt: Date.now(),
  });

  await supabase
    .from('whatsapp_instances')
    .update({
      status: 'connecting',
      last_connected: qrData,
    })
    .eq('id', instanceId);
}

// ----------------------------------------------------------------
// Connected / PairSuccess
// ----------------------------------------------------------------
async function handleConnected(instanceId?: string, data?: Record<string, any>): Promise<void> {
  if (!instanceId) return;

  let rawJid: string = data?.jid || data?.ID || '';
  // Normaliza jid: "5511918798714:5@s.whatsapp.net" -> "+5511918798714"
  let phone: string | null = null;
  if (rawJid) {
    const cleanNumber = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (cleanNumber) {
      phone = `+${cleanNumber}`;
    }
  }

  const pushName: string = data?.pushName || data?.BusinessName || '';

  const updatePayload: Record<string, any> = {
    status: 'connected',
    last_connected: 'Agora mesmo',
  };

  if (phone) updatePayload.phone = phone;
  if (pushName && !updatePayload.name) updatePayload.name = pushName;

  await supabase
    .from('whatsapp_instances')
    .update(updatePayload)
    .eq('id', instanceId);

  console.log(`[Webhook] Instance ${instanceId} connected successfully. Phone: ${phone}`);
}

// ----------------------------------------------------------------
// LoggedOut
// ----------------------------------------------------------------
async function handleLoggedOut(instanceId?: string): Promise<void> {
  if (!instanceId) return;

  await supabase
    .from('whatsapp_instances')
    .update({
      status: 'disconnected',
      phone: null,
      last_connected: 'Desconectado',
    })
    .eq('id', instanceId);

  console.log(`[Webhook] Instance ${instanceId} logged out.`);
}

// ----------------------------------------------------------------
// Message
// ----------------------------------------------------------------
// Cache in-memory for LID -> Phone mapping
const lidToPhoneCache = new Map<string, { phone: string; name?: string }>();
let cachedContactsList: Array<{ Jid: string; PushName?: string; FirstName?: string; FullName?: string; BusinessName?: string }> = [];
let contactsLastFetch = 0;

async function getOrFetchContacts(
  instanceId: string
): Promise<Array<{ Jid: string; PushName?: string; FirstName?: string; FullName?: string; BusinessName?: string }>> {
  const now = Date.now();
  if (cachedContactsList.length > 0 && now - contactsLastFetch < 5 * 60 * 1000) {
    return cachedContactsList;
  }
  try {
    const list = await evolutionClient.getContacts(instanceId);
    if (list && list.length > 0) {
      cachedContactsList = list;
      contactsLastFetch = now;
    }
  } catch (err) {
    console.warn('[Webhook] Error fetching contacts list:', err);
  }
  return cachedContactsList;
}

async function resolveContact(
  instanceId: string,
  info: Record<string, any>,
  fromMe: boolean
): Promise<{ phone: string; name: string } | null> {
  const chatJid: string = info.Chat || info.Sender || info.RemoteJid || '';
  
  // 1. Direct @s.whatsapp.net resolution
  let directJid = '';
  if (fromMe && info.Recipient && info.Recipient.includes('@s.whatsapp.net')) {
    directJid = info.Recipient;
  } else if (chatJid.includes('@s.whatsapp.net')) {
    directJid = chatJid;
  } else if (!fromMe && info.Sender && info.Sender.includes('@s.whatsapp.net')) {
    directJid = info.Sender;
  }

  let cleanDigits = directJid ? directJid.split('@')[0].split(':')[0].replace(/\D/g, '') : '';
  let contactName = !fromMe ? (info.PushName || '') : '';

  // 2. LID resolution if needed
  if (!cleanDigits || cleanDigits.startsWith('176020728590') || chatJid.includes('@lid')) {
    const lidKey = (chatJid.includes('@lid') ? chatJid : info.Sender || '').split('@')[0].replace(/\D/g, '');
    if (lidKey && lidToPhoneCache.has(lidKey)) {
      const cached = lidToPhoneCache.get(lidKey)!;
      cleanDigits = cached.phone.replace(/\D/g, '');
      if (!contactName) contactName = cached.name || '';
    } else {
      const contacts = await getOrFetchContacts(instanceId);
      const phoneContacts = contacts.filter((c) => c.Jid && c.Jid.includes('@s.whatsapp.net'));
      const lidContacts = contacts.filter((c) => c.Jid && c.Jid.includes('@lid'));

      for (const lidC of lidContacts) {
        const lidDigits = lidC.Jid.split('@')[0].replace(/\D/g, '');
        const targetName = lidC.PushName || lidC.FullName || lidC.BusinessName || lidC.FirstName;
        if (targetName) {
          const match = phoneContacts.find(
            (p) =>
              (p.PushName && p.PushName === targetName) ||
              (p.FullName && p.FullName === targetName) ||
              (p.FirstName && p.FirstName === targetName)
          );
          if (match) {
            const clean = match.Jid.split('@')[0].split(':')[0].replace(/\D/g, '');
            if (clean) {
              lidToPhoneCache.set(lidDigits, {
                phone: `+${clean}`,
                name: match.FullName || match.FirstName || match.PushName || targetName,
              });
            }
          }
        }
      }

      if (lidKey && lidToPhoneCache.has(lidKey)) {
        const cached = lidToPhoneCache.get(lidKey)!;
        cleanDigits = cached.phone.replace(/\D/g, '');
        if (!contactName) contactName = cached.name || '';
      }
    }
  }

  if (!cleanDigits) {
    const fallbackDigits = chatJid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!fallbackDigits) return null;
    cleanDigits = fallbackDigits;
  }

  const phone = `+${cleanDigits}`;

  // Se o nome estiver vazio ou for mensagem enviada por nós (fromMe), busca no catálogo de contactos do WhatsApp
  if (!contactName || contactName === phone) {
    const contacts = await getOrFetchContacts(instanceId);
    const matched = contacts.find((c) => c.Jid && c.Jid.includes(cleanDigits));
    if (matched) {
      contactName = matched.FullName || matched.FirstName || matched.PushName || matched.BusinessName || '';
    }
  }

  return {
    phone,
    name: contactName || phone,
  };
}

async function handleMessage(instanceId?: string, data?: Record<string, any>): Promise<void> {
  if (!instanceId || !data) return;

  const info = data.Info;
  if (!info) return;

  // Ignora mensagens de grupos
  if (info.IsGroup) return;

  const fromMe: boolean = info.IsFromMe ?? false;

  // Resolve telefone e nome do contacto considerando LIDs e mensagens fromMe
  const resolved = await resolveContact(instanceId, info, fromMe);
  if (!resolved || !resolved.phone) return;

  const phone = resolved.phone;
  const senderName = resolved.name;

  // Encontra a store vinculada a esta instância
  const { data: instRow } = await supabase
    .from('whatsapp_instances')
    .select('store_id')
    .eq('id', instanceId)
    .single();

  if (!instRow?.store_id) {
    console.warn(`[Webhook] No store found for instanceId: ${instanceId}`);
    return;
  }

  const storeId = instRow.store_id;

  // Extrai conteúdo da mensagem
  const msgObj = data.Message || {};
  let text = msgObj.conversation || msgObj.extendedTextMessage?.text || '';
  let type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';
  let mediaUrl: string | null = null;
  let mediaCaption: string | null = null;
  let audioDuration: string | null = null;

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
    const seconds = msgObj.audioMessage?.seconds || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    audioDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
    mediaUrl = msgObj.base64 ? `data:audio/ogg;base64,${msgObj.base64}` : msgObj.audioMessage?.url || null;
  }

  const ts = info.Timestamp ? new Date(info.Timestamp) : new Date();
  const timeStr = ts.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('pt-PT');

  // ID da mensagem no WhatsApp (necessário para apagar para todos)
  const whatsappMessageId: string | null = info.ID || info.MessageID || null;

  // Encontra ou cria o lead no Kanban
  let leadId: string;

  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, unread_count, avatar, name')
    .eq('store_id', storeId)
    .eq('phone', phone)
    .single();

  if (existingLead) {
    leadId = existingLead.id;
  } else {
    // Busca a primeira coluna real do Kanban da loja (ex: "Novo Lead")
    const { data: firstCol } = await supabase
      .from('kanban_columns')
      .select('id')
      .eq('store_id', storeId)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    const targetColumnId = firstCol?.id || 'col-new';
    const lastMsgPreview = text || (type === 'image' ? (fromMe ? 'Foto enviada' : 'Foto recebida') : type === 'video' ? (fromMe ? 'Vídeo enviado' : 'Vídeo recebido') : type === 'audio' ? (fromMe ? 'Áudio enviado' : 'Áudio recebido') : (fromMe ? 'Mensagem enviada' : 'Mensagem recebida'));

    // Cria novo lead na primeira coluna do Kanban ("Novo Lead") tanto para clientes que entram em contacto quanto para conversas iniciadas por nós
    const { data: newLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        store_id: storeId,
        name: senderName || phone,
        phone,
        column_id: targetColumnId,
        unread_count: fromMe ? 0 : 1,
        last_message: lastMsgPreview,
        last_message_time: timeStr,
        last_message_timestamp: Date.now(),
        deal_value: 0,
        tags: [],
      })
      .select('*')
      .single();

    if (leadErr || !newLead) {
      console.error('[Webhook] Error creating lead for incoming/outgoing message:', leadErr);
      return;
    }

    leadId = newLead.id;
    // Broadcast newly created lead instantly to all connected clients
    realtimeBroadcaster.broadcastLead(storeId, newLead, 'INSERT');
    console.log(`[Webhook] Novo lead adicionado ao Kanban (${fromMe ? 'Iniciado por nós' : 'Iniciado pelo cliente'}): ${newLead.name} (${newLead.phone})`);
  }

  // Busca avatar em background (non-blocking) se o lead ainda não tiver foto de perfil
  const needsAvatar = !existingLead?.avatar;
  if (needsAvatar) {
    const capturedLeadId = leadId;
    (async () => {
      try {
        console.log(`[Webhook] Fetching avatar for ${phone}...`);
        const avatarUrl = await evolutionClient.getContactAvatar(instanceId!, phone);
        if (avatarUrl) {
          const { data: updatedLeadAvatar } = await supabase
            .from('leads')
            .update({ avatar: avatarUrl })
            .eq('id', capturedLeadId)
            .select('*')
            .single();
          if (updatedLeadAvatar) {
            realtimeBroadcaster.broadcastLead(storeId, updatedLeadAvatar, 'UPDATE');
            console.log(`[Webhook] Avatar updated for ${phone}: ${avatarUrl}`);
          }
        } else {
          console.log(`[Webhook] No avatar found for ${phone}`);
        }
      } catch (err) {
        console.warn(`[Webhook] Failed to fetch avatar for ${phone}:`, err);
      }
    })();
  }

  // Se a mensagem foi enviada por nós (fromMe), verifica se já foi gravada pelo CRM nos últimos 10s para evitar duplicação
  if (fromMe) {
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { data: recentSent } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('lead_id', leadId)
      .eq('from_me', true)
      .eq('text', text || null)
      .gte('created_at', tenSecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentSent && recentSent.length > 0) {
      console.log(`[Webhook] Deduped outgoing message already inserted by CRM: "${text}" (msgId: ${recentSent[0].id})`);
      return;
    }
  }

  // Salva mídia em disco se for base64 para permitir reprodução perfeita sem travar o Postgres
  const publicMediaUrl = mediaUrl ? saveBase64Media(mediaUrl, type) : null;

  const { data: insertedMsg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      store_id: storeId,
      lead_id: leadId,
      from_me: fromMe,
      type,
      text: text || null,
      media_url: publicMediaUrl,
      media_caption: mediaCaption,
      audio_duration: audioDuration,
      timestamp: timeStr,
      full_date: dateStr,
      status: fromMe ? 'sent' : 'delivered',
    })
    .select('*')
    .single();

  if (msgErr) {
    console.error('[Webhook] Error persisting message:', msgErr);
    return;
  }

  // Atualiza lead com última mensagem e contador
  let updatedLeadData: any = null;
  if (!fromMe) {
    const currentUnread = (existingLead?.unread_count || 0) + 1;
    const { data: updatedLead } = await supabase
      .from('leads')
      .update({
        last_message: text || (type === 'image' ? 'Foto recebida' : type === 'video' ? 'Vídeo recebido' : type === 'audio' ? 'Áudio recebido' : 'Mensagem recebida'),
        last_message_time: timeStr,
        last_message_timestamp: Date.now(),
        unread_count: currentUnread,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select('*')
      .single();

    updatedLeadData = updatedLead;
    if (updatedLead) {
      realtimeBroadcaster.broadcastLead(storeId, updatedLead, 'UPDATE');
    }
  } else {
    const { data: updatedLead } = await supabase
      .from('leads')
      .update({
        last_message: text || (type === 'image' ? 'Foto enviada' : type === 'video' ? 'Vídeo enviado' : type === 'audio' ? 'Áudio enviado' : 'Mensagem enviada'),
        last_message_time: timeStr,
        last_message_timestamp: Date.now(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select('*')
      .single();

    updatedLeadData = updatedLead;
    if (updatedLead) {
      realtimeBroadcaster.broadcastLead(storeId, updatedLead, 'UPDATE');
    }
  }

  // Broadcast the new message INSTANTLY over WebSocket to all clients
  if (insertedMsg) {
    realtimeBroadcaster.broadcastMessage(storeId, insertedMsg, updatedLeadData);
  }

  // Incrementa contagem de mensagens do dia na instância
  const { data: instCurrent } = await supabase
    .from('whatsapp_instances')
    .select('messages_today')
    .eq('id', instanceId)
    .single();

  if (instCurrent) {
    await supabase
      .from('whatsapp_instances')
      .update({
        messages_today: (instCurrent.messages_today || 0) + 1,
      })
      .eq('id', instanceId);
  }

  console.log(`[Webhook] Processed & broadcasted message from ${phone} (${senderName}): ${text || type}`);
}

// ----------------------------------------------------------------
// Receipt (Delivered / Read status updates)
// ----------------------------------------------------------------
async function handleReceipt(instanceId?: string, data?: Record<string, any>): Promise<void> {
  if (!instanceId || !data) return;

  const rawJid = data.chat || data.remoteJid || data.from || data.Chat || '';
  const cleanDigits = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  if (!cleanDigits) return;

  const phone = `+${cleanDigits}`;
  const receiptType = String(data.type || data.ReceiptType || '').toLowerCase();

  let targetStatus: 'delivered' | 'read' = 'delivered';
  if (receiptType.includes('read') || receiptType.includes('played') || receiptType.includes('view')) {
    targetStatus = 'read';
  } else if (receiptType.includes('deliver') || receiptType.includes('receipt') || receiptType.includes('received')) {
    targetStatus = 'delivered';
  }

  // Busca lead pelo telefone
  const { data: lead } = await supabase
    .from('leads')
    .select('id, store_id')
    .eq('phone', phone)
    .single();

  if (!lead) return;

  // Atualiza mensagens recentes enviadas para esse lead
  if (targetStatus === 'read') {
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('lead_id', lead.id)
      .eq('from_me', true)
      .in('status', ['sent', 'delivered']);
  } else {
    await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('lead_id', lead.id)
      .eq('from_me', true)
      .eq('status', 'sent');
  }

  // Broadcast receipt update
  realtimeBroadcaster.broadcastReceipt(lead.store_id, phone, lead.id, targetStatus);

  console.log(`[Webhook] Updated & broadcasted message receipts for ${phone} to ${targetStatus}`);
}

