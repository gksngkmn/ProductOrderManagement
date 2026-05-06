const CompanyService = require("../services/CompanyService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error."
  });
}

async function getCompanies(req, res) {
  try {
    const companies = await CompanyService.getCompanies();
    return res.json(companies);
  } catch (error) {
    return handleError(res, error, "Get companies error:");
  }
}

async function createCompany(req, res) {
  try {
    const company = await CompanyService.createCompany(req.body);
    return res.status(201).json(company);
  } catch (error) {
    return handleError(res, error, "Create company error:");
  }
}

async function updateCompany(req, res) {
  try {
    const { id } = req.params;

    const updatedCompany = await CompanyService.updateCompany(
      id,
      req.user,
      req.body
    );

    return res.json(updatedCompany);
  } catch (error) {
    return handleError(res, error, "Update company error:");
  }
}

/* =========================
   INFO UPDATE VERIFICATION
========================= */
async function requestCompanyUpdateCode(req, res) {
  try {
    const { id } = req.params;

    const result = await CompanyService.requestCompanyUpdateCode(
      id,
      req.user
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Request company update code error:");
  }
}

async function verifyAndUpdateCompany(req, res) {
  try {
    const { id } = req.params;
    const { code, ...companyData } = req.body;

    const updatedCompany = await CompanyService.verifyAndUpdateCompany(
      id,
      req.user,
      companyData,
      code
    );

    return res.json(updatedCompany);
  } catch (error) {
    return handleError(res, error, "Verify and update company error:");
  }
}

async function updateCustomerPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const result = await CompanyService.updateCustomerPassword(id, newPassword);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Update customer password error:");
  }
}

async function deleteCompany(req, res) {
  try {
    const { id } = req.params;

    const result = await CompanyService.deleteCompany(id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Delete company error:");
  }
}

module.exports = {
  getCompanies,
  createCompany,
  updateCompany,

  requestCompanyUpdateCode,
  verifyAndUpdateCompany,

  updateCustomerPassword,
  deleteCompany
};