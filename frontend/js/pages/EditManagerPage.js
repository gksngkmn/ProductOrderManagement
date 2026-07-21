import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import ManagerApi from "../api/ManagerApi.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const managerInfo = document.getElementById("managerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const backToManagerBtn = document.getElementById("backToManagerBtn");

const summaryManagerName = document.getElementById("summaryManagerName");
const summaryManagerRole = document.getElementById("summaryManagerRole");
const summaryUsername = document.getElementById("summaryUsername");
const summaryEmail = document.getElementById("summaryEmail");
const summaryPhone = document.getElementById("summaryPhone");
const summaryRole = document.getElementById("summaryRole");

const editManagerForm = document.getElementById("editManagerForm");
const nameInput = document.getElementById("nameInput");
const surnameInput = document.getElementById("surnameInput");
const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");
const roleInput = document.getElementById("roleInput");

const requestManagerCodeBtn = document.getElementById("requestManagerCodeBtn");
const saveManagerBtn = document.getElementById("saveManagerBtn");
const managerVerificationArea = document.getElementById("managerVerificationArea");
const managerVerificationCodeInput = document.getElementById("managerVerificationCodeInput");
const managerVerificationMessage = document.getElementById("managerVerificationMessage");

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
let manager = null;
let isManagerCodeRequested = false;
let isPasswordCodeRequested = false;

/* =========================
   INIT
========================= */
loadManager();

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

backToManagerBtn.addEventListener("click", () => {
  window.location.href = "/manager.html";
});

/* =========================
   LOAD / NORMALIZE MANAGER
========================= */
function loadManager() {
  const user = AuthManager.getUser();

  if (!user) {
    alert("Manager session not found.");
    window.location.href = "/index.html";
    return;
  }

  manager = normalizeManager(user);

  managerInfo.innerText = `${manager.username || "manager"} • ${manager.role || "manager"}`;

  renderManager();
  fillForm();
}

function normalizeManager(data) {
  return {
    id: data.id || data.managerId || data.manager_id || null,
    name: data.name || "",
    surname: data.surname || "",
    username: data.username || "",
    email: data.email || "",
    phone: data.phone || "",
    role: data.role || "manager"
  };
}

function renderManager() {
  const fullName = `${manager.name || ""} ${manager.surname || ""}`.trim();

  summaryManagerName.innerText = fullName || manager.username || "Manager";
  summaryManagerRole.innerText = manager.role || "manager";

  summaryUsername.innerText = manager.username || "-";
  summaryEmail.innerText = manager.email || "-";
  summaryPhone.innerText = manager.phone || "-";
  summaryRole.innerText = manager.role || "-";
}

function fillForm() {
  nameInput.value = manager.name || "";
  surnameInput.value = manager.surname || "";
  usernameInput.value = manager.username || "";
  emailInput.value = manager.email || "";
  PhoneInput.setValue(phoneInput, manager.phone || "");
  roleInput.value = manager.role || "manager";
}

/* =========================
   VERIFICATION HELPERS
========================= */

function showMessage(element, message, type = "success") {
  element.innerText = message;
  element.className = `edit-message ${type}`;
}

function updateLocalSession(updatedData) {
  const currentUser = AuthManager.getUser();
  const token = AuthManager.getToken();

  if (!currentUser || !token) return;

  const updatedUser = {
    ...currentUser,
    ...updatedData
  };

  AuthManager.saveSession(token, updatedUser);
}

/* =========================
   MANAGER DETAILS VERIFICATION
========================= */
requestManagerCodeBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    requestManagerCodeBtn.disabled = true;
    showMessage(managerVerificationMessage, "Sending verification code...", "success");

    await ManagerApi.requestManagerUpdateCode();

    isManagerCodeRequested = true;

    managerVerificationArea.classList.remove("hidden");
    managerVerificationArea.style.display = "block";

    saveManagerBtn.disabled = false;

    showMessage(
      managerVerificationMessage,
      "Verification code has been sent to your email.",
      "success"
    );
  } catch (error) {
    showMessage(managerVerificationMessage, error.message, "error");
  } finally {
    requestManagerCodeBtn.disabled = false;
  }
});

/* =========================
   SAVE MANAGER DETAILS
========================= */
editManagerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isManagerCodeRequested) {
    showMessage(managerVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  const code = managerVerificationCodeInput.value.trim();

  if (!code) {
    showMessage(managerVerificationMessage, "Verification code is required.", "error");
    return;
  }

  const updatedData = {
    name: nameInput.value.trim(),
    surname: surnameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: PhoneInput.getValue(phoneInput),
  };

  try {
    const updatedManager = await ManagerApi.verifyAndUpdateManager(
      updatedData,
      code
    );

    manager = normalizeManager({
      ...manager,
      ...updatedManager,
    });

    updateLocalSession(updatedManager);

    renderManager();
    fillForm();

    isManagerCodeRequested = false;
    managerVerificationCodeInput.value = "";
    saveManagerBtn.disabled = true;

    showMessage(managerVerificationMessage, "Manager details updated successfully.", "success");
  } catch (error) {
    showMessage(managerVerificationMessage, error.message, "error");
  }
});

/* =========================
   PASSWORD VERIFICATION
========================= */
requestPasswordCodeBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    requestPasswordCodeBtn.disabled = true;
    showMessage(passwordVerificationMessage, "Sending verification code...", "success");

    await ManagerApi.requestManagerPasswordCode();

    isPasswordCodeRequested = true;

    passwordVerificationArea.classList.remove("hidden");
    passwordVerificationArea.style.display = "block";

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
  const code = passwordVerificationCodeInput.value.trim();

  if (!newPassword || !confirmPassword) {
    showMessage(passwordVerificationMessage, "Password fields are required.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage(passwordVerificationMessage, "Passwords do not match.", "error");
    return;
  }

  if (newPassword.length < 12) {
    showMessage(passwordVerificationMessage, "Password must be at least 12 characters.", "error");
    return;
  }

  if (!isPasswordCodeRequested) {
    showMessage(passwordVerificationMessage, "Please request a verification code first.", "error");
    return;
  }

  if (!code) {
    showMessage(passwordVerificationMessage, "Verification code is required.", "error");
    return;
  }

  try {
    await ManagerApi.verifyAndUpdateManagerPassword(code, newPassword);

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
