BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS manager_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_manager_id_fkey'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES manager_users(id);
  END IF;
END
$$;

-- Legacy products were shared. Keep the original rows for the oldest manager
-- and clone the catalogue for every other existing manager so each tenant
-- starts with the same data but can change it independently afterwards.
DO $$
DECLARE
  legacy_manager_id INTEGER;
  manager_record RECORD;
  product_record RECORD;
  cloned_product_id INTEGER;
BEGIN
  SELECT MIN(id) INTO legacy_manager_id FROM manager_users;

  IF legacy_manager_id IS NOT NULL THEN
    UPDATE products SET manager_id = legacy_manager_id WHERE manager_id IS NULL;

    CREATE TEMP TABLE IF NOT EXISTS product_tenant_clone_map (
      original_product_id INTEGER NOT NULL,
      manager_id INTEGER NOT NULL,
      cloned_product_id INTEGER NOT NULL,
      PRIMARY KEY (original_product_id, manager_id)
    ) ON COMMIT DROP;

    FOR manager_record IN
      SELECT id FROM manager_users WHERE id <> legacy_manager_id ORDER BY id
    LOOP
      FOR product_record IN
        SELECT * FROM products WHERE manager_id = legacy_manager_id ORDER BY id
      LOOP
        INSERT INTO products (
          material, type, model, angle, nodal_length, width,
          number_of_teeth, unit_price, currency, created_at, manager_id
        ) VALUES (
          product_record.material, product_record.type, product_record.model,
          product_record.angle, product_record.nodal_length, product_record.width,
          product_record.number_of_teeth, product_record.unit_price,
          product_record.currency, product_record.created_at, manager_record.id
        ) RETURNING id INTO cloned_product_id;

        INSERT INTO product_tenant_clone_map
          (original_product_id, manager_id, cloned_product_id)
        VALUES (product_record.id, manager_record.id, cloned_product_id);
      END LOOP;
    END LOOP;

    UPDATE order_items oi
    SET product_id = clone.cloned_product_id
    FROM orders o
    JOIN companies c ON c.id = o.company_id
    JOIN product_tenant_clone_map clone ON clone.manager_id = c.manager_id
    WHERE oi.order_id = o.id
      AND oi.product_id = clone.original_product_id;
  END IF;
END
$$;

ALTER TABLE products ALTER COLUMN manager_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_manager_id ON products(manager_id);
CREATE INDEX IF NOT EXISTS idx_products_manager_model ON products(manager_id, model);

-- Product deletion must never erase historical order items.
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

COMMIT;
