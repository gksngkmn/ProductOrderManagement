import StorageManager from "./StorageManager.js";

class AuthManager {
  static TOKEN_KEY = "token";
  static USER_KEY = "user";

  static saveSession(token, user) {
    StorageManager.set(this.TOKEN_KEY, token);
    StorageManager.set(this.USER_KEY, user);
  }

  static getToken() {
    return StorageManager.get(this.TOKEN_KEY);
  }

  static getUser() {
    return StorageManager.get(this.USER_KEY);
  }

  static getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static logout() {
    StorageManager.clear();
    window.location.href = "/index.html";
  }
}

export default AuthManager;