import ClientApi from "./ClientApi.js";

class AuthApi {
  static login(username, password) {
    return ClientApi.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  // Logged-in customer password change
  static requestPasswordCode() {
    return ClientApi.request("/auth/request-password-code", {
      method: "POST",
    });
  }

  static verifyPasswordCode(code) {
    return ClientApi.request("/auth/verify-password-code", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  static resetPassword(code, newPassword) {
    return ClientApi.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ code, newPassword }),
    });
  }

  // Public forgot password
  static requestForgotPasswordCode(identifier, deliveryMethod = "email") {
    return ClientApi.request("/auth/forgot-password/request-code", {
      method: "POST",
      body: JSON.stringify({ identifier, deliveryMethod }),
    });
  }

  static resetForgotPassword(identifier, code, newPassword) {
    return ClientApi.request("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ identifier, code, newPassword }),
    });
  }
}

export default AuthApi;