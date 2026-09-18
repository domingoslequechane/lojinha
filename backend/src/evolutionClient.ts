import axios, { AxiosInstance } from 'axios';

export interface EvolutionGoInstance {
  id: string;
  name: string;
  token: string;
  connected: boolean;
  jid?: string;
  qrcode?: string;
  createdAt?: string;
}

export interface EvolutionGoQrResponse {
  qrcode: string; // "data:image/png;base64,..."
  code: string;
  passkeyStage?: string;
  passkeyOpenUrl?: string;
  passkeyCode?: string;
}

export class EvolutionClient {
  private baseUrl: string;
  private globalApiKey: string;

  constructor(baseUrl: string, globalApiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.globalApiKey = globalApiKey;
  }

  private client(apiKey?: string, timeoutMs: number = 60000): AxiosInstance {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        apikey: apiKey ?? this.globalApiKey,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }

  // ----------------------------------------------------------------
  // Server-level Operations (usa GLOBAL_API_KEY)
  // ----------------------------------------------------------------

  /** Lista todas as instâncias no servidor Evolution GO */
  async getAllInstances(): Promise<EvolutionGoInstance[]> {
    const { data } = await this.client(this.globalApiKey).get('/instance/all');
    return data?.data ?? [];
  }

  /** Cria uma nova instância no Evolution GO */
  async createInstance(name: string, token: string): Promise<EvolutionGoInstance> {
    const { data } = await this.client(this.globalApiKey).post('/instance/create', {
      name,
      token,
    });
    return data?.data;
  }

  /** Remove uma instância pelo seu UUID */
  async deleteInstance(instanceId: string): Promise<void> {
    await this.client(this.globalApiKey).delete(`/instance/delete/${instanceId}`);
  }

  // ----------------------------------------------------------------
  // Instance-level Operations (usa o TOKEN da instância)
  // ----------------------------------------------------------------

  /** Conecta a instância e configura o webhook */
  async connectInstance(
    instanceToken: string,
    webhookUrl: string,
    phone?: string
  ): Promise<{ jid?: string; eventString?: string }> {
    const body: Record<string, unknown> = {
      webhookUrl,
      subscribe: ['ALL'],
      immediate: true,
    };
    if (phone) {
      body.phone = this.normalizePhone(phone);
    }

    const { data } = await this.client(instanceToken).post('/instance/connect', body);
    return data?.data;
  }

