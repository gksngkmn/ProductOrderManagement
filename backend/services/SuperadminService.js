const pool = require("../db");
const bcrypt = require("bcryptjs");
const CompanyService = require("./CompanyService");
const { validatePassword } = require("../utils/passwordPolicy");

class SuperadminService {
  static async getManagers() {
    const result = await pool.query(`
      SELECT id, username, name, surname, email, phone, role
      FROM manager_users
      ORDER BY id ASC
    `);
    return result.rows;
  }

  static async createManager(data) {
    const { username, password, name, surname, email, phone } = data;
    if (!username || !password || !name || !surname || !email || !phone) {
      const error = new Error("All manager fields are required.");
      error.statusCode = 400;
      throw error;
    }

    validatePassword(password);
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const result = await pool.query(
        `INSERT INTO manager_users
         (username, password_hash, name, surname, email, phone, role)
         VALUES ($1,$2,$3,$4,$5,$6,'manager')
         RETURNING id, username, name, surname, email, phone, role`,
        [username, passwordHash, name, surname, email, phone]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        const conflict = new Error("Manager username or email already exists.");
        conflict.statusCode = 409;
        throw conflict;
      }
      throw error;
    }
  }

  static async createCustomer(managerId, data) {
    const manager = await pool.query(
      "SELECT id FROM manager_users WHERE id = $1",
      [managerId]
    );
    if (!manager.rows.length) {
      const error = new Error("Manager not found.");
      error.statusCode = 404;
      throw error;
    }

    return CompanyService.createCompany(
      { id: Number(managerId), role: "manager" },
      data
    );
  }

  static async updateManager(id, data) {
    const { username, name, surname, email, phone } = data;
    if (!username) {
      const error = new Error("Username is required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `UPDATE manager_users
       SET username=$1, name=$2, surname=$3, email=$4, phone=$5
       WHERE id=$6
       RETURNING id, username, name, surname, email, phone, role`,
      [username, name || null, surname || null, email || null, phone || null, id]
    );

    if (!result.rows.length) {
      const error = new Error("Manager not found.");
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async getCustomersByManager(managerId) {
    const result = await pool.query(
      `SELECT id, manager_id, name, surname, email, phone, company_name,
              address, country, city, company_phone, username, role, created_at
       FROM companies
       WHERE manager_id = $1
       ORDER BY company_name ASC`,
      [managerId]
    );
    return result.rows;
  }

  static async updateCustomer(id, data) {
    const { name, surname, email, phone, company_name, country, city } = data;
    const result = await pool.query(
      `UPDATE companies
       SET name=$1, surname=$2, email=$3, phone=$4,
           company_name=$5, country=$6, city=$7
       WHERE id=$8
       RETURNING id, manager_id, name, surname, email, phone, company_name,
                 address, country, city, company_phone, username, role, created_at`,
      [name, surname, email, phone || null, company_name, country, city, id]
    );

    if (!result.rows.length) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }
    return result.rows[0];
  }

  static async deleteCustomer(id) {
    const result = await pool.query(
      `DELETE FROM companies WHERE id = $1
       RETURNING id, username, company_name`,
      [id]
    );
    if (!result.rows.length) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }
    return { message: "Customer deleted successfully.", customer: result.rows[0] };
  }

  static async deleteManager(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const manager = await client.query(
        "SELECT id, username FROM manager_users WHERE id = $1 FOR UPDATE",
        [id]
      );
      if (!manager.rows.length) {
        const error = new Error("Manager not found.");
        error.statusCode = 404;
        throw error;
      }

      const customers = await client.query(
        "SELECT COUNT(*)::int AS count FROM companies WHERE manager_id = $1",
        [id]
      );
      const customerCount = customers.rows[0].count;
      const products = await client.query(
        "SELECT COUNT(*)::int AS count FROM products WHERE manager_id = $1",
        [id]
      );
      const productCount = products.rows[0].count;
      const orders = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM orders o
         JOIN companies c ON c.id = o.company_id
         WHERE c.manager_id = $1`,
        [id]
      );
      const orderCount = orders.rows[0].count;

      await client.query(
        `DELETE FROM order_items oi
         USING orders o, companies c
         WHERE oi.order_id = o.id
           AND o.company_id = c.id
           AND c.manager_id = $1`,
        [id]
      );
      await client.query(
        `DELETE FROM verification_codes vc
         USING companies c
         WHERE vc.company_id = c.id
           AND c.manager_id = $1`,
        [id]
      );
      await client.query(
        `DELETE FROM orders o
         USING companies c
         WHERE o.company_id = c.id
           AND c.manager_id = $1`,
        [id]
      );
      await client.query("DELETE FROM companies WHERE manager_id = $1", [id]);
      await client.query("DELETE FROM products WHERE manager_id = $1", [id]);

      await client.query("DELETE FROM manager_users WHERE id = $1", [id]);
      await client.query("COMMIT");
      return {
        message:
          `Manager deleted successfully. ${customerCount} customer(s), ` +
          `${orderCount} order(s), and ${productCount} product(s) deleted.`
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SuperadminService;
