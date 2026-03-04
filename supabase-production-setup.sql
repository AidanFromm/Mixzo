-- ============================================
-- MixzoKickz Production SQL Setup
-- Run in Supabase SQL Editor (afmtwymcqprwaukkpfta)
-- ============================================

-- 1. Make Aidan's profile an owner (not just manager)
UPDATE profiles SET role = 'owner' WHERE email = 'usevantix@gmail.com';

-- 2. Settings table — store defaults
INSERT INTO settings (id, key, value) VALUES 
  (gen_random_uuid(), 'store_name', 'MixzoKickz'),
  (gen_random_uuid(), 'store_email', 'mixzo.kickz@gmail.com'),
  (gen_random_uuid(), 'store_phone', '720-720-5015'),
  (gen_random_uuid(), 'store_location', 'Denver, CO'),
  (gen_random_uuid(), 'free_shipping_threshold', '200'),
  (gen_random_uuid(), 'tax_rate', '0')
ON CONFLICT DO NOTHING;

-- 3. Gift cards table (referenced in checkout but may not exist)
CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  initial_balance numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'disabled')),
  purchaser_email text,
  recipient_email text,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Payment links table
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  amount numeric NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  stripe_payment_link_id text,
  url text,
  times_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  permissions jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 6. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7. Inventory adjustments log
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id),
  adjustment integer NOT NULL,
  reason text,
  adjusted_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 8. Ensure products table has all needed columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new';
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_box boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS colorway text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT 'sneakers';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_id text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS goat_product_id text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stockx_product_id text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_oz numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;

-- 9. Ensure orders table has all needed columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- 10. Discount codes — ensure structure
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type text DEFAULT 'percentage';
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value numeric DEFAULT 0;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS times_used integer DEFAULT 0;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS max_uses integer;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS min_purchase numeric DEFAULT 0;

-- 11. RLS Policies — allow service role full access, anon read on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY IF NOT EXISTS "Public read products" ON products FOR SELECT USING (status = 'active');
-- Authenticated users can read their own orders
CREATE POLICY IF NOT EXISTS "Users read own orders" ON orders FOR SELECT USING (auth.uid()::text = customer_email OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')));
-- Service role bypasses RLS automatically

-- 12. Create storage bucket for product images (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Done!
SELECT 'MixzoKickz production SQL setup complete!' as status;
