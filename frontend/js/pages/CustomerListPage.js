import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import CompanyApi from "../api/CompanyApi.js";

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
managerInfo.innerText = `${user.username} • ${user.role}`;

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
    customersTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">${error.message}</td>
      </tr>
    `;
    customerStatsContainer.innerHTML = `<div class="empty-message">${error.message}</div>`;
    customerCountInfo.innerText = "Customers could not be loaded.";
  }
}

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
   RENDER CUSTOMERS
========================= */
function renderCurrentPage() {
  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.ceil(totalCustomers / CUSTOMERS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * CUSTOMERS_PER_PAGE;
  const endIndex = startIndex + CUSTOMERS_PER_PAGE;
  const customersForPage = filteredCustomers.slice(startIndex, endIndex);

  renderCustomers(customersForPage);
  renderPagination(totalPages);

  const visibleStart = totalCustomers === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(endIndex, totalCustomers);

  customerCountInfo.innerText =
    `Showing ${visibleStart}-${visibleEnd} of ${totalCustomers} customers`;
}

function renderCustomers(customers) {
  if (!customers.length) {
    customersTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">No customers found.</td>
      </tr>
    `;
    return;
  }

  customersTableBody.innerHTML = customers
    .map(
      (customer) => `
      <tr title="${escapeHtml(customer.companyName)} | ${escapeHtml(customer.email)}">
        <td>${escapeHtml(customer.companyName)}</td>
        <td>${escapeHtml(customer.name)} ${escapeHtml(customer.surname)}</td>
        <td>${escapeHtml(customer.email)}</td>
        <td>${escapeHtml(customer.phone)}</td>
        <td>${escapeHtml(customer.country)}</td>
        <td>${escapeHtml(customer.city)}</td>
        <td>${escapeHtml(customer.username)}</td>
        <td class="actions-cell">
          <button class="ordersBtn" data-id="${customer.id}" type="button">
            Orders
          </button>
          <button class="deleteCustomerBtn danger" data-id="${customer.id}" type="button">
            Delete
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

/* =========================
   PAGINATION
========================= */
function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);

  let html = `
    <button 
      type="button" 
      data-page="${currentPage - 1}" 
      ${currentPage === 1 ? "disabled" : ""}
    >
      Prev
    </button>
  `;

  visiblePages.forEach((page) => {
    if (page === "...") {
      html += `<span class="pagination-dots">...</span>`;
      return;
    }

    html += `
      <button 
        type="button"
        class="${page === currentPage ? "active-page" : ""}" 
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  });

  html += `
    <button 
      type="button" 
      data-page="${currentPage + 1}" 
      ${currentPage === totalPages ? "disabled" : ""}
    >
      Next
    </button>

    <div class="pagination-info">
      Page ${currentPage} of ${totalPages}
    </div>
  `;

  paginationContainer.innerHTML = html;
}

function getVisiblePages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

paginationContainer.addEventListener("click", (e) => {
  const page = Number(e.target.dataset.page);

  if (!page || Number.isNaN(page)) return;

  const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE) || 1;

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
customersTableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("ordersBtn")) {
    window.location.href = `/orderHistory.html?companyId=${id}`;
    return;
  }

  if (e.target.classList.contains("deleteCustomerBtn")) {
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
   SECURITY HELPER
========================= */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   PAGE LOAD
========================= */
loadCustomers();