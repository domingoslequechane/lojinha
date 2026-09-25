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

function getBackendUrl(): string {
  if (import.meta.env.VITE_BACKEND_URL) {
    return (import.meta.env.VITE_BACKEND_URL as string).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001`;
  }
  return 'http://localhost:3001';
}

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

    // 1. Tenta criar pelo backend (admin & criptografia de senha)
    try {
      const resp = await fetch(`${getBackendUrl()}/api/team/create-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          storeId,
          name: member.name.trim(),
          email: member.email.trim().toLowerCase(),
          phone: member.phone?.trim() || null,
          password: member.password?.trim() || undefined,
          role: member.role || 'vendedor',
          permissions: member.permissions || ['cockpit'],
          allowedColumnIds: member.allowedColumnIds ?? null,
          isActive: member.isActive ?? true,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.userId) {
          authUserId = data.userId;
        }
      }
    } catch (backendErr) {
      console.warn('[TeamService] Backend create-member notice:', backendErr);
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

    // Atualiza cache local imediatamente
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

    // Persistência direta no Supabase
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
        console.warn('[TeamService] Error saving to Supabase store_members:', error.message);
      } else if (data) {
        newMember.id = data.id;
      }
    } catch (err: any) {
      console.warn('[TeamService] Exception saving to store_members:', err.message);
    }

    return { success: true, member: newMember };
  },

  /**
   * Remove um membro da equipe (do banco de dados e do cache local)
   */
  async deleteTeamMember(
    memberId: string,
    storeId: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Remove do cache local
    const local = loadLocalMembers(storeId);
    const updated = local.filter((m) => m.id !== memberId && (email ? m.email !== email : true));
    saveLocalMembers(storeId, updated);

    // 2. Remove do backend (inclui exclusão de auth.users e banco)
    try {
      await fetch(`${getBackendUrl()}/api/team/delete-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, storeId, email }),
      });
    } catch (e) {
      console.warn('[TeamService] Backend delete notice:', e);
    }

    // 3. Remove diretamente da tabela store_members no Supabase
    try {
      let del = supabase.from('store_members').delete().eq('store_id', storeId);
      if (memberId) {
        await del.eq('id', memberId);
      } else if (email) {
        await del.eq('email', email.trim().toLowerCase());
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
      await fetch(`${getBackendUrl()}/api/team/${storeId}/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
    } catch {}

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

  /**
   * Autentica um colaborador da equipe através do endpoint dedicado
   */
  async memberLogin(
    email: string,
    password: string
  ): Promise<{ success: boolean; member?: StoreMember; store?: any; error?: string }> {
    try {
      const resp = await fetch(`${getBackendUrl()}/api/team/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Credenciais de colaborador inválidas.',
        };
      }

      return {
        success: true,
        member: data.member,
        store: data.store,
      };
    } catch (err: any) {
      console.warn('[TeamService] Backend member login unreachable, trying direct DB check:', err);

      // Fallback direto via Supabase se o backend não estiver respondendo
      try {
        const { data: member, error } = await supabase
          .from('store_members')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (error || !member) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }

        if (member.is_active === false) {
          return { success: false, error: 'Sua conta de colaborador foi desativada pelo administrador.' };
        }

        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('id', member.store_id)
          .maybeSingle();

        return {
          success: true,
          member: {
            id: member.id,
            storeId: member.store_id,
            userId: member.user_id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: member.role || 'vendedor',
            permissions: member.permissions || ['cockpit'],
            allowedColumnIds: member.allowed_column_ids || null,
            isActive: member.is_active ?? true,
            createdAt: member.created_at || new Date().toISOString(),
            acceptedAt: member.accepted_at,
          },
          store: store || { id: member.store_id, name: 'Minha Loja' },
        };
      } catch (e: any) {
        return { success: false, error: 'Erro ao verificar credenciais de colaborador.' };
      }
    }
  },
};
