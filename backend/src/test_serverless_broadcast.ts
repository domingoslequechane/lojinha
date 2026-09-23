import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const receiver = createClient(url, anonKey);
const serverlessSender = createClient(url, anonKey);

async function testServerlessBroadcast() {
  let received = false;

  // Receiver listens
  const rx = receiver.channel('lojinha-realtime-global');
  rx.on('broadcast', { event: 'message:new' }, (payload) => {
    console.log('⚡ Receiver got instant broadcast!', payload);
    received = true;
  });

  await new Promise((resolve) => rx.subscribe((s) => {
    if (s === 'SUBSCRIBED') resolve(s);
  }));

  console.log('Receiver listening on lojinha-realtime-global.');

  // Serverless sender function (simulate Vercel webhook)
  console.log('Simulating Vercel broadcast...');
  const start = Date.now();

  const channel = serverlessSender.channel('lojinha-realtime-global', {
    config: { broadcast: { ack: true } }
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), 3000);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        const res = await channel.send({
          type: 'broadcast',
          event: 'message:new',
          payload: {
            storeId: '29de077e-a057-48c4-9869-20e5ce9dee3f',
            message: {
              id: 'test-msg-1',
              lead_id: '41a2ec82-2205-4da7-874a-c7f96b622e11',
              contactId: '41a2ec82-2205-4da7-874a-c7f96b622e11',
              from_me: false,
              type: 'text',
              text: 'Serverless broadcast test',
              timestamp: '01:00',
              full_date: '22/09/2026',
              status: 'delivered'
            }
          }
        });
        console.log(`Send completed in ${Date.now() - start}ms with result:`, res);
        resolve();
      }
    });
  });

  // wait 1s
  await new Promise(r => setTimeout(r, 1000));
  console.log('Test success? received =', received);
  process.exit(received ? 0 : 1);
}

testServerlessBroadcast();
