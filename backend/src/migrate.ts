// Temporary migration runner — run with: npx tsx src/run-migration.ts
// Delete after use
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🔄 Running migrations via Supabase RPC...\n');

  // Try to create a migration function first using anon key (will fail without service role)
  // Instead, let's use upsert to add the column indirectly by inserting rows with those fields
  
  // Workaround: Use Supabase's implicit column addition via upsert with new fields
  // This won't work either without service role
  
  // The REAL solution: try using the Supabase pooler DB URL
  // Format: postgresql://postgres.nijlwzqxsgmutpstujoz:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
  
  const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (DB_URL) {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    
    const sql = `
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_type text DEFAULT 'followup';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_address text;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_product text;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_quantity text;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_value numeric;
    `;
    
    await client.query(sql);
    await client.end();
    console.log('✅ Migrations applied!');
  } else {
    console.log('❌ No DB_URL found. Please add SUPABASE_DB_URL to .env');
    console.log('\nGet it from: Supabase Dashboard → Settings → Database → Connection string');
    console.log('\nSQL to run manually in Supabase SQL Editor:');
    console.log(`
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_type text DEFAULT 'followup';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_product text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_quantity text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_value numeric;
`);
  }
}

main().catch(console.error);
