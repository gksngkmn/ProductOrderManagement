const SuperadminService = require("../services/SuperadminService");

function handleError(res, error, operation) {
  console.error(`${operation}:`, error);
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error."
  });
}

async function getManagers(req, res) {
  try { return res.json(await SuperadminService.getManagers()); }
  catch (error) { return handleError(res, error, "Get managers error"); }
}

async function createManager(req, res) {
  try { return res.status(201).json(await SuperadminService.createManager(req.body)); }
  catch (error) { return handleError(res, error, "Create manager error"); }
}

async function updateManager(req, res) {
  try { return res.json(await SuperadminService.updateManager(req.params.id, req.body)); }
  catch (error) { return handleError(res, error, "Update manager error"); }
}

async function getCustomersByManager(req, res) {
  try { return res.json(await SuperadminService.getCustomersByManager(req.params.id)); }
  catch (error) { return handleError(res, error, "Get manager customers error"); }
}

async function createCustomer(req, res) {
  try {
    return res.status(201).json(
      await SuperadminService.createCustomer(req.params.id, req.body)
    );
  } catch (error) { return handleError(res, error, "Create customer error"); }
}

async function updateCustomer(req, res) {
  try { return res.json(await SuperadminService.updateCustomer(req.params.id, req.body)); }
  catch (error) { return handleError(res, error, "Update customer error"); }
}

async function deleteCustomer(req, res) {
  try { return res.json(await SuperadminService.deleteCustomer(req.params.id)); }
  catch (error) { return handleError(res, error, "Delete customer error"); }
}

async function deleteManager(req, res) {
  try {
    return res.json(await SuperadminService.deleteManager(req.params.id));
  } catch (error) { return handleError(res, error, "Delete manager error"); }
}

module.exports = {
  getManagers,
  createManager,
  updateManager,
  deleteManager,
  getCustomersByManager,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
