const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

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
  requestManagerUpdateCode
);

router.put(
  "/verify-update",
  authMiddleware,
  requireRole("manager"),
  verifyAndUpdateManager
);

router.post(
  "/request-password-code",
  authMiddleware,
  requireRole("manager"),
  requestManagerPasswordCode
);

router.put(
  "/verify-password",
  authMiddleware,
  requireRole("manager"),
  verifyAndUpdateManagerPassword
);

module.exports = router;