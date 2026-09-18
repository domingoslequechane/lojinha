import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://nijlwzqxsgmutpstujoz.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pamx3enF4c2dtdXRwc3R1am96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDg0MzAsImV4cCI6MjEwNTE4NDQzMH0.dc7-S9vIX1s5ndIXFy9EYLNxzPqfaZE1-awsFGDZYqc";

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, apikey, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(200).json({ status: "ok", message: "Webhook endpoint ready" });
  }

  const payload = req.body || {};
  console.log("[Webhook] Full payload:", JSON.stringify(payload));

  res.status(200).json({ received: true });

  try {
    await processWebhook(payload);
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
  }
}

async function processWebhook(payload: Record<string, any>) {
  const event: string =
    payload.event || payload.Event || payload.type || payload.Type || "";
  const instanceId: string =
    payload.instanceId || payload.InstanceId || payload.instance ||
    payload.Instance || payload.instanceName || payload.InstanceName || "";
  const data: Record<string, any> =
    payload.data || payload.Data || payload.message || payload.Message || payload;

  console.log(`[Webhook] Event: "${event}" | Instance: "${instanceId}"`);
  const eventLower = event.toLowerCase();

  if (eventLower === "connected" || eventLower === "pairsuccess" || eventLower === "open" || eventLower === "connection") {
    await handleConnected(instanceId, data);
  } else if (eventLower === "loggedout" || eventLower === "close" || eventLower === "disconnected") {
    await handleDisconnected(instanceId);
  } else if (
    eventLower === "message" ||
    eventLower === "sendmessage" ||
    eventLower === "send_message" ||
    eventLower === "receive_message" ||
    eventLower === "messages.upsert" ||
    eventLower === "message.received"
  ) {
    await handleIncomingMessage(instanceId, data, payload);
  } else {
    console.log(`[Webhook] Unhandled event: "${event}". Keys: ${Object.keys(payload).join(", ")}`);
  }
}

async function handleConnected(instanceId: string, data: Record<string, any>) {
  if (!instanceId) return;
  const rawJid: string = data?.jid || data?.ID || data?.Jid || data?.wid || "";
  let phone: string | null = null;
  if (rawJid) {
    const n = rawJid.split("@")[0].split(":")[0].replace(/\D/g, "");
    if (n) phone = `+${n}`;
  }
  const { error } = await supabase
    .from("whatsapp_instances")
    .update({ status: "connected", ...(phone ? { phone } : {}), last_connected: "Agora mesmo" })
    .eq("id", instanceId);
  console.log(`[Webhook] Connected ${instanceId} phone=${phone} err=${error?.message}`);
}

async function handleDisconnected(instanceId: string) {
  if (!instanceId) return;
  await supabase
    .from("whatsapp_instances")
    .update({ status: "disconnected", phone: null, last_connected: "Desconectado" })
    .eq("id", instanceId);
  console.log(`[Webhook] Disconnected ${instanceId}`);
}

