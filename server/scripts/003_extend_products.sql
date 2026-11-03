-- Add new fields for modern storefront
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) DEFAULT 0;
