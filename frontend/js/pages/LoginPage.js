import AuthApi from "../api/AuthApi.js";
import AuthManager from "../core/AuthManager.js";

/* =========================
   ELEMENTS
========================= */
const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const managerTab =
  document.getElementById("managerTab") ||
  document.getElementById("managerLoginTab");

const customerTab =
  document.getElementById("customerTab") ||
  document.getElementById("customerLoginTab");

const title = document.getElementById("loginTitle");

const loginMessage =
  document.getElementById("loginMessage") ||
  document.getElementById("message");

const loginBtn =
  document.getElementById("loginBtn") ||
  form?.querySelector("button[type='submit']");

/* Forgot Password Elements */
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const closeForgotPasswordModalBtn = document.getElementById("closeForgotPasswordModalBtn");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");

const resetIdentifierInput = document.getElementById("resetIdentifierInput");
const requestResetCodeBtn = document.getElementById("requestResetCodeBtn");
const resetPasswordArea = document.getElementById("resetPasswordArea");
const resetCodeInput = document.getElementById("resetCodeInput");
const newResetPasswordInput = document.getElementById("newResetPasswordInput");
const confirmResetPasswordInput = document.getElementById("confirmResetPasswordInput");
const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");

/* =========================
   SAFETY CHECK
========================= */
if (
  !form ||
  !usernameInput ||
  !passwordInput ||
  !managerTab ||
  !customerTab ||
  !title ||
  !loginMessage ||
  !loginBtn ||
  !forgotPasswordBtn ||
  !forgotPasswordModal ||
  !closeForgotPasswordModalBtn ||
  !forgotPasswordForm ||
  !resetIdentifierInput ||
  !requestResetCodeBtn ||
  !resetPasswordArea ||
  !resetCodeInput ||
  !newResetPasswordInput ||
  !confirmResetPasswordInput ||
  !forgotPasswordMessage
) {
  console.error("Login page element missing:", {
    form,
    usernameInput,
    passwordInput,
    managerTab,
    customerTab,
    title,
    loginMessage,
    loginBtn,
    forgotPasswordBtn,
    forgotPasswordModal,
    closeForgotPasswordModalBtn,
    forgotPasswordForm,
    resetIdentifierInput,
    requestResetCodeBtn,
    resetPasswordArea,
    resetCodeInput,
    newResetPasswordInput,
    confirmResetPasswordInput,
    forgotPasswordMessage
  });

  throw new Error("Login page HTML and LoginPage.js ids do not match.");
}

/* =========================
   STATE
========================= */
let mode = "manager";
let frontendResetCode = null;

/* =========================
   TAB UI
========================= */
function setLoginMode(selectedMode) {
  mode = selectedMode;

  if (mode === "manager") {
    title.innerText = "Manager Login";

    managerTab.classList.add("active");
    managerTab.classList.remove("light");

    customerTab.classList.remove("active");
    customerTab.classList.add("light");
  } else {
    title.innerText = "Customer Login";

    customerTab.classList.add("active");
    customerTab.classList.remove("light");

    managerTab.classList.remove("active");
    managerTab.classList.add("light");
  }

  loginMessage.innerText = "";
  loginMessage.className = "login-message";
}

managerTab.addEventListener("click", () => {
  setLoginMode("manager");
});

customerTab.addEventListener("click", () => {
  setLoginMode("customer");
});

/* =========================
   LOGIN
========================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginMessage.innerText = "Username and password are required.";
    loginMessage.className = "login-message error";
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.innerText = "Logging in...";

    const data = await AuthApi.login(username, password);

    if (mode === "manager" && data.user.role !== "manager") {
      throw new Error("Please use customer login.");
    }

    if (mode === "customer" && data.user.role !== "customer") {
      throw new Error("Please use manager login.");
    }

    AuthManager.saveSession(data.token, data.user);

    loginMessage.innerText = "Login successful.";
    loginMessage.className = "login-message success";

    if (data.user.role === "manager") {
      window.location.href = "/manager.html";
    } else {
      window.location.href = "/customer.html";
    }
  } catch (error) {
    loginMessage.innerText = error.message;
    loginMessage.className = "login-message error";
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerText = "Login";
  }
});

/* =========================
   FORGOT PASSWORD MODAL
========================= */
forgotPasswordBtn.addEventListener("click", () => {
  openForgotPasswordModal();
});

