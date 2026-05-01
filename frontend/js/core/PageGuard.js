import AuthManager from "./AuthManager.js";

class PageGuard {
  static requireRole(requiredRole) {
    if (!AuthManager.isLoggedIn()) {
      window.location.href = "/index.html";
      return;
    }

    const role = AuthManager.getRole();

    if (role !== requiredRole) {
      if (role === "manager") {
        window.location.href = "/manager.html";
        return;
      }

      if (role === "customer") {
        window.location.href = "/customer.html";
        return;
      }

      window.location.href = "/index.html";
    }
  }
}

export default PageGuard;