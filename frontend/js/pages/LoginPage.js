import AuthApi from "../api/AuthApi.js";
import AuthManager from "../core/AuthManager.js";

/* =========================
   ELEMENTS
========================= */
const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// Yeni UI id'leri veya eski UI id'leri
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

/* =========================
   SAFETY CHECK
========================= */
if (!form || !usernameInput || !passwordInput || !managerTab || !customerTab || !title || !loginMessage || !loginBtn) {
  console.error("Login page element missing:", {
    form,
    usernameInput,
    passwordInput,
    managerTab,
    customerTab,
    title,
    loginMessage,
    loginBtn
  });

  throw new Error("Login page HTML and LoginPage.js ids do not match.");
}

/* =========================
   STATE
========================= */
let mode = "manager";

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
   INIT
========================= */
setLoginMode("manager");