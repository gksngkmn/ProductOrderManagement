import ClientApi from "./ClientApi.js";

class CompanyApi {
  static getCompanies() {
    return ClientApi.request("/companies");
  }
}

export default CompanyApi;