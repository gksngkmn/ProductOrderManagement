const ManagerService = require("../services/ManagerService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error.",
  });
}

async function requestManagerUpdateCode(req, res) {
  try {
    const result = await ManagerService.requestManagerUpdateCode(req.user);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Request manager update code error:");
  }
}

async function verifyAndUpdateManager(req, res) {
  try {
    const { code, ...managerData } = req.body;

    const result = await ManagerService.verifyAndUpdateManager(
      req.user,
      managerData,
      code
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Verify and update manager error:");
  }
}

async function requestManagerPasswordCode(req, res) {
  try {
    const result = await ManagerService.requestManagerPasswordCode(req.user);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Request manager password code error:");
  }
}

async function verifyAndUpdateManagerPassword(req, res) {
  try {
    const { code, newPassword } = req.body;

    const result = await ManagerService.verifyAndUpdateManagerPassword(
      req.user,
      code,
      newPassword
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Verify and update manager password error:");
  }
}

module.exports = {
  requestManagerUpdateCode,
  verifyAndUpdateManager,
  requestManagerPasswordCode,
  verifyAndUpdateManagerPassword,
};