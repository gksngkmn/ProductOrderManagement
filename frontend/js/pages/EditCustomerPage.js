import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import CompanyApi from "../api/CompanyApi.js";
import AuthApi from "../api/AuthApi.js";

PageGuard.requireRole("customer");

/* =========================
   ELEMENTS
========================= */
const customerInfo = document.getElementById("customerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const backToCustomerBtn = document.getElementById("backToCustomerBtn");

const summaryCompanyName = document.getElementById("summaryCompanyName");
const summaryCustomerName = document.getElementById("summaryCustomerName");
const summaryEmail = document.getElementById("summaryEmail");
const summaryPhone = document.getElementById("summaryPhone");
const summaryCountry = document.getElementById("summaryCountry");
const summaryCity = document.getElementById("summaryCity");
const summaryUsername = document.getElementById("summaryUsername");
const summaryRole = document.getElementById("summaryRole");

const editCustomerForm = document.getElementById("editCustomerForm");
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
let isDetailsCodeRequested = false;
let isPasswordCodeRequested = false;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();

customerInfo.innerText = user
  ? `${user.company || user.username || "Customer"} • ${user.role || "customer"}`
  : "Customer information";

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

backToCustomerBtn.addEventListener("click", () => {
  window.location.href = "/customer.html";
});

/* =========================
   LOAD CUSTOMER
========================= */
async function loadCustomer() {
  try {
    const currentUser = AuthManager.getUser();

    if (!currentUser) {
      throw new Error("Customer session not found.");
    }

    const customerId =
      currentUser.id ||
      currentUser.companyId ||
      currentUser.company_id;

    if (!customerId) {
      customer = normalizeCustomer(currentUser);
    } else {
      try {
        customer = await CompanyApi.getCompanyById(customerId);
      } catch {
        customer = normalizeCustomer(currentUser);
      }
    }

    customer = normalizeCustomer(customer || currentUser);

    renderCustomer();
    fillForm();
  } catch (error) {
    alert(error.message);
    window.location.href = "/customer.html";
  }
}

function normalizeCustomer(data) {
  return {
    id: data.id || data.companyId || data.company_id || null,
    name: data.name || "",
    surname: data.surname || "",
    email: data.email || "",
    phone: data.phone || "",
    username: data.username || "",
    role: data.role || "customer",

    companyName: data.companyName || data.company || data.company_name || "",
    companyPhone: data.companyPhone || data.company_phone || "",
    address: data.address || "",
    country: data.country || "",
    city: data.city || ""
  };
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
========================= 
function getSelectedVerificationMethod(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "email";
}

function createFrontendVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validateCode(inputCode, realCode) {
  return String(inputCode || "").trim() === String(realCode || "").trim();
}

*/

function showMessage(element, message, type = "success") {
  element.innerText = message;
  element.className = `edit-message ${type}`;
}

function updateLocalSession(updatedData) {
  const currentUser = AuthManager.getUser();

  if (!currentUser) return;

  const updatedUser = {
    ...currentUser,
    ...updatedData,
    company: updatedData.companyName || currentUser.company
  };

  AuthManager.saveSession(AuthManager.getToken(), updatedUser);
}

/* =========================
   DETAILS VERIFICATION
========================= */
requestDetailsCodeBtn.addEventListener("click", async () => {
  try {
    if (!customer || !customer.id) {
      throw new Error("Customer information could not be loaded.");
    }

    requestDetailsCodeBtn.disabled = true;
    showMessage(detailsVerificationMessage, "Sending verification code...", "success");

    await CompanyApi.requestCompanyUpdateCode(customer.id);

    isDetailsCodeRequested = true;
    detailsVerificationArea.classList.remove("hidden");
    saveDetailsBtn.disabled = false;

    showMessage(
      detailsVerificationMessage,
      "Verification code has been sent to your email.",
      "success"
    );
  } catch (error) {
    showMessage(detailsVerificationMessage, error.message, "error");
  } finally {
    requestDetailsCodeBtn.disabled = false;
  }
});

/* =========================
   SAVE DETAILS
========================= */
editCustomerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isDetailsCodeRequested) {
    showMessage(detailsVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  const detailsCode = detailsVerificationCodeInput.value.trim();

  if (!detailsCode) {
    showMessage(detailsVerificationMessage, "Verification code is required.", "error");
    return;
  }

  const updatedData = {
    name: nameInput.value.trim(),
    surname: surnameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    companyName: companyNameInput.value.trim(),
    companyPhone: companyPhoneInput.value.trim(),
    address: addressInput.value.trim(),
    country: countryInput.value.trim(),
    city: cityInput.value.trim()
  };

  try {
    let backendResponse = {};

    if (customer.id && CompanyApi.verifyAndUpdateCompany) {
      backendResponse = await CompanyApi.verifyAndUpdateCompany(
        customer.id,
        updatedData,
        detailsCode
      );
  }

    customer = normalizeCustomer({
      ...customer,
      ...updatedData,
      ...backendResponse
    });

    updateLocalSession(updatedData);

    renderCustomer();
    fillForm();

    isDetailsCodeRequested = false;
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
requestPasswordCodeBtn.addEventListener("click", async () => {
  try {
    requestPasswordCodeBtn.disabled = true;
    showMessage(passwordVerificationMessage, "Sending verification code...", "success");

    await AuthApi.requestPasswordCode();

    isPasswordCodeRequested = true;
    passwordVerificationArea.classList.remove("hidden");
    savePasswordBtn.disabled = false;

    showMessage(
      passwordVerificationMessage,
      "Verification code has been sent to your email.",
      "success"
    );
  } catch (error) {
    showMessage(passwordVerificationMessage, error.message, "error");
  } finally {
    requestPasswordCodeBtn.disabled = false;
  }
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

  if (!isPasswordCodeRequested) {
    showMessage(passwordVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  const passwordCode = passwordVerificationCodeInput.value.trim(); 


  if (!passwordCode) {
    showMessage(passwordVerificationMessage, "Verification code is required.", "error");
    return;
  }

  try {
    await AuthApi.resetPassword(passwordCode, newPassword);

    isPasswordCodeRequested = false;
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