ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_type text DEFAULT 'followup';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_product text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_quantity text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_value numeric;
