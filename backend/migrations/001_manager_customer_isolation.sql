BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS manager_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_manager_id_fkey'
      AND conrelid = 'companies'::regclass
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_manager_id_fkey
      FOREIGN KEY (manager_id)
      REFERENCES manager_users(id);
  END IF;
END
$$;

-- Legacy installations had no manager ownership. Automatic backfill is safe
-- only when there is exactly one manager; multi-manager installations require
-- an explicit business decision for every unassigned customer.
UPDATE companies
SET manager_id = (SELECT MIN(id) FROM manager_users)
WHERE manager_id IS NULL
  AND (SELECT COUNT(*) FROM manager_users) = 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM companies WHERE manager_id IS NULL) THEN
    ALTER TABLE companies
      ALTER COLUMN manager_id SET NOT NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_companies_manager_id
  ON companies(manager_id);

COMMIT;
