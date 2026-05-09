import ClientApi from "./ClientApi.js";

class ProductApi {
  static getProducts() {
    return ClientApi.request("/products");
  }

  static createProduct(productData) {
    return ClientApi.request("/products", {
      method: "POST",
      body: JSON.stringify(productData)
    });
  }

  static updateProduct(id, productData) {
    return ClientApi.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData)
    });
  }

  static deleteProduct(id) {
    return ClientApi.request(`/products/${id}`, {
      method: "DELETE"
    });
  }

  static sendProductUpdates(updateData) {
    return ClientApi.request("/products/send-updates", {
      method: "POST",
      body: JSON.stringify(updateData)
    });
  }
}

export default ProductApi;