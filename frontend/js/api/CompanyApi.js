import ClientApi from "./ClientApi.js";

class CompanyApi {
  static getCompanies() {
    return ClientApi.request("/companies");
  }

  static async getCompanyById(id) {
    const companies = await this.getCompanies();

    return companies.find((company) => String(company.id) === String(id));
  }

  static updateCompany(id, companyData) {
    return ClientApi.request(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(companyData)
    });
  }

  static updateCustomerPassword(id, newPassword) {
    return ClientApi.request(`/companies/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword })
    });
  }

  static deleteCompany(id) {
    return ClientApi.request(`/companies/${id}`, {
      method: "DELETE"
    });
  }
}

export default CompanyApi;