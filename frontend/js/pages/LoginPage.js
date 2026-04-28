import AuthApi from "../api/AuthApi.js";
import AuthManager from "../core/AuthManager.js";

const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

const managerTab = document.getElementById("managerLoginTab");
const customerTab = document.getElementById("customerLoginTab");
const title = document.getElementById("loginTitle");

let mode = "manager";

managerTab.onclick = () => {
  mode = "manager";
  title.innerText = "Manager Login";
};

customerTab.onclick = () => {
  mode = "customer";
  title.innerText = "Customer Login";
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const data = await AuthApi.login(username, password);

    AuthManager.saveSession(data.token, data.user);

    if (data.user.role === "manager") {
      window.location.href = "/frontend/manager.html";
    } else {
      window.location.href = "/frontend/customer.html";
    }
  } catch (error) {
    message.innerText = error.message;
  }
});