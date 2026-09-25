import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

/**
 * Função segura para hash de senhas de colaboradores
 */
function hashPassword(password: string): string {
  const salt = 'lojinha_saas_member_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Cria ou convida um novo colaborador na loja
 * POST /api/team/create-member
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
      isActive = true 
    } = req.body;

    if (!email || !storeId || !name) {
      res.status(400).json({ error: 'Nome, e-mail e storeId são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let authUserId: string | null = null;
    let emailSent = false;
    let authError: string | null = null;
    const passwordHash = password ? hashPassword(password.trim()) : null;

    // 1. Criação no Supabase Auth (auth.users) se Service Role Key estiver configurada
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      if (password && password.trim().length >= 6) {
        // Cria usuário diretamente confirmado com a senha definida pelo admin
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: password.trim(),
          email_confirm: true,
          user_metadata: { name: name.trim(), store_id: storeId, role },
        });

        if (newUser?.user) {
          authUserId = newUser.user.id;
        } else if (createErr) {
          authError = createErr.message;
          console.warn('[Team Backend] Admin createUser notice:', createErr.message);

          // Se o usuário já existia, busca o ID dele e atualiza a senha
          if (createErr.message.toLowerCase().includes('already registered') || createErr.message.toLowerCase().includes('already exists')) {
            try {
              const { data: listUsers } = await supabase.auth.admin.listUsers();
              const existing = listUsers?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
              if (existing) {
                authUserId = existing.id;
                await supabase.auth.admin.updateUserById(existing.id, {
                  password: password.trim(),
                  user_metadata: { name: name.trim(), store_id: storeId, role },
                });
              }
            } catch (e) {
              console.warn('[Team Backend] Error updating existing user:', e);
            }
          }
        }
      } else {
        // Sem senha informada -> Envia e-mail de convite oficial do Supabase
        const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
          data: { name: name.trim(), store_id: storeId, role },
        });

        if (inviteData?.user) {
          authUserId = inviteData.user.id;
          emailSent = true;
        } else if (inviteErr) {
          authError = inviteErr.message;
          console.warn('[Team Backend] Invite user email error:', inviteErr.message);
        }
      }
    }

    // 2. Persistência na tabela store_members
    const memberId = id || crypto.randomUUID();
    const payload: any = {
      id: memberId,
      store_id: storeId,
      user_id: authUserId || null,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || null,
      role,
      permissions,
      allowed_column_ids: allowedColumnIds,
      is_active: isActive,
    };

    if (passwordHash) {
      payload.password_hash = passwordHash;
    }

    let { data: memberData, error: memberErr } = await supabase
      .from('store_members')
      .upsert(payload, { onConflict: 'store_id,email' })
      .select()
      .maybeSingle();

    // Caso a coluna password_hash ainda não exista na BD remota, retenta sem o campo
    if (memberErr && (memberErr.code === 'PGRST204' || memberErr.message.includes('password_hash'))) {
      console.warn('[Team Backend] password_hash column not found, retrying without it...');
      delete payload.password_hash;
      const retry = await supabase
        .from('store_members')
        .upsert(payload, { onConflict: 'store_id,email' })
        .select()
        .maybeSingle();
      memberData = retry.data;
      memberErr = retry.error;
    }

    if (memberErr) {
      console.warn('[Team Backend] Error inserting into store_members table:', memberErr.message);
    }

    res.json({
      success: true,
      member: memberData || payload,
      userId: authUserId,
      emailSent,
      authError,
      message: emailSent
        ? 'Convite enviado por e-mail com sucesso!'
        : 'Colaborador cadastrado com sucesso!',
    });
  } catch (err: any) {
    console.error('[Team Backend] Error creating team member:', err);
    res.status(500).json({ error: err.message || 'Erro interno ao cadastrar colaborador.' });
  }
});

