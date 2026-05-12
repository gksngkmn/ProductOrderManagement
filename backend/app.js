const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const managerRoutes = require("./routes/managerRoutes");

const app = express();

app.use(cors());
app.use(express.json());


/* =========================
   API ROUTES
========================= */
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);

/* =========================
   FRONTEND STATIC FILES
========================= */
const frontendPath =
  process.env.ELECTRON_PACKAGED === "true"
    ? path.join(process.resourcesPath, "frontend")
    : path.join(__dirname, "..", "frontend");

console.log("Frontend path:", frontendPath);
console.log("Index exists:", fs.existsSync(path.join(frontendPath, "index.html")));

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/:page", (req, res, next) => {
  const requestedFile = path.join(frontendPath, req.params.page);

  if (fs.existsSync(requestedFile)) {
    return res.sendFile(requestedFile);
  }

  return next();
});

module.exports = app;