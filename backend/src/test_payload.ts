import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const client = createClient(url, anonKey);

async function run() {
  const channel = client.channel('test-payload');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    console.log('--- RECEIVED POSTGRES_CHANGES ---');
    console.log('Full payload:', JSON.stringify(payload, null, 2));
  });

  await new Promise((resolve) => channel.subscribe((s) => {
    if (s === 'SUBSCRIBED') resolve(s);
  }));

  console.log('Subscribed. Inserting message...');
  const { data: leads } = await client.from('leads').select('id, store_id').limit(1);
  const lead = leads![0];

  const { data: msg } = await client.from('messages').insert({
    store_id: lead.store_id,
    lead_id: lead.id,
    from_me: false,
    type: 'text',
    text: 'Testing payload fields',
    timestamp: '12:34',
    full_date: '22/09/2026',
    status: 'delivered'
  }).select('*').single();

  console.log('Inserted msg id:', msg.id);
  await new Promise(r => setTimeout(r, 4000));
  await client.from('messages').delete().eq('id', msg.id);
  process.exit(0);
}

run();