closeForgotPasswordModalBtn.addEventListener("click", () => {
  closeForgotPasswordModal();
});

forgotPasswordModal.addEventListener("click", (event) => {
  if (event.target === forgotPasswordModal) {
    closeForgotPasswordModal();
  }
});

function openForgotPasswordModal() {
  forgotPasswordModal.classList.remove("hidden");

  frontendResetCode = null;
  forgotPasswordForm.reset();
  resetPasswordArea.classList.add("hidden");

  forgotPasswordMessage.innerText = "";
  forgotPasswordMessage.className = "login-message";
}

function closeForgotPasswordModal() {
  forgotPasswordModal.classList.add("hidden");

  frontendResetCode = null;
  forgotPasswordForm.reset();
  resetPasswordArea.classList.add("hidden");

  forgotPasswordMessage.innerText = "";
  forgotPasswordMessage.className = "login-message";
}

function getResetMethod() {
  return document.querySelector('input[name="resetMethod"]:checked')?.value || "email";
}

function createFrontendVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function showForgotPasswordMessage(message, type = "success") {
  forgotPasswordMessage.innerText = message;
  forgotPasswordMessage.className = `login-message ${type}`;
}

/* =========================
   REQUEST RESET CODE
========================= */
requestResetCodeBtn.addEventListener("click", async () => {
  const identifier = resetIdentifierInput.value.trim();
  const method = getResetMethod();

  if (!identifier) {
    showForgotPasswordMessage("Username or email is required.", "error");
    return;
  }

  try {
    requestResetCodeBtn.disabled = true;
    requestResetCodeBtn.innerText = "Requesting...";

    /*
      Backend integration later:
      await AuthApi.requestPasswordReset(identifier, method);
    */

    frontendResetCode = createFrontendVerificationCode();
    resetPasswordArea.classList.remove("hidden");

    showForgotPasswordMessage(
      `Frontend demo: verification code sent by ${method.toUpperCase()}. Test code: ${frontendResetCode}`,
      "success"
    );
  } catch (error) {
    showForgotPasswordMessage(error.message, "error");
  } finally {
    requestResetCodeBtn.disabled = false;
    requestResetCodeBtn.innerText = "Request Verification Code";
  }
});

/* =========================
   RESET PASSWORD
========================= */
forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const identifier = resetIdentifierInput.value.trim();
  const code = resetCodeInput.value.trim();
  const newPassword = newResetPasswordInput.value.trim();
  const confirmPassword = confirmResetPasswordInput.value.trim();

  if (!frontendResetCode) {
    showForgotPasswordMessage("Please request a verification code first.", "error");
    return;
  }

  if (!code || code !== frontendResetCode) {
    showForgotPasswordMessage("Invalid verification code.", "error");
    return;
  }

  if (!newPassword || !confirmPassword) {
    showForgotPasswordMessage("Password fields are required.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showForgotPasswordMessage("Passwords do not match.", "error");
    return;
  }

  if (newPassword.length < 4) {
    showForgotPasswordMessage("Password must be at least 4 characters.", "error");
    return;
  }

  try {
    /*
      Backend integration later:
      await AuthApi.resetPassword(identifier, code, newPassword);
    */

    showForgotPasswordMessage(
      "Password reset successfully. You can now login with your new password.",
      "success"
    );

    setTimeout(() => {
      closeForgotPasswordModal();
    }, 1200);
  } catch (error) {
    showForgotPasswordMessage(error.message, "error");
  }
});

/* =========================
   INIT
========================= */
setLoginMode("manager");