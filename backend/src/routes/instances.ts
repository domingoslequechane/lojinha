import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { EvolutionClient, EvolutionGoInstance } from '../evolutionClient';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

function getEvolutionClient(): EvolutionClient {
  return new EvolutionClient(
    process.env.EVOLUTION_API_URL!,
    process.env.EVOLUTION_API_KEY!
  );
}

// Cache em memória para tokens das instâncias (id -> token)
const tokenCache = new Map<string, string>();

async function getInstanceToken(instanceId: string): Promise<string | null> {
  if (tokenCache.has(instanceId)) {
    return tokenCache.get(instanceId)!;
  }

  // Tenta ler do last_connected na DB se tiver token salvo em JSON
  const { data: row } = await supabase
    .from('whatsapp_instances')
    .select('last_connected')
    .eq('id', instanceId)
    .single();

  if (row?.last_connected && row.last_connected.startsWith('{')) {
    try {
      const parsed = JSON.parse(row.last_connected);
      if (parsed.token) {
        tokenCache.set(instanceId, parsed.token);
        return parsed.token;
      }
    } catch {}
  }

  // Fallback: busca na Evolution GO via /instance/all
  const evolution = getEvolutionClient();
  try {
    const all = await evolution.getAllInstances();
    for (const inst of all) {
      if (inst.id === instanceId) {
        tokenCache.set(instanceId, inst.token);
        return inst.token;
      }
    }
  } catch (err) {
    console.error('[Instances] Failed to fetch token from Evolution:', err);
  }

  return null;
}

// ----------------------------------------------------------------
// GET /api/instances — lista instâncias da loja
// ----------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) return res.status(400).json({ error: 'Missing x-store-id header' });

  const { data: localRows, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Sincroniza status em tempo real com Evolution GO
  const evolution = getEvolutionClient();
  let liveInstances: EvolutionGoInstance[] = [];
  try {
    liveInstances = await evolution.getAllInstances();
  } catch {}

  const synced = (localRows || []).map((row) => {
    const live = liveInstances.find((li) => li.id === row.id);
    if (live) {
      tokenCache.set(row.id, live.token);
      // Se na Evolution estiver conectado mas no banco local não
      if (live.connected && row.status !== 'connected') {
        supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone: live.jid ? '+' + live.jid.split('@')[0].split(':')[0] : row.phone,
          })
          .eq('id', row.id)
          .then();
        return {
          ...row,
          status: 'connected',
          phone: live.jid ? '+' + live.jid.split('@')[0].split(':')[0] : row.phone,
        };
      }
    }
    return row;
  });

  return res.json(synced);
});

// ----------------------------------------------------------------
// POST /api/instances — cria nova instância no Evolution GO
// ----------------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  const { name } = req.body as { name: string };

  if (!storeId) return res.status(400).json({ error: 'Missing x-store-id header' });
  if (!name?.trim()) return res.status(400).json({ error: 'Missing instance name' });

  const evolution = getEvolutionClient();
  const token = crypto.randomBytes(16).toString('hex');
  // Cria um nome limpo para a Evolution (letras, números, hífen)
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

  let createdEv: EvolutionGoInstance;
  try {
    createdEv = await evolution.createInstance(slug, token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Instances] Error creating Evolution instance:', msg);
    return res.status(502).json({ error: `Evolution GO error: ${msg}` });
  }

  // Cache token
  tokenCache.set(createdEv.id, token);

  // Conecta e configura webhook
  const webhookUrl = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/webhook/evolution`;
  try {
    await evolution.connectInstance(token, webhookUrl);
  } catch (err) {
    console.warn('[Instances] Connect instance warning:', err);
  }

  // Verifica se é a primeira instância para torná-la padrão
  const { count } = await supabase
    .from('whatsapp_instances')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const isDefault = (count ?? 0) === 0;

  // Persiste no Supabase usando o ID gerado pelo Evolution GO
  const { data: newRow, error: dbError } = await supabase
    .from('whatsapp_instances')
    .insert({
      id: createdEv.id,
      store_id: storeId,
      name: name.trim(),
      status: 'connecting',
      is_default: isDefault,
      messages_today: 0,
      last_connected: JSON.stringify({ token, createdAt: new Date().toISOString() }),
    })
    .select()
    .single();

  if (dbError) {
    console.error('[Instances] DB insert error:', dbError);
    return res.status(500).json({ error: dbError.message });
  }

  return res.status(201).json(newRow);
});

// ----------------------------------------------------------------
// GET /api/instances/:id/qrcode — busca QR code atual
// ----------------------------------------------------------------
router.get('/:id/qrcode', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const token = await getInstanceToken(id);

  if (!token) {
    return res.status(404).json({ error: 'Instance token not found' });
  }

  const evolution = getEvolutionClient();
  try {
    const qrData = await evolution.getQrCode(token);
    if (!qrData?.qrcode) {
      return res.status(404).json({ error: 'QR Code not ready yet. Please wait a moment.' });
    }
    return res.json({
      qrcode: qrData.qrcode,
      code: qrData.code,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: msg });
  }
});

// ----------------------------------------------------------------
// POST /api/instances/:id/pairing-code — pareamento com número
// ----------------------------------------------------------------
router.post('/:id/pairing-code', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { phone } = req.body as { phone: string };

  if (!phone) return res.status(400).json({ error: 'Missing phone number' });

  const token = await getInstanceToken(id);
  if (!token) return res.status(404).json({ error: 'Instance token not found' });

  const webhookUrl = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/webhook/evolution`;
  const evolution = getEvolutionClient();
  try {
    // Dispara conexão com número de telefone para geração do código de pareamento
    try {
      await evolution.connectInstance(token, webhookUrl, phone);
    } catch {}

    // Aguarda e busca o código gerado
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const qrData = await evolution.getQrCode(token);
        if (qrData?.code) {
          return res.json({ code: qrData.code });
        }
      } catch {}
    }

    try {
      const code = await evolution.getPairingCode(token, phone);
      if (code) return res.json({ code });
    } catch {}

    return res.json({ code: 'Código solicitado — confirme no WhatsApp' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: msg });
  }
});


