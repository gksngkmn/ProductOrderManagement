const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = require("../db");
const runMigrations = require("../utils/migrationRunner");

runMigrations(pool)
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