  /** Busca o QR Code atual diretamente da Evolution GO */
  async getQrCode(instanceToken: string): Promise<EvolutionGoQrResponse | null> {
    try {
      const { data } = await this.client(instanceToken).get('/instance/qr');
      if (data?.data?.qrcode) {
        return {
          qrcode: data.data.qrcode,
          code: data.data.code ?? '',
          passkeyStage: data.data.passkeyStage,
          passkeyOpenUrl: data.data.passkeyOpenUrl,
          passkeyCode: data.data.passkeyCode,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Solicita código de pareamento numérico para o número de telefone */
  async getPairingCode(instanceToken: string, phone: string): Promise<string> {
    const normalized = this.normalizePhone(phone);
    const { data } = await this.client(instanceToken).post('/instance/pair', {
      phone: normalized,
      subscribe: ['ALL'],
    });
    return data?.data?.PairingCode ?? '';
  }

  /** Suspende a conexão sem apagar a sessão (permite retomar sem QR) */
  async disconnectInstance(instanceToken: string): Promise<void> {
    await this.client(instanceToken).post('/instance/disconnect');
  }

  /** Desconecta a instância (logout do WhatsApp) */
  async logoutInstance(instanceToken: string): Promise<void> {
    await this.client(instanceToken).delete('/instance/logout');
  }

  // ----------------------------------------------------------------
  // Mensagens
  // ----------------------------------------------------------------

  /** Envia mensagem de texto para um número */
  async sendText(instanceToken: string, to: string, text: string): Promise<unknown> {
    const number = this.normalizePhone(to);
    const { data } = await this.client(instanceToken).post('/send/text', {
      number,
      text,
    });
    return data;
  }

  /** Envia mídia (imagem, áudio, vídeo, documento) via Evolution GO */
  async sendMedia(
    instanceToken: string,
    to: string,
    mediaUrlOrBase64: string,
    type: 'image' | 'audio' | 'video' | 'document' = 'image',
    caption?: string,
    mimetype?: string,
    fileName?: string
  ): Promise<unknown> {
    const number = this.normalizePhone(to);

    let detectedMime = mimetype;
    let cleanUrlOrBase64 = mediaUrlOrBase64;

    if (mediaUrlOrBase64.startsWith('data:')) {
      const match = mediaUrlOrBase64.match(/^data:([^;]+);base64,/);
      if (match && !detectedMime) {
        detectedMime = match[1];
      }
      if (cleanUrlOrBase64.includes(';base64,')) {
        cleanUrlOrBase64 = cleanUrlOrBase64.split(';base64,')[1];
      }
    }

    if (!detectedMime) {
      if (type === 'video') detectedMime = 'video/mp4';
      else if (type === 'audio') detectedMime = 'audio/ogg';
      else if (type === 'image') detectedMime = 'image/jpeg';
      else detectedMime = 'application/octet-stream';
    }

    const payload: Record<string, unknown> = {
      number,
      url: cleanUrlOrBase64,
      type,
      mimetype: detectedMime,
    };
    if (caption && caption.trim()) {
      payload.caption = caption.trim();
    }
    if (fileName && fileName.trim()) {
      payload.fileName = fileName.trim();
    }

    console.log(`[Evolution] Sending ${type} to ${number} (payload length: ${cleanUrlOrBase64.length}, mimetype: ${detectedMime})...`);
    const { data } = await this.client(instanceToken, 180000).post('/send/media', payload);
    console.log(`[Evolution] ${type} dispatched successfully to ${number}.`);
    return data;
  }


  /** Apaga mensagem para todos no WhatsApp via Evolution GO (POST /message/delete) */
  async deleteMessage(
    instanceToken: string,
    to: string,
    whatsappMessageId: string
  ): Promise<unknown> {
    const number = this.normalizePhone(to);
    const chatJid = `${number}@s.whatsapp.net`;
    console.log(`[Evolution] Revoking message ${whatsappMessageId} in chat ${chatJid}...`);

    try {
      const { data } = await this.client(instanceToken).post('/message/delete', {
        chat: chatJid,
        messageId: whatsappMessageId,
      });
      console.log(`[Evolution] Message ${whatsappMessageId} revoked successfully via chatJid:`, data);
      return data;
    } catch (err: any) {
      console.warn(`[Evolution] /message/delete failed with chatJid (${err.response?.status || err.message}), trying plain number...`);
      const { data } = await this.client(instanceToken).post('/message/delete', {
        chat: number,
        messageId: whatsappMessageId,
      });
      console.log(`[Evolution] Message ${whatsappMessageId} revoked successfully via number:`, data);
      return data;
    }
  }

  // ----------------------------------------------------------------
  // Contact Info
  // ----------------------------------------------------------------

  /** Busca a URL do avatar/foto de perfil de um contacto no WhatsApp */
  async getContactAvatar(instanceToken: string, phone: string): Promise<string | null> {
    try {
      const number = this.normalizePhone(phone);
      const { data } = await this.client(instanceToken, 30000).post('/user/avatar', {
        number,
        preview: false,
      });
      // The response shape may vary; try common paths
      return data?.data?.url || data?.url || data?.data?.profilePictureUrl || null;
    } catch {
      return null;
    }
  }

  /** Busca a lista de contactos do WhatsApp (inclui mapeamento de LIDs para nomes/números) */
  async getContacts(instanceToken: string): Promise<Array<{ Jid: string; PushName?: string; FirstName?: string; FullName?: string; BusinessName?: string }>> {
    try {
      const { data } = await this.client(instanceToken, 15000).get('/user/contacts');
      return data?.data || data || [];
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
