import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

async function testHttpBroadcast() {
  try {
    const res = await axios.post(`${url}/rest/v1/rpc/broadcast`, {
      topic: 'lojinha-realtime-global',
      event: 'test_http_event',
      payload: { hello: 'from_http', time: Date.now() },
      private: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });
    console.log('HTTP broadcast response:', res.status, res.data);
  } catch (err: any) {
    console.log('HTTP broadcast error:', err.response?.status, err.response?.data || err.message);
  }
}

testHttpBroadcast().then(() => process.exit(0));
