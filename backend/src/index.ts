import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { handleWebhook } from './webhookHandler';
import instancesRouter from './routes/instances';
import messagesRouter from './routes/messages';
import leadsRouter from './routes/leads';
import { requireInternalSecret } from './middleware/auth';
import { startMediaCleanupJob } from './cleanup';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ----------------------------------------------------------------
// Middleware global
// ----------------------------------------------------------------
app.use(express.json({ limit: '100mb' })); // Suporta envio e sincronização de vídeos e mídias pesadas
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static media files serving (videos, photos, audios)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const defaultAllowed = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://lojinha.my',
  'https://www.lojinha.my',
  'http://lojinha.my',
  'http://www.lojinha.my',
];

const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS ?? '').trim();
const allowAllOrigins = allowedOriginsRaw === '*';
const configuredOrigins = allowedOriginsRaw
  ? allowedOriginsRaw.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];
const allowedOrigins = Array.from(new Set([...defaultAllowed, ...configuredOrigins]));

// Localtunnel / Tunnel headers
app.use((_req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'yes');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite chamadas sem origin (ex: curl, Postman, webhook interno da Evolution)
      if (!origin || allowAllOrigins) {
        callback(null, true);
        return;
      }

      const normalized = origin.replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.includes(normalized) ||
        normalized.endsWith('lojinha.my') ||
        normalized.includes('lojinha.my');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Request blocked from unauthorized origin: ${origin}`);
        callback(new Error(`CORS: origin not allowed — ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-internal-secret', 'x-store-id', 'Authorization'],
    credentials: true,
  })
);

// ----------------------------------------------------------------
// Health check (público)
// ----------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'lojinha-backend',
    timestamp: new Date().toISOString(),
    evolutionUrl: process.env.EVOLUTION_API_URL ?? 'not configured',
  });
});

// ----------------------------------------------------------------
// Webhook da Evolution API (público — chamado pelo servidor deles)
// ----------------------------------------------------------------
app.post('/webhook/evolution', handleWebhook);

// ----------------------------------------------------------------
// API privada (requer x-internal-secret)
// ----------------------------------------------------------------
app.use('/api/instances', requireInternalSecret, instancesRouter);
app.use('/api/messages', requireInternalSecret, messagesRouter);
app.use('/api/leads', requireInternalSecret, leadsRouter);

// ----------------------------------------------------------------
// 404 handler
// ----------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ----------------------------------------------------------------
// Error handler
// ----------------------------------------------------------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ----------------------------------------------------------------
// Start
// ----------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Lojinha Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Webhook: http://localhost:${PORT}/webhook/evolution`);
  console.log(`   Evolution API: ${process.env.EVOLUTION_API_URL ?? 'NOT CONFIGURED'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ?? 'NOT CONFIGURED'}\n`);

  // Start scheduled cleanup job (removes media_url for messages older than 48h)
  startMediaCleanupJob();
});

export default app;
