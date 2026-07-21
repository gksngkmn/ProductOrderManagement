BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_currency_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_currency_check
      CHECK (currency IN ('USD', 'CNY'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_currency_check') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_currency_check
      CHECK (currency IN ('USD', 'CNY'));
  END IF;
END
$$;

COMMIT;
