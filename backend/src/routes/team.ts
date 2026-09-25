import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

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

    // 1. Criação no Supabase Auth (auth.users)
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

          // Se o usuário já existia, busca o ID dele
          if (createErr.message.toLowerCase().includes('already registered') || createErr.message.toLowerCase().includes('already exists')) {
            try {
              const { data: listUsers } = await supabase.auth.admin.listUsers();
              const existing = listUsers?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
              if (existing) {
                authUserId = existing.id;
                // Atualiza a senha se foi enviada
                await supabase.auth.admin.updateUserById(existing.id, {
                  password: password.trim(),
                  user_metadata: { name: name.trim(), store_id: storeId, role },
                });
              }
            } catch {}
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
    } else {
      console.warn('[Team Backend] SUPABASE_SERVICE_ROLE_KEY not configured. Falling back to public schema operations.');
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

    const { data: memberData, error: memberErr } = await supabase
      .from('store_members')
      .upsert(payload, { onConflict: 'store_id,email' })
      .select()
      .maybeSingle();

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
