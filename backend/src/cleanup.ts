import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getUploadsDir } from './utils/mediaStorage';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

async function cleanupExpiredMedia() {
  const cutoffTime = Date.now() - 48 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffTime).toISOString();

  // 1. Apaga mídias na base de dados
  const { error } = await supabase
    .from('messages')
    .update({ media_url: null })
    .lt('created_at', cutoffIso)
    .not('media_url', 'is', null);

  if (error) {
    console.error('[cleanup] Erro ao limpar midias expiradas na BD:', error.message);
  } else {
    console.log(`[cleanup] Midias expiradas limpas na BD (criadas antes de ${cutoffIso})`);
  }

  // 2. Apaga arquivos locais em backend/uploads com mais de 48h
  try {
    const uploadsDir = getUploadsDir();
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        console.log(`[cleanup] Removidos ${deletedCount} arquivo(s) de midia do disco (>48h).`);
      }
    }
  } catch (fsErr) {
    console.error('[cleanup] Erro ao limpar arquivos locais:', fsErr);
  }
}

async function cleanupPhantomLids() {
  try {
    // 1. Fetch leads with fake LID numbers (> 13 digits, or starting with +780, +946, +202)
    const { data: phantomLeads } = await supabase
      .from('leads')
      .select('id, phone, name, store_id')
      .or('phone.ilike.+780%,phone.ilike.+946%,phone.ilike.+202%');

    if (phantomLeads && phantomLeads.length > 0) {
      console.log(`[cleanup] Found ${phantomLeads.length} phantom LID leads to clean up:`, phantomLeads.map(l => `${l.name} (${l.phone})`));
      for (const pLead of phantomLeads) {
        await supabase.from('messages').delete().eq('lead_id', pLead.id);
        await supabase.from('leads').delete().eq('id', pLead.id);
      }
      console.log(`[cleanup] Successfully removed ${phantomLeads.length} phantom LID leads.`);
    }
  } catch (err) {
    console.error('[cleanup] Error cleaning up phantom LIDs:', err);
  }
}

export function startMediaCleanupJob() {
  // Run immediately on startup to catch any already-expired media and phantom LIDs
  cleanupExpiredMedia();
  cleanupPhantomLids();

  // Then run every hour (at minute 0 of every hour)
  cron.schedule('0 * * * *', () => {
    console.log('[cleanup] Executando limpeza de midias com mais de 48h...');
    cleanupExpiredMedia();
    cleanupPhantomLids();
  });

  console.log('[cleanup] Job de limpeza de midias agendado (a cada hora).');
}
