const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  getCompanies,
  createCompany,
  updateCompany,
  updateCustomerPassword,
  deleteCompany
} = require("../controllers/companyController");

router.get("/", authMiddleware, requireRole("manager"), getCompanies);

router.post("/", authMiddleware, requireRole("manager"), createCompany);

router.put("/:id", authMiddleware, updateCompany);

router.put(
  "/:id/password",
  authMiddleware,
  requireRole("manager"),
  updateCustomerPassword
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("manager"),
  deleteCompany
);

module.exports = router;