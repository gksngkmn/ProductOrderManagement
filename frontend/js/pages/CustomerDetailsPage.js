import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import CompanyApi from "../api/CompanyApi.js";
import DomHelper from "../helpers/DomHelper.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const managerInfo = document.getElementById("managerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const backToCustomerListBtn = document.getElementById("backToCustomerListBtn");

const summaryCompanyName = document.getElementById("summaryCompanyName");
const summaryCustomerName = document.getElementById("summaryCustomerName");
const summaryEmail = document.getElementById("summaryEmail");
const summaryPhone = document.getElementById("summaryPhone");
const summaryCountry = document.getElementById("summaryCountry");
const summaryCity = document.getElementById("summaryCity");
const summaryUsername = document.getElementById("summaryUsername");
const summaryRole = document.getElementById("summaryRole");

const customerDetailsForm = document.getElementById("customerDetailsForm");
const nameInput = document.getElementById("nameInput");
const surnameInput = document.getElementById("surnameInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");
const usernameInput = document.getElementById("usernameInput");
const companyNameInput = document.getElementById("companyNameInput");
const companyPhoneInput = document.getElementById("companyPhoneInput");
const addressInput = document.getElementById("addressInput");
const countryInput = document.getElementById("countryInput");
const cityInput = document.getElementById("cityInput");

const requestDetailsCodeBtn = document.getElementById("requestDetailsCodeBtn");
const saveDetailsBtn = document.getElementById("saveDetailsBtn");
const detailsVerificationArea = document.getElementById("detailsVerificationArea");
const detailsVerificationCodeInput = document.getElementById("detailsVerificationCodeInput");
const detailsVerificationMessage = document.getElementById("detailsVerificationMessage");

const passwordForm = document.getElementById("passwordForm");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const requestPasswordCodeBtn = document.getElementById("requestPasswordCodeBtn");
const savePasswordBtn = document.getElementById("savePasswordBtn");
const passwordVerificationArea = document.getElementById("passwordVerificationArea");
const passwordVerificationCodeInput = document.getElementById("passwordVerificationCodeInput");
const passwordVerificationMessage = document.getElementById("passwordVerificationMessage");

/* =========================
   STATE
========================= */
let customer = null;

let detailsVerificationCode = null;
let passwordVerificationCode = null;

const params = new URLSearchParams(window.location.search);
const companyId = params.get("companyId");

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
managerInfo.innerText = `${user.username} • ${user.role}`;

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

backToCustomerListBtn.addEventListener("click", () => {
  window.location.href = "/customerList.html";
});

/* =========================
   LOAD CUSTOMER
========================= */
async function loadCustomer() {
  if (!companyId) {
    alert("No customer selected.");
    window.location.href = "/customerList.html";
    return;
  }

  try {
    customer = await CompanyApi.getCompanyById(companyId);

    if (!customer) {
      throw new Error("Customer not found.");
    }

    renderCustomer();
    fillForm();
  } catch (error) {
    alert(error.message);
    window.location.href = "/customerList.html";
  }
}

function renderCustomer() {
  summaryCompanyName.innerText = customer.companyName || "-";
  summaryCustomerName.innerText = `${customer.name || ""} ${customer.surname || ""}`.trim() || "-";
  summaryEmail.innerText = customer.email || "-";
  summaryPhone.innerText = customer.phone || "-";
  summaryCountry.innerText = customer.country || "-";
  summaryCity.innerText = customer.city || "-";
  summaryUsername.innerText = customer.username || "-";
  summaryRole.innerText = customer.role || "-";
}

function fillForm() {
  nameInput.value = customer.name || "";
  surnameInput.value = customer.surname || "";
  emailInput.value = customer.email || "";
  phoneInput.value = customer.phone || "";
  usernameInput.value = customer.username || "";

  companyNameInput.value = customer.companyName || "";
  companyPhoneInput.value = customer.companyPhone || "";
  addressInput.value = customer.address || "";
  countryInput.value = customer.country || "";
  cityInput.value = customer.city || "";
}

