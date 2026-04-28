import AuthManager from "./AuthManager.js";

class PageGuard {
  static requireRole(requiredRole) {
    if (!AuthManager.isLoggedIn()) {
      window.location.href = "/frontend/index.html";
      return;
    }

    const role = AuthManager.getRole();

    if (role !== requiredRole) {
      AuthManager.logout();
    }
  }
}

export default PageGuard;