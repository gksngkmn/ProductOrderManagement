const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  verificationRequestRateLimiter,
  verificationAttemptRateLimiter
} = require("../middleware/rateLimitMiddleware");

const {
  requestManagerUpdateCode,
  verifyAndUpdateManager,
  requestManagerPasswordCode,
  verifyAndUpdateManagerPassword,
} = require("../controllers/managerController");

router.post(
  "/request-update-code",
  authMiddleware,
  requireRole("manager"),
  verificationRequestRateLimiter,
  requestManagerUpdateCode
);

router.put(
  "/verify-update",
  authMiddleware,
  requireRole("manager"),
  verificationAttemptRateLimiter,
  verifyAndUpdateManager
);

router.post(
  "/request-password-code",
  authMiddleware,
  requireRole("manager"),
  verificationRequestRateLimiter,
  requestManagerPasswordCode
);

router.put(
  "/verify-password",
  authMiddleware,
  requireRole("manager"),
  verificationAttemptRateLimiter,
  verifyAndUpdateManagerPassword
);

module.exports = router;
