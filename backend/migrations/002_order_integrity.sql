BEGIN;

CREATE SEQUENCE IF NOT EXISTS order_code_sequence;

SELECT setval(
  'order_code_sequence',
  GREATEST(
    (SELECT COALESCE(MAX(id), 0) FROM orders),
    (SELECT last_value FROM order_code_sequence)
  ),
  true
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_one_current_per_company
  ON orders(company_id)
  WHERE status = 'Current';

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_order_code
  ON orders(order_code);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

COMMIT;
