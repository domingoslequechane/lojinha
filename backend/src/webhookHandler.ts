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
// Cache in-memory for LID -> Phone mapping & Instance Tokens
const lidToPhoneCache = new Map<string, { phone: string; name?: string }>();
const instanceTokenCache = new Map<string, string>();
let cachedContactsList: Array<{ Jid: string; PushName?: string; FirstName?: string; FullName?: string; BusinessName?: string }> = [];
let contactsLastFetch = 0;

async function getInstanceToken(instanceId: string): Promise<string> {
  if (instanceTokenCache.has(instanceId)) {
    return instanceTokenCache.get(instanceId)!;
  }

  // 1. Check DB last_connected JSON for token
  const { data: row } = await supabase
    .from('whatsapp_instances')
    .select('last_connected')
    .eq('id', instanceId)
    .single();

  if (row?.last_connected && row.last_connected.startsWith('{')) {
    try {
      const parsed = JSON.parse(row.last_connected);
      if (parsed.token) {
        instanceTokenCache.set(instanceId, parsed.token);
        return parsed.token;
      }
    } catch {}
  }

  // 2. Fetch all instances from Evolution API to get token
  try {
    const all = await evolutionClient.getAllInstances();
    const inst = all.find((i) => i.id === instanceId);
    if (inst?.token) {
      instanceTokenCache.set(instanceId, inst.token);
      return inst.token;
    }
  } catch (err) {
    console.error('[Webhook] Failed to fetch instance token from Evolution:', err);
  }

  return instanceId;
}

async function getOrFetchContacts(
  instanceId: string,
  forceRefresh: boolean = false
): Promise<Array<{ Jid: string; PushName?: string; FirstName?: string; FullName?: string; BusinessName?: string }>> {
  const now = Date.now();
  if (!forceRefresh && cachedContactsList.length > 0 && now - contactsLastFetch < 5 * 60 * 1000) {
    return cachedContactsList;
  }
  try {
    const token = await getInstanceToken(instanceId);
    const list = await evolutionClient.getContacts(token);
    if (list && list.length > 0) {
      cachedContactsList = list;
      contactsLastFetch = now;

      // Build 2-way name index from phone contacts
      const phoneContacts = list.filter((c) => c.Jid && c.Jid.includes('@s.whatsapp.net'));
      const lidContacts = list.filter((c) => c.Jid && c.Jid.includes('@lid'));

      const nameToPhone = new Map<string, { phone: string; name: string }>();
      for (const p of phoneContacts) {
        const clean = p.Jid.split('@')[0].split(':')[0].replace(/\D/g, '');
        if (clean && clean.length <= 13) {
          const names = [p.PushName, p.FullName, p.FirstName, p.BusinessName].filter(Boolean);
          for (const n of names) {
            const lower = n!.trim().toLowerCase();
            if (lower.length >= 2) {
              nameToPhone.set(lower, { phone: `+${clean}`, name: p.FullName || p.PushName || p.FirstName || n! });
            }
          }
        }
      }

      // Map each LID contact to its real phone number
      for (const lidC of lidContacts) {
        const lidDigits = lidC.Jid.split('@')[0].replace(/\D/g, '');
        const lidNames = [lidC.PushName, lidC.FullName, lidC.FirstName, lidC.BusinessName].filter(Boolean);
        for (const n of lidNames) {
          const lower = n!.trim().toLowerCase();
          if (nameToPhone.has(lower)) {
            const match = nameToPhone.get(lower)!;
            lidToPhoneCache.set(lidDigits, match);
            break;
          }
        }
      }

      console.log(`[Webhook] Refreshed contacts: ${phoneContacts.length} phones, ${lidContacts.length} LIDs. Cached ${lidToPhoneCache.size} LID mappings.`);
    }
  } catch (err) {
    console.warn('[Webhook] Error fetching contacts list:', err);
  }
  return cachedContactsList;
}

/**
 * Searches for an existing lead in the database using multiple phone number formats.
 * Handles '+25884xxxxxxx', '25884xxxxxxx', '84xxxxxxx', spaces, and dashes.
 */
