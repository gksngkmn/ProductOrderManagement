import ClientApi from "./ClientApi.js";

class OrderApi {
  static getOrdersByCompany(companyId) {
    return ClientApi.request(`/orders/company/${companyId}`);
  }

  static getMyOrders() {
    return ClientApi.request("/orders/my");
  }

  static createOrder() {
    return ClientApi.request("/orders", {
      method: "POST"
    });
  }

  static addItemToOrder(orderId, productId, quantity) {
    return ClientApi.request(`/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    });
  }

  static completeOrder(orderId) {
    return ClientApi.request(`/orders/${orderId}/complete`, {
      method: "PUT"
    });
  }
}

export default OrderApi;