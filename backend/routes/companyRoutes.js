const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  getCompanies,
  createCompany,
  updateCompany,
  requestCompanyUpdateCode,
  verifyAndUpdateCompany,
  updateCustomerPassword,
  deleteCompany
} = require("../controllers/companyController");

router.get("/", authMiddleware, requireRole("manager"), getCompanies);

router.post("/", authMiddleware, requireRole("manager"), createCompany);

/* =========================
   INFO UPDATE VERIFICATION
========================= */
router.post(
  "/:id/request-update-code",
  authMiddleware,
  requestCompanyUpdateCode
);

router.put(
  "/:id/verify-update",
  authMiddleware,
  verifyAndUpdateCompany
);

/* 
  Direkt update route sadece manager için açık.
  Customer kendi bilgilerini güncellemek için verification route kullanmalıdır.
*/
router.put(
  "/:id",
  authMiddleware,
  requireRole("manager"),
  updateCompany
);

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