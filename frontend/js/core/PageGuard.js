import AuthManager from "./AuthManager.js";

class PageGuard {
  static requireRole(requiredRole) {
    if (!AuthManager.isLoggedIn()) {
      window.location.replace("/index.html");
      return;
    }

    const role = AuthManager.getRole();

    if (role == "superadmin") {
      return;
    }

    if (role !== requiredRole) {
      alert("You do not have permission to access this page.");
      window.location.replace("/index.html");
      return;
    }
  }
}

export default PageGuard;