const bcrypt = require("bcryptjs");
const pool = require("../db");
const VerificationService = require("./VerificationService");
const { validatePassword } = require("../utils/passwordPolicy");

const {
  sendCustomerUpdatedInfoMailToManager,
  sendManagerUpdatedCustomerInfoMail,
  sendManagerUpdatedCustomerPasswordMail,
  sendNewCustomerAccountMail,
} = require("../utils/mailService");

class CompanyService {
  static async getManagerEmail(managerId) {
    if (!managerId) return null;

    const result = await pool.query(
      "SELECT email FROM manager_users WHERE id = $1",
      [managerId]
    );

    return result.rows[0]?.email || null;
  }

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
      createdAt: company.created_at,
    };
  }

  static async getCompanies(user) {
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
        manager_id,
        created_at
      FROM companies
      WHERE manager_id = $1
      ORDER BY company_name ASC
      `,
      [user.id]
    );

    return result.rows.map(this.formatCompany);
  }

  static async createCompany(user, companyData) {
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
      password,
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

    validatePassword(password);

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
          role,
          manager_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
          "customer",
          user.id,
        ]
      );

      const createdCustomer = this.formatCompany(result.rows[0]);

      try {
        await sendNewCustomerAccountMail({
          customer: createdCustomer,
        });
      } catch (mailError) {
        console.log(
          "New customer account mail could not be sent:",
          mailError.message
        );
      }

      return createdCustomer;
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
        manager_id,
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


  static async getCompanyByIdForUser(id, user) {
    if (user.role === "customer" && Number(user.id) !== Number(id)) {
      const error = new Error("You can only view your own profile.");
      error.statusCode = 403;
      throw error;
    }
    const company = await this.getCompanyById(id);

    if (
      user.role === "manager" &&
      Number(company.manager_id) !== Number(user.id)
    ) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    return this.formatCompany(company);
  }

  static async assertManagerOwnsCompany(id, user) {
    if (user.role !== "manager") {
      return;
    }

    const result = await pool.query(
      "SELECT id FROM companies WHERE id = $1 AND manager_id = $2",
      [id, user.id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }
  }

  static getUpdatedFields(oldCompany, newData) {
    const fields = [];

    const addIfChanged = (label, oldValue, newValue) => {
      const oldText = String(oldValue ?? "").trim();
      const newText = String(newValue ?? "").trim();

      if (oldText !== newText) {
        fields.push({
          label,
          oldValue: oldText || "-",
          newValue: newText || "-",
        });
      }
    };

    addIfChanged("Name", oldCompany.name, newData.name);
    addIfChanged("Surname", oldCompany.surname, newData.surname);
    addIfChanged("Email", oldCompany.email, newData.email);
    addIfChanged("Phone", oldCompany.phone, newData.phone);
    addIfChanged("Company Name", oldCompany.company_name, newData.companyName);
    addIfChanged("Address", oldCompany.address, newData.address);
    addIfChanged("Country", oldCompany.country, newData.country);
    addIfChanged("City", oldCompany.city, newData.city);
    addIfChanged("Company Phone", oldCompany.company_phone, newData.companyPhone);

    return fields;
  }

  static async requestCompanyUpdateCode(id, user) {
    if (user.role === "customer" && Number(user.id) !== Number(id)) {
      const error = new Error(
        "You can only request update code for your own profile."
      );
      error.statusCode = 403;
      throw error;
    }

    await this.assertManagerOwnsCompany(id, user);

    const company = await this.getCompanyById(id);
    const formattedCompany = this.formatCompany(company);

    await VerificationService.createCode({
      companyId: formattedCompany.id,
      email: formattedCompany.email,
      phone: formattedCompany.phone,
      name: formattedCompany.name,
      purpose: "info_update",
      reason: "Information update verification",
      deliveryMethod: "email",
    });

    return {
      message: "Information update verification code sent successfully.",
    };
  }

  static async verifyAndUpdateCompany(id, user, companyData, code) {
    if (!code) {
      const error = new Error("Verification code is required.");
      error.statusCode = 400;
      throw error;
    }

    await this.assertManagerOwnsCompany(id, user);

    const company = await this.getCompanyById(id);
    const formattedCompany = this.formatCompany(company);

    await VerificationService.verifyCode({
      companyId: formattedCompany.id,
      email: formattedCompany.email,
      purpose: "info_update",
      code,
    });

    return this.updateCompany(id, user, companyData);
  }

  static async updateCompany(id, user, companyData) {
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
      !companyPhone
    ) {
      const error = new Error("All customer fields are required.");
      error.statusCode = 400;
      throw error;
    }

    if (user.role === "customer" && Number(user.id) !== Number(id)) {
      const error = new Error("You can only update your own profile.");
      error.statusCode = 403;
      throw error;
    }

    await this.assertManagerOwnsCompany(id, user);

    const oldCompany = await this.getCompanyById(id);

    const updatedFields = this.getUpdatedFields(oldCompany, {
      name,
      surname,
      email,
      phone,
      companyName,
      address,
      country,
      city,
      companyPhone,
    });

    const result = await pool.query(
      `
      UPDATE companies
      SET
        name = $1,
        surname = $2,
        email = $3,
        phone = $4,
        company_name = $5,
        address = $6,
        country = $7,
        city = $8,
        company_phone = $9
      WHERE id = $10
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    const updatedCustomer = result.rows[0];
    const formattedCustomer = this.formatCompany(updatedCustomer);

    if (updatedFields.length > 0) {
      try {
        if (user.role === "customer") {
          const managerEmail = await this.getManagerEmail(oldCompany.manager_id);
          await sendCustomerUpdatedInfoMailToManager({
            customer: formattedCustomer,
            updatedFields,
            managerEmail,
          });
        }

        if (user.role === "manager") {
          await sendManagerUpdatedCustomerInfoMail({
            customer: formattedCustomer,
            updatedFields,
          });
        }
      } catch (mailError) {
        console.log(
          "Company update notification mail could not be sent:",
          mailError.message
        );
      }
    }

    return formattedCustomer;
  }

  static async requestCustomerPasswordUpdateCode(id, user) {
    if (user.role !== "manager") {
      const error = new Error(
        "Only managers can request customer password update code."
      );
      error.statusCode = 403;
      throw error;
    }

    await this.assertManagerOwnsCompany(id, user);

    const customer = await this.getCompanyById(id);
    const formattedCustomer = this.formatCompany(customer);

    await VerificationService.createCode({
      companyId: formattedCustomer.id,
      email: formattedCustomer.email,
      phone: formattedCustomer.phone,
      name: formattedCustomer.name,
      purpose: "manager_password_update",
      reason: "Manager password update verification",
      deliveryMethod: "email",
    });

    return {
      message: "Password update verification code sent to customer email.",
    };
  }

  static async verifyAndUpdateCustomerPassword(id, user, code, newPassword) {
    if (user.role !== "manager") {
      const error = new Error("Only managers can update customer password.");
      error.statusCode = 403;
      throw error;
    }

    await this.assertManagerOwnsCompany(id, user);

    if (!code) {
      const error = new Error("Verification code is required.");
      error.statusCode = 400;
      throw error;
    }

    if (!newPassword) {
      const error = new Error("New password is required.");
      error.statusCode = 400;
      throw error;
    }

    const customer = await this.getCompanyById(id);
    const formattedCustomer = this.formatCompany(customer);

    await VerificationService.verifyCode({
      companyId: formattedCustomer.id,
      email: formattedCustomer.email,
      purpose: "manager_password_update",
      code,
    });

    return this.updateCustomerPassword(id, user, newPassword);
  }

  static async updateCustomerPassword(id, user, newPassword) {
    if (!newPassword) {
      const error = new Error("New password is required.");
      error.statusCode = 400;
      throw error;
    }

    validatePassword(newPassword);

    await this.assertManagerOwnsCompany(id, user);

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
      await sendManagerUpdatedCustomerPasswordMail({
        customer: this.formatCompany(result.rows[0] || oldCustomer),
      });
    } catch (mailError) {
      console.log(
        "Customer password update mail could not be sent:",
        mailError.message
      );
    }

    return {
      message: "Password updated successfully.",
    };
  }

  static async deleteCompany(id, user) {
    await this.assertManagerOwnsCompany(id, user);

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
      message: "Customer deleted successfully.",
    };
  }
}

module.exports = CompanyService;
