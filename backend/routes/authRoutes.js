const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  loginRateLimiter,
  verificationRequestRateLimiter,
  verificationAttemptRateLimiter
} = require("../middleware/rateLimitMiddleware");

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
router.post("/login", loginRateLimiter, login);
router.post("/manager-login", loginRateLimiter, managerLogin);
router.post("/customer-login", loginRateLimiter, customerLogin);
router.post("/superadmin-login", loginRateLimiter, login);

// ===== FORGOT PASSWORD OPERATIONS (PUBLIC) =====
// User does not need to be logged in for these routes.
router.post("/forgot-password/request-code", verificationRequestRateLimiter, requestForgotPasswordCode);
router.post("/forgot-password/reset", verificationAttemptRateLimiter, resetForgotPassword);

// ===== PASSWORD OPERATIONS (ONLY LOGGED-IN CUSTOMER) =====
router.post(
  "/request-password-code",
  authMiddleware,
  requireRole("customer"),
  verificationRequestRateLimiter,
  requestPasswordCode
);

router.post(
  "/verify-password-code",
  authMiddleware,
  requireRole("customer"),
  verificationAttemptRateLimiter,
  verifyPasswordCode
);

router.post(
  "/reset-password",
  authMiddleware,
  requireRole("customer"),
  verificationAttemptRateLimiter,
  resetPassword
);

// TEST ROUTE
router.get("/", (req, res) => {
  res.json({ message: "Auth route works." });
});

module.exports = router;
