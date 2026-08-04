const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const path = require("path");
const ExcelJS = require("exceljs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
process.env.MAIL_MODE = "mock";
process.env.SMS_MODE = "mock";

const pool = require("../db");
const SuperadminService = require("../services/SuperadminService");
const ProductService = require("../services/ProductService");
const OrderService = require("../services/OrderService");

test("superadmin manager deletion removes only its linked data", {
  skip: process.env.RUN_DB_TESTS !== "true"
}, async () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  let firstManager;
  let secondManager;
  let customer;
  let firstProduct;
  let secondProduct;
  let order;

  try {
    firstManager = await SuperadminService.createManager({
      username: `test_m1_${suffix}`, password: "Valid-Test-Password-123",
      name: "Test", surname: "One", email: `m1_${suffix}@example.test`,
      phone: "10000000001"
    });
    secondManager = await SuperadminService.createManager({
      username: `test_m2_${suffix}`, password: "Valid-Test-Password-123",
      name: "Test", surname: "Two", email: `m2_${suffix}@example.test`,
      phone: "10000000002"
    });
    customer = await SuperadminService.createCustomer(firstManager.id, {
      username: `test_c_${suffix}`, password: "Valid-Test-Password-123",
      name: "Test", surname: "Customer", email: `c_${suffix}@example.test`,
      phone: "10000000003", companyName: `Test Co ${suffix}`,
      address: "Test", country: "TR", city: "Istanbul"
    });
    assert.equal(customer.companyPhone, null);

    const productData = {
      material: "Test Steel", type: "Test Type", model: `Model ${suffix}`,
      angle: 10, nodalLength: 20, width: 30, numberOfTeeth: 40,
      unitPrice: 50, currency: "USD"
    };
    firstProduct = await ProductService.createProduct(
      { id: firstManager.id, role: "manager" },
      productData
    );
    secondProduct = await ProductService.createProduct(
      { id: secondManager.id, role: "manager" },
      { ...productData, model: `Other ${suffix}` }
    );

    const firstManagerProducts = await ProductService.getProducts({
      id: firstManager.id, role: "manager"
    });
    const secondManagerProducts = await ProductService.getProducts({
      id: secondManager.id, role: "manager"
    });
    const customerProducts = await ProductService.getProducts({
      id: customer.id, role: "customer"
    });
    assert(firstManagerProducts.some((product) => product.id === firstProduct.id));
    assert(!firstManagerProducts.some((product) => product.id === secondProduct.id));
    assert(secondManagerProducts.some((product) => product.id === secondProduct.id));
    assert(customerProducts.some((product) => product.id === firstProduct.id));
    await assert.rejects(
      () => ProductService.updateProduct(
        { id: secondManager.id, role: "manager" },
        firstProduct.id,
        productData
      ),
      (error) => error.statusCode === 404
    );

    order = await OrderService.createOrder({ id: customer.id, role: "customer" });
    await OrderService.addItemToOrder(
      { id: customer.id, role: "customer" },
      order.id,
      { productId: firstProduct.id, quantity: 2 }
    );
    await OrderService.completeOrder(
      { id: customer.id, role: "customer" },
      order.id
    );

    const superadminOrders = await OrderService.getOrdersByCompany(
      { id: 0, role: "superadmin" },
      customer.id
    );
    assert(superadminOrders.some((customerOrder) => customerOrder.id === order.id));

    await SuperadminService.deleteManager(firstManager.id);
    firstManager = null;
    const deletedCustomer = await pool.query(
      "SELECT id FROM companies WHERE id = $1",
      [customer.id]
    );
    const deletedProduct = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [firstProduct.id]
    );
    const retainedProduct = await pool.query(
      "SELECT manager_id FROM products WHERE id = $1",
      [secondProduct.id]
    );
    const deletedOrder = await pool.query(
      "SELECT id FROM orders WHERE id = $1",
      [order.id]
    );
    assert.equal(deletedCustomer.rowCount, 0);
    assert.equal(deletedProduct.rowCount, 0);
    assert.equal(deletedOrder.rowCount, 0);
    assert.equal(retainedProduct.rows[0].manager_id, secondManager.id);
    customer = null;
    firstProduct = null;
    order = null;

    await SuperadminService.deleteManager(secondManager.id);
    secondManager = null;
    secondProduct = null;
  } finally {
    if (customer) await pool.query("DELETE FROM companies WHERE id = $1", [customer.id]);
    if (firstProduct || secondProduct) {
      await pool.query("DELETE FROM products WHERE id = ANY($1::int[])", [
        [firstProduct?.id, secondProduct?.id].filter(Boolean)
      ]);
    }
    if (firstManager) await pool.query("DELETE FROM manager_users WHERE id = $1", [firstManager.id]);
    if (secondManager) await pool.query("DELETE FROM manager_users WHERE id = $1", [secondManager.id]);
  }
});

