const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const app = require("./app");
const pool = require("./db");
const runMigrations = require("./utils/migrationRunner");

const PORT = process.env.PORT || 3000;

const ready = runMigrations(pool).then(() => {
  return app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
});

ready.catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exitCode = 1;
});

ready.close = (callback) => {
  ready.then((server) => server.close(callback)).catch(() => callback?.());
};

module.exports = ready;
