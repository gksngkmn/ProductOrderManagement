const bcrypt = require("bcryptjs");
const pool = require("../db");

const {
  sendCustomerUpdatedInfoMailToManager,
  sendManagerUpdatedCustomerInfoMail,
  sendCustomerPasswordChangedMailToManager
} = require("../utils/mailService");

class CompanyService {
  static formatCompany(company) {
    return {
      id: company.id,
      name: company.name,
      surname: company.surname,
      email: company.email,
      phone: company.phone,
      companyName: company.company_name,
      address: company.address,
      country: company.country,
      city: company.city,
      companyPhone: company.company_phone,
      username: company.username,
      role: company.role,
      createdAt: company.created_at
    };
  }

  static async getCompanies() {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        surname,
        email,
        phone,
        company_name,
        address,
        country,
        city,
        company_phone,
        username,
        role,
        created_at
      FROM companies
      ORDER BY company_name ASC
    `);

    return result.rows.map(this.formatCompany);
  }

  static async createCompany(companyData) {
    const {
      name,
      surname,
      email,
      phone,
      companyName,
      address,
      country,
      city,
      companyPhone,
      username,
      password
    } = companyData;

    if (
      !name ||
      !surname ||
      !email ||
      !phone ||
      !companyName ||
      !address ||
      !country ||
      !city ||
      !companyPhone ||
      !username ||
      !password
    ) {
      const error = new Error("All company fields are required.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        `
        INSERT INTO companies
        (
          name,
          surname,
          email,
          phone,
          company_name,
          address,
          country,
          city,
          company_phone,
          username,
          password_hash,
          role
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING 
          id,
          name,
          surname,
          email,
          phone,
          company_name,
          address,
          country,
          city,
          company_phone,
          username,
          role,
          created_at
        `,
        [
          name,
          surname,
          email,
          phone,
          companyName,
          address,
          country,
          city,
          companyPhone,
          username,
          hashedPassword,
          "customer"
        ]
      );

      return this.formatCompany(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        const conflictError = new Error("Username already exists.");
        conflictError.statusCode = 409;
        throw conflictError;
      }

      throw error;
    }
  }

  static async getCompanyById(id) {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        surname,
        email,
        phone,
        company_name,
        address,
        country,
        city,
        company_phone,
        username,
        role,
        created_at
      FROM companies
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  static getUpdatedFields(oldCompany, newData) {
    const fields = [];

    if (oldCompany.name !== newData.name) {
      fields.push("Name");
    }

    if (oldCompany.surname !== newData.surname) {
      fields.push("Surname");
    }

    if (oldCompany.email !== newData.email) {
      fields.push("Email");
    }

    if (oldCompany.phone !== newData.phone) {
      fields.push("Phone");
    }

    return fields;
  }

  static async updateCompany(id, user, companyData) {
    const { name, surname, email, phone } = companyData;

    if (!name || !surname || !email || !phone) {
      const error = new Error("Name, surname, email and phone are required.");
      error.statusCode = 400;
      throw error;
    }

    if (user.role === "customer" && Number(user.id) !== Number(id)) {
      const error = new Error("You can only update your own profile.");
      error.statusCode = 403;
      throw error;
    }

    const oldCompany = await this.getCompanyById(id);

    const updatedFields = this.getUpdatedFields(oldCompany, {
      name,
      surname,
      email,
      phone
    });

    const result = await pool.query(
      `
      UPDATE companies
      SET
        name = $1,
        surname = $2,
        email = $3,
        phone = $4
      WHERE id = $5
      RETURNING
        id,
        name,
        surname,
        email,
        phone,
        company_name,
        address,
        country,
        city,
        company_phone,
        username,
        role,
        created_at
      `,
      [name, surname, email, phone, id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    const updatedCustomer = result.rows[0];
    const formattedCustomer = this.formatCompany(updatedCustomer);

    try {
      if (user.role === "customer") {
        await sendCustomerUpdatedInfoMailToManager({
          customer: formattedCustomer,
          updatedFields
        });
      }

      if (user.role === "manager") {
        await sendManagerUpdatedCustomerInfoMail({
          customer: formattedCustomer,
          updatedFields
        });
      }
    } catch (mailError) {
      console.log("Company update notification mail could not be sent:", mailError.message);
    }

    return formattedCustomer;
  }

  static async updateCustomerPassword(id, newPassword) {
    if (!newPassword) {
      const error = new Error("New password is required.");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 4) {
      const error = new Error("New password must be at least 4 characters.");
      error.statusCode = 400;
      throw error;
    }

    const oldCustomer = await this.getCompanyById(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `
      UPDATE companies
      SET password_hash = $1
      WHERE id = $2
      RETURNING
        id,
        name,
        surname,
        email,
        phone,
        company_name,
        address,
        country,
        city,
        company_phone,
        username,
        role,
        created_at
      `,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    try {
      await sendCustomerPasswordChangedMailToManager({
        customer: this.formatCompany(result.rows[0] || oldCustomer)
      });
    } catch (mailError) {
      console.log("Password change notification mail could not be sent:", mailError.message);
    }

    return {
      message: "Password updated successfully."
    };
  }

  static async deleteCompany(id) {
    const result = await pool.query(
      `
      DELETE FROM companies
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    return {
      message: "Customer deleted successfully."
    };
  }
}

module.exports = CompanyService;