// ----------------------------------------------------------------
// DELETE /api/instances/:id — remove instância
// ----------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const storeId = req.headers['x-store-id'] as string;

  const evolution = getEvolutionClient();
  try {
    await evolution.deleteInstance(id);
  } catch (err) {
    console.warn('[Instances] Delete in Evolution warning:', err);
  }

  await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', id);

  tokenCache.delete(id);

  // Se a deletada era padrão, promove outra
  if (storeId) {
    const { data: remaining } = await supabase
      .from('whatsapp_instances')
      .select('id, is_default')
      .eq('store_id', storeId)
      .limit(1);

    if (remaining?.length && !remaining[0].is_default) {
      await supabase
        .from('whatsapp_instances')
        .update({ is_default: true })
        .eq('id', remaining[0].id);
    }
  }

  return res.json({ ok: true });
});

// ----------------------------------------------------------------
// POST /api/instances/:id/reconnect — reconecta e aguarda QR Code
// ----------------------------------------------------------------
router.post('/:id/reconnect', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const token = await getInstanceToken(id);

  if (!token) {
    return res.status(404).json({ error: 'Instance token not found' });
  }

  const webhookUrl = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001'}/webhook/evolution`;
  const evolution = getEvolutionClient();

  // Mark as connecting
  await supabase
    .from('whatsapp_instances')
    .update({ status: 'connecting' })
    .eq('id', id);

  try {
    // Trigger connect — Evolution GO starts QR flow
    await evolution.connectInstance(token, webhookUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Instances] Connect error:', msg);
    // Continue anyway — sometimes connect returns EOF but QR still arrives
  }

  // Poll /instance/qr up to 15 attempts x 1.5s = ~22s
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const qrData = await evolution.getQrCode(token);
      if (qrData?.qrcode) {
        // Store QR in Supabase so Realtime also updates the UI
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connecting',
            last_connected: JSON.stringify({ qr: qrData.qrcode, code: qrData.code ?? '', updatedAt: Date.now() }),
          })
          .eq('id', id);
        return res.json({ ok: true, qrcode: qrData.qrcode, code: qrData.code ?? '' });
      }
    } catch {}

    // Also check if it connected directly (re-paired from session)
    try {
      const allInsts = await evolution.getAllInstances();
      const live = allInsts.find((i) => i.token === token);
      if (live?.connected) {
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone: live.jid ? `+${live.jid.split('@')[0].split(':')[0]}` : undefined,
            last_connected: 'Agora mesmo',
          })
          .eq('id', id);
        return res.json({ ok: true, connected: true });
      }
    } catch {}
  }

  return res.status(408).json({ error: 'QR Code timeout. Please try again.' });
});

// ----------------------------------------------------------------
// POST /api/instances/:id/pause — pausa conexão (mantém sessão)
// ----------------------------------------------------------------
router.post('/:id/pause', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const token = await getInstanceToken(id);

  if (token) {
    const evolution = getEvolutionClient();
    try {
      await evolution.disconnectInstance(token);
    } catch {}
  }

  await supabase
    .from('whatsapp_instances')
    .update({ status: 'paused' })
    .eq('id', id);

  return res.json({ ok: true });
});


// ----------------------------------------------------------------
// POST /api/instances/:id/logout — desconecta WhatsApp
// ----------------------------------------------------------------
router.post('/:id/logout', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const token = await getInstanceToken(id);

  if (token) {
    const evolution = getEvolutionClient();
    try {
      await evolution.logoutInstance(token);
    } catch {}
  }

  await supabase
    .from('whatsapp_instances')
    .update({
      status: 'disconnected',
      phone: null,
      last_connected: 'Desconectado',
    })
    .eq('id', id);

  return res.json({ ok: true });
});

// ----------------------------------------------------------------
// PATCH /api/instances/:id/set-default
// ----------------------------------------------------------------
router.patch('/:id/set-default', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const storeId = req.headers['x-store-id'] as string;

  if (!storeId) return res.status(400).json({ error: 'Missing x-store-id header' });

  await supabase
    .from('whatsapp_instances')
    .update({ is_default: false })
    .eq('store_id', storeId);

  await supabase
    .from('whatsapp_instances')
    .update({ is_default: true })
    .eq('id', id);

  return res.json({ ok: true });
});

export default router;
