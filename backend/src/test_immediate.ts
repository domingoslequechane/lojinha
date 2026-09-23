import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const ch = s.channel('test-unsub', { config: { broadcast: { ack: true } } });

ch.subscribe((status) => {
  console.log('Status change:', status);
});

// Immediately send before SUBSCRIBED
ch.send({ type: 'broadcast', event: 'foo', payload: {} }).then(res => {
  console.log('Immediate send result:', res);
  setTimeout(() => process.exit(0), 1000);
}).catch(err => {
  console.error('Immediate send error:', err);
  process.exit(1);
});
