import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import CompanyApi from "../api/CompanyApi.js";
import ProductApi from "../api/ProductApi.js";

PageGuard.requireRole("manager");

const managerInfo = document.getElementById("managerInfo");
const logoutBtn = document.getElementById("logoutBtn");

const loadCustomersBtn = document.getElementById("loadCustomersBtn");
const customersContainer = document.getElementById("customersContainer");

const loadProductsBtn = document.getElementById("loadProductsBtn");
const productsContainer = document.getElementById("productsContainer");

const user = AuthManager.getUser();

managerInfo.innerText = `Logged in as: ${user.username}`;

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

loadCustomersBtn.addEventListener("click", async () => {
  try {
    const customers = await CompanyApi.getCompanies();

    customersContainer.innerHTML = customers
      .map(
        (customer) => `
        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
          <strong>${customer.companyName}</strong><br>
          ${customer.name} ${customer.surname}<br>
          ${customer.email}<br>
          ${customer.phone}<br>
          <button data-id="${customer.id}" class="detailsBtn">Details</button>
          <button data-id="${customer.id}" class="deleteBtn">Delete</button>
        </div>
      `
      )
      .join("");
  } catch (error) {
    customersContainer.innerHTML = `<p>${error.message}</p>`;
  }
});

loadProductsBtn.addEventListener("click", async () => {
  try {
    const products = await ProductApi.getProducts();

    productsContainer.innerHTML = products
      .map(
        (product) => `
        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
          <strong>${product.model}</strong><br>
          Material: ${product.material}<br>
          Type: ${product.type}<br>
          Nodal Length: ${product.nodalLength}<br>
          Width: ${product.width}<br>
          Teeth: ${product.numberOfTeeth}<br>
          Unit Price: ${product.unitPrice}
        </div>
      `
      )
      .join("");
  } catch (error) {
    productsContainer.innerHTML = `<p>${error.message}</p>`;
  }
});