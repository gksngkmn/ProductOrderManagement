const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const VerificationService = require("./VerificationService");
const { validatePassword } = require("../utils/passwordPolicy");

const {
  sendCustomerPasswordChangedMailToManager
} = require("../utils/mailService");

class AuthService {
  static async getManagerEmailForCustomer(customer) {
    if (!customer?.manager_id) return null;

    const result = await pool.query(
      "SELECT email FROM manager_users WHERE id = $1",
      [customer.manager_id]
    );

    return result.rows[0]?.email || null;
  }

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
      reason: "Password change verification",
      deliveryMethod: "email",
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

    validatePassword(newPassword);

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
      const managerEmail = await this.getManagerEmailForCustomer(company);
      await sendCustomerPasswordChangedMailToManager({
        customer: this.formatCustomer(company),
        managerEmail
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
  static async findAccountByIdentifier(identifier, accountType = "customer") {
    if (!identifier) {
      const error = new Error("Email or username is required.");
      error.statusCode = 400;
      throw error;
    }

    if (!['manager', 'customer'].includes(accountType)) {
      const error = new Error("Account type must be manager or customer.");
      error.statusCode = 400;
      throw error;
    }

    const table = accountType === "manager" ? "manager_users" : "companies";

    const result = await pool.query(
      `
      SELECT *
      FROM ${table}
      WHERE email = $1
      OR username = $1
      `,
      [identifier]
    );

    if (result.rows.length === 0) {
      const error = new Error("Account not found.");
      error.statusCode = 404;
      throw error;
    }

    return { ...result.rows[0], accountType };
  }

  static async requestForgotPasswordCode(
    identifier,
    deliveryMethod = "email",
    accountType = "customer"
  ) {
    const allowedMethods = ["email", "sms"];

    if (!allowedMethods.includes(deliveryMethod)) {
      const error = new Error("Delivery method must be email or sms.");
      error.statusCode = 400;
      throw error;
    }

    let account;

    try {
      account = await this.findAccountByIdentifier(identifier, accountType);
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          message: "If the account exists, a verification code has been sent."
        };
      }
      throw error;
    }

    if (deliveryMethod === "email" && !account.email) {
      return { message: "If the account exists, a verification code has been sent." };
    }

    if (deliveryMethod === "sms" && !account.phone) {
      return { message: "If the account exists, a verification code has been sent." };
    }

    await VerificationService.createCode({
      companyId: accountType === "customer" ? account.id : null,
      email: account.email,
      phone: account.phone,
      name: account.name || account.username,
      purpose: `forgot_password_${accountType}`,
      reason: "Forgot password verification",
      deliveryMethod
    });

    return {
      message: "If the account exists, a verification code has been sent."
    };
  }

  static async resetForgotPassword(
    identifier,
    code,
    newPassword,
    accountType = "customer"
  ) {
    if (!identifier || !code || !newPassword) {
      const error = new Error("Identifier, code and new password are required.");
      error.statusCode = 400;
      throw error;
    }

    validatePassword(newPassword);

    let account;

    try {
      account = await this.findAccountByIdentifier(identifier, accountType);
    } catch (error) {
      if (error.statusCode === 404) {
        const invalidCodeError = new Error("Invalid or expired verification code.");
        invalidCodeError.statusCode = 400;
        throw invalidCodeError;
      }
      throw error;
    }

    await VerificationService.verifyCode({
      companyId: accountType === "customer" ? account.id : null,
      email: account.email,
      purpose: `forgot_password_${accountType}`,
      code
    });

    const isSamePassword = await bcrypt.compare(
      newPassword,
      account.password_hash
    );

    if (isSamePassword) {
      const error = new Error("New password cannot be the same as old password.");
      error.statusCode = 400;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    if (accountType === "manager") {
      await pool.query(
        "UPDATE manager_users SET password_hash = $1 WHERE id = $2",
        [newPasswordHash, account.id]
      );
    } else {
      await pool.query(
        `
        UPDATE companies
        SET password_hash = $1,
            reset_code_hash = NULL,
            reset_code_expires = NULL
        WHERE id = $2
        `,
        [newPasswordHash, account.id]
      );
    }

    if (accountType === "customer") {
      try {
        const managerEmail = await this.getManagerEmailForCustomer(account);
        await sendCustomerPasswordChangedMailToManager({
          customer: this.formatCustomer(account),
          managerEmail
        });
      } catch (mailError) {
        console.log("Forgot password notification mail could not be sent:", mailError.message);
      }
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
