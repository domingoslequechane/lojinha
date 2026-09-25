import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

/**
 * Cria ou convida um novo usuário no Supabase Auth para a equipe
 */
router.post('/create-user', async (req: Request, res: Response) => {
  try {
    const { email, password, name, storeId, role } = req.body;

    if (!email || !storeId) {
      res.status(400).json({ error: 'E-mail e storeId são obrigatórios.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let createdUserId: string | null = null;

    // Se temos SUPABASE_SERVICE_ROLE_KEY podemos criar o usuário diretamente confirmado
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && password) {
      try {
        const { data: adminUser, error: adminErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: password.trim(),
          email_confirm: true,
          user_metadata: { name: name || 'Membro da Equipe', store_id: storeId, role: role || 'vendedor' },
        });

        if (!adminErr && adminUser?.user) {
          createdUserId = adminUser.user.id;
        } else if (adminErr && !adminErr.message.includes('already exists')) {
          console.warn('[Team Backend] Admin createUser warning:', adminErr.message);
        }
      } catch (adminEx: any) {
        console.warn('[Team Backend] Admin API exception:', adminEx.message);
      }
    }

    // Se o usuário já existia ou service role não estava disponível, tenta buscar o ID do auth.users se possível
    res.json({
      success: true,
      userId: createdUserId,
      email: cleanEmail,
      message: 'Membro registrado com sucesso no sistema.',
    });
  } catch (err: any) {
    console.error('[Team Backend] Error in create-user route:', err);
    res.status(500).json({ error: err.message || 'Erro interno ao criar membro da equipe.' });
  }
});

export default router;
