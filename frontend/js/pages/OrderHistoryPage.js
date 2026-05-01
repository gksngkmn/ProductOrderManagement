import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import OrderApi from "../api/OrderApi.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const ordersContainer = document.getElementById("ordersContainer");
const orderCountInfo = document.getElementById("orderCountInfo");

const detailPanelInfo = document.getElementById("detailPanelInfo");
const orderDetailPanel = document.getElementById("orderDetailPanel");

const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   STATE
========================= */
let allOrders = [];
let selectedOrderId = null;

const params = new URLSearchParams(window.location.search);
const companyId = params.get("companyId");

/* =========================
   INIT
========================= */
backBtn.addEventListener("click", () => {
  window.location.href = "/customerList.html";
});

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

/* =========================
   LOAD ORDERS
========================= */
async function loadOrders() {
  if (!companyId) {
    ordersContainer.innerHTML = `<div class="empty-message">No company selected.</div>`;
    orderCountInfo.innerText = "No company selected.";
    return;
  }

  try {
    orderCountInfo.innerText = "Loading orders...";

    allOrders = await OrderApi.getOrdersByCompany(companyId);

    orderCountInfo.innerText = `${allOrders.length} order(s) found`;

    if (!allOrders.length) {
      renderOrders([]);
      return;
    }

    selectedOrderId = allOrders[0].id;

    renderOrders(allOrders);
    renderOrderDetails(allOrders[0]);
  } catch (error) {
    ordersContainer.innerHTML = `<div class="empty-message">${error.message}</div>`;
    orderCountInfo.innerText = "Orders could not be loaded.";
  }
}

/* =========================
   RENDER ORDERS
========================= */
function renderOrders(orders) {
  if (!orders.length) {
    ordersContainer.innerHTML = `<div class="empty-message">No orders found.</div>`;
    detailPanelInfo.innerText = "Select an order to view details.";
    orderDetailPanel.innerHTML = `<div class="empty-message">No order selected.</div>`;
    return;
  }

  ordersContainer.innerHTML = `
    <div class="order-table-wrapper">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Details</th>
            <th>Order Code</th>
            <th>Status</th>
            <th>Created</th>
            <th>Completed</th>
            <th>Items</th>
            <th>Total Price</th>
          </tr>
        </thead>

        <tbody>
          ${orders
            .map((order) => {
              const total = calculateOrderTotal(order);
              const itemCount = order.items?.length || 0;
              const selectedClass =
                String(order.id) === String(selectedOrderId) ? "selected-row" : "";

              return `
                <tr class="${selectedClass}">
                  <td class="details-cell">
                    <button class="detailsBtn" data-order-id="${order.id}" type="button">
                      Details
                    </button>
                  </td>
                  <td title="${escapeHtml(order.order_code)}">${escapeHtml(order.order_code)}</td>
                  <td>
                    <span class="${getStatusClass(order.status)}">
                      ${escapeHtml(order.status)}
                    </span>
                  </td>
                  <td>${formatDate(order.created_at)}</td>
                  <td>${order.completed_at ? formatDate(order.completed_at) : "-"}</td>
                  <td>${itemCount}</td>
                  <td>${total}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

ordersContainer.addEventListener("click", (e) => {
  if (!e.target.classList.contains("detailsBtn")) return;

  const orderId = e.target.dataset.orderId;
  const order = allOrders.find((item) => String(item.id) === String(orderId));

  if (!order) {
    alert("Order not found.");
    return;
  }

  selectedOrderId = order.id;

  renderOrders(allOrders);
  renderOrderDetails(order);
});

/* =========================
   DETAIL PANEL
========================= */
function renderOrderDetails(order) {
  detailPanelInfo.innerText =
    `${order.order_code} • ${order.status} • ${order.items?.length || 0} item(s)`;

  if (!order.items || order.items.length === 0) {
    orderDetailPanel.innerHTML = `<div class="empty-message">No items in this order.</div>`;
    return;
  }

  const total = calculateOrderTotal(order);

  orderDetailPanel.innerHTML = `
    <div class="detail-summary">
      <p><strong>Order Code:</strong> ${escapeHtml(order.order_code)}</p>
      <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
      <p><strong>Created:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Completed:</strong> ${order.completed_at ? formatDate(order.completed_at) : "-"}</p>
    </div>

    <div class="detail-table-wrapper">
      <table class="detail-items-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Type</th>
            <th>Model</th>
            <th>Angle</th>
            <th>Nodal</th>
            <th>Width</th>
            <th>Teeth</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${order.items
            .map(
              (item) => `
              <tr>
                <td>${escapeHtml(item.material)}</td>
                <td>${escapeHtml(item.type)}</td>
                <td>${escapeHtml(item.model)}</td>
                <td>${item.angle ?? "-"}</td>
                <td>${item.nodal_length ?? "-"}</td>
                <td>${item.width ?? "-"}</td>
                <td>${item.number_of_teeth ?? "-"}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price}</td>
                <td>${item.total_price}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="order-total-box">
      Total Price: ${total}
    </div>
  `;
}

/* =========================
   HELPERS
========================= */
function calculateOrderTotal(order) {
  if (!order.items?.length) return 0;

  return order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );
}

function getStatusClass(status) {
  return status === "Completed" ? "badge success" : "badge warning";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

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
loadOrders();