/* =========================
   VERIFICATION HELPERS
========================= */
function getSelectedVerificationMethod(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "email";
}

function createFrontendVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function showMessage(element, message, type = "success") {
  element.innerText = message;
  element.className = `details-message ${type}`;
}

function validateCode(inputCode, realCode) {
  return String(inputCode || "").trim() === String(realCode || "").trim();
}

/* =========================
   DETAILS VERIFICATION
========================= */
requestDetailsCodeBtn.addEventListener("click", () => {
  const method = getSelectedVerificationMethod("detailsVerificationMethod");

  detailsVerificationCode = createFrontendVerificationCode();

  detailsVerificationArea.classList.remove("hidden");
  saveDetailsBtn.disabled = false;

  showMessage(
    detailsVerificationMessage,
    `Frontend demo: verification code sent by ${method.toUpperCase()}. Test code: ${detailsVerificationCode}`,
    "success"
  );
});

/* =========================
   SAVE DETAILS
========================= */
customerDetailsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!detailsVerificationCode) {
    showMessage(detailsVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  if (!validateCode(detailsVerificationCodeInput.value, detailsVerificationCode)) {
    showMessage(detailsVerificationMessage, "Invalid verification code.", "error");
    return;
  }

  const updatedData = {
    name: nameInput.value.trim(),
    surname: surnameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),

    // Backend şu an sadece name/surname/email/phone update ediyor olabilir.
    // Bu alanları frontend tasarımda tutuyoruz; backend genişletilince kullanılacak.
    companyName: companyNameInput.value.trim(),
    companyPhone: companyPhoneInput.value.trim(),
    address: addressInput.value.trim(),
    country: countryInput.value.trim(),
    city: cityInput.value.trim()
  };

  try {
    const updatedCustomer = await CompanyApi.updateCompany(companyId, updatedData);

    customer = {
      ...customer,
      ...updatedData,
      ...updatedCustomer
    };

    renderCustomer();
    fillForm();

    detailsVerificationCode = null;
    detailsVerificationCodeInput.value = "";
    saveDetailsBtn.disabled = true;

    showMessage(detailsVerificationMessage, "Customer details updated successfully.", "success");
  } catch (error) {
    showMessage(detailsVerificationMessage, error.message, "error");
  }
});

/* =========================
   PASSWORD VERIFICATION
========================= */
requestPasswordCodeBtn.addEventListener("click", () => {
  const method = getSelectedVerificationMethod("passwordVerificationMethod");

  passwordVerificationCode = createFrontendVerificationCode();

  passwordVerificationArea.classList.remove("hidden");
  savePasswordBtn.disabled = false;

  showMessage(
    passwordVerificationMessage,
    `Frontend demo: verification code sent by ${method.toUpperCase()}. Test code: ${passwordVerificationCode}`,
    "success"
  );
});

/* =========================
   SAVE PASSWORD
========================= */
passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!newPassword || !confirmPassword) {
    showMessage(passwordVerificationMessage, "Password fields are required.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage(passwordVerificationMessage, "Passwords do not match.", "error");
    return;
  }

  if (newPassword.length < 4) {
    showMessage(passwordVerificationMessage, "Password must be at least 4 characters.", "error");
    return;
  }

  if (!passwordVerificationCode) {
    showMessage(passwordVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  if (!validateCode(passwordVerificationCodeInput.value, passwordVerificationCode)) {
    showMessage(passwordVerificationMessage, "Invalid verification code.", "error");
    return;
  }

  try {
    await CompanyApi.updateCustomerPassword(companyId, newPassword);

    passwordVerificationCode = null;
    passwordVerificationCodeInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
    savePasswordBtn.disabled = true;

    showMessage(passwordVerificationMessage, "Password changed successfully.", "success");
  } catch (error) {
    showMessage(passwordVerificationMessage, error.message, "error");
  }
});

/* =========================
   PAGE LOAD
========================= */
loadCustomer();