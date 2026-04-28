import ClientApi from "./ClientApi.js";

class ProductApi {
  static getProducts() {
    return ClientApi.request("/products");
  }
}

export default ProductApi;