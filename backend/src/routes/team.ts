import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

/**
 * Cliente com service_role — NUNCA exposto ao frontend.
 * Usado apenas para operações admin (createUser, deleteUser, updateUser).
 * O SERVICE_ROLE_KEY vive apenas em variáveis de ambiente do servidor.
 */
const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Cria um novo colaborador com conta Supabase Auth real
 * POST /api/team/create-member
 *
 * Segurança:
 * - Chama supabase.auth.admin.createUser() — apenas o backend tem acesso (service role)
 * - A senha definida pelo admin é passada diretamente ao Supabase e nunca armazenada localmente
 * - email_confirm: true → o membro pode entrar imediatamente sem confirmar e-mail
 */
router.post('/create-member', async (req: Request, res: Response) => {
  try {
    const {
      id,
      storeId,
      name,
      email,
      phone,
      password,
      role = 'vendedor',
      permissions = ['cockpit'],
      allowedColumnIds = null,
      isActive = true,
    } = req.body;

    if (!email || !storeId || !name || !password) {
      res.status(400).json({ error: 'Nome, e-mail, senha e storeId são obrigatórios.' });
      return;
    }

    if (password.trim().length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // ─── 1. Criar (ou atualizar) conta real no Supabase Auth ──────────────────
    let authUserId: string | null = null;

    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: password.trim(),
      email_confirm: true,               // Entra imediatamente, sem precisar confirmar e-mail
      user_metadata: { name: cleanName, store_id: storeId, role },
    });

    if (createData?.user) {
      authUserId = createData.user.id;
    } else if (createError) {
      // Se o e-mail já existe em auth.users, actualiza a senha e os metadados
      const errMsg = (createError.message || '').toLowerCase();
      if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
        const { data: listData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          authUserId = existing.id;
          await adminSupabase.auth.admin.updateUserById(existing.id, {
            password: password.trim(),
            user_metadata: { name: cleanName, store_id: storeId, role },
          });
        } else {
          res.status(400).json({ error: `Erro ao criar conta: ${createError.message}` });
          return;
        }
      } else {
        res.status(400).json({ error: `Erro ao criar conta Supabase: ${createError.message}` });
        return;
      }
    }

    // ─── 2. Persistir em store_members (sem password_hash — autenticação é do Supabase) ─
    const memberId = id || crypto.randomUUID();
    const payload = {
      id: memberId,
      store_id: storeId,
      user_id: authUserId,
      name: cleanName,
      email: cleanEmail,
      phone: phone?.trim() || null,
      role,
      permissions,
      allowed_column_ids: allowedColumnIds,
      is_active: isActive,
      accepted_at: new Date().toISOString(),
    };

    const { data: memberData, error: memberErr } = await adminSupabase
      .from('store_members')
      .upsert(payload, { onConflict: 'store_id,email' })
      .select()
      .maybeSingle();

    if (memberErr) {
      console.warn('[Team] store_members upsert warning:', memberErr.message);
    }

    res.json({
      success: true,
      member: memberData || payload,
      userId: authUserId,
      message: 'Colaborador criado com sucesso! Já pode fazer login com as credenciais fornecidas.',
    });
  } catch (err: any) {
    console.error('[Team] Error creating team member:', err);
    res.status(500).json({ error: err.message || 'Erro interno ao cadastrar colaborador.' });
  }
});

/**
 * Remove um colaborador da equipe (store_members + auth.users)
 * DELETE /api/team/:storeId/:memberId
 */
router.delete('/:storeId/:memberId', async (req: Request, res: Response) => {
  try {
    const { storeId, memberId } = req.params;

    // Busca o user_id antes de deletar
    const { data: member } = await adminSupabase
      .from('store_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('store_id', storeId)
      .maybeSingle();

    // Remove de store_members
    const { error: delErr } = await adminSupabase
      .from('store_members')
      .delete()
      .eq('id', memberId)
      .eq('store_id', storeId);

    if (delErr) {
      res.status(400).json({ success: false, error: delErr.message });
      return;
    }

    // Remove de auth.users (conta Supabase real)
    if (member?.user_id) {
      try {
        await adminSupabase.auth.admin.deleteUser(member.user_id);
      } catch (e: any) {
        console.warn('[Team] Notice deleting auth user:', e.message);
      }
    }

    res.json({ success: true, message: 'Colaborador removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao remover colaborador.' });
  }
});

/**
 * Remove um colaborador via POST (com body)
 * POST /api/team/delete-member
 */
router.post('/delete-member', async (req: Request, res: Response) => {
  try {
    const { memberId, storeId, email } = req.body;

    if (!memberId && !email) {
      res.status(400).json({ success: false, error: 'memberId ou email é obrigatório.' });
      return;
    }

    // Busca o membro para obter user_id
    let query = adminSupabase.from('store_members').select('user_id, id');
    if (memberId) query = query.eq('id', memberId) as any;
    if (storeId) query = query.eq('store_id', storeId) as any;
    if (email) query = query.eq('email', email.trim().toLowerCase()) as any;
    const { data: member } = await (query as any).maybeSingle();

    // Deleta de store_members
    let delQuery = adminSupabase.from('store_members').delete();
    if (memberId) delQuery = delQuery.eq('id', memberId) as any;
    else if (email) delQuery = delQuery.eq('email', email.trim().toLowerCase()) as any;
    if (storeId) delQuery = delQuery.eq('store_id', storeId) as any;
    const { error: delErr } = await delQuery;

    if (delErr) {
      res.status(400).json({ success: false, error: delErr.message });
      return;
    }

    // Deleta da autenticação Supabase
    if (member?.user_id) {
      try {
        await adminSupabase.auth.admin.deleteUser(member.user_id);
      } catch (e: any) {
        console.warn('[Team] Notice deleting auth user:', e.message);
      }
    }

    res.json({ success: true, message: 'Colaborador deletado.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao deletar colaborador.' });
  }
});

/**
 * Alterna status ativo/inativo do colaborador
 * PATCH /api/team/:storeId/:memberId/status
 */
router.patch('/:storeId/:memberId/status', async (req: Request, res: Response) => {
  try {
    const { storeId, memberId } = req.params;
    const { isActive } = req.body;

    const { error } = await adminSupabase
      .from('store_members')
      .update({ is_active: isActive })
      .eq('id', memberId)
      .eq('store_id', storeId);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Lista os membros da equipe de uma loja
 * GET /api/team/:storeId
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { data, error } = await adminSupabase
      .from('store_members')
      .select('id, store_id, user_id, name, email, phone, role, permissions, allowed_column_ids, is_active, created_at, accepted_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true, members: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
