const bcrypt = require("bcryptjs");
const pool = require("../db");
const VerificationService = require("./VerificationService");

class ManagerService {
  static formatManager(manager) {
    return {
      id: manager.id,
      username: manager.username,
      role: "manager",
      name: manager.name || "",
      surname: manager.surname || "",
      email: manager.email || "",
      phone: manager.phone || "",
    };
  }

  static async getManagerById(id) {
    const result = await pool.query(
      `
      SELECT id, username, name, surname, email, phone, password_hash
      FROM manager_users
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Manager not found.");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  static async requestManagerUpdateCode(user) {
    if (user.role !== "manager") {
      const error = new Error("Only managers can request manager update code.");
      error.statusCode = 403;
      throw error;
    }

    const manager = await this.getManagerById(user.id);

    await VerificationService.createCode({
      companyId: null,
      email: manager.email,
      phone: manager.phone,
      name: manager.name || manager.username,
      purpose: "manager_info_update",
      reason: "Manager information update verification",
      deliveryMethod: "email",
    });

    return {
      message: "Manager information verification code sent successfully.",
    };
  }

  static async verifyAndUpdateManager(user, managerData, code) {
    if (user.role !== "manager") {
      const error = new Error("Only managers can update manager information.");
      error.statusCode = 403;
      throw error;
    }

    if (!code) {
      const error = new Error("Verification code is required.");
      error.statusCode = 400;
      throw error;
    }

    const { name, surname, email, phone } = managerData;

    if (!name || !surname || !email || !phone) {
      const error = new Error("Name, surname, email and phone are required.");
      error.statusCode = 400;
      throw error;
    }

    const manager = await this.getManagerById(user.id);

    await VerificationService.verifyCode({
      email: manager.email,
      purpose: "manager_info_update",
      code,
    });

    const result = await pool.query(
      `
      UPDATE manager_users
      SET name = $1,
          surname = $2,
          email = $3,
          phone = $4
      WHERE id = $5
      RETURNING id, username, name, surname, email, phone
      `,
      [name, surname, email, phone, user.id]
    );

    return this.formatManager(result.rows[0]);
  }

  static async requestManagerPasswordCode(user) {
    if (user.role !== "manager") {
      const error = new Error("Only managers can request password code.");
      error.statusCode = 403;
      throw error;
    }

    const manager = await this.getManagerById(user.id);

    await VerificationService.createCode({
      companyId: null,
      email: manager.email,
      phone: manager.phone,
      name: manager.name || manager.username,
      purpose: "manager_password_change",
      reason: "Manager password change verification",
      deliveryMethod: "email",
    });

    return {
      message: "Manager password verification code sent successfully.",
    };
  }

  static async verifyAndUpdateManagerPassword(user, code, newPassword) {
    if (user.role !== "manager") {
      const error = new Error("Only managers can update password.");
      error.statusCode = 403;
      throw error;
    }

    if (!code || !newPassword) {
      const error = new Error("Verification code and new password are required.");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 4) {
      const error = new Error("New password must be at least 4 characters.");
      error.statusCode = 400;
      throw error;
    }

    const manager = await this.getManagerById(user.id);

    await VerificationService.verifyCode({
      email: manager.email,
      purpose: "manager_password_change",
      code,
    });

    const isSamePassword = await bcrypt.compare(
      newPassword,
      manager.password_hash || ""
    );

    if (isSamePassword) {
      const error = new Error("New password cannot be the same as old password.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE manager_users
      SET password_hash = $1
      WHERE id = $2
      `,
      [hashedPassword, user.id]
    );

    return {
      message: "Manager password changed successfully.",
    };
  }
}

module.exports = ManagerService;