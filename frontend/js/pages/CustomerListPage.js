import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import CompanyApi from "../api/CompanyApi.js";

import CustomerInfo from "../components/CustomerInfo.js";
import CustomerTable from "../components/CustomerTable.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";
import ExportHelper from "../helpers/ExportHelper.js";

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

const customerCountInfo = document.getElementById("customerCountInfo");
const customersTableBody = document.getElementById("customersTableBody");
const paginationContainer = document.getElementById("paginationContainer");
const exportCustomersBtn = document.getElementById("exportCustomersBtn");

const openAddCustomerModalBtn = document.getElementById("openAddCustomerModalBtn");
const addCustomerModal = document.getElementById("addCustomerModal");
const closeAddCustomerModalBtn = document.getElementById("closeAddCustomerModalBtn");
const cancelAddCustomerBtn = document.getElementById("cancelAddCustomerBtn");

const addCustomerForm = document.getElementById("addCustomerForm");
const addCustomerMessage = document.getElementById("addCustomerMessage");
const customerPageNotice = document.getElementById("customerPageNotice");
const createCustomerBtn = document.getElementById("createCustomerBtn");

const addNameInput = document.getElementById("addNameInput");
const addSurnameInput = document.getElementById("addSurnameInput");
const addEmailInput = document.getElementById("addEmailInput");
const addPhoneInput = document.getElementById("addPhoneInput");
const addUsernameInput = document.getElementById("addUsernameInput");
const addPasswordInput = document.getElementById("addPasswordInput");

const addCompanyNameInput = document.getElementById("addCompanyNameInput");
const addCompanyPhoneInput = document.getElementById("addCompanyPhoneInput");
const addAddressInput = document.getElementById("addAddressInput");
const addCountryInput = document.getElementById("addCountryInput");
const addCityInput = document.getElementById("addCityInput");
const countrySuggestions = document.getElementById("countrySuggestions");
const citySuggestions = document.getElementById("citySuggestions");

