import ClientApi from "./ClientApi.js";

class AuthApi {
  static login(username, password) {
    return ClientApi.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  }
}

export default AuthApi;