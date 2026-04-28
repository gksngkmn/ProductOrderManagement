const AuthService = require("../services/AuthService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error."
  });
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const result = await AuthService.login(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Login error:");
  }
}

async function managerLogin(req, res) {
  try {
    const { username, password } = req.body;

    const result = await AuthService.managerLogin(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Manager login error:");
  }
}

async function customerLogin(req, res) {
  try {
    const { username, password } = req.body;

    const result = await AuthService.customerLogin(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Customer login error:");
  }
}

async function requestPasswordCode(req, res) {
  try {
    const companyId = req.user.id;

    const result = await AuthService.requestPasswordCode(companyId);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Request password code error:");
  }
}

async function verifyPasswordCode(req, res) {
  try {
    const companyId = req.user.id;
    const { code } = req.body;

    const result = await AuthService.verifyPasswordCode(companyId, code);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Verify password code error:");
  }
}

async function resetPassword(req, res) {
  try {
    const companyId = req.user.id;
    const { code, newPassword } = req.body;

    const result = await AuthService.resetPassword(
      companyId,
      code,
      newPassword
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Reset password error:");
  }
}

module.exports = {
  login,
  managerLogin,
  customerLogin,
  requestPasswordCode,
  verifyPasswordCode,
  resetPassword
};