test("product Excel import reports valid, invalid and duplicate rows", {
  skip: process.env.RUN_DB_TESTS !== "true"
}, async () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  let manager;
  try {
    manager = await SuperadminService.createManager({
      username: `import_${suffix}`, password: "Valid-Test-Password-123",
      name: "Import", surname: "Test", email: `import_${suffix}@example.test`,
      phone: "10000000005"
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.addRow([
      "Material", "Type", "Model", "Angle", "Nodal Length", "Width",
      "Number of Teeth", "Unit Price", "Currency"
    ]);
    sheet.addRow(["PU", "T5", "500", 0, 500, 150, 100, 0, "USD"]);
    sheet.addRow(["PU", "T5", "Broken", 0, 500, 150, "not-a-number", 0, "USD"]);
    const dataBase64 = Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");

    const first = await ProductService.importProducts(
      { id: manager.id, role: "manager" },
      { fileName: "products.xlsx", dataBase64 }
    );
    assert.equal(first.importedCount, 1);
    assert.equal(first.failedCount, 1);
    assert.match(first.results.find((row) => row.status === "failed").message, /Number of Teeth/);

    const second = await ProductService.importProducts(
      { id: manager.id, role: "manager" },
      { fileName: "products.xlsx", dataBase64 }
    );
    assert.equal(second.importedCount, 0);
    assert.equal(second.failedCount, 2);
    assert.match(second.results[0].message, /already exists/);
  } finally {
    if (manager) {
      await pool.query("DELETE FROM products WHERE manager_id = $1", [manager.id]);
      await pool.query("DELETE FROM manager_users WHERE id = $1", [manager.id]);
    }
  }
});

test("manager deletion removes its products when it has no customers", {
  skip: process.env.RUN_DB_TESTS !== "true"
}, async () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  let manager;
  let product;

  try {
    manager = await SuperadminService.createManager({
      username: `delete_${suffix}`, password: "Valid-Test-Password-123",
      name: "Delete", surname: "Test", email: `delete_${suffix}@example.test`,
      phone: "10000000006"
    });
    product = await ProductService.createProduct(
      { id: manager.id, role: "manager" },
      {
        material: "Test Steel", type: "Delete Type", model: `Delete ${suffix}`,
        angle: 10, nodalLength: 20, width: 30, numberOfTeeth: 40,
        unitPrice: 0, currency: "USD"
      }
    );

    const result = await SuperadminService.deleteManager(manager.id);
    assert.match(result.message, /product\(s\) deleted/);

    const deletedManager = await pool.query(
      "SELECT id FROM manager_users WHERE id = $1",
      [manager.id]
    );
    const deletedProduct = await pool.query(
      "SELECT id FROM products WHERE id = $1",
      [product.id]
    );
    assert.equal(deletedManager.rowCount, 0);
    assert.equal(deletedProduct.rowCount, 0);
    manager = null;
    product = null;
  } finally {
    if (product) await pool.query("DELETE FROM products WHERE id = $1", [product.id]);
    if (manager) await pool.query("DELETE FROM manager_users WHERE id = $1", [manager.id]);
  }
});

test.after(() => pool.end());
