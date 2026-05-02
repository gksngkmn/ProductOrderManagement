import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import CompanyApi from "../api/CompanyApi.js";

import CustomerInfo from "../components/CustomerInfo.js";
import CustomerTable from "../components/CustomerTable.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const managerInfo = document.getElementById("managerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const backToManagerBtn = document.getElementById("backToManagerBtn");

const customerSearchInput = document.getElementById("customerSearchInput");
const cityFilter = document.getElementById("cityFilter");
const countryFilter = document.getElementById("countryFilter");
const applyCustomerFiltersBtn = document.getElementById("applyCustomerFiltersBtn");
const clearCustomerFiltersBtn = document.getElementById("clearCustomerFiltersBtn");

const customerStatsContainer = document.getElementById("customerStatsContainer");
const customerCountInfo = document.getElementById("customerCountInfo");
const customersTableBody = document.getElementById("customersTableBody");
const paginationContainer = document.getElementById("paginationContainer");

/* =========================
   STATE
========================= */
let allCustomers = [];
let filteredCustomers = [];

let currentPage = 1;
const CUSTOMERS_PER_PAGE = 25;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
managerInfo.innerText = CustomerInfo.renderManagerInfo(user);

/* =========================
   NAVIGATION / AUTH
========================= */
logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

backToManagerBtn.addEventListener("click", () => {
  window.location.href = "/manager.html";
});

/* =========================
   LOAD CUSTOMERS
========================= */
async function loadCustomers() {
  try {
    customerCountInfo.innerText = "Loading customers...";

    allCustomers = await CompanyApi.getCompanies();
    filteredCustomers = [...allCustomers];
    currentPage = 1;

    renderCurrentPage();
    renderStats();
  } catch (error) {
    customersTableBody.innerHTML = DomHelper.tableEmpty(error.message, 8);
    customerStatsContainer.innerHTML = DomHelper.emptyMessage(error.message);
    customerCountInfo.innerText = "Customers could not be loaded.";
  }
}

/* =========================
   STATS
========================= */
function renderStats() {
  const countries = new Set(
    allCustomers
      .map((customer) => customer.country)
      .filter(Boolean)
  );

  const cities = new Set(
    allCustomers
      .map((customer) => customer.city)
      .filter(Boolean)
  );

  customerStatsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${allCustomers.length}</div>
      <div class="stat-label">Customers</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${countries.size}</div>
      <div class="stat-label">Countries</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${cities.size}</div>
      <div class="stat-label">Cities</div>
    </div>
  `;
}

/* =========================
   RENDER CURRENT PAGE
========================= */
function renderCurrentPage() {
  const pageData = PaginationHelper.getPageData(
    filteredCustomers,
    currentPage,
    CUSTOMERS_PER_PAGE
  );

  currentPage = pageData.currentPage;

  customersTableBody.innerHTML = CustomerTable.renderRows(pageData.pageItems);

  paginationContainer.innerHTML = PaginationHelper.render(
    pageData.currentPage,
    pageData.totalPages
  );

  customerCountInfo.innerText =
    `Showing ${pageData.visibleStart}-${pageData.visibleEnd} of ${pageData.totalItems} customers`;
}

/* =========================
   PAGINATION EVENTS
========================= */
paginationContainer.addEventListener("click", (event) => {
  const page = PaginationHelper.getClickedPage(event);

  if (!page) return;

  const totalPages = PaginationHelper.getTotalPages(
    filteredCustomers.length,
    CUSTOMERS_PER_PAGE
  );

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderCurrentPage();
});

/* =========================
   FILTERS
========================= */
applyCustomerFiltersBtn.addEventListener("click", applyCustomerFilters);

clearCustomerFiltersBtn.addEventListener("click", () => {
  customerSearchInput.value = "";
  cityFilter.value = "";
  countryFilter.value = "";

  filteredCustomers = [...allCustomers];
  currentPage = 1;
  renderCurrentPage();
});

[customerSearchInput, cityFilter, countryFilter].forEach((input) => {
  input.addEventListener("input", applyCustomerFilters);
  input.addEventListener("keyup", applyCustomerFilters);
  input.addEventListener("change", applyCustomerFilters);
});

function applyCustomerFilters() {
  const search = customerSearchInput.value.toLowerCase().trim();
  const city = cityFilter.value.toLowerCase().trim();
  const country = countryFilter.value.toLowerCase().trim();

  filteredCustomers = allCustomers.filter((customer) => {
    const customerCity = String(customer.city || "").toLowerCase();
    const customerCountry = String(customer.country || "").toLowerCase();

    const combined = `
      ${customer.companyName}
      ${customer.name}
      ${customer.surname}
      ${customer.email}
      ${customer.phone}
      ${customer.username}
      ${customer.city}
      ${customer.country}
    `.toLowerCase();

    const matchesSearch = !search || combined.includes(search);
    const matchesCity = !city || customerCity.includes(city);
    const matchesCountry = !country || customerCountry.includes(country);

    return matchesSearch && matchesCity && matchesCountry;
  });

  currentPage = 1;
  renderCurrentPage();
}

/* =========================
   TABLE ACTIONS
========================= */
customersTableBody.addEventListener("click", async (event) => {
  const id = event.target.dataset.id;

  if (event.target.classList.contains("ordersBtn")) {
    window.location.href = `/orderHistory.html?companyId=${id}`;
  }

  if (event.target.classList.contains("deleteCustomerBtn")) {
    const confirmed = confirm("Are you sure you want to delete this customer?");

    if (!confirmed) return;

    try {
      await CompanyApi.deleteCompany(id);
      alert("Customer deleted successfully.");
      await loadCustomers();
    } catch (error) {
      alert(error.message);
    }
  }
});

/* =========================
   PAGE LOAD
========================= */
loadCustomers();