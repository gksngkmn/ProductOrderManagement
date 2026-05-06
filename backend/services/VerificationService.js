const bcrypt = require("bcryptjs");
const pool = require("../db");

const {
  sendVerificationCodeMail
} = require("../utils/mailService");

const {
  sendVerificationCodeSms
} = require("../utils/smsService");

class VerificationService {
  static generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  static async createCode({
    companyId,
    email,
    phone,
    name,
    purpose,
    reason
  }) {
    if (!purpose) {
      const error = new Error("Verification purpose is required.");
      error.statusCode = 400;
      throw error;
    }

    if (!email && !phone) {
      const error = new Error("Email or phone is required for verification.");
      error.statusCode = 400;
      throw error;
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    await pool.query(
      `
      UPDATE verification_codes
      SET is_used = true
      WHERE purpose = $1
      AND is_used = false
      AND (
        company_id = $2
        OR email = $3
      )
      `,
      [purpose, companyId || null, email || null]
    );

    await pool.query(
      `
      INSERT INTO verification_codes
      (
        company_id,
        email,
        phone,
        code_hash,
        purpose,
        expires_at,
        is_used
      )
      VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP + INTERVAL '10 minutes',false)
      `,
      [
        companyId || null,
        email || null,
        phone || null,
        codeHash,
        purpose
      ]
    );

    if (email) {
      await sendVerificationCodeMail({
        to: email,
        name,
        code,
        reason
      });
    }

    if (phone) {
      await sendVerificationCodeSms({
        to: phone,
        code,
        reason
      });
    }

    return {
      message: "Verification code sent successfully."
    };
  }

    static async checkCode({
    companyId,
    email,
    purpose,
    code
  }) {
    if (!purpose || !code) {
      const error = new Error("Purpose and code are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      SELECT *
      FROM verification_codes
      WHERE purpose = $1
      AND is_used = false
      AND (
        company_id = $2
        OR email = $3
      )
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [purpose, companyId || null, email || null]
    );

    if (result.rows.length === 0) {
      const error = new Error("No active verification code found.");
      error.statusCode = 400;
      throw error;
    }

    const verification = result.rows[0];

    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      const error = new Error("Verification code expired.");
      error.statusCode = 400;
      throw error;
    }

    const isCorrect = await bcrypt.compare(code, verification.code_hash);

    if (!isCorrect) {
      const error = new Error("Verification code is incorrect.");
      error.statusCode = 400;
      throw error;
    }

    return {
      message: "Verification successful."
    };
  }

  static async verifyCode({
    companyId,
    email,
    purpose,
    code
  }) {
    if (!purpose || !code) {
      const error = new Error("Purpose and code are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      SELECT *
      FROM verification_codes
      WHERE purpose = $1
      AND is_used = false
      AND (
        company_id = $2
        OR email = $3
      )
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [purpose, companyId || null, email || null]
    );

    if (result.rows.length === 0) {
      const error = new Error("No active verification code found.");
      error.statusCode = 400;
      throw error;
    }

    const verification = result.rows[0];

    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      const error = new Error("Verification code expired.");
      error.statusCode = 400;
      throw error;
    }

    const isCorrect = await bcrypt.compare(code, verification.code_hash);

    if (!isCorrect) {
      const error = new Error("Verification code is incorrect.");
      error.statusCode = 400;
      throw error;
    }

    await pool.query(
      `
      UPDATE verification_codes
      SET is_used = true
      WHERE id = $1
      `,
      [verification.id]
    );

    return {
      message: "Verification successful."
    };
  }
}

module.exports = VerificationService;