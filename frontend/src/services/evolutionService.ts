/**
 * evolutionService.ts
 * 
 * Serviço do frontend para comunicar com o backend Lojinha (Node.js/Express),
 * que por sua vez chama a Evolution API / Evolution GO de forma segura.
 */

import { WhatsAppInstance } from '../types';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:3001';
const INTERNAL_SECRET = (import.meta.env.VITE_INTERNAL_SECRET as string) ?? '';

function headers(storeId?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_SECRET,
  };
  if (storeId) h['x-store-id'] = storeId;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
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

export const evolutionService = {
  // ----------------------------------------------------------------
  // Instance management
  // ----------------------------------------------------------------

  /** Lista todas as instâncias da loja a partir do Supabase (via backend com sync live) */
  async getInstances(storeId: string): Promise<WhatsAppInstance[]> {
    const res = await fetch(`${BACKEND_URL}/api/instances`, {
      headers: headers(storeId),
    });
    const rows = await handleResponse<Record<string, unknown>[]>(res);
    return rows.map(mapRow);
  },

  /** Cria nova instância no Evolution GO e persiste no Supabase */
  async createInstance(storeId: string, name: string): Promise<WhatsAppInstance> {
    const res = await fetch(`${BACKEND_URL}/api/instances`, {
      method: 'POST',
      headers: headers(storeId),
      body: JSON.stringify({ name }),
    });
    const row = await handleResponse<Record<string, unknown>>(res);
    return mapRow(row);
  },

  /** Busca QR Code atual (base64 PNG e código de pareamento) para uma instância */
  async getQrCode(instanceId: string): Promise<{ qrcode: string; code: string } | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/qrcode`, {
        headers: headers(),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { qrcode: string; code: string };
      return data;
    } catch {
      return null;
    }
  },

  /** Força reconexão — backend poleia QR e devolve diretamente */
  async reconnectInstance(instanceId: string): Promise<{ ok: boolean; qrcode?: string; code?: string; connected?: boolean }> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/reconnect`, {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) return { ok: false };
      return await res.json();
    } catch {
      return { ok: false };
    }
  },

  /** Pausa a conexão (mantém sessão — retomar sem QR) */
  async pauseInstance(instanceId: string): Promise<void> {
    await fetch(`${BACKEND_URL}/api/instances/${instanceId}/pause`, {
      method: 'POST',
      headers: headers(),
    });
  },


  /** Gera código de pareamento numérico por número de telefone */
  async getPairingCode(instanceId: string, phone: string): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/pairing-code`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ phone }),
    });
    const data = await handleResponse<{ code: string }>(res);
    return data.code;
  },

  /** Apaga instância da Evolution GO e do Supabase */
  async deleteInstance(storeId: string, instanceId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}`, {
      method: 'DELETE',
      headers: headers(storeId),
    });
    await handleResponse<unknown>(res);
  },

  /** Desconecta o WhatsApp (logout) sem apagar a instância */
  async logoutInstance(storeId: string, instanceId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/logout`, {
      method: 'POST',
      headers: headers(storeId),
    });
    await handleResponse<unknown>(res);
  },

  /** Define uma instância como padrão */
  async setDefault(storeId: string, instanceId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/set-default`, {
      method: 'PATCH',
      headers: headers(storeId),
    });
    await handleResponse<unknown>(res);
  },

  // ----------------------------------------------------------------
  // Envio de mensagens
  // ----------------------------------------------------------------

  /** Envia mensagem de texto para o WhatsApp do cliente */
  async sendText(phone: string, text: string, instanceId?: string, storeId?: string): Promise<{ ok: boolean; whatsappMessageId?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/messages/send-text`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ phone, text, instanceId, storeId }),
    });
    return await handleResponse<{ ok: boolean; whatsappMessageId?: string }>(res);
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
    const res = await fetch(`${BACKEND_URL}/api/messages/send-media`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ phone, mediaUrl, type, caption, instanceId, storeId }),
    });
    return await handleResponse<{ ok: boolean; mediaUrl?: string; whatsappMessageId?: string }>(res);
  },

  /** Apaga mensagem para todos — revoga no WhatsApp e marca como deletada na BD */
  async deleteMessage(
    messageDbId: string,
    whatsappMessageId?: string,
    instanceId?: string,
    storeId?: string
  ): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/messages/delete`, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ messageDbId, whatsappMessageId, instanceId, storeId }),
    });
    await handleResponse<unknown>(res);
  },
};
