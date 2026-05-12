const ProductService = require("../services/ProductService");
const { generateProductUpdatesExcel } = require("../utils/productExcelGenerator");

const {
  sendProductUpdatesMailToCustomer,
} = require("../utils/mailService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error.",
  });
}

async function getProducts(req, res) {
  try {
    const products = await ProductService.getProducts();
    return res.json(products);
  } catch (error) {
    return handleError(res, error, "Get products error:");
  }
}

async function createProduct(req, res) {
  try {
    const product = await ProductService.createProduct(req.body);

    /*
      Product creation does NOT send automatic emails anymore.
      Product update mails are sent manually by manager using:
      POST /api/products/send-updates
    */

    return res.status(201).json(product);
  } catch (error) {
    return handleError(res, error, "Create product error:");
  }
}

async function sendProductUpdates(req, res) {
  try {
    const { period, startDate, endDate } = req.body;

    const { products, periodLabel } =
      await ProductService.getProductsForUpdateMail({
        period,
        startDate,
        endDate,
      });

    if (!products.length) {
      return res.status(400).json({
        message: "No products found for selected period.",
      });
    }

    const customers = await ProductService.getCustomersForProductMail();

    if (!customers.length) {
      return res.status(400).json({
        message: "No customers found for product update mail.",
      });
    }

    let productsExcelBuffer = null;

    try {
      productsExcelBuffer = await generateProductUpdatesExcel({
        products,
        periodLabel,
      });
    } catch (excelError) {
      console.log(
        "Product updates Excel file could not be generated:",
        excelError.message
      );
    }

    const results = [];

    for (const customer of customers) {
      const result = await sendProductUpdatesMailToCustomer({
        customerEmail: customer.email,
        customerName: `${customer.name || ""} ${customer.surname || ""}`.trim(),
        products,
        periodLabel,
        productsExcelBuffer,
      });

      results.push({
        customerEmail: customer.email,
        success: result,
      });
    }

    return res.json({
      message: "Product update mails processed successfully.",
      periodLabel,
      productCount: products.length,
      customerCount: customers.length,
      sentCount: results.filter((item) => item.success).length,
      failedCount: results.filter((item) => !item.success).length,
      excelAttached: Boolean(productsExcelBuffer),
      results,
    });
  } catch (error) {
    return handleError(res, error, "Send product updates error:");
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await ProductService.updateProduct(id, req.body);
    return res.json(product);
  } catch (error) {
    return handleError(res, error, "Update product error:");
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await ProductService.deleteProduct(id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, "Delete product error:");
  }
}

module.exports = {
  getProducts,
  createProduct,
  sendProductUpdates,
  updateProduct,
  deleteProduct,
};