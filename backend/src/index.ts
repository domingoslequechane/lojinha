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

const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').trim();
const allowAllOrigins = allowedOriginsRaw === '*';
const allowedOrigins = allowedOriginsRaw.split(',').map((o) => o.trim());

// Localtunnel bypass — evita que o tunnel exija clique no browser antes de aceitar requests
app.use((_req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'yes');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite chamadas sem origin (ex: curl, Postman, webhook)
      if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin not allowed — ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-internal-secret', 'x-store-id'],
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
