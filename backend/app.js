const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const managerRoutes = require("./routes/managerRoutes");
const superadminRoutes = require("./routes/superadminRoutes");

const app = express();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


/* =========================
   API ROUTES
========================= */
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/superadmin", superadminRoutes);

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

app.use((error, req, res, next) => {
  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ message: "Origin is not allowed." });
  }

  return next(error);
});

module.exports = app;
