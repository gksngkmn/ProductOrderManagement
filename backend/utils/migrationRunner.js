const fs = require("fs");
const path = require("path");

async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsPath = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [file]
    );

    if (applied.rows.length) continue;

    const sql = fs.readFileSync(path.join(migrationsPath, file), "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    console.log(`Applied migration: ${file}`);
  }
}

module.exports = runMigrations;
