const OrderService = require("../services/OrderService");

function handleError(res, error, logMessage) {
  console.error(logMessage, error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error."
  });
}

async function getOrdersByCompany(req, res) {
  try {
    const orders = await OrderService.getOrdersByCompany(
      req.user,
      req.params.companyId
    );

    return res.json(orders);
  } catch (error) {
    return handleError(res, error, "Get orders error:");
  }
}

async function createOrder(req, res) {
  try {
    const order = await OrderService.createOrder(req.user);
    return res.status(201).json(order);
  } catch (error) {
    return handleError(res, error, "Create order error:");
  }
}

async function addItemToOrder(req, res) {
  try {
    const { orderId } = req.params;

    const item = await OrderService.addItemToOrder(
      req.user,
      orderId,
      req.body
    );

    return res.status(201).json(item);
  } catch (error) {
    return handleError(res, error, "Add item error:");
  }
}

async function completeOrder(req, res) {
  try {
    const { orderId } = req.params;

    const order = await OrderService.completeOrder(
      req.user,
      orderId
    );

    return res.json(order);
  } catch (error) {
    return handleError(res, error, "Complete order error:");
  }
}

module.exports = {
  getOrdersByCompany,
  createOrder,
  addItemToOrder,
  completeOrder
};