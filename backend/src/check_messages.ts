import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
async function run() {
  const { data: msgs, error } = await s.from('messages').select('id, text, type, from_me, created_at, lead_id, media_url').order('created_at', { ascending: false }).limit(10);
  if (error) console.error('Error:', error);
  console.log('Last 10 messages:');
  msgs?.forEach(m => console.log(`[${m.created_at}] from_me=${m.from_me} type=${m.type} text="${m.text}" media_url=${m.media_url ? m.media_url.substring(0, 30) + '...' : 'null'}`));
}
run().then(() => process.exit(0));