async function findLeadByPhone(storeId: string, phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const candidatePhones = new Set<string>();
  candidatePhones.add(`+${digits}`);
  candidatePhones.add(digits);

  // Mozambican country code handling
  if (digits.startsWith('258') && digits.length === 12) {
    const local = digits.slice(3); // e.g. 868499221
    candidatePhones.add(`+${local}`);
    candidatePhones.add(local);
  } else if (digits.length === 9 && digits.startsWith('8')) {
    candidatePhones.add(`+258${digits}`);
    candidatePhones.add(`258${digits}`);
  }

  const phoneArray = Array.from(candidatePhones);

  // 1. Direct match on phone column with any candidate format
  const { data: directMatches } = await supabase
    .from('leads')
    .select('*')
    .eq('store_id', storeId)
    .in('phone', phoneArray)
    .limit(1);

  if (directMatches && directMatches.length > 0) {
    return directMatches[0];
  }

  // 2. Partial match using the last 9 digits (local Mozambican mobile number)
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

async function resolveContact(
  instanceId: string,
  info: Record<string, any>,
  data: Record<string, any>,
  fromMe: boolean
): Promise<{ phone: string; name: string } | null> {
  const messageSource = info.MessageSource || data.messageSource || {};

  // When fromMe is true (sent by store/owner):
  // The customer is the RECIPIENT/CHAT. NEVER use Sender (which is the store itself!)
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
      data.destination ||
      data.chatJid ||
      '';
  } else {
    // When fromMe is false (received from customer):
    // The customer is the SENDER/CHAT
    rawCustomerJid =
      info.Sender ||
      messageSource.Sender ||
      info.Chat ||
      messageSource.Chat ||
      info.RemoteJid ||
      data.key?.remoteJid ||
      '';
  }

  if (!rawCustomerJid) return null;

  // Ignore group chats, broadcast status, newsletters, system messages
  if (
    info.IsGroup ||
    messageSource.IsGroup ||
    rawCustomerJid.includes('@g.us') ||
    rawCustomerJid.includes('broadcast') ||
    rawCustomerJid.includes('@newsletter') ||
    rawCustomerJid === 'status@broadcast'
  ) {
    return null;
  }

  // 1. Direct @s.whatsapp.net resolution
  let cleanDigits = '';
  let contactName = !fromMe ? (info.PushName || data.pushName || '') : '';

  if (rawCustomerJid.includes('@s.whatsapp.net')) {
    cleanDigits = rawCustomerJid.split('@')[0].split(':')[0].replace(/\D/g, '');
  }

  // 2. LID resolution if needed (WhatsApp Linked Identity Devices)
  if (!cleanDigits || cleanDigits.length > 13 || rawCustomerJid.includes('@lid')) {
    const lidKey = rawCustomerJid.split('@')[0].replace(/\D/g, '');
    if (lidKey && lidToPhoneCache.has(lidKey)) {
      const cached = lidToPhoneCache.get(lidKey)!;
      cleanDigits = cached.phone.replace(/\D/g, '');
      if (!contactName) contactName = cached.name || '';
    } else if (lidKey) {
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
            if (clean && clean.length <= 13) {
              lidToPhoneCache.set(lidDigits, {
                phone: `+${clean}`,
                name: match.FullName || match.FirstName || match.PushName || targetName,
              });
            }
          }
        }
      }

      if (lidToPhoneCache.has(lidKey)) {
        const cached = lidToPhoneCache.get(lidKey)!;
        cleanDigits = cached.phone.replace(/\D/g, '');
        if (!contactName) contactName = cached.name || '';
      }
    }
  }

  // Strict Validation: Real phone numbers have 8 to 13 digits.
  // Unresolved LIDs have 14 to 16 random digits and must NEVER be saved as phone numbers!
  if (!cleanDigits || cleanDigits.length < 8 || cleanDigits.length > 13) {
    console.log(`[Webhook] Ignored invalid phone / unresolved LID: ${rawCustomerJid} (${cleanDigits})`);
    return null;
  }

  // Format with standard E.164 country code
  let phone = `+${cleanDigits}`;
  if (cleanDigits.length === 9 && cleanDigits.startsWith('8')) {
    phone = `+258${cleanDigits}`;
    cleanDigits = `258${cleanDigits}`;
  }

  // Lookup contact name in WhatsApp address book if missing or if message was sent fromMe
  if (!contactName || contactName === phone || fromMe) {
    const contacts = await getOrFetchContacts(instanceId);
    const matched = contacts.find((c) => c.Jid && c.Jid.includes(cleanDigits.slice(-9)));
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

  const info = data.Info || data.info || {};
  const messageSource = info.MessageSource || data.messageSource || {};

  // Check if group or broadcast
  if (
    info.IsGroup ||
    messageSource.IsGroup ||
    info.Chat?.includes('@g.us') ||
    info.Chat?.includes('broadcast') ||
    info.Chat?.includes('@newsletter')
  ) {
    return;
  }

  const fromMe: boolean = 
    info.IsFromMe ?? 
    messageSource.IsFromMe ?? 
    data.key?.fromMe ?? 
    data.fromMe ?? 
    false;

  // Resolve customer phone & name
  const resolved = await resolveContact(instanceId, info, data, fromMe);
  if (!resolved || !resolved.phone) return;

  const phone = resolved.phone;
  const senderName = resolved.name;

  // Encontra a store vinculada a esta instância
  const { data: instRow } = await supabase
    .from('whatsapp_instances')
    .select('store_id, phone')
    .eq('id', instanceId)
    .single();

  if (!instRow?.store_id) {
    console.warn(`[Webhook] No store found for instanceId: ${instanceId}`);
    return;
  }

  const storeId = instRow.store_id;

  // Prevent creating a lead of the store's own WhatsApp number
  if (instRow.phone) {
    const myClean = instRow.phone.replace(/\D/g, '');
    const phoneClean = phone.replace(/\D/g, '');
    if (myClean && phoneClean && (myClean === phoneClean || myClean.endsWith(phoneClean) || phoneClean.endsWith(myClean))) {
      console.log(`[Webhook] Ignored message to/from own instance phone number: ${phone}`);
      return;
    }
  }

  // Extrai e desembrulha o conteúdo da mensagem (incluindo viewOnce, ephemeral, etc.)
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

  // ATENÇÃO: A descarga de mídia (downloadMedia) é movida para background ASYNC
  // para não bloquear a resposta instantânea ao cliente.
  // O base64 que já vem no webhook é usado diretamente (casos comuns).
  // Caso não venha base64, a mensagem é salva com media_url: null e o download
  // acontece em background, atualizando a linha no Supabase após conclusão.

  // Constrói URL ou Data URI da mídia (apenas com base64 que JÁ VEIO no webhook)
  let mediaUrl: string | null = null;
  if (rawBase64) {
    const mimePrefix = rawMime || (type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/ogg' : 'image/jpeg');
    const dataUri = rawBase64.startsWith('data:') ? rawBase64 : `data:${mimePrefix};base64,${rawBase64}`;
    if (dataUri.length < 8 * 1024 * 1024) {
      mediaUrl = dataUri;
    } else {
      mediaUrl = saveBase64Media(dataUri, type);
    }
  } else if (directMediaUrl) {
    mediaUrl = directMediaUrl;
  }

  const ts = info.Timestamp ? new Date(info.Timestamp) : new Date();
  const timeStr = ts.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('pt-PT');

  // ID da mensagem no WhatsApp (necessário para apagar para todos)
  const whatsappMessageId: string | null = info.ID || info.MessageID || data.key?.id || null;

  // Encontra lead existente no Kanban usando busca flexível de telefone
  let leadId: string;
  const existingLead = await findLeadByPhone(storeId, phone);

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

    // Cria novo lead na primeira coluna do Kanban ("Novo Lead")
    const leadNameToUse = senderName && senderName !== 'Bird Kids' ? senderName : phone;
    const { data: newLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        store_id: storeId,
        name: leadNameToUse,
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

  // Salva mídia em disco se já tiver base64 (evita gravar data URI gigante no Postgres)
  const publicMediaUrl = mediaUrl ? saveBase64Media(mediaUrl, type) : null;

  // ─── INSERÇÃO IMEDIATA: message salva com media_url (ou null se download ainda não feito) ───
  const { data: insertedMsg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      store_id: storeId,
      lead_id: leadId,
      from_me: fromMe,
      type,
      text: text || null,
      media_url: publicMediaUrl,      // null se não havia base64 no webhook
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

  // ─── BROADCAST INSTANTÂNEO — acontece AGORA, antes do download de mídia ───
  if (insertedMsg) {
    realtimeBroadcaster.broadcastMessage(storeId, insertedMsg, updatedLeadData);
    console.log(`[Webhook] ✅ Broadcasted message instantly from ${phone} (${senderName}): ${text || type}`);
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

  // ─── DOWNLOAD DE MÍDIA EM BACKGROUND (não bloqueia o broadcast acima) ───
  // Apenas quando não havia base64 no webhook e a mensagem é uma mídia
  if (isMedia && !publicMediaUrl && insertedMsg) {
    const capturedMsgId = insertedMsg.id;
    const capturedStoreId = storeId;
    const capturedType = type;
    const capturedRawMsg = rawMsg;
    const capturedInstanceId = instanceId;
    const capturedRawMime = rawMime;

    (async () => {
      try {
        console.log(`[Webhook] 🔄 Background: downloading ${capturedType} media for msg ${capturedMsgId}...`);
        const token = await getInstanceToken(capturedInstanceId!);
        if (!token) return;

        const downloaded = await evolutionClient.downloadMedia(token, capturedRawMsg);
        if (!downloaded) return;

        let bgMediaUrl: string | null = null;
        if (downloaded.base64) {
          const mimePrefix = downloaded.mimetype || capturedRawMime || (capturedType === 'video' ? 'video/mp4' : capturedType === 'audio' ? 'audio/ogg' : 'image/jpeg');
          const dataUri = downloaded.base64.startsWith('data:') ? downloaded.base64 : `data:${mimePrefix};base64,${downloaded.base64}`;
          bgMediaUrl = saveBase64Media(dataUri, capturedType) || (dataUri.length < 8 * 1024 * 1024 ? dataUri : null);
        } else if (downloaded.url && !downloaded.url.includes('mmg.whatsapp.net')) {
          bgMediaUrl = downloaded.url;
        }

        if (!bgMediaUrl) return;

        // Atualiza a linha da mensagem com a mídia descarregada
        const { data: updatedMsg } = await supabase
          .from('messages')
          .update({ media_url: bgMediaUrl })
          .eq('id', capturedMsgId)
          .select('*')
          .single();

        if (updatedMsg) {
          // O postgres_changes subscription no frontend já vai capturar o UPDATE automáticamente.
          // Não chamamos broadcastMessage aqui para evitar duplicação no handler de INSERT.
          console.log(`[Webhook] ✅ Background media download complete for msg ${capturedMsgId}`);
        }
      } catch (err) {
        console.warn(`[Webhook] ⚠️ Background media download failed for msg ${capturedMsgId}:`, err);
      }
    })();
  }
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

