const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  getOrdersByCompany,
  createOrder,
  addItemToOrder,
  updateOrderItem,
  deleteOrderItem,
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

router.put(
  "/:orderId/items/:itemId",
  authMiddleware,
  requireRole("customer"),
  updateOrderItem
);

router.delete(
  "/:orderId/items/:itemId",
  authMiddleware,
  requireRole("customer"),
  deleteOrderItem
);

// Customer siparişi tamamlar
router.put(
  "/:orderId/complete",
  authMiddleware,
  requireRole("customer"),
  completeOrder
);

module.exports = router;