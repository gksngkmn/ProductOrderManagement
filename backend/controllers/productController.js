const ProductService = require("../services/ProductService");

const {
  sendNewProductMailToCustomer
} = require("../utils/mailService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error."
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

    try {
      const customers = await ProductService.getCustomersForProductMail();
      const productForMail = ProductService.formatProductForMail(product);

      for (const customer of customers) {
        await sendNewProductMailToCustomer({
          customerEmail: customer.email,
          customerName: `${customer.name || ""} ${customer.surname || ""}`.trim(),
          product: productForMail
        });
      }

      console.log(`New product mail sent to ${customers.length} customers.`);
    } catch (mailError) {
      console.error("New product mail sending error:", mailError.message);
    }

    return res.status(201).json(product);
  } catch (error) {
    return handleError(res, error, "Create product error:");
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
  updateProduct,
  deleteProduct
};