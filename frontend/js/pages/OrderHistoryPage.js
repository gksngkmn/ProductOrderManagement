import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import OrderApi from "../api/OrderApi.js";

PageGuard.requireRole("manager");

const ordersContainer = document.getElementById("ordersContainer");
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");

const params = new URLSearchParams(window.location.search);
const companyId = params.get("companyId");

backBtn.addEventListener("click", () => {
  window.location.href = "/manager.html";
});

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

async function loadOrders() {
  if (!companyId) {
    ordersContainer.innerHTML = `<div class="empty-message">No company selected.</div>`;
    return;
  }

  try {
    const orders = await OrderApi.getOrdersByCompany(companyId);

    if (!orders.length) {
      ordersContainer.innerHTML = `<div class="empty-message">No orders found.</div>`;
      return;
    }

    ordersContainer.innerHTML = orders
      .map((order) => {
        const itemsHtml = order.items?.length
          ? order.items
              .map(
                (item) => `
                <div class="order-item-row">
                  <p><strong>${item.model}</strong></p>
                  <p>Material: ${item.material}</p>
                  <p>Quantity: ${item.quantity}</p>
                  <p>Unit Price: ${item.unit_price}</p>
                  <p>Total Price: ${item.total_price}</p>
                </div>
              `
              )
              .join("")
          : `<div class="empty-message">No items in this order.</div>`;

        const statusClass =
          order.status === "Completed" ? "badge success" : "badge warning";

        return `
          <div class="order-card">
            <h3>Order Code: ${order.order_code}</h3>

            <div class="order-meta">
              <span class="${statusClass}">${order.status}</span>
              <span class="badge">Created: ${new Date(order.created_at).toLocaleString()}</span>
            </div>

            <div class="order-items">
              ${itemsHtml}
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    ordersContainer.innerHTML = `<div class="empty-message">${error.message}</div>`;
  }
}

loadOrders();