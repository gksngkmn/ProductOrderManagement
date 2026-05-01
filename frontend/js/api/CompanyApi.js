import ClientApi from "./ClientApi.js";

class CompanyApi {
  static getCompanies() {
    return ClientApi.request("/companies");
  }

  static deleteCompany(id) {
    return ClientApi.request(`/companies/${id}`, {
      method: "DELETE"
    });
  }
}

export default CompanyApi;