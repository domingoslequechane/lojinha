import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;
const instanceId = '96bb4cce-71f4-4507-944c-ebbf98b9172d';

async function check() {
  console.log('Checking Evolution API at:', EVOLUTION_API_URL);
  
  // 1. Get instance info / token
  try {
    const instRes = await axios.get(`${EVOLUTION_API_URL}/instance/all`, {
      headers: { apikey: EVOLUTION_API_KEY }
    });
    console.log('Instances found:', instRes.data?.data?.length);
    console.log('All instances:', JSON.stringify(instRes.data, null, 2));
  } catch (err: any) {
    console.error('Error checking Evolution:', err.response?.data || err.message);
  }
}

check().then(() => process.exit(0));
