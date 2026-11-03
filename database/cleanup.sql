-- Run this SQL in your Supabase SQL Editor to safely clean up the test products and exact duplicates

-- 1. Safely remove test products that are NOT referenced in any active orders/carts
DELETE FROM products 
WHERE (name ILIKE 'test product%' OR name ILIKE 'test item%')
  AND id NOT IN (SELECT product_id FROM order_items)
  AND id NOT IN (SELECT product_id FROM cart_items);

-- 2. Safely remove exact duplicates (same name, price, category) while keeping the oldest entry
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY LOWER(TRIM(name)), price, category_id ORDER BY id ASC) as rn
  FROM products
)
DELETE FROM products
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
  AND id NOT IN (SELECT product_id FROM order_items)
  AND id NOT IN (SELECT product_id FROM cart_items);
