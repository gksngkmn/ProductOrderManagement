const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  login,
  managerLogin,
  customerLogin,
  requestPasswordCode,
  verifyPasswordCode,
  resetPassword
} = require("../controllers/authController");

// ===== LOGIN =====
router.post("/login", login);
router.post("/manager-login", managerLogin);
router.post("/customer-login", customerLogin);

// ===== PASSWORD OPERATIONS (ONLY CUSTOMER) =====
router.post(
  "/request-password-code",
  authMiddleware,
  requireRole("customer"),
  requestPasswordCode
);

router.post(
  "/verify-password-code",
  authMiddleware,
  requireRole("customer"),
  verifyPasswordCode
);

router.post(
  "/reset-password",
  authMiddleware,
  requireRole("customer"),
  resetPassword
);

// TEST ROUTE
router.get("/", (req, res) => {
  res.json({ message: "Auth route works." });
});

module.exports = router;