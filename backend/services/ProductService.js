const pool = require("../db");

class ProductService {
  static formatProduct(product) {
    return {
      id: product.id,
      material: product.material,
      type: product.type,
      model: product.model,
      angle: product.angle,
      nodalLength: product.nodal_length,
      width: product.width,
      numberOfTeeth: product.number_of_teeth,
      unitPrice: product.unit_price,
      createdAt: product.created_at
    };
  }

  static formatProductForMail(product) {
    return {
      id: product.id,
      material: product.material,
      type: product.type,
      model: product.model,
      angle: product.angle,
      nodal_length: product.nodalLength,
      width: product.width,
      number_of_teeth: product.numberOfTeeth,
      unit_price: product.unitPrice
    };
  }

  static async getProducts() {
    const result = await pool.query(`
      SELECT 
        id,
        material,
        type,
        model,
        angle,
        nodal_length,
        width,
        number_of_teeth,
        unit_price,
        created_at
      FROM products
      ORDER BY model ASC
    `);

    return result.rows.map(this.formatProduct);
  }

  static async createProduct(data) {
    const {
      material,
      type,
      model,
      angle,
      nodalLength,
      width,
      numberOfTeeth,
      unitPrice
    } = data;

    if (
      !material ||
      !type ||
      !model ||
      angle === undefined ||
      nodalLength === undefined ||
      width === undefined ||
      numberOfTeeth === undefined ||
      unitPrice === undefined
    ) {
      const error = new Error("All product fields are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      INSERT INTO products
      (
        material,
        type,
        model,
        angle,
        nodal_length,
        width,
        number_of_teeth,
        unit_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        material,
        type,
        model,
        Number(angle),
        Number(nodalLength),
        Number(width),
        Number(numberOfTeeth),
        Number(unitPrice)
      ]
    );

    return this.formatProduct(result.rows[0]);
  }

  static async updateProduct(id, data) {
    const {
      material,
      type,
      model,
      angle,
      nodalLength,
      width,
      numberOfTeeth,
      unitPrice
    } = data;

    if (
      !material ||
      !type ||
      !model ||
      angle === undefined ||
      nodalLength === undefined ||
      width === undefined ||
      numberOfTeeth === undefined ||
      unitPrice === undefined
    ) {
      const error = new Error("All product fields are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        material = $1,
        type = $2,
        model = $3,
        angle = $4,
        nodal_length = $5,
        width = $6,
        number_of_teeth = $7,
        unit_price = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        material,
        type,
        model,
        Number(angle),
        Number(nodalLength),
        Number(width),
        Number(numberOfTeeth),
        Number(unitPrice),
        id
      ]
    );

    if (result.rows.length === 0) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    return this.formatProduct(result.rows[0]);
  }

  static async deleteProduct(id) {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    return {
      message: "Product deleted successfully."
    };
  }

  static async getCustomersForProductMail() {
    const result = await pool.query(`
      SELECT
        id,
        name,
        surname,
        email,
        company_name
      FROM companies
      WHERE email IS NOT NULL
      AND email <> ''
      ORDER BY id ASC
    `);

    return result.rows.map((customer) => ({
      id: customer.id,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      companyName: customer.company_name
    }));
  }
}

module.exports = ProductService;