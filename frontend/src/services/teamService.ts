import { supabase } from '../lib/supabase';
import { StoreMember, ModulePermission } from '../types';

function getLocalCacheKey(storeId: string): string {
  return `lojinha_team_members_${storeId}`;
}

function loadLocalMembers(storeId: string): StoreMember[] {
  try {
    const raw = localStorage.getItem(getLocalCacheKey(storeId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[TeamService] Error loading local members cache:', e);
    return [];
  }
}

function saveLocalMembers(storeId: string, members: StoreMember[]) {
  try {
    localStorage.setItem(getLocalCacheKey(storeId), JSON.stringify(members));
  } catch (e) {
    console.warn('[TeamService] Error saving local members cache:', e);
  }
}

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string) ||
  'https://practical-contentment-production-b0e4.up.railway.app';

export const teamService = {
  /**
   * Obtém todos os membros cadastrados na equipe da loja
   */
  async getTeamMembers(storeId: string): Promise<StoreMember[]> {
    const local = loadLocalMembers(storeId);
    try {
      const { data, error } = await supabase
        .from('store_members')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[TeamService] Could not fetch from store_members table:', error.message);
        return local;
      }

      if (data && data.length > 0) {
        const mapped: StoreMember[] = data.map((row: any) => ({
          id: row.id,
          storeId: row.store_id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role || 'vendedor',
          permissions: (row.permissions || ['cockpit']) as ModulePermission[],
          allowedColumnIds: row.allowed_column_ids || null,
          isActive: row.is_active ?? true,
          createdAt: row.created_at || new Date().toISOString(),
          acceptedAt: row.accepted_at,
        }));
        saveLocalMembers(storeId, mapped);
        return mapped;
      }

      return local;
    } catch (err) {
      console.warn('[TeamService] Network error fetching team members, using cache:', err);
      return local;
    }
  },

  /**
   * Salva ou atualiza um membro da equipe e cria o login correspondente
   */
  async saveTeamMember(
    member: Partial<StoreMember> & { name: string; email: string; password?: string },
    storeId: string
  ): Promise<{ success: boolean; member?: StoreMember; error?: string }> {
    const id = member.id || crypto.randomUUID();
    const now = new Date().toISOString();
    let authUserId = member.userId;

    // Se uma senha foi fornecida para este novo colaborador, cria a conta no Supabase Auth
    if (member.password && member.password.trim().length >= 6) {
      try {
        // 1. Tenta criar pelo backend (admin)
        const resp = await fetch(`${BACKEND_URL}/api/team/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: member.email.trim().toLowerCase(),
            password: member.password.trim(),
            name: member.name.trim(),
            storeId,
            role: member.role || 'vendedor',
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.userId) {
            authUserId = data.userId;
          }
        }
      } catch (backendErr) {
        console.warn('[TeamService] Backend create-user endpoint notice:', backendErr);
      }

      // 2. Fallback de criação direta via Supabase Auth SignUp se ainda não tiver ID
      if (!authUserId) {
        try {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: member.email.trim().toLowerCase(),
            password: member.password.trim(),
            options: {
              data: {
                name: member.name.trim(),
                store_id: storeId,
                role: member.role || 'vendedor',
              },
            },
          });
          if (signUpData?.user) {
            authUserId = signUpData.user.id;
          } else if (signUpErr && !signUpErr.message.includes('already registered')) {
            console.warn('[TeamService] Supabase signUp notice:', signUpErr.message);
          }
        } catch (e) {
          console.warn('[TeamService] Supabase signUp exception:', e);
        }
      }
    }

    const newMember: StoreMember = {
      id,
      storeId,
      userId: authUserId,
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
      phone: member.phone?.trim(),
      role: member.role || 'vendedor',
      permissions: member.permissions || ['cockpit'],
      allowedColumnIds: member.allowedColumnIds ?? null,
      isActive: member.isActive ?? true,
      createdAt: member.createdAt || now,
      acceptedAt: member.acceptedAt,
    };

    // Update local cache immediately (optimistic)
    const local = loadLocalMembers(storeId);
    const existingIndex = local.findIndex((m) => m.id === id || m.email === newMember.email);
    let updatedLocal: StoreMember[];
    if (existingIndex >= 0) {
      updatedLocal = [...local];
      updatedLocal[existingIndex] = { ...updatedLocal[existingIndex], ...newMember };
    } else {
      updatedLocal = [...local, newMember];
    }
    saveLocalMembers(storeId, updatedLocal);

    // Persist to Supabase
    try {
      const payload: any = {
        id: newMember.id,
        store_id: storeId,
        user_id: newMember.userId || null,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone || null,
        role: newMember.role,
        permissions: newMember.permissions,
        allowed_column_ids: newMember.allowedColumnIds,
        is_active: newMember.isActive,
      };

      const { data, error } = await supabase
        .from('store_members')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('[TeamService] Error saving to Supabase store_members (using local):', error.message);
      } else if (data) {
        newMember.id = data.id;
      }
    } catch (err: any) {
      console.warn('[TeamService] Exception saving to store_members:', err.message);
    }

    return { success: true, member: newMember };
  },

  /**
   * Remove um membro da equipe
   */
  async deleteTeamMember(memberId: string, storeId: string): Promise<{ success: boolean; error?: string }> {
    // Local cache removal
    const local = loadLocalMembers(storeId);
    const updated = local.filter((m) => m.id !== memberId);
    saveLocalMembers(storeId, updated);

    // Supabase removal
    try {
      const { error } = await supabase
        .from('store_members')
        .delete()
        .eq('id', memberId)
        .eq('store_id', storeId);

      if (error) {
        console.warn('[TeamService] Error deleting from store_members:', error.message);
      }
    } catch (err: any) {
      console.warn('[TeamService] Exception deleting from store_members:', err.message);
    }

    return { success: true };
  },

  /**
   * Alterna o status ativo/inativo de um membro
   */
  async toggleMemberStatus(
    memberId: string,
    isActive: boolean,
    storeId: string
  ): Promise<{ success: boolean; error?: string }> {
    const local = loadLocalMembers(storeId);
    const updated = local.map((m) => (m.id === memberId ? { ...m, isActive } : m));
    saveLocalMembers(storeId, updated);

    try {
      await supabase
        .from('store_members')
        .update({ is_active: isActive })
        .eq('id', memberId)
        .eq('store_id', storeId);
    } catch (err) {
      console.warn('[TeamService] Error updating status in Supabase:', err);
    }

    return { success: true };
  },
};
