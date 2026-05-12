import ClientApi from "./ClientApi.js";

class ManagerApi {
  static requestManagerUpdateCode() {
    return ClientApi.request("/manager/request-update-code", {
      method: "POST",
    });
  }

  static verifyAndUpdateManager(managerData, code) {
    return ClientApi.request("/manager/verify-update", {
      method: "PUT",
      body: JSON.stringify({
        ...managerData,
        code,
      }),
    });
  }

  static requestManagerPasswordCode() {
    return ClientApi.request("/manager/request-password-code", {
      method: "POST",
    });
  }

  static verifyAndUpdateManagerPassword(code, newPassword) {
    return ClientApi.request("/manager/verify-password", {
      method: "PUT",
      body: JSON.stringify({
        code,
        newPassword,
      }),
    });
  }
}

export default ManagerApi;