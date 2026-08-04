const pool = require("../db");
const {
  sendOrderSubmittedMailToCustomer,
  sendOrderSubmittedMailToManager
} = require("../utils/mailService");

const { generateOrderExcel } = require("../utils/orderExcelGenerator");


class OrderService {
  static getCountryCode(company) {
    return String(company.country || "TR").substring(0, 2).toUpperCase();
  }

  static getCompanyInitials(company) {
    const companyName = company.company_name || "XX";

    return (
      companyName
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "XX"
    );
  }

  static async generateOrderCode(client, companyId) {
    const companyResult = await client.query(
      "SELECT * FROM companies WHERE id = $1",
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }

    const company = companyResult.rows[0];

    const sequenceResult = await client.query(
      "SELECT nextval('order_code_sequence') AS value"
    );
    const next = String(sequenceResult.rows[0].value).padStart(4, "0");

    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(now.getDate()).padStart(2, "0")}`;

    return `${this.getCountryCode(company)}_${this.getCompanyInitials(
      company
    )}_${next}_${date}`;
  }

  static async getOrdersByCompany(user, companyIdParam) {
  let companyId;

  if (user.role === "customer") {
    companyId = user.id;
  } else if (user.role === "manager" || user.role === "superadmin") {
    companyId = Number(companyIdParam);
  }

  if (!companyId) {
    const error = new Error("Company ID is required.");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "manager") {
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE id = $1 AND manager_id = $2",
      [companyId, user.id]
    );

    if (companyResult.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }
  } else if (user.role === "superadmin") {
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE id = $1",
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      const error = new Error("Customer not found.");
      error.statusCode = 404;
      throw error;
    }
  }

  const ordersResult = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE company_id = $1
    ORDER BY submission_date DESC NULLS LAST, id DESC
    `,
    [companyId]
  );

  const itemsResult = await pool.query(
      `
      SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.currency,

        p.material,
        p.type,
        p.model,
        p.angle,
        p.nodal_length,
        p.width,
        p.number_of_teeth

      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ANY($1::int[])
      `,
      [ordersResult.rows.map((order) => order.id)]
    );

  const itemsByOrder = new Map();
  for (const item of itemsResult.rows) {
    const items = itemsByOrder.get(item.order_id) || [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  }

  return ordersResult.rows.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) || []
  }));
  }

  static async createOrder(user) {
    if (user.role !== "customer") {
      const error = new Error("Only customers can create orders.");
      error.statusCode = 403;
      throw error;
    }

    const companyId = user.id;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [companyId]);

      const existing = await client.query(
        `SELECT * FROM orders
         WHERE company_id = $1 AND status = 'Current'
         LIMIT 1`,
        [companyId]
      );

      if (existing.rows.length > 0) {
        await client.query("COMMIT");
        return existing.rows[0];
      }

      const code = await this.generateOrderCode(client, companyId);
      const result = await client.query(
        `INSERT INTO orders (order_code, company_id, status)
         VALUES ($1, $2, 'Current')
         RETURNING *`,
        [code, companyId]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async addItemToOrder(user, orderId, data) {
    const { productId, quantity } = data;
    const companyId = user.id;

    if (!productId || !quantity || Number(quantity) <= 0) {
      const error = new Error("Product ID and valid quantity are required.");
      error.statusCode = 400;
      throw error;
    }

    const orderCheck = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1 AND company_id = $2 AND status = 'Current'
      `,
      [orderId, companyId]
    );

    if (orderCheck.rows.length === 0) {
      const error = new Error("Order not found or not allowed.");
      error.statusCode = 403;
      throw error;
    }

    const productResult = await pool.query(
      `SELECT p.*
       FROM products p
       JOIN companies c ON c.id = $2
       WHERE p.id = $1 AND p.manager_id = c.manager_id`,
      [productId, companyId]
    );

    if (productResult.rows.length === 0) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    const product = productResult.rows[0];

    const existing = await pool.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1 AND product_id = $2
      `,
      [orderId, productId]
    );

    if (existing.rows.length > 0) {
      const item = existing.rows[0];

      const newQuantity = Number(item.quantity) + Number(quantity);
      const newTotal = newQuantity * Number(item.unit_price);

      const updated = await pool.query(
        `
        UPDATE order_items
        SET quantity = $1,
            total_price = $2
        WHERE id = $3
        RETURNING *
        `,
        [newQuantity, newTotal, item.id]
      );

      return updated.rows[0];
    }

    const unitPrice = Number(product.unit_price);
    const totalPrice = unitPrice * Number(quantity);

    const result = await pool.query(
      `
      INSERT INTO order_items
      (order_id, product_id, quantity, unit_price, total_price, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [orderId, productId, Number(quantity), unitPrice, totalPrice, product.currency]
    );

    return result.rows[0];
  }

  static async updateOrderItem(user, orderId, itemId, data) {
  const { quantity } = data;
  const companyId = user.id;

  if (!quantity || Number(quantity) <= 0) {
    const error = new Error("Valid quantity is required.");
    error.statusCode = 400;
    throw error;
  }

  const orderCheck = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE id = $1 AND company_id = $2 AND status = 'Current'
    `,
    [orderId, companyId]
  );

  if (orderCheck.rows.length === 0) {
    const error = new Error("Order not found or not allowed.");
    error.statusCode = 403;
    throw error;
  }

  const itemCheck = await pool.query(
    `
    SELECT *
    FROM order_items
    WHERE id = $1 AND order_id = $2
    `,
    [itemId, orderId]
  );

  if (itemCheck.rows.length === 0) {
    const error = new Error("Order item not found.");
    error.statusCode = 404;
    throw error;
  }

  const item = itemCheck.rows[0];
  const newQuantity = Number(quantity);
  const newTotal = newQuantity * Number(item.unit_price);

  const updated = await pool.query(
    `
    UPDATE order_items
    SET quantity = $1,
        total_price = $2
    WHERE id = $3 AND order_id = $4
    RETURNING *
    `,
    [newQuantity, newTotal, itemId, orderId]
  );

  return updated.rows[0];
  }

