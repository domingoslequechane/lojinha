import { supabase } from '../lib/supabase';
import { KanbanColumn, ContactLead, StageHistoryEntry } from '../types';

export const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(id?: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export interface SaveColumnsResult {
  success: boolean;
  columns: KanbanColumn[];
  deletedColumnIds: string[];
  fallbackColumnId?: string;
  error?: string;
}

export const kanbanService = {
  // Fetch columns ordered by order_index
  async getColumns(storeId: string = DEFAULT_STORE_ID): Promise<KanbanColumn[]> {
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('store_id', storeId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching kanban columns:', error);
      return [];
    }

    return (data || []).map((col) => ({
      id: col.id,
      title: col.title,
      color: col.color,
      order: col.order_index,
      slaHours: col.sla_hours,
      defaultTemplateId: col.default_template_id,
    }));
  },

  // Save/reorder/delete/create columns permanently for a specific tenant store
  async saveColumns(
    columns: KanbanColumn[],
    storeId: string = DEFAULT_STORE_ID
  ): Promise<SaveColumnsResult> {
    try {
      if (!columns || columns.length === 0) {
        return { success: false, columns: [], deletedColumnIds: [], error: 'Pelo menos uma etapa é necessária' };
      }

      // 1. Normalize each column with valid UUID and order
      const normalizedColumns: KanbanColumn[] = columns.map((col, idx) => ({
        ...col,
        id: isValidUUID(col.id) ? col.id : generateUUID(),
        order: idx,
        slaHours: Number(col.slaHours) || 24,
        title: col.title.trim(),
      }));

      const activeIds = new Set(normalizedColumns.map((c) => c.id));
      const fallbackColumnId = normalizedColumns[0].id;

      // 2. Fetch existing columns in DB for this store to detect deletions
      const { data: existingRows, error: fetchErr } = await supabase
        .from('kanban_columns')
        .select('id')
        .eq('store_id', storeId);

      if (fetchErr) {
        console.error('Error fetching existing columns for store:', fetchErr);
      }

      const existingDbIds = (existingRows || []).map((r) => r.id);
      const deletedColumnIds = existingDbIds.filter((id) => !activeIds.has(id));

      // 3. Handle deletions:
      if (deletedColumnIds.length > 0) {
        // A) Safely reassign any leads in the deleted columns to the fallback column
        const { error: reassignErr } = await supabase
          .from('leads')
          .update({
            column_id: fallbackColumnId,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', storeId)
          .in('column_id', deletedColumnIds);

        if (reassignErr) {
          console.warn('Warning reassigning leads before deleting column:', reassignErr);
        }

        // B) Delete the removed columns from kanban_columns
        const { error: delErr } = await supabase
          .from('kanban_columns')
          .delete()
          .eq('store_id', storeId)
          .in('id', deletedColumnIds);

        if (delErr) {
          console.error('Error deleting removed kanban columns:', delErr);
        }
      }

      // 4. Upsert all normalized columns (every item has a valid UUID)
      const upsertData = normalizedColumns.map((col) => ({
        id: col.id,
        store_id: storeId,
        title: col.title,
        color: col.color,
        order_index: col.order,
        sla_hours: col.slaHours,
        default_template_id: col.defaultTemplateId || null,
      }));

      const { data: upsertedRows, error: upsertErr } = await supabase
        .from('kanban_columns')
        .upsert(upsertData)
        .select();

      if (upsertErr) {
        console.error('Error upserting kanban columns:', upsertErr);
        return {
          success: false,
          columns: normalizedColumns,
          deletedColumnIds,
          error: upsertErr.message,
        };
      }

      // 5. Build final returned columns list ordered by order_index
      const finalColumns: KanbanColumn[] = (upsertedRows && upsertedRows.length > 0)
        ? upsertedRows
            .sort((a, b) => a.order_index - b.order_index)
            .map((col) => ({
              id: col.id,
              title: col.title,
              color: col.color,
              order: col.order_index,
              slaHours: col.sla_hours,
              defaultTemplateId: col.default_template_id,
            }))
        : normalizedColumns;

      return {
        success: true,
        columns: finalColumns,
        deletedColumnIds,
        fallbackColumnId,
      };
    } catch (err: any) {
      console.error('Exception in saveColumns:', err);
      return {
        success: false,
        columns,
        deletedColumnIds: [],
        error: err?.message || 'Erro inesperado ao salvar etapas',
      };
    }
  },

  // Fetch leads with column mapping
  async getLeads(storeId: string = DEFAULT_STORE_ID): Promise<ContactLead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      avatar: l.avatar || undefined,
      columnId: l.column_id,
      unreadCount: l.unread_count || 0,
      lastMessage: l.last_message || '',
      lastMessageTime: l.last_message_time || 'Agora',
      lastMessageTimestamp: Number(l.last_message_timestamp) || Date.now(),
      dealValue: Number(l.deal_value) || 0,
      tags: l.tags || [],
      location: l.location,
      childInfo: l.child_info,
      productInterest: l.product_interest,
      followUpDate: l.follow_up_date,
      followUpNotes: l.follow_up_notes,
      assignedTo: l.assigned_to,
      stageHistory: (l.stage_history as StageHistoryEntry[]) || [],
    }));
  },

  // Create lead in Supabase
  async createLead(lead: Partial<ContactLead>, storeId: string = DEFAULT_STORE_ID): Promise<ContactLead | null> {
    const now = Date.now();
    const payload = {
      store_id: storeId,
      column_id: lead.columnId,
      name: lead.name,
      phone: lead.phone,
      avatar: lead.avatar,
      deal_value: lead.dealValue || 0,
      tags: lead.tags || [],
      location: lead.location,
      child_info: lead.childInfo,
      product_interest: lead.productInterest,
      last_message: lead.lastMessage || 'Contato cadastrado',
      last_message_time: 'Agora',
      last_message_timestamp: now,
      unread_count: lead.unreadCount !== undefined ? lead.unreadCount : 0,
      follow_up_date: lead.followUpDate,
      follow_up_notes: lead.followUpNotes,
      stage_history: lead.stageHistory || [],
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      columnId: data.column_id,
      unreadCount: data.unread_count,
      lastMessage: data.last_message,
      lastMessageTime: data.last_message_time,
      lastMessageTimestamp: Number(data.last_message_timestamp),
      dealValue: Number(data.deal_value),
      tags: data.tags || [],
      location: data.location,
      childInfo: data.child_info,
      productInterest: data.product_interest,
      followUpDate: data.follow_up_date,
      followUpNotes: data.follow_up_notes,
      assignedTo: data.assigned_to,
      stageHistory: data.stage_history || [],
    };
  },

  // Move lead to target column with stage history entry
  async moveLeadColumn(
    leadId: string,
    targetColumnId: string,
    historyEntry?: StageHistoryEntry,
    currentHistory: StageHistoryEntry[] = []
  ): Promise<boolean> {
    const updatedHistory = historyEntry ? [...currentHistory, historyEntry] : currentHistory;

    const { error } = await supabase
      .from('leads')
      .update({
        column_id: targetColumnId,
        stage_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error moving lead column in Supabase:', error);
      return false;
    }
    return true;
  },

  // Update lead follow up
  async updateFollowUp(leadId: string, followUpDate?: string, followUpNotes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating follow-up in Supabase:', error);
      return false;
    }
    return true;
  },

  // Update lead notes directly
  async updateLeadNotes(leadId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead notes in Supabase:', error);
      return false;
    }
    return true;
  },

  // Update customer information in Supabase
  async updateLead(leadId: string, updates: Partial<ContactLead>): Promise<ContactLead | null> {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone.trim();
    if (updates.columnId !== undefined) payload.column_id = updates.columnId;
    if (updates.dealValue !== undefined) payload.deal_value = Number(updates.dealValue) || 0;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.location !== undefined) payload.location = updates.location?.trim() || null;
    if (updates.childInfo !== undefined) payload.child_info = updates.childInfo?.trim() || null;
    if (updates.productInterest !== undefined) payload.product_interest = updates.productInterest?.trim() || null;
    if (updates.followUpNotes !== undefined) payload.follow_up_notes = updates.followUpNotes?.trim() || null;
    if (updates.followUpDate !== undefined) payload.follow_up_date = updates.followUpDate || null;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar || null;

    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', leadId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error updating lead in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar || undefined,
      columnId: data.column_id,
      unreadCount: data.unread_count || 0,
      lastMessage: data.last_message || '',
      lastMessageTime: data.last_message_time || 'Agora',
      lastMessageTimestamp: Number(data.last_message_timestamp) || Date.now(),
      dealValue: Number(data.deal_value) || 0,
      tags: data.tags || [],
      location: data.location || undefined,
      childInfo: data.child_info || undefined,
      productInterest: data.product_interest || undefined,
      followUpDate: data.follow_up_date || undefined,
      followUpNotes: data.follow_up_notes || undefined,
      assignedTo: data.assigned_to || undefined,
      stageHistory: data.stage_history || [],
    };
  },

  // Delete lead in cascade (messages first, then lead)
  async deleteLead(leadId: string): Promise<boolean> {
    try {
      // 1. Delete associated messages first
      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .eq('lead_id', leadId);

      if (msgErr) {
        console.warn('Warning deleting associated messages for lead:', msgErr.message);
      }

      // 2. Delete the lead
      const { error: leadErr } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (leadErr) {
        console.error('Error deleting lead from Supabase:', leadErr.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Cascade delete error:', err);
      return false;
    }
  },

  // Batch delete leads in cascade
  async deleteMultipleLeads(leadIds: string[]): Promise<{ success: number; failed: number }> {
    if (!leadIds || leadIds.length === 0) return { success: 0, failed: 0 };
    try {
      // 1. Delete associated messages first
      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .in('lead_id', leadIds);

      if (msgErr) {
        console.warn('Warning batch deleting associated messages:', msgErr.message);
      }

      // 2. Delete leads
      const { error: leadErr } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (leadErr) {
        console.error('Error batch deleting leads:', leadErr.message);
        return { success: 0, failed: leadIds.length };
      }

      return { success: leadIds.length, failed: 0 };
    } catch (err) {
      console.error('Batch delete exception:', err);
      return { success: 0, failed: leadIds.length };
    }
  },
};
