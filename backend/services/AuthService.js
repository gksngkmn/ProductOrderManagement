const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const {
  sendMailFromManagerToCustomer
} = require("../utils/mailService");

class AuthService {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
  }

  static generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
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

  static async requestPasswordCode(companyId) {
    if (!companyId) {
      const error = new Error("Company ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const companyResult = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    const company = companyResult.rows[0];

    const code = this.generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    await pool.query(
      `
      UPDATE companies
      SET reset_code_hash = $1,
          reset_code_expires = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
      WHERE id = $2
      `,
      [codeHash, companyId]
    );

    await sendMailFromManagerToCustomer({
      to: company.email,
      subject: "Password Change Verification Code",
      text: `
Hello ${company.name},

Your password change verification code is:

${code}

This code is valid for 10 minutes.
      `
    });

    return {
      message: "Verification code sent to email."
    };
  }

  static async verifyPasswordCode(companyId, code) {
    if (!companyId || !code) {
      const error = new Error("Company ID and code are required.");
      error.statusCode = 400;
      throw error;
    }

    const company = await this.getCompanyById(companyId);

    if (!company.reset_code_hash || !company.reset_code_expires) {
      const error = new Error("No verification code requested.");
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    const expires = new Date(company.reset_code_expires);

    if (now > expires) {
      const error = new Error("Verification code expired.");
      error.statusCode = 400;
      throw error;
    }

    const isCodeCorrect = await bcrypt.compare(code, company.reset_code_hash);

    if (!isCodeCorrect) {
      const error = new Error("Verification code is incorrect.");
      error.statusCode = 400;
      throw error;
    }

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

    await this.verifyPasswordCode(companyId, code);

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

    return {
      message: "Password changed successfully."
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