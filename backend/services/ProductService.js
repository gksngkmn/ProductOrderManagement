const pool = require("../db");
const ExcelJS = require("exceljs");

class ProductService {
  static normalizeImportHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  static importCellValue(cell) {
    const value = cell?.value;
    if (value && typeof value === "object") {
      if ("result" in value) return value.result;
      if (Array.isArray(value.richText)) {
        return value.richText.map((part) => part.text).join("");
      }
      if ("text" in value) return value.text;
    }
    return value;
  }

  static productIdentity(product) {
    const textParts = [
      product.material,
      product.type,
      product.model
    ].map((value) => String(value ?? "").trim().toLowerCase());
    const decimalParts = [
      product.angle,
      product.nodalLength,
      product.width
    ].map((value) => Number(value).toFixed(2));
    return [...textParts, ...decimalParts, String(Number(product.numberOfTeeth))].join("|");
  }

  static async getManagerIdForUser(user) {
    if (user.role === "manager") return Number(user.id);

    if (user.role === "customer") {
      const result = await pool.query(
        "SELECT manager_id FROM companies WHERE id = $1",
        [user.id]
      );
      if (result.rows.length) return Number(result.rows[0].manager_id);
    }

    const error = new Error("Product access is not allowed.");
    error.statusCode = 403;
    throw error;
  }

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
      currency: product.currency,
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
      unit_price: product.unitPrice,
      currency: product.currency
    };
  }

  static async getProducts(user) {
    const managerId = await this.getManagerIdForUser(user);
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
        currency,
        created_at
      FROM products
      WHERE manager_id = $1
      ORDER BY model ASC
    `, [managerId]);

    return result.rows.map(this.formatProduct);
  }


    static getPeriodConfig({ period, startDate, endDate }) {
    if (startDate && endDate) {
      return {
        whereClause: "created_at BETWEEN $1 AND $2",
        values: [startDate, endDate],
        periodLabel: `${startDate} - ${endDate}`
      };
    }

    const allowedPeriods = {
      "7d": {
        interval: "7 days",
        label: "Last 7 Days"
      },
      "14d": {
        interval: "14 days",
        label: "Last 14 Days"
      },
      "30d": {
        interval: "30 days",
        label: "Last 30 Days"
      },
      "3m": {
        interval: "3 months",
        label: "Last 3 Months"
      },
      "6m": {
        interval: "6 months",
        label: "Last 6 Months"
      }
    };

    const selectedPeriod = allowedPeriods[period] || allowedPeriods["7d"];

    return {
      whereClause: `created_at >= CURRENT_TIMESTAMP - INTERVAL '${selectedPeriod.interval}'`,
      values: [],
      periodLabel: selectedPeriod.label
    };
  }

  static async getProductsForUpdateMail(user, { period, startDate, endDate }) {
    const managerId = await this.getManagerIdForUser(user);
    const config = this.getPeriodConfig({
      period,
      startDate,
      endDate
    });
    const tenantWhereClause = config.values.length
      ? "created_at BETWEEN $2 AND $3"
      : config.whereClause;

    const result = await pool.query(
      `
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
        currency,
        created_at
      FROM products
      WHERE manager_id = $1 AND ${tenantWhereClause}
      ORDER BY created_at DESC
      `,
      [managerId, ...config.values]
    );

    return {
      products: result.rows,
      periodLabel: config.periodLabel
    };
  }
  

  static async createProduct(user, data) {
    const managerId = await this.getManagerIdForUser(user);
    const {
      material,
      type,
      model,
      angle,
      nodalLength,
      width,
      numberOfTeeth,
      unitPrice,
      currency
    } = data;

    if (
      !material ||
      !type ||
      !model ||
      angle === undefined ||
      nodalLength === undefined ||
      width === undefined ||
      numberOfTeeth === undefined ||
      unitPrice === undefined ||
      !["USD", "CNY"].includes(currency)
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
        unit_price,
        currency,
        manager_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
        currency,
        managerId
      ]
    );

    return this.formatProduct(result.rows[0]);
  }

  static async importProducts(user, { fileName, dataBase64 }) {
    const managerId = await this.getManagerIdForUser(user);
    if (!fileName || !/\.xlsx$/i.test(fileName)) {
      const error = new Error("Only .xlsx files can be imported.");
      error.statusCode = 400;
      throw error;
    }
    if (!dataBase64 || typeof dataBase64 !== "string") {
      const error = new Error("Excel file content is required.");
      error.statusCode = 400;
      throw error;
    }

    const buffer = Buffer.from(dataBase64, "base64");
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
      const error = new Error("Excel file must be smaller than 10 MB.");
      error.statusCode = 400;
      throw error;
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer);
    } catch {
      const error = new Error("Excel file could not be read.");
      error.statusCode = 400;
      throw error;
    }
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      const error = new Error("Excel file does not contain a worksheet.");
      error.statusCode = 400;
      throw error;
    }

    const requiredHeaders = {
      material: "Material",
      type: "Type",
      model: "Model",
      angle: "Angle",
      nodallength: "Nodal Length",
      width: "Width",
      numberofteeth: "Number of Teeth",
      unitprice: "Unit Price",
      currency: "Currency"
    };
    const headerColumns = new Map();
    worksheet.getRow(1).eachCell((cell, columnNumber) => {
      headerColumns.set(
        this.normalizeImportHeader(this.importCellValue(cell)),
        columnNumber
      );
    });
    const missingHeaders = Object.entries(requiredHeaders)
      .filter(([normalized]) => !headerColumns.has(normalized))
      .map(([, label]) => label);
    if (missingHeaders.length) {
      const error = new Error(`Missing Excel columns: ${missingHeaders.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    const existingResult = await pool.query(
      `SELECT material, type, model, angle, nodal_length AS "nodalLength",
              width, number_of_teeth AS "numberOfTeeth"
       FROM products WHERE manager_id = $1`,
      [managerId]
    );
    const knownIdentities = new Set(
      existingResult.rows.map((product) => this.productIdentity(product))
    );
    const results = [];
    const validRows = [];

    for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const read = (header) => this.importCellValue(row.getCell(headerColumns.get(header)));
      const raw = {
        material: String(read("material") ?? "").trim(),
        type: String(read("type") ?? "").trim(),
        model: String(read("model") ?? "").trim(),
        angle: read("angle"),
        nodalLength: read("nodallength"),
        width: read("width"),
        numberOfTeeth: read("numberofteeth"),
        unitPrice: read("unitprice"),
        currency: String(read("currency") ?? "").trim().toUpperCase()
      };
      if (Object.values(raw).every((value) => value === "" || value === null || value === undefined)) {
        continue;
      }

      const product = {
        ...raw,
        angle: Number(Number(raw.angle).toFixed(2)),
        nodalLength: Number(Number(raw.nodalLength).toFixed(2)),
        width: Number(Number(raw.width).toFixed(2)),
        numberOfTeeth: Number(raw.numberOfTeeth),
        unitPrice: Number(Number(raw.unitPrice).toFixed(2))
      };
      const errors = [];
      if (!product.material) errors.push("Material is required.");
      if (!product.type) errors.push("Type is required.");
      if (!product.model) errors.push("Model is required.");
      for (const [field, label] of [
        ["angle", "Angle"], ["nodalLength", "Nodal Length"],
        ["width", "Width"], ["numberOfTeeth", "Number of Teeth"],
        ["unitPrice", "Unit Price"]
      ]) {
        if (!Number.isFinite(product[field]) || product[field] < 0) {
          errors.push(`${label} must be a non-negative number.`);
        }
      }
      if (!Number.isInteger(product.numberOfTeeth)) {
        errors.push("Number of Teeth must be an integer.");
      }
      if (!["USD", "CNY"].includes(product.currency)) {
        errors.push("Currency must be USD or CNY.");
      }

      const identity = this.productIdentity(product);
      if (!errors.length && knownIdentities.has(identity)) {
        errors.push("Product already exists in this manager's catalogue or is duplicated in the file.");
      }

      if (errors.length) {
        results.push({ rowNumber, status: "failed", message: errors.join(" "), product: raw });
        continue;
      }
      knownIdentities.add(identity);
      validRows.push({ rowNumber, product });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of validRows) {
        await client.query("SAVEPOINT import_product_row");
        try {
          const inserted = await client.query(
            `INSERT INTO products
             (material, type, model, angle, nodal_length, width,
              number_of_teeth, unit_price, currency, manager_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [
              item.product.material, item.product.type, item.product.model,
              item.product.angle, item.product.nodalLength, item.product.width,
              item.product.numberOfTeeth, item.product.unitPrice,
              item.product.currency, managerId
            ]
          );
          results.push({
            rowNumber: item.rowNumber,
            status: "imported",
            message: "Imported successfully.",
            product: item.product,
            productId: inserted.rows[0].id
          });
          await client.query("RELEASE SAVEPOINT import_product_row");
        } catch {
          await client.query("ROLLBACK TO SAVEPOINT import_product_row");
          await client.query("RELEASE SAVEPOINT import_product_row");
          results.push({
            rowNumber: item.rowNumber,
            status: "failed",
            message: "Database rejected the product.",
            product: item.product
          });
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    results.sort((left, right) => left.rowNumber - right.rowNumber);
    const importedCount = results.filter((item) => item.status === "imported").length;
    return {
      fileName,
      totalRows: results.length,
      importedCount,
      failedCount: results.length - importedCount,
      results
    };
  }

  static async updateProduct(user, id, data) {
    const managerId = await this.getManagerIdForUser(user);
    const {
      material,
      type,
      model,
      angle,
      nodalLength,
      width,
      numberOfTeeth,
      unitPrice,
      currency
    } = data;

    if (
      !material ||
      !type ||
      !model ||
      angle === undefined ||
      nodalLength === undefined ||
      width === undefined ||
      numberOfTeeth === undefined ||
      unitPrice === undefined ||
      !["USD", "CNY"].includes(currency)
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
        unit_price = $8,
        currency = $9
      WHERE id = $10 AND manager_id = $11
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
        currency,
        id,
        managerId
      ]
    );

    if (result.rows.length === 0) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    return this.formatProduct(result.rows[0]);
  }

  static async deleteProduct(user, id) {
    const managerId = await this.getManagerIdForUser(user);
    let result;
    try {
      result = await pool.query(
        "DELETE FROM products WHERE id = $1 AND manager_id = $2 RETURNING id",
        [id, managerId]
      );
    } catch (error) {
      if (error.code === "23503") {
        const conflict = new Error("Product is used in an order and cannot be deleted.");
        conflict.statusCode = 409;
        throw conflict;
      }
      throw error;
    }

    if (result.rows.length === 0) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    return {
      message: "Product deleted successfully."
    };
  }

  static async getCustomersForProductMail(user) {
    const managerId = await this.getManagerIdForUser(user);
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
      AND manager_id = $1
      ORDER BY id ASC
    `, [managerId]);

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
