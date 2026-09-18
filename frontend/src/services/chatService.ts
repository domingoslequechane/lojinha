import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { DEFAULT_STORE_ID } from './kanbanService';

export const chatService = {
  // Fetch messages for a specific lead, limited to last 50 for free-tier database efficiency
  async getMessages(leadId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages from Supabase:', error);
      return [];
    }

    return (data || []).map((m) => ({
      id: m.id,
      contactId: m.lead_id,
      fromMe: m.from_me,
      type: m.type,
      text: m.text,
      mediaUrl: m.media_url,
      mediaCaption: m.media_caption,
      audioDuration: m.audio_duration,
      timestamp: m.timestamp,
      fullDate: m.full_date,
      status: m.status,
      createdAt: m.created_at,
      whatsappMessageId: m.whatsapp_message_id,
      deletedAt: m.deleted_at,
    }));
  },

  // Send a message and update lead's last_message
  async sendMessage(
    leadId: string,
    message: Omit<ChatMessage, 'id'>,
    storeId: string = DEFAULT_STORE_ID
  ): Promise<ChatMessage | null> {
    const safeMediaUrl = message.mediaUrl ?? null;

    const payload = {
      store_id: storeId || DEFAULT_STORE_ID,
      lead_id: leadId,
      from_me: Boolean(message.fromMe),
      type: message.type || 'text',
      text: message.text ?? null,
      media_url: safeMediaUrl,
      media_caption: message.mediaCaption ?? null,
      audio_duration: message.audioDuration ?? null,
      timestamp: message.timestamp || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      full_date: message.fullDate || 'Hoje',
      status: message.status || 'sent',
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[chatService] Erro ao salvar mensagem no Supabase:', error);
      return null;
    }

    // Update lead's last message timestamp & preview asynchronously
    await supabase
      .from('leads')
      .update({
        last_message: message.text || (message.type === 'image' ? 'Foto enviada' : message.type === 'video' ? 'Vídeo enviado' : message.type === 'audio' ? 'Áudio enviado' : 'Mensagem enviada'),
        last_message_time: message.timestamp,
        last_message_timestamp: Date.now(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    return {
      id: data.id,
      contactId: data.lead_id,
      fromMe: data.from_me,
      type: data.type,
      text: data.text,
      mediaUrl: data.media_url,
      mediaCaption: data.media_caption,
      audioDuration: data.audio_duration,
      timestamp: data.timestamp,
      fullDate: data.full_date,
      status: data.status,
      createdAt: data.created_at,
      whatsappMessageId: data.whatsapp_message_id,
      deletedAt: data.deleted_at,
    };
  },

  // Mark all unread messages for a lead as read
  async markAsRead(leadId: string): Promise<void> {
    await supabase
      .from('leads')
      .update({ unread_count: 0 })
      .eq('id', leadId);

    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('lead_id', leadId)
      .eq('from_me', false);
  },
};