static async deleteOrderItem(user, orderId, itemId) {
  const companyId = user.id;

  const orderCheck = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE id = $1 AND company_id = $2 AND status = 'Current'
    `,
    [orderId, companyId]
  );

  if (orderCheck.rows.length === 0) {
    const error = new Error("Order not found or not allowed.");
    error.statusCode = 403;
    throw error;
  }

  const deleted = await pool.query(
    `
    DELETE FROM order_items
    WHERE id = $1 AND order_id = $2
    RETURNING *
    `,
    [itemId, orderId]
  );

  if (deleted.rows.length === 0) {
    const error = new Error("Order item not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    message: "Order item deleted successfully."
  };
  }

  static async completeOrder(user, orderId) {
    const companyId = user.id;
    const client = await pool.connect();
    let order;
    let customer;
    let managerEmail;
    let items;

    try {
      await client.query("BEGIN");

      const check = await client.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1 AND company_id = $2 AND status = 'Current'
        FOR UPDATE
        `,
        [orderId, companyId]
      );

      if (check.rows.length === 0) {
        const error = new Error("Order not found or not allowed.");
        error.statusCode = 403;
        throw error;
      }

      const itemsResult = await client.query(
        `
        SELECT
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.currency,
          p.material,
          p.type,
          p.model,
          p.angle,
          p.nodal_length,
          p.width,
          p.number_of_teeth
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
        `,
        [orderId]
      );

      items = itemsResult.rows;

      if (!items.length) {
        const error = new Error("You cannot complete an empty order.");
        error.statusCode = 400;
        throw error;
      }

      const result = await client.query(
        `
        UPDATE orders
        SET status = 'Completed',
            submission_date = CURRENT_TIMESTAMP
        WHERE id = $1 AND company_id = $2 AND status = 'Current'
        RETURNING *
        `,
        [orderId, companyId]
      );

      order = result.rows[0];

      const companyResult = await client.query(
        `
        SELECT
          id,
          name,
          surname,
          email,
          phone,
          company_name,
          username
        FROM companies c
        WHERE c.id = $1
        `,
        [companyId]
      );

      customer = companyResult.rows[0];

      const managerResult = await client.query(
        `SELECT m.email
         FROM manager_users m
         JOIN companies c ON c.manager_id = m.id
         WHERE c.id = $1`,
        [companyId]
      );
      managerEmail = managerResult.rows[0]?.email;

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    let excelBuffer = null;

    try {
      excelBuffer = await generateOrderExcel({
        customer,
        order,
        items,
      });
    } catch (excelError) {
      console.log("Order Excel file could not be generated:", excelError.message);
    }

    try {
      await sendOrderSubmittedMailToCustomer({
        customer,
        order,
        excelBuffer,
      });
    } catch (mailError) {
      console.log(
        "Customer order submitted mail could not be sent:",
        mailError.message
      );
    }

    try {
      await sendOrderSubmittedMailToManager({
        customer,
        order,
        excelBuffer,
        managerEmail,
      });
    } catch (mailError) {
      console.log(
        "Manager order submitted mail could not be sent:",
        mailError.message
      );
    }

    return {
      ...order,
      items,
    };
  }
}


module.exports = OrderService;
