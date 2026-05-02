import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import OrderApi from "../api/OrderApi.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const ordersTableBody = document.getElementById("ordersTableBody");
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
   NAVIGATION
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
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">No company selected.</td>
      </tr>
    `;
    orderCountInfo.innerText = "No company selected.";
    return;
  }

  try {
    allOrders = await OrderApi.getOrdersByCompany(companyId);

    if (!allOrders.length) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">No orders found.</td>
        </tr>
      `;
      orderCountInfo.innerText = "0 orders found.";
      return;
    }

    renderOrdersTable(allOrders);
    orderCountInfo.innerText = `${allOrders.length} orders found.`;

    selectOrder(allOrders[0].id);
  } catch (error) {
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty">${error.message}</td>
      </tr>
    `;
    orderCountInfo.innerText = "Orders could not be loaded.";
  }
}

/* =========================
   RENDER ORDERS TABLE
========================= */
function renderOrdersTable(orders) {
  ordersTableBody.innerHTML = orders
    .map((order) => {
      const total = calculateOrderTotal(order);
      const itemCount = order.items ? order.items.length : 0;
      const isSelected = String(order.id) === String(selectedOrderId);

      return `
        <tr 
          class="${isSelected ? "selected-row" : ""}" 
          data-order-id="${order.id}"
        >
          <td>${order.id}</td>
          <td title="${escapeHtml(order.order_code)}">${escapeHtml(order.order_code)}</td>
          <td>${escapeHtml(order.status)}</td>
          <td>${formatDate(order.created_at)}</td>
          <td>${formatDate(order.completed_at)}</td>
          <td>${itemCount}</td>
          <td>${total}</td>
        </tr>
      `;
    })
    .join("");
}

/* =========================
   SELECT ORDER
========================= */
ordersTableBody.addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  if (!row || !row.dataset.orderId) return;

  selectOrder(row.dataset.orderId);
});

function selectOrder(orderId) {
  selectedOrderId = orderId;

  const order = allOrders.find((item) => String(item.id) === String(orderId));

  if (!order) {
    orderDetailPanel.innerHTML = `<div class="empty-message">Order not found.</div>`;
    return;
  }

  renderOrdersTable(allOrders);
  renderOrderDetail(order);
}

/* =========================
   RENDER DETAIL
========================= */
function renderOrderDetail(order) {
  const total = calculateOrderTotal(order);

  detailPanelInfo.innerText = `${order.order_code} • ${order.status}`;

  const itemsHtml = order.items?.length
    ? `
      <div class="detail-table-wrapper">
        <table class="detail-items-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Type</th>
              <th>Model</th>
              <th>Angle</th>
              <th>Nodal Length</th>
              <th>Width</th>
              <th>Teeth</th>
              <th>Qty</th>
              <th>Unit Price</th>
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
                  <td>${item.angle ?? ""}</td>
                  <td>${item.nodal_length ?? ""}</td>
                  <td>${item.width ?? ""}</td>
                  <td>${item.number_of_teeth ?? ""}</td>
                  <td>${item.quantity ?? ""}</td>
                  <td>${item.unit_price ?? ""}</td>
                  <td>${item.total_price ?? ""}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
    : `<div class="empty-message">No items in this order.</div>`;

  orderDetailPanel.innerHTML = `
    <div class="detail-summary">
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
      <p><strong>Created:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Completed:</strong> ${formatDate(order.completed_at)}</p>
      <p><strong>Items:</strong> ${order.items?.length || 0}</p>
      <p><strong>Total:</strong> ${total}</p>
    </div>

    ${itemsHtml}

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