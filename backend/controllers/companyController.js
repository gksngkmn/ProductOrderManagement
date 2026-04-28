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
  updateCustomerPassword,
  deleteCompany
};