const COUNTRY_CITY_SUGGESTIONS = {
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  China: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Dongguan", "Ningbo", "Suzhou", "Hangzhou"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  "United Kingdom": ["London", "Manchester", "Birmingham"],
  Germany: ["Berlin", "Hamburg", "Munich", "Frankfurt"],
  France: ["Paris", "Lyon", "Marseille"],
  Italy: ["Milan", "Rome", "Turin"],
  Spain: ["Madrid", "Barcelona", "Valencia"],
  Netherlands: ["Amsterdam", "Rotterdam"],
  Belgium: ["Brussels", "Antwerp"],
  Switzerland: ["Zurich", "Geneva"],
  Austria: ["Vienna", "Graz"],
  Poland: ["Warsaw", "Krakow"],
  Portugal: ["Lisbon", "Porto"],
  Sweden: ["Stockholm", "Gothenburg"],
  Norway: ["Oslo", "Bergen"],
  Denmark: ["Copenhagen", "Aarhus"],
  Finland: ["Helsinki", "Tampere"],
  Greece: ["Athens", "Thessaloniki"],
  Romania: ["Bucharest", "Cluj-Napoca"],
  Bulgaria: ["Sofia", "Plovdiv"],
  Ukraine: ["Kyiv", "Lviv"],
  Russia: ["Moscow", "Saint Petersburg"],
  Kazakhstan: ["Almaty", "Astana"],
  Georgia: ["Tbilisi", "Batumi"],
  Azerbaijan: ["Baku", "Ganja"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Saudi Arabia": ["Riyadh", "Jeddah"],
  Qatar: ["Doha"],
  Kuwait: ["Kuwait City"],
  Egypt: ["Cairo", "Alexandria"],
  "South Africa": ["Johannesburg", "Cape Town"],
  India: ["Mumbai", "Delhi", "Bengaluru", "Chennai"],
  Pakistan: ["Karachi", "Lahore", "Islamabad"],
  Japan: ["Tokyo", "Osaka", "Nagoya"],
  "South Korea": ["Seoul", "Busan"],
  "Hong Kong": ["Hong Kong"],
  Taiwan: ["Taipei", "Kaohsiung"],
  Singapore: ["Singapore"],
  Malaysia: ["Kuala Lumpur", "Johor Bahru"],
  Indonesia: ["Jakarta", "Surabaya"],
  Thailand: ["Bangkok", "Chiang Mai"],
  Vietnam: ["Ho Chi Minh City", "Hanoi"],
  Philippines: ["Manila", "Cebu"],
  Australia: ["Sydney", "Melbourne", "Brisbane"],
  "New Zealand": ["Auckland", "Wellington"],
  Mexico: ["Mexico City", "Monterrey"],
  Brazil: ["São Paulo", "Rio de Janeiro"],
  Argentina: ["Buenos Aires", "Córdoba"],
  Chile: ["Santiago", "Valparaíso"],
  Colombia: ["Bogotá", "Medellín"],
  Peru: ["Lima", "Arequipa"]
};
/* =========================
   STATE
========================= */
let allCustomers = [];
let filteredCustomers = [];

let currentPage = 1;
const CUSTOMERS_PER_PAGE = 25;
let pageNoticeTimer;

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
   ADD CUSTOMER MODAL
========================= */
openAddCustomerModalBtn.addEventListener("click", () => {
  openAddCustomerModal();
});

closeAddCustomerModalBtn.addEventListener("click", () => {
  closeAddCustomerModal();
});

cancelAddCustomerBtn.addEventListener("click", () => {
  closeAddCustomerModal();
});

addCustomerModal.addEventListener("click", (event) => {
  if (event.target === addCustomerModal) {
    closeAddCustomerModal();
  }
});

function openAddCustomerModal() {
  addCustomerModal.classList.remove("hidden");
  addCustomerMessage.innerText = "";
  addCustomerMessage.className = "add-customer-message";
}

function closeAddCustomerModal() {
  addCustomerModal.classList.add("hidden");
  addCustomerForm.reset();
  addCustomerMessage.innerText = "";
  addCustomerMessage.className = "add-customer-message";
}

function getAddCustomerNotificationMethod() {
  return document.querySelector(
    'input[name="addCustomerNotificationMethod"]:checked'
  )?.value || "email";
}

function showAddCustomerMessage(message, type = "success") {
  addCustomerMessage.innerText = message;
  addCustomerMessage.className = `add-customer-message ${type}`;
}

function showCustomerPageNotice(message, type = "success", autoHide = true) {
  clearTimeout(pageNoticeTimer);
  customerPageNotice.innerText = message;
  customerPageNotice.className = `customer-page-notice ${type}`;
  if (autoHide) {
    pageNoticeTimer = setTimeout(() => {
      customerPageNotice.classList.add("hidden");
    }, 5000);
  }
}

function setSuggestionOptions(datalist, values) {
  datalist.replaceChildren(
    ...[...new Set(values.filter(Boolean))]
      .sort((left, right) => left.localeCompare(right))
      .map((value) => {
        const option = document.createElement("option");
        option.value = value;
        return option;
      })
  );
}

function populateCountrySuggestions() {
  setSuggestionOptions(countrySuggestions, [
    ...Object.keys(COUNTRY_CITY_SUGGESTIONS),
    ...allCustomers.map((customer) => customer.country)
  ]);
}

function populateCitySuggestions() {
  const selectedCountry = addCountryInput.value.trim().toLowerCase();
  const matchedCountry = Object.keys(COUNTRY_CITY_SUGGESTIONS)
    .find((country) => country.toLowerCase() === selectedCountry);
  const predefinedCities = matchedCountry
    ? COUNTRY_CITY_SUGGESTIONS[matchedCountry]
    : Object.values(COUNTRY_CITY_SUGGESTIONS).flat();
  const existingCities = allCustomers
    .filter((customer) =>
      !selectedCountry ||
      String(customer.country || "").trim().toLowerCase() === selectedCountry
    )
    .map((customer) => customer.city);

  setSuggestionOptions(citySuggestions, [...predefinedCities, ...existingCities]);
}

addCountryInput.addEventListener("input", populateCitySuggestions);
addCountryInput.addEventListener("change", populateCitySuggestions);

/* =========================
   LOAD CUSTOMERS
========================= */
async function loadCustomers() {
  try {
    customerCountInfo.innerText = "Loading customers...";

    allCustomers = await CompanyApi.getCompanies();
    filteredCustomers = [...allCustomers];
    currentPage = 1;

    populateFilterOptions();
    populateCountrySuggestions();
    populateCitySuggestions();
    renderCurrentPage();
  } catch (error) {
    customersTableBody.innerHTML = DomHelper.tableEmpty(error.message, 8);
    customerCountInfo.innerText = "Customers could not be loaded.";
  }
}

/* =========================
   FILTER OPTIONS
========================= */
function populateFilterOptions() {
  populateSelectOptions(cityFilter, allCustomers, "city", "All Cities");
  populateSelectOptions(countryFilter, allCustomers, "country", "All Countries");
}

function populateSelectOptions(selectElement, customers, fieldName, defaultText) {
  const values = [
    ...new Set(
      customers
        .map((customer) => customer[fieldName])
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));

  selectElement.innerHTML = `
    <option value="">${defaultText}</option>
    ${values
      .map((value) => `<option value="${DomHelper.escapeHtml(value)}">${DomHelper.escapeHtml(value)}</option>`)
      .join("")}
  `;
}


/* =========================
   CREATE CUSTOMER
========================= */
addCustomerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const notificationMethod = getAddCustomerNotificationMethod();

  const customerData = {
    name: addNameInput.value.trim(),
    surname: addSurnameInput.value.trim(),
    email: addEmailInput.value.trim(),
    phone: PhoneInput.getValue(addPhoneInput),
    username: addUsernameInput.value.trim(),
    password: addPasswordInput.value.trim(),

    companyName: addCompanyNameInput.value.trim(),
    companyPhone: PhoneInput.getValue(addCompanyPhoneInput),
    address: addAddressInput.value.trim(),
    country: addCountryInput.value.trim(),
    city: addCityInput.value.trim(),

    notificationMethod
  };

  if (!customerData.name || !customerData.surname || !customerData.email) {
    showAddCustomerMessage("Name, surname and email are required.", "error");
    return;
  }

  if (!customerData.username || !customerData.password) {
    showAddCustomerMessage("Username and password are required.", "error");
    return;
  }

  if (customerData.password.length < 12) {
    showAddCustomerMessage(
      "Password must be at least 12 characters.",
      "error"
    );
    return;
  }

  if (!customerData.companyName || !customerData.country || !customerData.city) {
    showAddCustomerMessage("Company name, country and city are required.", "error");
    return;
  }

  try {
    createCustomerBtn.disabled = true;
    addCustomerModal.classList.add("hidden");

    await CompanyApi.createCompany(customerData);
    addCustomerForm.reset();
    showCustomerPageNotice("Customer created. Please reload the page.", "success");
    await loadCustomers();
  } catch (error) {
    showCustomerPageNotice(error.message, "error");
    addCustomerModal.classList.remove("hidden");
  } finally {
    createCustomerBtn.disabled = false;
  }
});

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
  input.addEventListener("change", applyCustomerFilters);
});

