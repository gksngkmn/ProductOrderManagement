const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const VerificationService = require("./VerificationService");

const {
  sendCustomerPasswordChangedMailToManager
} = require("../utils/mailService");

class AuthService {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
  }

  static formatManager(manager) {
    return {
      id: manager.id,
      username: manager.username,
      role: "manager",
      name: manager.name || "Manager",
      email: manager.email || "",
      phone: manager.phone || ""
    };
  }

  static formatCustomer(company) {
    return {
      id: company.id,
      name: company.name,
      surname: company.surname,
      email: company.email,
      phone: company.phone,
      company: company.company_name,
      address: company.address,
      country: company.country,
      city: company.city,
      companyPhone: company.company_phone,
      username: company.username,
      role: "customer"
    };
  }

  static async login(username, password) {
    if (!username || !password) {
      const error = new Error("Username and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const managerResult = await pool.query(
      "SELECT * FROM manager_users WHERE username = $1",
      [username]
    );

    if (managerResult.rows.length > 0) {
      const manager = managerResult.rows[0];

      const isMatch = await bcrypt.compare(password, manager.password_hash);

      if (!isMatch) {
        const error = new Error("Wrong username or password.");
        error.statusCode = 401;
        throw error;
      }

      const token = this.generateToken({
        id: manager.id,
        role: "manager"
      });

      return {
        token,
        user: this.formatManager(manager)
      };
    }

    const companyResult = await pool.query(
      "SELECT * FROM companies WHERE username = $1",
      [username]
    );

    if (companyResult.rows.length > 0) {
      const company = companyResult.rows[0];

      const isMatch = await bcrypt.compare(password, company.password_hash);

      if (!isMatch) {
        const error = new Error("Wrong username or password.");
        error.statusCode = 401;
        throw error;
      }

      const token = this.generateToken({
        id: company.id,
        role: "customer"
      });

      return {
        token,
        user: this.formatCustomer(company)
      };
    }

    const error = new Error("Wrong username or password.");
    error.statusCode = 401;
    throw error;
  }

  static async managerLogin(username, password) {
    if (!username || !password) {
      const error = new Error("Username and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      "SELECT * FROM manager_users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      const error = new Error("Wrong manager username or password.");
      error.statusCode = 401;
      throw error;
    }

    const manager = result.rows[0];
    const isMatch = await bcrypt.compare(password, manager.password_hash);

    if (!isMatch) {
      const error = new Error("Wrong manager username or password.");
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken({
      id: manager.id,
      role: "manager"
    });

    return {
      token,
      user: this.formatManager(manager)
    };
  }

  static async customerLogin(username, password) {
    if (!username || !password) {
      const error = new Error("Username and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      "SELECT * FROM companies WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      const error = new Error("Wrong customer username or password.");
      error.statusCode = 401;
      throw error;
    }

    const company = result.rows[0];
    const isMatch = await bcrypt.compare(password, company.password_hash);

    if (!isMatch) {
      const error = new Error("Wrong customer username or password.");
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken({
      id: company.id,
      role: "customer"
    });

    return {
      token,
      user: this.formatCustomer(company)
    };
  }

  /* =========================
     PASSWORD CHANGE
     LOGGED-IN CUSTOMER ONLY
  ========================= */
  static async requestPasswordCode(companyId) {
    if (!companyId) {
      const error = new Error("Company ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const company = await this.getCompanyById(companyId);

    await VerificationService.createCode({
      companyId: company.id,
      email: company.email,
      phone: company.phone,
      name: company.name,
      purpose: "password_change",
      reason: "Password change verification"
    });

    return {
      message: "Password change verification code sent successfully."
    };
  }

    static async verifyPasswordCode(companyId, code) {
    if (!companyId || !code) {
      const error = new Error("Company ID and code are required.");
      error.statusCode = 400;
      throw error;
    }

    await VerificationService.checkCode({
      companyId,
      purpose: "password_change",
      code
    });

    return {
      message: "Verification successful."
    };
  }
  static async resetPassword(companyId, code, newPassword) {
    if (!companyId || !code || !newPassword) {
      const error = new Error("Company ID, code and new password are required.");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 4) {
      const error = new Error("New password must be at least 4 characters.");
      error.statusCode = 400;
      throw error;
    }

    const company = await this.getCompanyById(companyId);

    await VerificationService.verifyCode({
      companyId,
      purpose: "password_change",
      code
    });

    const isSamePassword = await bcrypt.compare(
      newPassword,
      company.password_hash
    );

    if (isSamePassword) {
      const error = new Error("New password cannot be the same as old password.");
      error.statusCode = 400;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE companies
      SET password_hash = $1,
          reset_code_hash = NULL,
          reset_code_expires = NULL
      WHERE id = $2
      `,
      [newPasswordHash, companyId]
    );

    try {
      await sendCustomerPasswordChangedMailToManager({
        customer: this.formatCustomer(company)
      });
    } catch (mailError) {
      console.log("Password change notification mail could not be sent:", mailError.message);
    }

    return {
      message: "Password changed successfully."
    };
  }

  /* =========================
     FORGOT PASSWORD
     PUBLIC ROUTES
  ========================= */
  static async findCustomerByIdentifier(identifier) {
    if (!identifier) {
      const error = new Error("Email or username is required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE email = $1
      OR username = $1
      `,
      [identifier]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  static async requestForgotPasswordCode(identifier) {
    const company = await this.findCustomerByIdentifier(identifier);

    await VerificationService.createCode({
      companyId: company.id,
      email: company.email,
      phone: company.phone,
      name: company.name,
      purpose: "forgot_password",
      reason: "Forgot password verification"
    });

    return {
      message: "Forgot password verification code sent successfully."
    };
  }

  static async resetForgotPassword(identifier, code, newPassword) {
    if (!identifier || !code || !newPassword) {
      const error = new Error("Identifier, code and new password are required.");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 4) {
      const error = new Error("New password must be at least 4 characters.");
      error.statusCode = 400;
      throw error;
    }

    const company = await this.findCustomerByIdentifier(identifier);

    await VerificationService.verifyCode({
      companyId: company.id,
      email: company.email,
      purpose: "forgot_password",
      code
    });

    const isSamePassword = await bcrypt.compare(
      newPassword,
      company.password_hash
    );

    if (isSamePassword) {
      const error = new Error("New password cannot be the same as old password.");
      error.statusCode = 400;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE companies
      SET password_hash = $1,
          reset_code_hash = NULL,
          reset_code_expires = NULL
      WHERE id = $2
      `,
      [newPasswordHash, company.id]
    );

    try {
      await sendCustomerPasswordChangedMailToManager({
        customer: this.formatCustomer(company)
      });
    } catch (mailError) {
      console.log("Forgot password notification mail could not be sent:", mailError.message);
    }

    return {
      message: "Password reset successfully."
    };
  }

  static async getCompanyById(companyId) {
    const result = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [companyId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }
}

module.exports = AuthService;