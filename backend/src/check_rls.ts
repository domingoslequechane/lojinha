import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const client = createClient(url, anonKey);

async function check() {
  // Check if we can query pg_policies or pg_tables via rpc or query
  // Let's test select on messages as anon
  const { data: anonMessages, error: anonErr } = await client.from('messages').select('id').limit(1);
  console.log('Anon select messages:', anonErr ? anonErr.message : 'OK', anonMessages?.length);

  const { data: anonLeads, error: leadsErr } = await client.from('leads').select('id').limit(1);
  console.log('Anon select leads:', leadsErr ? leadsErr.message : 'OK', anonLeads?.length);
}

check().then(() => process.exit(0));