async function handleIncomingMessage(
  instanceId: string,
  data: Record<string, any>,
  fullPayload: Record<string, any>
) {
  if (!instanceId) { console.log("[Webhook] No instanceId"); return; }

  const info = data?.Info || data?.info || data?.key || {};
  const msgObj = data?.Message || data?.message || data?.body || {};

  const isGroup =
    info?.IsGroup || info?.isGroup ||
    (info?.remoteJid || info?.RemoteJid || "").includes("@g.us");
  if (isGroup) { console.log("[Webhook] Group message, skipping"); return; }

  const fromMe: boolean = info?.IsFromMe ?? info?.fromMe ?? info?.from_me ?? data?.fromMe ?? false;

  const chatJid: string =
    info?.Chat || info?.chat || info?.remoteJid || info?.RemoteJid ||
    info?.Sender || info?.sender || info?.from || info?.to || "";

  let directJid = "";
  if (fromMe && info?.Recipient && info.Recipient.includes("@s.whatsapp.net")) {
    directJid = info.Recipient;
  } else if (chatJid.includes("@s.whatsapp.net")) {
    directJid = chatJid;
  } else if (!fromMe && (info?.Sender || info?.sender)) {
    const s = info?.Sender || info?.sender;
    if (s.includes("@s.whatsapp.net")) directJid = s;
  } else if (chatJid.includes("@")) {
    directJid = chatJid;
  }

  let cleanDigits = directJid ? directJid.split("@")[0].split(":")[0].replace(/\D/g, "") : "";
  if (!cleanDigits) cleanDigits = chatJid.split("@")[0].split(":")[0].replace(/\D/g, "");
  if (!cleanDigits) {
    const anyPhone = data?.phone || data?.number || fullPayload?.phone || "";
    cleanDigits = String(anyPhone).replace(/\D/g, "");
  }
  if (!cleanDigits) {
    console.log("[Webhook] Cannot extract phone. Data keys:", Object.keys(data));
    return;
  }

  const phone = `+${cleanDigits}`;
  const contactName =
    info?.PushName || info?.pushName || info?.notify || info?.FullName ||
    data?.pushName || data?.name || phone;
  console.log(`[Webhook] Message: phone=${phone} name=${contactName} fromMe=${fromMe}`);

  const { data: instRow } = await supabase
    .from("whatsapp_instances").select("store_id").eq("id", instanceId).single();
  if (!instRow?.store_id) { console.log(`[Webhook] No store for instance ${instanceId}`); return; }
  const storeId = instRow.store_id;

  let text = "";
  let type: "text" | "image" | "audio" | "video" | "document" = "text";
  let mediaUrl: string | null = null;
  let mediaCaption: string | null = null;

  if (typeof msgObj === "string") {
    text = msgObj;
  } else {
    text = msgObj?.conversation || msgObj?.extendedTextMessage?.text ||
      msgObj?.text || msgObj?.body || data?.text || data?.body || "";
    const mediaType = info?.MediaType || info?.mediaType || "";
    if (mediaType === "image" || msgObj?.imageMessage) {
      type = "image";
      mediaCaption = msgObj?.imageMessage?.caption || null;
      mediaUrl = msgObj?.base64
        ? `data:${msgObj.imageMessage?.mimetype || "image/jpeg"};base64,${msgObj.base64}`
        : msgObj?.imageMessage?.url || null;
    } else if (mediaType === "video" || msgObj?.videoMessage) {
      type = "video";
      mediaUrl = msgObj?.videoMessage?.url || null;
    } else if (mediaType === "audio" || msgObj?.audioMessage) {
      type = "audio";
      mediaUrl = msgObj?.audioMessage?.url || null;
    }
  }

  const tsRaw = info?.Timestamp || info?.timestamp || data?.timestamp || Date.now();
  const ts = typeof tsRaw === "number" && tsRaw < 1e12 ? new Date(tsRaw * 1000) : new Date(tsRaw);
  const timeStr = ts.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const dateStr = ts.toLocaleDateString("pt-PT");

  const { data: existingLead } = await supabase
    .from("leads").select("id, unread_count, name")
    .eq("store_id", storeId).eq("phone", phone).single();

  let leadId: string;
  if (existingLead) {
    leadId = existingLead.id;
    console.log(`[Webhook] Existing lead: ${leadId}`);
  } else {
    const { data: firstCol } = await supabase
      .from("kanban_columns").select("id")
      .eq("store_id", storeId).order("order_index", { ascending: true }).limit(1).single();

    const lastMsgPreview = text || (type === "image" ? "Foto" : type === "video" ? "Video" : type === "audio" ? "Audio" : "Mensagem");
    const { data: newLead, error: leadError } = await supabase
      .from("leads").insert({
        store_id: storeId, name: contactName, phone,
        column_id: firstCol?.id || null,
        unread_count: fromMe ? 0 : 1,
        last_message: lastMsgPreview,
        last_message_time: timeStr,
        last_message_timestamp: Date.now(),
        deal_value: 0, tags: [],
      }).select("id").single();

    if (leadError || !newLead) { console.error("[Webhook] Lead insert error:", leadError?.message); return; }
    leadId = newLead.id;
    console.log(`[Webhook] Created lead: ${leadId}`);
  }

  if (fromMe && text) {
    const tenSecAgo = new Date(Date.now() - 10000).toISOString();
    const { data: recent } = await supabase.from("messages").select("id")
      .eq("lead_id", leadId).eq("from_me", true).eq("text", text).gte("created_at", tenSecAgo).limit(1);
    if (recent && recent.length > 0) { console.log("[Webhook] Duplicate, skipping"); return; }
  }

  const { error: msgError } = await supabase.from("messages").insert({
    store_id: storeId, lead_id: leadId, from_me: fromMe, type,
    text: text || null, media_url: mediaUrl, media_caption: mediaCaption,
    timestamp: timeStr, full_date: dateStr, status: fromMe ? "sent" : "delivered",
  });
  console.log(`[Webhook] Inserted message. Error: ${msgError?.message}`);

  const lastMsgText = text || (type === "image" ? (fromMe ? "Foto enviada" : "Foto") : type === "video" ? "Video" : type === "audio" ? "Audio" : "Mensagem");
  await supabase.from("leads").update({
    last_message: lastMsgText, last_message_time: timeStr,
    last_message_timestamp: Date.now(),
    ...(!fromMe ? { unread_count: (existingLead?.unread_count || 0) + 1 } : {}),
  }).eq("id", leadId);
}
