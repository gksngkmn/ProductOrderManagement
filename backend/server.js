const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = server;