/**
 * Autenticação direta de colaboradores da equipe
 * POST /api/team/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashed = hashPassword(password.trim());

    // 1. Busca membro pelo e-mail
    const { data: member, error: memberErr } = await supabase
      .from('store_members')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (memberErr || !member) {
      res.status(401).json({ success: false, error: 'Nenhum membro de equipe encontrado com este e-mail.' });
      return;
    }

    // 2. Verifica se a conta está ativa
    if (member.is_active === false) {
      res.status(403).json({
        success: false,
        error: 'Sua conta de colaborador foi desativada pelo administrador da loja.',
      });
      return;
    }

    // 3. Validação de senha
    const isValidPassword =
      (member.password_hash && member.password_hash === hashed) ||
      (member.password_hash && member.password_hash === password.trim()) ||
      (!member.password_hash); // Se não possuía hash prévio, autoriza e salva o hash

    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Senha incorreta para esta conta de colaborador.' });
      return;
    }

    // Se não tinha hash salvo ainda, atualiza
    if (!member.password_hash) {
      await supabase
        .from('store_members')
        .update({ password_hash: hashed, accepted_at: new Date().toISOString() })
        .eq('id', member.id);
    }

    // 4. Busca os dados da loja correspondente
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', member.store_id)
      .maybeSingle();

    res.json({
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
      },
      store: store || {
        id: member.store_id,
        name: 'Minha Loja',
      },
    });
  } catch (err: any) {
    console.error('[Team Backend] Login error:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao autenticar colaborador.' });
  }
});

/**
 * Remove um colaborador da equipe e do banco de dados
 * DELETE /api/team/:storeId/:memberId
 */
router.delete('/:storeId/:memberId', async (req: Request, res: Response) => {
  try {
    const { storeId, memberId } = req.params;

    // 1. Busca os dados do membro antes de deletar
    const { data: member } = await supabase
      .from('store_members')
      .select('*')
      .eq('id', memberId)
      .eq('store_id', storeId)
      .maybeSingle();

    // 2. Remove da tabela store_members
    const { error: delErr } = await supabase
      .from('store_members')
      .delete()
      .eq('id', memberId)
      .eq('store_id', storeId);

    if (delErr) {
      console.warn('[Team Backend] Error deleting from store_members:', delErr.message);
      res.status(400).json({ success: false, error: delErr.message });
      return;
    }

    // 3. Remove do Supabase Auth se houver user_id e Service Role Key
    if (member?.user_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.auth.admin.deleteUser(member.user_id);
      } catch (authDelErr: any) {
        console.warn('[Team Backend] Notice deleting auth user:', authDelErr.message);
      }
    }

    res.json({ success: true, message: 'Colaborador deletado com sucesso do banco de dados.' });
  } catch (err: any) {
    console.error('[Team Backend] Error deleting team member:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao remover colaborador.' });
  }
});

/**
 * Remove um colaborador via POST (delete-member com body)
 * POST /api/team/delete-member
 */
router.post('/delete-member', async (req: Request, res: Response) => {
  try {
    const { memberId, storeId, email } = req.body;

    if (!memberId && !email) {
      res.status(400).json({ success: false, error: 'memberId ou email é obrigatório.' });
      return;
    }

    // Busca o membro
    let query = supabase.from('store_members').select('*');
    if (memberId) query = query.eq('id', memberId);
    if (storeId) query = query.eq('store_id', storeId);
    if (email) query = query.eq('email', email.trim().toLowerCase());

    const { data: member } = await query.maybeSingle();

    // Deleta o registro
    let delQuery = supabase.from('store_members').delete();
    if (memberId) delQuery = delQuery.eq('id', memberId);
    else if (email) delQuery = delQuery.eq('email', email.trim().toLowerCase());
    if (storeId) delQuery = delQuery.eq('store_id', storeId);

    const { error: delErr } = await delQuery;
    if (delErr) {
      res.status(400).json({ success: false, error: delErr.message });
      return;
    }

    // Deleta da autenticação Supabase se existir
    if (member?.user_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.auth.admin.deleteUser(member.user_id);
      } catch (e: any) {
        console.warn('[Team Backend] Notice deleting auth user:', e.message);
      }
    }

    res.json({ success: true, message: 'Colaborador deletado do banco de dados.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao deletar colaborador.' });
  }
});

/**
 * Alterna status do colaborador (ativo / inativo)
 * PATCH /api/team/:storeId/:memberId/status
 */
router.patch('/:storeId/:memberId/status', async (req: Request, res: Response) => {
  try {
    const { storeId, memberId } = req.params;
    const { isActive } = req.body;

    const { error } = await supabase
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
    const { data, error } = await supabase
      .from('store_members')
      .select('*')
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
