import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEFAULT_STORE_ID } from './kanbanService';
import { ChatMessage, ContactLead, WhatsAppInstance } from '../types';

export interface RealtimeHandlers {
  onLeadChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; lead: any }) => void;
  onMessageChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; message: ChatMessage; lead?: any }) => void;
  onReceiptUpdate?: (payload: { phone: string; leadId: string; status: 'delivered' | 'read' }) => void;
  onMessageDeleted?: (payload: { messageId: string; leadId: string }) => void;
  onWhatsAppInstanceChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; instance: any }) => void;
  onColumnPipelineToggle?: (payload: { columnId: string; isIncluded: boolean; storeId?: string }) => void;
}

function normalizeChatMessage(m: any): ChatMessage {
  return {
    id: m.id || `msg-${Date.now()}`,
    contactId: m.lead_id || m.contactId || m.contact_id,
    fromMe: Boolean(m.from_me ?? m.fromMe),
    type: m.type || 'text',
    text: m.text ?? undefined,
    mediaUrl: m.media_url || m.mediaUrl || undefined,
    mediaCaption: m.media_caption || m.mediaCaption || undefined,
    audioDuration: m.audio_duration || m.audioDuration || undefined,
    timestamp: m.timestamp || 'Agora',
    fullDate: m.full_date || m.fullDate || 'Hoje',
    status: m.status || (m.from_me ? 'sent' : 'delivered'),
    createdAt: m.created_at || m.createdAt || new Date().toISOString(),
    whatsappMessageId: m.whatsapp_message_id || m.whatsappMessageId,
    deletedAt: m.deleted_at || m.deletedAt,
  };
}

let activeChannel: RealtimeChannel | null = null;
let currentActiveStoreId: string = DEFAULT_STORE_ID;
const registeredHandlers: Set<RealtimeHandlers> = new Set();

function isStoreMatch(eventStoreId?: string): boolean {
  if (!eventStoreId) return true;
  if (!currentActiveStoreId || currentActiveStoreId === DEFAULT_STORE_ID) return true;
  return eventStoreId === currentActiveStoreId;
}

export const realtimeService = {
  /**
   * Subscribe to real-time events for leads, messages, and whatsapp instances.
   * Listens to both zero-latency Supabase Broadcast AND postgres_changes fallback.
   */
  subscribe(handlers: RealtimeHandlers, storeId: string = DEFAULT_STORE_ID): () => void {
    registeredHandlers.add(handlers);
    if (storeId) {
      currentActiveStoreId = storeId;
    }

    if (!activeChannel) {
      activeChannel = supabase
        .channel('lojinha-realtime-global', {
          config: {
            broadcast: { ack: false },
          },
        })
        // -------------------------------------------------------------
        // 1. INSTANT BROADCAST LISTENERS (Sub-50ms latency)
        // -------------------------------------------------------------
        .on('broadcast', { event: 'message:new' }, (eventPayload) => {
          const { message, lead, storeId: evStoreId } = (eventPayload.payload || {}) as any;
          if (!message) return;
          if (!isStoreMatch(evStoreId)) return;
          const normalized = normalizeChatMessage(message);
          registeredHandlers.forEach((h) => {
            try {
              h.onMessageChange?.({ eventType: 'INSERT', message: normalized, lead });
            } catch (err) {
              console.error('[Realtime Broadcast] Error in onMessageChange:', err);
            }
          });
        })
        .on('broadcast', { event: 'lead:change' }, (eventPayload) => {
          const { lead, eventType = 'UPDATE', storeId: evStoreId } = (eventPayload.payload || {}) as any;
          if (!lead) return;
          if (!isStoreMatch(evStoreId)) return;
          registeredHandlers.forEach((h) => {
            try {
              h.onLeadChange?.({ eventType, lead });
            } catch (err) {
              console.error('[Realtime Broadcast] Error in onLeadChange:', err);
            }
          });
        })
        .on('broadcast', { event: 'receipt:update' }, (eventPayload) => {
          const { phone, leadId, status, storeId: evStoreId } = (eventPayload.payload || {}) as any;
          if (!status) return;
          if (!isStoreMatch(evStoreId)) return;
          registeredHandlers.forEach((h) => {
            try {
              h.onReceiptUpdate?.({ phone, leadId, status });
            } catch (err) {
              console.error('[Realtime Broadcast] Error in onReceiptUpdate:', err);
            }
          });
        })
        .on('broadcast', { event: 'message:deleted' }, (eventPayload) => {
          const { messageId, leadId, storeId: evStoreId } = (eventPayload.payload || {}) as any;
          if (!messageId) return;
          if (!isStoreMatch(evStoreId)) return;
          registeredHandlers.forEach((h) => {
            try {
              h.onMessageDeleted?.({ messageId, leadId });
            } catch (err) {
              console.error('[Realtime Broadcast] Error in onMessageDeleted:', err);
            }
          });
        })
        .on('broadcast', { event: 'column:pipeline-toggle' }, (eventPayload) => {
          const { columnId, isIncluded, storeId: evStoreId } = (eventPayload.payload || {}) as any;
          if (!columnId) return;
          if (!isStoreMatch(evStoreId)) return;
          registeredHandlers.forEach((h) => {
            try {
              h.onColumnPipelineToggle?.({ columnId, isIncluded, storeId: evStoreId });
            } catch (err) {
              console.error('[Realtime Broadcast] Error in onColumnPipelineToggle:', err);
            }
          });
        })

        // -------------------------------------------------------------
        // 2. POSTGRES CHANGES LISTENERS (Reliable DB Sync Fallback)
        // -------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
          },
          (payload) => {
            const item = (payload.new || payload.old) as any;
            if (!isStoreMatch(item?.store_id)) return;
            registeredHandlers.forEach((h) => {
              try {
                h.onLeadChange?.({
                  eventType: payload.eventType as any,
                  lead: payload.new || payload.old,
                });
              } catch (err) {
                console.error('[Realtime Postgres] Error in onLeadChange:', err);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const item = (payload.new || payload.old) as any;
            if (!isStoreMatch(item?.store_id)) return;
            const normalized = normalizeChatMessage(item);
            registeredHandlers.forEach((h) => {
              try {
                h.onMessageChange?.({
                  eventType: payload.eventType as any,
                  message: normalized,
                });
              } catch (err) {
                console.error('[Realtime Postgres] Error in onMessageChange:', err);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances',
          },
          (payload) => {
            const item = (payload.new || payload.old) as any;
            registeredHandlers.forEach((h) => {
              try {
                h.onWhatsAppInstanceChange?.({
                  eventType: payload.eventType as any,
                  instance: item,
                });
              } catch (err) {
                console.error('[Realtime Postgres] Error in onWhatsAppInstanceChange:', err);
              }
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('⚡ [Lojinha Realtime] Connected via WebSocket (0ms Broadcast & Postgres Changes)');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn('[Lojinha Realtime] Channel status:', status, err || '');
          }
        });
    }

    return () => {
      registeredHandlers.delete(handlers);
      if (registeredHandlers.size === 0 && activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  },

  /**
   * Broadcasts a column pipeline toggle event to all connected clients immediately (sub-50ms)
   */
  broadcastColumnPipelineToggle(columnId: string, isIncluded: boolean, storeId?: string) {
    if (activeChannel) {
      activeChannel.send({
        type: 'broadcast',
        event: 'column:pipeline-toggle',
        payload: { columnId, isIncluded, storeId },
      });
    }
  },
};
