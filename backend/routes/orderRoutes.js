const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  getOrdersByCompany,
  createOrder,
  addItemToOrder,
  completeOrder
} = require("../controllers/orderController");

// Customer kendi siparişlerini görür
router.get("/my", authMiddleware, requireRole("customer"), getOrdersByCompany);

// Manager belirli company'nin siparişlerini görür
router.get(
  "/company/:companyId",
  authMiddleware,
  requireRole("manager"),
  getOrdersByCompany
);

// Customer sipariş oluşturur
router.post("/", authMiddleware, requireRole("customer"), createOrder);

// Customer siparişe ürün ekler
router.post(
  "/:orderId/items",
  authMiddleware,
  requireRole("customer"),
  addItemToOrder
);

// Customer siparişi tamamlar
router.put(
  "/:orderId/complete",
  authMiddleware,
  requireRole("customer"),
  completeOrder
);

module.exports = router;