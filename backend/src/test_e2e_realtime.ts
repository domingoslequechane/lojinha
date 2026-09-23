/**
 * Full end-to-end test of the Vercel webhook broadcast path:
 * 1. Start a receiver listening on lojinha-realtime-global
 * 2. Call the same logic as frontend/api/webhook.ts (insert msg + broadcast)
 * 3. Verify the receiver gets the message:new event instantly
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const receiver = createClient(url, anonKey);
const webhook = createClient(url, anonKey);

async function runE2ETest() {
  let receivedBroadcast = false;
  let receivedLeadBroadcast = false;

  // 1. Setup receiver (simulates the frontend app)
  const rx = receiver.channel('lojinha-realtime-global');
  rx.on('broadcast', { event: 'message:new' }, (payload) => {
    console.log('✅ [E2E] Frontend received message:new broadcast!');
    console.log('   message text:', payload.payload?.message?.text);
    receivedBroadcast = true;
  });
  rx.on('broadcast', { event: 'lead:change' }, (payload) => {
    console.log('✅ [E2E] Frontend received lead:change broadcast!');
    console.log('   eventType:', payload.payload?.eventType);
    receivedLeadBroadcast = true;
  });
  await new Promise((resolve) => rx.subscribe((s) => s === 'SUBSCRIBED' && resolve(s)));
  console.log('Receiver subscribed and listening...');

  // 2. Find a lead to use for test
  const { data: leads } = await webhook.from('leads').select('id, store_id, unread_count').limit(1);
  if (!leads || leads.length === 0) {
    console.error('No leads found');
    process.exit(1);
  }
  const lead = leads[0];
  const storeId = lead.store_id;

  // 3. Insert message (as Vercel webhook would)
  const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toLocaleDateString('pt-PT');
  
  const { data: insertedMsg } = await webhook.from('messages').insert({
    store_id: storeId,
    lead_id: lead.id,
    from_me: false,
    type: 'text',
    text: '[E2E Realtime Test] ' + new Date().toISOString(),
    timestamp: timeStr,
    full_date: dateStr,
    status: 'delivered',
  }).select('*').single();

  console.log('Inserted msg id:', insertedMsg?.id);

  // 4. Update lead
  const { data: updatedLead } = await webhook.from('leads').update({
    last_message: '[E2E Realtime Test]',
    last_message_time: timeStr,
    last_message_timestamp: Date.now(),
    unread_count: (lead.unread_count || 0) + 1,
  }).eq('id', lead.id).select('*').single();

  // 5. Broadcast (as Vercel webhook would)
  if (insertedMsg) {
    const broadcastChannel = webhook.channel('lojinha-realtime-global');
    const res = await broadcastChannel.send({
      type: 'broadcast',
      event: 'message:new',
      payload: { storeId, message: insertedMsg, lead: updatedLead || lead },
    });
    console.log('Broadcast message:new result:', res);
    webhook.removeChannel(broadcastChannel);

    if (updatedLead) {
      const leadChannel = webhook.channel('lojinha-realtime-global-2');
      const res2 = await leadChannel.send({
        type: 'broadcast',
        event: 'lead:change',
        payload: { storeId, eventType: 'UPDATE', lead: updatedLead },
      });
      console.log('Broadcast lead:change result:', res2);
      webhook.removeChannel(leadChannel);
    }
  }

  // 6. Wait for delivery
  await new Promise(r => setTimeout(r, 3000));

  // 7. Cleanup
  if (insertedMsg) {
    await webhook.from('messages').delete().eq('id', insertedMsg.id);
    console.log('Cleaned up test message.');
  }

  console.log('\n--- E2E TEST SUMMARY ---');
  console.log('message:new received:', receivedBroadcast);
  console.log('lead:change received:', receivedLeadBroadcast);
  
  if (receivedBroadcast && receivedLeadBroadcast) {
    console.log('\n✅ REALTIME IS FULLY WORKING! Frontend will receive messages instantly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some broadcasts were not received.');
    process.exit(1);
  }
}

runE2ETest();
