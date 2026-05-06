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
  resetPassword,

  requestForgotPasswordCode,
  resetForgotPassword
} = require("../controllers/authController");

// ===== LOGIN =====
router.post("/login", login);
router.post("/manager-login", managerLogin);
router.post("/customer-login", customerLogin);

// ===== FORGOT PASSWORD OPERATIONS (PUBLIC) =====
// User does not need to be logged in for these routes.
router.post("/forgot-password/request-code", requestForgotPasswordCode);
router.post("/forgot-password/reset", resetForgotPassword);

// ===== PASSWORD OPERATIONS (ONLY LOGGED-IN CUSTOMER) =====
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