const ProductService = require("../services/ProductService");

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