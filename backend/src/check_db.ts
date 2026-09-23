import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
async function run() {
  const { data: stores } = await s.from('stores').select('*');
  console.log('Stores count:', stores?.length, stores);
  const { data: instances } = await s.from('whatsapp_instances').select('*');
  console.log('Instances count:', instances?.length, instances);
  const { data: leads } = await s.from('leads').select('id, name, phone, store_id, updated_at').order('updated_at', { ascending: false }).limit(5);
  console.log('Recent 5 leads:', leads);
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
