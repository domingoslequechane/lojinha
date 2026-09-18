/**
 * evolutionService.ts
 * 
 * Serviço de comunicação direta e segura do frontend com a Evolution GO e Supabase.
 * Funciona diretamente com a Evolution GO no Railway sem necessidade de servidor intermediário.
 */

import { WhatsAppInstance } from '../types';
import { supabase } from '../lib/supabase';

const EVOLUTION_API_URL = (
  (import.meta.env.VITE_EVOLUTION_API_URL as string) ||
  'https://practical-contentment-production-b0e4.up.railway.app'
).replace(/\/$/, '');

const EVOLUTION_API_KEY =
  (import.meta.env.VITE_EVOLUTION_API_KEY as string) ||
  'X8rE4ZArVLRZq-vbI_Uzr0wBwBMd2KSys6Prh3_15CE';

// In-memory token cache (instanceId -> token)
const tokenCache = new Map<string, string>();

async function getInstanceToken(instanceId: string): Promise<string | null> {
  if (tokenCache.has(instanceId)) {
    return tokenCache.get(instanceId)!;
  }

  // 1. Read from Supabase last_connected JSON
  try {
    const { data: row } = await supabase
      .from('whatsapp_instances')
      .select('last_connected')
      .eq('id', instanceId)
      .single();

    if (row?.last_connected && row.last_connected.startsWith('{')) {
      const parsed = JSON.parse(row.last_connected);
      if (parsed.token) {
        tokenCache.set(instanceId, parsed.token);
        return parsed.token;
      }
    }
  } catch {}

  // 2. Fetch from Evolution GO /instance/all
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/all`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data || json || [];
      for (const inst of list) {
        if (inst.id === instanceId && inst.token) {
          tokenCache.set(instanceId, inst.token);
          return inst.token;
        }
      }
    }
  } catch {}

  return null;
}

// Raw DB row → WhatsAppInstance (frontend type)
function mapRow(row: Record<string, unknown>): WhatsAppInstance {
  let displayLastConnected = 'Nunca conectado';
  if (row.last_connected) {
    const str = String(row.last_connected);
    if (str.startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.createdAt) {
          displayLastConnected = new Date(parsed.createdAt).toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {}
    } else {
      displayLastConnected = str;
    }
  }

  return {
    id: row.id as string,
    instanceName: (row.name as string) || (row.id as string),
    name: (row.name as string) || 'Instância WhatsApp',
    phone: (row.phone as string) || undefined,
    status: (row.status as WhatsAppInstance['status']) || 'disconnected',
    profilePic: (row.profile_pic as string) || undefined,
    messagesToday: (row.messages_today as number) ?? 0,
    isDefault: (row.is_default as boolean) ?? false,
    batteryLevel: (row.battery_level as number) || undefined,
    lastConnected: displayLastConnected,
  };
}

function getWebhookUrl(): string {
  // Use env var se definido; caso contrário, usa o domínio direto da Vercel
  // (evita problemas de DNS onde www.lojinha.my ainda pode apontar para Hostinger)
  const envUrl = import.meta.env.VITE_WEBHOOK_URL as string | undefined;
  if (envUrl) return envUrl;
  return 'https://lojinha-seven-chi.vercel.app/api/webhook';
}

export const evolutionService = {
  // ----------------------------------------------------------------
  // Instance management
  // ----------------------------------------------------------------

  /** Lista todas as instâncias da loja a partir do Supabase com sincronização live da Evolution GO */
  async getInstances(storeId: string): Promise<WhatsAppInstance[]> {
    const { data: rows, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Evolution] Error fetching instances from Supabase:', error.message);
      return [];
    }

    // Live sync com Evolution GO
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/all`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });
      if (res.ok) {
        const json = await res.json();
        const liveList: any[] = json?.data || json || [];
        for (const live of liveList) {
          if (live.id && live.token) {
            tokenCache.set(live.id, live.token);
          }
          const matchingRow = rows?.find((r) => r.id === live.id);
          if (matchingRow && live.connected && matchingRow.status !== 'connected') {
            const cleanPhone = live.jid ? '+' + live.jid.split('@')[0].split(':')[0] : matchingRow.phone;
            matchingRow.status = 'connected';
            matchingRow.phone = cleanPhone;
            await supabase
              .from('whatsapp_instances')
              .update({ status: 'connected', phone: cleanPhone })
              .eq('id', live.id);
          }
        }
      }
    } catch {}

    return (rows || []).map(mapRow);
  },

  /** Cria nova instância diretamente no Evolution GO e persiste no Supabase */
  async createInstance(storeId: string, name: string): Promise<WhatsAppInstance> {
    const generatedToken =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'tok_' + Math.random().toString(36).substring(2) + Date.now();

    // 1. Criar instância na Evolution GO
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        name: name.trim(),
        token: generatedToken,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(
        errBody.error || errBody.message || `Erro ${res.status}: Falha ao criar instância na Evolution GO`
      );
    }

    const resJson = await res.json();
    const created = resJson?.data || resJson;
    const instanceId = created.id || generatedToken;
    const instanceToken = created.token || generatedToken;

    tokenCache.set(instanceId, instanceToken);

    // 2. Salvar registro na tabela whatsapp_instances do Supabase
    const payload = {
      id: instanceId,
      store_id: storeId,
      name: name.trim(),
      phone: null,
      status: 'disconnected',
      messages_today: 0,
      is_default: true,
      last_connected: JSON.stringify({
        token: instanceToken,
        createdAt: new Date().toISOString(),
      }),
    };

    const { error: dbError } = await supabase.from('whatsapp_instances').insert([payload]);
    if (dbError) {
      console.warn('[Evolution] Supabase insert warning:', dbError.message);
    }

    // 3. Iniciar conexão configurando o Webhook da Vercel para receber mensagens
    const webhookUrl = getWebhookUrl();
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: instanceToken,
        },
        body: JSON.stringify({
          webhookUrl,
          subscribe: ['ALL'],
          immediate: true,
        }),
      });
    } catch {}

    return mapRow(payload);
  },

  /** Busca QR Code atual (base64 PNG e código de pareamento) diretamente da Evolution GO */
  async getQrCode(instanceId: string): Promise<{ qrcode: string; code: string } | null> {
    const token = await getInstanceToken(instanceId);
    if (!token) return null;

    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/qr`, {
        headers: { apikey: token },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const data = json?.data || json;
      if (data?.qrcode) {
        return {
          qrcode: data.qrcode,
          code: data.code || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /** Força reconexão — aciona connect com Webhook e busca QR Code diretamente da Evolution GO */
  async reconnectInstance(instanceId: string): Promise<{ ok: boolean; qrcode?: string; code?: string; connected?: boolean }> {
    const token = await getInstanceToken(instanceId);
    if (!token) return { ok: false };

    const webhookUrl = getWebhookUrl();
    try {
      const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: token,
        },
        body: JSON.stringify({
          webhookUrl,
          subscribe: ['ALL'],
          immediate: true,
        }),
      });

      // Polling rápido para pegar o novo QR recém-gerado
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const qr = await this.getQrCode(instanceId);
        if (qr && qr.qrcode) {
          return {
            ok: true,
            qrcode: qr.qrcode,
            code: qr.code,
          };
        }
      }

      return { ok: true };
    } catch {
      return { ok: false };
    }
  },

  /** Pausa a conexão (mantém sessão — retomar sem QR) */
  async pauseInstance(instanceId: string): Promise<void> {
    const token = await getInstanceToken(instanceId);
    if (token) {
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/disconnect`, {
          method: 'POST',
          headers: { apikey: token },
        });
      } catch {}
    }
    await supabase
      .from('whatsapp_instances')
      .update({ status: 'paused' })
      .eq('id', instanceId);
  },

  /** Gera código de pareamento numérico por número de telefone */
  async getPairingCode(instanceId: string, phone: string): Promise<string> {
    const token = await getInstanceToken(instanceId);
    if (!token) throw new Error('Token da instância não encontrado.');

    const cleanPhone = phone.replace(/\D/g, '');
    const res = await fetch(`${EVOLUTION_API_URL}/instance/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: token,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        subscribe: ['ALL'],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Falha ao solicitar código de pareamento');
    }

    const json = await res.json();
    return json?.data?.PairingCode || json?.PairingCode || '';
  },

  /** Apaga instância da Evolution GO e do Supabase */
  async deleteInstance(storeId: string, instanceId: string): Promise<void> {
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceId}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_API_KEY },
      });
    } catch {}

    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);
    
    tokenCache.delete(instanceId);
  },

  /** Desconecta o WhatsApp (logout) sem apagar a instância */
  async logoutInstance(storeId: string, instanceId: string): Promise<void> {
    const token = await getInstanceToken(instanceId);
    if (token) {
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/logout`, {
          method: 'DELETE',
          headers: { apikey: token },
        });
      } catch {}
    }

    await supabase
      .from('whatsapp_instances')
      .update({ status: 'disconnected', phone: null })
      .eq('id', instanceId);
  },

  /** Define uma instância como padrão */
  async setDefault(storeId: string, instanceId: string): Promise<void> {
    await supabase
      .from('whatsapp_instances')
      .update({ is_default: false })
      .eq('store_id', storeId);

    await supabase
      .from('whatsapp_instances')
      .update({ is_default: true })
      .eq('id', instanceId);
  },

  // ----------------------------------------------------------------
  // Envio de mensagens
  // ----------------------------------------------------------------

  /** Envia mensagem de texto para o WhatsApp do cliente */
  async sendText(phone: string, text: string, instanceId?: string, storeId?: string): Promise<{ ok: boolean; whatsappMessageId?: string }> {
    let token: string | null = null;
    if (instanceId) {
      token = await getInstanceToken(instanceId);
    }

    if (!token && storeId) {
      const instances = await this.getInstances(storeId);
      const connected = instances.find((i) => i.status === 'connected') || instances[0];
      if (connected) {
        token = await getInstanceToken(connected.id);
      }
    }

    if (!token) {
      throw new Error('Nenhuma instância WhatsApp ativa para enviar a mensagem.');
    }

    const cleanNumber = phone.replace(/\D/g, '');
    const res = await fetch(`${EVOLUTION_API_URL}/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: token,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Falha ao enviar mensagem no WhatsApp');
    }

    const json = await res.json();
    return {
      ok: true,
      whatsappMessageId: json?.data?.id || json?.id,
    };
  },

  /** Envia mídia (foto, áudio, vídeo) para o WhatsApp do cliente */
  async sendMedia(
    phone: string,
    mediaUrl: string,
    type: 'image' | 'audio' | 'video' | 'document' = 'image',
    caption?: string,
    instanceId?: string,
    storeId?: string
  ): Promise<{ ok: boolean; mediaUrl?: string; whatsappMessageId?: string }> {
    let token: string | null = null;
    if (instanceId) {
      token = await getInstanceToken(instanceId);
    }

    if (!token && storeId) {
      const instances = await this.getInstances(storeId);
      const connected = instances.find((i) => i.status === 'connected') || instances[0];
      if (connected) {
        token = await getInstanceToken(connected.id);
      }
    }

    if (!token) {
      throw new Error('Nenhuma instância WhatsApp ativa para enviar a mídia.');
    }

    const cleanNumber = phone.replace(/\D/g, '');
    let mimetype = 'image/jpeg';
    if (type === 'video') mimetype = 'video/mp4';
    else if (type === 'audio') mimetype = 'audio/ogg';

    const payload: Record<string, unknown> = {
      number: cleanNumber,
      url: mediaUrl,
      type,
      mimetype,
    };
    if (caption && caption.trim()) payload.caption = caption.trim();

    const res = await fetch(`${EVOLUTION_API_URL}/send/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: token,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || 'Falha ao enviar mídia no WhatsApp');
    }

    const json = await res.json();
    return {
      ok: true,
      mediaUrl,
      whatsappMessageId: json?.data?.id || json?.id,
    };
  },

  /** Apaga mensagem para todos no WhatsApp via Evolution GO */
  async deleteMessage(
    messageDbId: string,
    whatsappMessageId?: string,
    instanceId?: string,
    storeId?: string
  ): Promise<void> {
    if (!whatsappMessageId) return;

    let token: string | null = null;
    if (instanceId) {
      token = await getInstanceToken(instanceId);
    }

    if (!token && storeId) {
      const instances = await this.getInstances(storeId);
      const connected = instances.find((i) => i.status === 'connected') || instances[0];
      if (connected) {
        token = await getInstanceToken(connected.id);
      }
    }

    if (token) {
      try {
        await fetch(`${EVOLUTION_API_URL}/message/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: token,
          },
          body: JSON.stringify({
            messageId: whatsappMessageId,
          }),
        });
      } catch {}
    }
  },
};
