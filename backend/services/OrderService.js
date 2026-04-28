const pool = require("../db");
const { sendMailToManager } = require("../utils/mailService");

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

  static async generateOrderCode(companyId) {
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

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE company_id = $1",
      [companyId]
    );

    const count = Number(countResult.rows[0].count);
    const next = String(count + 1).padStart(4, "0");

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
    const companyId =
      user.role === "customer" ? user.id : Number(companyIdParam);

    if (!companyId) {
      const error = new Error("Company ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const ordersResult = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE company_id = $1
      ORDER BY created_at DESC
      `,
      [companyId]
    );

    const orders = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await pool.query(
        `
        SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,

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
        [order.id]
      );

      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    return orders;
  }

  static async createOrder(user) {
    if (user.role !== "customer") {
      const error = new Error("Only customers can create orders.");
      error.statusCode = 403;
      throw error;
    }

    const companyId = user.id;

    const existing = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE company_id = $1 AND status = 'Current'
      LIMIT 1
      `,
      [companyId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const code = await this.generateOrderCode(companyId);

    const result = await pool.query(
      `
      INSERT INTO orders (order_code, company_id, status)
      VALUES ($1, $2, 'Current')
      RETURNING *
      `,
      [code, companyId]
    );

    return result.rows[0];
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
      "SELECT * FROM products WHERE id = $1",
      [productId]
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
      (order_id, product_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [orderId, productId, Number(quantity), unitPrice, totalPrice]
    );

    return result.rows[0];
  }

  static async completeOrder(user, orderId) {
    const companyId = user.id;

    const check = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1 AND company_id = $2 AND status = 'Current'
      `,
      [orderId, companyId]
    );

    if (check.rows.length === 0) {
      const error = new Error("Order not found or not allowed.");
      error.statusCode = 403;
      throw error;
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = 'Completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [orderId]
    );

    const order = result.rows[0];

    const companyResult = await pool.query(
      "SELECT * FROM companies WHERE id = $1",
      [order.company_id]
    );

    const company = companyResult.rows[0];

    try {
      await sendMailToManager({
        subject: "New Order Completed",
        text: `Order ${order.order_code} completed by ${company.company_name}`
      });
    } catch (mailError) {
      console.log("Manager notification mail could not be sent:", mailError.message);
    }

    return order;
  }
}

module.exports = OrderService;