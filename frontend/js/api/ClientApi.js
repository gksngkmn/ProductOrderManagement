import AuthManager from "../core/AuthManager.js";

class ClientApi {
  static BASE_URL = "/api";

  static async request(endpoint, options = {}) {
    const token = AuthManager.getToken();

    const response = await fetch(this.BASE_URL + endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const responseText = await response.text();

    let data = null;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("Invalid JSON response from server:", responseText);
        throw new Error("Server returned an invalid response.");
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || "API error");
    }

    return data;
  }
}

export default ClientApi;
