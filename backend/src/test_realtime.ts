import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

console.log('Testing Supabase Realtime with URL:', url);

const receiver = createClient(url, anonKey);
const sender = createClient(url, anonKey);

async function runTest() {
  let receivedBroadcast = false;
  let receivedPostgres = false;

  // 1. Setup receiver channel
  const rxChannel = receiver.channel('lojinha-realtime-global', {
    config: { broadcast: { ack: false } }
  });

  rxChannel.on('broadcast', { event: 'test-event' }, (payload) => {
    console.log('✅ Receiver received broadcast event:', payload);
    receivedBroadcast = true;
  });

  rxChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    console.log('✅ Receiver received postgres_changes on messages:', payload.eventType);
    receivedPostgres = true;
  });

  console.log('Subscribing receiver...');
  const rxStatus = await new Promise<string>((resolve) => {
    rxChannel.subscribe((status, err) => {
      console.log('Receiver status change:', status, err || '');
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        resolve(status);
      }
    });
  });

  console.log('Receiver subscribed with status:', rxStatus);

  if (rxStatus !== 'SUBSCRIBED') {
    console.error('❌ Receiver failed to subscribe to channel!');
    process.exit(1);
  }

  // 2. Setup sender channel
  console.log('Subscribing sender...');
  const txChannel = sender.channel('lojinha-realtime-global', {
    config: { broadcast: { ack: true } }
  });

  const txStatus = await new Promise<string>((resolve) => {
    txChannel.subscribe((status, err) => {
      console.log('Sender status change:', status, err || '');
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        resolve(status);
      }
    });
  });

  console.log('Sender subscribed with status:', txStatus);

  // 3. Test broadcast sending
  console.log('Sending broadcast message...');
  const sendResult = await txChannel.send({
    type: 'broadcast',
    event: 'test-event',
    payload: { hello: 'world', timestamp: Date.now() }
  });

  console.log('Broadcast send result:', sendResult);

  // Wait 3 seconds for delivery
  await new Promise(r => setTimeout(r, 3000));
  console.log('Did receiver get broadcast?', receivedBroadcast);

  // 4. Test postgres_changes by inserting a test message
  console.log('Inserting test message to test postgres_changes...');
  // Find a store and lead
  const { data: leads } = await receiver.from('leads').select('id, store_id').limit(1);
  if (leads && leads.length > 0) {
    const lead = leads[0];
    const { data: inserted, error: insErr } = await sender.from('messages').insert({
      store_id: lead.store_id,
      lead_id: lead.id,
      from_me: true,
      type: 'text',
      text: '__REALTIME_TEST__',
      timestamp: '12:00',
      full_date: '22/09/2026',
      status: 'sent'
    }).select('id').single();

    if (insErr) {
      console.error('Error inserting test message:', insErr);
    } else {
      console.log('Inserted test message ID:', inserted?.id);
      // wait 4 seconds
      await new Promise(r => setTimeout(r, 4000));
      console.log('Did receiver get postgres_changes?', receivedPostgres);
      // clean up test message
      await sender.from('messages').delete().eq('id', inserted?.id);
      console.log('Cleaned up test message');
    }
  }

  console.log('--- TEST SUMMARY ---');
  console.log('Broadcast Working:', receivedBroadcast);
  console.log('Postgres Changes Working:', receivedPostgres);

  process.exit(0);
}

runTest().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
