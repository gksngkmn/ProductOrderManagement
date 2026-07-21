const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  getProducts,
  createProduct,
  importProducts,
  sendProductUpdates,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

router.get("/", authMiddleware, getProducts);

router.post("/", authMiddleware, requireRole("manager"), createProduct);

router.post("/import", authMiddleware, requireRole("manager"), importProducts);

/* =========================
   SEND PRODUCT UPDATES
   MANAGER ONLY
========================= */
router.post(
  "/send-updates",
  authMiddleware,
  requireRole("manager"),
  sendProductUpdates
);

router.put("/:id", authMiddleware, requireRole("manager"), updateProduct);

router.delete("/:id", authMiddleware, requireRole("manager"), deleteProduct);

module.exports = router;
