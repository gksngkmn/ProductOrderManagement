import AuthManager from "../core/AuthManager.js";

class ClientApi {
  static BASE_URL = "http://localhost:3000/api";

  static async request(endpoint, options = {}) {
    const token = AuthManager.getToken();

    const response = await fetch(this.BASE_URL + endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API error");
    }

    return data;
  }
}

export default ClientApi;