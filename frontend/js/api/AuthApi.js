import ClientApi from "./ClientApi.js";

class AuthApi {
  static login(username, password) {
    return ClientApi.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  }

  static requestPasswordReset(identifier, method) {
    return ClientApi.request("/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify({ identifier, method })
    });
  }

  static resetPassword(identifier, code, newPassword) {
    return ClientApi.request("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ identifier, code, newPassword })
    });
  }
}

export default AuthApi;