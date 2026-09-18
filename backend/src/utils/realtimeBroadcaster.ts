import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

let globalChannel: RealtimeChannel | null = null;

function getChannel(): RealtimeChannel {
  if (!globalChannel) {
    globalChannel = supabase.channel('lojinha-realtime-global', {
      config: {
        broadcast: { ack: false },
      },
    });

    globalChannel.subscribe((status) => {
      console.log(`[Backend Realtime Broadcaster] Channel status: ${status}`);
    });
  }
  return globalChannel;
}

export const realtimeBroadcaster = {
  /**
   * Broadcast a new or incoming message instantly to all connected CRM clients.
   */
  async broadcastMessage(storeId: string, message: any, lead?: any) {
    try {
      const channel = getChannel();
      await channel.send({
        type: 'broadcast',
        event: 'message:new',
        payload: {
          storeId,
          message,
          lead,
        },
      });
      console.log(`[RealtimeBroadcaster] Broadcasted message:new for lead ${message.lead_id || message.contactId}`);
    } catch (err) {
      console.error('[RealtimeBroadcaster] Failed to broadcast message:new:', err);
    }
  },

  /**
   * Broadcast a lead created, updated or moved.
   */
  async broadcastLead(storeId: string, lead: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE') {
    try {
      const channel = getChannel();
      await channel.send({
        type: 'broadcast',
        event: 'lead:change',
        payload: {
          storeId,
          eventType,
          lead,
        },
      });
      console.log(`[RealtimeBroadcaster] Broadcasted lead:change (${eventType}) for lead ${lead.id || lead.name}`);
    } catch (err) {
      console.error('[RealtimeBroadcaster] Failed to broadcast lead:change:', err);
    }
  },

  /**
   * Broadcast receipt updates (delivered / read status ticks).
   */
  async broadcastReceipt(storeId: string, phone: string, leadId: string, status: 'delivered' | 'read') {
    try {
      const channel = getChannel();
      await channel.send({
        type: 'broadcast',
        event: 'receipt:update',
        payload: {
          storeId,
          phone,
          leadId,
          status,
        },
      });
      console.log(`[RealtimeBroadcaster] Broadcasted receipt:update (${status}) for ${phone}`);
    } catch (err) {
      console.error('[RealtimeBroadcaster] Failed to broadcast receipt:update:', err);
    }
  },

  /**
   * Broadcast message deletion.
   */
  async broadcastMessageDeleted(storeId: string, messageId: string, leadId: string) {
    try {
      const channel = getChannel();
      await channel.send({
        type: 'broadcast',
        event: 'message:deleted',
        payload: {
          storeId,
          messageId,
          leadId,
        },
      });
      console.log(`[RealtimeBroadcaster] Broadcasted message:deleted for msg ${messageId}`);
    } catch (err) {
      console.error('[RealtimeBroadcaster] Failed to broadcast message:deleted:', err);
    }
  },
};
