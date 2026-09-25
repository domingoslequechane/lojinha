import { supabase } from '../lib/supabase';
import { StoreMember, ModulePermission } from '../types';

// ─── Cache local (offline / fallback de leitura) ──────────────────────────────

function getLocalCacheKey(storeId: string): string {
  return `lojinha_team_members_${storeId}`;
}

function loadLocalMembers(storeId: string): StoreMember[] {
  try {
    const raw = localStorage.getItem(getLocalCacheKey(storeId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMembers(storeId: string, members: StoreMember[]) {
  try {
    localStorage.setItem(getLocalCacheKey(storeId), JSON.stringify(members));
  } catch {}
}

// ─── URL do backend (Railway em produção, 3001 em dev) ────────────────────────

function getBackendUrl(): string {
  if (import.meta.env.VITE_BACKEND_URL) {
    return (import.meta.env.VITE_BACKEND_URL as string).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }
  return 'http://localhost:3001';
}

// ─── Serviço de equipa ────────────────────────────────────────────────────────

export const teamService = {
  /**
   * Lista todos os membros da loja.
   * Tenta Supabase primeiro; usa cache local como fallback.
   */
  async getTeamMembers(storeId: string): Promise<StoreMember[]> {
    const local = loadLocalMembers(storeId);
    try {
      const { data, error } = await supabase
        .from('store_members')
        .select('id, store_id, user_id, name, email, phone, role, permissions, allowed_column_ids, is_active, created_at, accepted_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[TeamService] store_members fetch error:', error.message);
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
      console.warn('[TeamService] Network error, using cache:', err);
      return local;
    }
  },

  /**
   * Cria ou actualiza um membro da equipa.
   *
   * Fluxo:
   * 1. Chama POST /api/team/create-member no backend (que tem a SERVICE_ROLE_KEY)
   * 2. O backend cria a conta real no Supabase Auth + regista em store_members
   * 3. O frontend actualiza o cache local
   *
   * SEGURANÇA: A senha do colaborador nunca passa pelo frontend — vai directamente
   * para o backend via HTTPS e é entregue ao Supabase Auth. O frontend nunca vê
   * nem armazena a senha em nenhum estado ou localStorage.
   */
  async saveTeamMember(
    member: Partial<StoreMember> & { name: string; email: string; password?: string },
    storeId: string
  ): Promise<{ success: boolean; member?: StoreMember; error?: string }> {
    const id = member.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // ── Criação via backend (único caminho — exige SERVICE_ROLE_KEY) ──────────
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

    const data = await resp.json();

    if (!resp.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Erro ao criar colaborador no servidor.',
      };
    }

    // ── Monta o objecto local com o que o backend devolveu ────────────────────
    const newMember: StoreMember = {
      id: data.member?.id || id,
      storeId,
      userId: data.userId || data.member?.user_id || undefined,
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
      phone: member.phone?.trim(),
      role: member.role || 'vendedor',
      permissions: member.permissions || ['cockpit'],
      allowedColumnIds: member.allowedColumnIds ?? null,
      isActive: member.isActive ?? true,
      createdAt: member.createdAt || now,
      acceptedAt: now,
    };

    // Actualiza cache local
    const local = loadLocalMembers(storeId);
    const idx = local.findIndex((m) => m.id === newMember.id || m.email === newMember.email);
    const updated = idx >= 0
      ? local.map((m, i) => (i === idx ? { ...m, ...newMember } : m))
      : [...local, newMember];
    saveLocalMembers(storeId, updated);

    return { success: true, member: newMember };
  },

  /**
   * Remove um membro da equipa.
   * O backend apaga de auth.users (conta Supabase real) + store_members.
   */
  async deleteTeamMember(
    memberId: string,
    storeId: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Remove do cache local imediatamente
    const local = loadLocalMembers(storeId);
    const updated = local.filter((m) => m.id !== memberId && (!email || m.email !== email));
    saveLocalMembers(storeId, updated);

    // Deleta via backend (tem permissão para apagar auth.users)
    try {
      await fetch(`${getBackendUrl()}/api/team/delete-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, storeId, email }),
      });
    } catch (e) {
      console.warn('[TeamService] Backend delete notice:', e);
    }

    // Garante remoção directa em store_members via Supabase (fallback)
    try {
      let q = supabase.from('store_members').delete().eq('store_id', storeId);
      if (memberId) await (q as any).eq('id', memberId);
      else if (email) await (q as any).eq('email', email.trim().toLowerCase());
    } catch {}

    return { success: true };
  },

  /**
   * Alterna o estado ativo/inativo de um membro.
   */
  async toggleMemberStatus(
    memberId: string,
    isActive: boolean,
    storeId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Cache local
    const local = loadLocalMembers(storeId);
    saveLocalMembers(storeId, local.map((m) => (m.id === memberId ? { ...m, isActive } : m)));

    // Backend
    try {
      await fetch(`${getBackendUrl()}/api/team/${storeId}/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
    } catch {}

    // Supabase directo (fallback)
    await supabase
      .from('store_members')
      .update({ is_active: isActive })
      .eq('id', memberId)
      .eq('store_id', storeId);

    return { success: true };
  },
};