function applyCustomerFilters() {
  const search = customerSearchInput.value.toLowerCase().trim();
  const selectedCity = cityFilter.value.toLowerCase().trim();
  const selectedCountry = countryFilter.value.toLowerCase().trim();

  filteredCustomers = allCustomers.filter((customer) => {
    const customerCity = String(customer.city || "").toLowerCase().trim();
    const customerCountry = String(customer.country || "").toLowerCase().trim();

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
    const matchesCity = !selectedCity || customerCity === selectedCity;
    const matchesCountry = !selectedCountry || customerCountry === selectedCountry;

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

  if (event.target.classList.contains("detailsCustomerBtn")) {
    window.location.href = `/customerDetails.html?companyId=${id}`;
  }

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
   EXPORT CUSTOMERS
========================= */
exportCustomersBtn.addEventListener("click", () => {
  ExportHelper.exportToExcel(
    `customers-${ExportHelper.getTodayFileDate()}`,
    "Customers",
    [
      { label: "Company", key: "companyName" },
      {
        label: "Name",
        key: (customer) =>
          `${customer.name || ""} ${customer.surname || ""}`.trim()
      },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" },
      { label: "Country", key: "country" },
      { label: "City", key: "city" },
      { label: "Username", key: "username" }
    ],
    filteredCustomers
  );
});

/* =========================
   PAGE LOAD
========================= */
loadCustomers();
