import ClientApi from "./ClientApi.js";

class CompanyApi {
  static getCompanies() {
    return ClientApi.request("/companies");
  }

  static getCompanyById(id) {
    return ClientApi.request(`/companies/${id}`);
  }

  // Manager direct update only
  static updateCompany(id, companyData) {
    return ClientApi.request(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  }

  // Customer info update verification request
  static requestCompanyUpdateCode(id) {
    return ClientApi.request(`/companies/${id}/request-update-code`, {
      method: "POST",
    });
  }

  // Customer verified info update
  static verifyAndUpdateCompany(id, companyData, code) {
    return ClientApi.request(`/companies/${id}/verify-update`, {
      method: "PUT",
      body: JSON.stringify({
        ...companyData,
        code,
      }),
    });
  }


    static requestCustomerPasswordUpdateCode(id) {
    return ClientApi.request(`/companies/${id}/request-password-code`, {
      method: "POST",
    });
  }

  static verifyAndUpdateCustomerPassword(id, code, newPassword) {
    return ClientApi.request(`/companies/${id}/verify-password`, {
      method: "PUT",
      body: JSON.stringify({
        code,
        newPassword,
      }),
    });
  }

  // Manager password update only
  static updateCustomerPassword(id, newPassword) {
    return ClientApi.request(`/companies/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
    });
  }

  static deleteCompany(id) {
    return ClientApi.request(`/companies/${id}`, {
      method: "DELETE",
    });
  }

  static createCompany(companyData) {
    return ClientApi.request("/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  }
}

export default CompanyApi;