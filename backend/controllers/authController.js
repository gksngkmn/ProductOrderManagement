const AuthService = require("../services/AuthService");
const bcrypt = require("bcryptjs");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error."
  });
}

async function authenticateSuperAdmin(username, password) {
  if (username !== process.env.SUPER_ADMIN_USER) {
    return null;
  }

  const passwordHash = process.env.SUPER_ADMIN_PASSWORD_HASH;
  const isMatch = Boolean(
    password &&
    passwordHash &&
    await bcrypt.compare(password, passwordHash)
  );

  if (!isMatch) {
    const error = new Error("Wrong username or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = AuthService.generateToken({ id: "super", role: "superadmin" });

  return {
    token,
    user: { username, role: "superadmin" }
  };
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const superAdminResult = await authenticateSuperAdmin(username, password);

    if (superAdminResult) {
      return res.json(superAdminResult);
    }

    const result = await AuthService.login(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Login error:");
  }
}

async function managerLogin(req, res) {
  try {
    const { username, password } = req.body;

    const superAdminResult = await authenticateSuperAdmin(username, password);

    if (superAdminResult) {
      return res.json(superAdminResult);
    }

    const result = await AuthService.managerLogin(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Manager login error:");
  }
}

async function customerLogin(req, res) {
  try {
    const { username, password } = req.body;

    const superAdminResult = await authenticateSuperAdmin(username, password);

    if (superAdminResult) {
      return res.json(superAdminResult);
    }

    const result = await AuthService.customerLogin(username, password);

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Customer login error:");
  }
}

/* =========================
   PASSWORD CHANGE
   LOGGED-IN CUSTOMER ONLY
========================= */
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

/* =========================
   FORGOT PASSWORD
   PUBLIC ROUTES
========================= */
async function requestForgotPasswordCode(req, res) {
  try {
    const { identifier, deliveryMethod, accountType } = req.body;

    const result = await AuthService.requestForgotPasswordCode(
      identifier,
      deliveryMethod,
      accountType
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Request forgot password code error:");
  }
}

async function resetForgotPassword(req, res) {
  try {
    const { identifier, code, newPassword, accountType } = req.body;

    const result = await AuthService.resetForgotPassword(
      identifier,
      code,
      newPassword,
      accountType
    );

    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Reset forgot password error:");
  }
}

module.exports = {
  login,
  managerLogin,
  customerLogin,

  requestPasswordCode,
  verifyPasswordCode,
  resetPassword,

  requestForgotPasswordCode,
  resetForgotPassword
};
