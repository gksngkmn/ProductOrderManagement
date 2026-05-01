import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import OrderApi from "../api/OrderApi.js";

PageGuard.requireRole("customer");

/* =========================
   ELEMENTS
========================= */
const customerInfo = document.getElementById("customerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const backToCustomerBtn = document.getElementById("backToCustomerBtn");

const orderSearchInput = document.getElementById("orderSearchInput");
const statusFilter = document.getElementById("statusFilter");
const applyOrderFiltersBtn = document.getElementById("applyOrderFiltersBtn");
const clearOrderFiltersBtn = document.getElementById("clearOrderFiltersBtn");

const orderStatsContainer = document.getElementById("orderStatsContainer");
const orderCountInfo = document.getElementById("orderCountInfo");
const ordersContainer = document.getElementById("ordersContainer");
const paginationContainer = document.getElementById("paginationContainer");

const detailPanelInfo = document.getElementById("detailPanelInfo");
const orderDetailPanel = document.getElementById("orderDetailPanel");

/* =========================
   STATE
========================= */
let allOrders = [];
let filteredOrders = [];
let selectedOrderId = null;

let currentPage = 1;
const ORDERS_PER_PAGE = 12;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
customerInfo.innerText = `${user.company || user.username} • ${user.role}`;

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

backToCustomerBtn.addEventListener("click", () => {
  window.location.href = "/customer.html";
});

/* =========================
   LOAD ORDERS
========================= */
async function loadOrders() {
  try {
    orderCountInfo.innerText = "Loading orders...";

    allOrders = await OrderApi.getMyOrders();
    filteredOrders = [...allOrders];
    currentPage = 1;

    renderStats();
    renderCurrentPage();

    if (filteredOrders.length > 0) {
      selectedOrderId = filteredOrders[0].id;
      renderOrderDetails(filteredOrders[0]);
      renderCurrentPage();
    }
  } catch (error) {
    ordersContainer.innerHTML = `<div class="empty-message">${error.message}</div>`;
    orderStatsContainer.innerHTML = `<div class="empty-message">${error.message}</div>`;
    orderCountInfo.innerText = "Orders could not be loaded.";
  }
}

function renderStats() {
  const completed = allOrders.filter((order) => order.status === "Completed").length;
  const current = allOrders.filter((order) => order.status === "Current").length;

  orderStatsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${allOrders.length}</div>
      <div class="stat-label">Total Orders</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${current}</div>
      <div class="stat-label">Current</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${completed}</div>
      <div class="stat-label">Completed</div>
    </div>
  `;
}

/* =========================
   RENDER ORDER LIST
========================= */
function renderCurrentPage() {
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const ordersForPage = filteredOrders.slice(startIndex, endIndex);

  renderOrders(ordersForPage);
  renderPagination(totalPages);

  const visibleStart = totalOrders === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(endIndex, totalOrders);

  orderCountInfo.innerText =
    `Showing ${visibleStart}-${visibleEnd} of ${totalOrders} orders`;
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersContainer.innerHTML = `<div class="empty-message">No orders found.</div>`;
    orderDetailPanel.innerHTML = `<div class="empty-message">No order selected.</div>`;
    detailPanelInfo.innerText = "Select an order to view details.";
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
  renderOrderDetails(order);
  renderCurrentPage();
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
   PAGINATION
========================= */
function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);

  let html = `
    <button 
      type="button" 
      data-page="${currentPage - 1}" 
      ${currentPage === 1 ? "disabled" : ""}
    >
      Prev
    </button>
  `;

  visiblePages.forEach((page) => {
    if (page === "...") {
      html += `<span class="pagination-dots">...</span>`;
      return;
    }

    html += `
      <button 
        type="button"
        class="${page === currentPage ? "active-page" : ""}" 
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  });

  html += `
    <button 
      type="button" 
      data-page="${currentPage + 1}" 
      ${currentPage === totalPages ? "disabled" : ""}
    >
      Next
    </button>

    <div class="pagination-info">
      Page ${currentPage} of ${totalPages}
    </div>
  `;

  paginationContainer.innerHTML = html;
}

function getVisiblePages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

paginationContainer.addEventListener("click", (e) => {
  const page = Number(e.target.dataset.page);

  if (!page || Number.isNaN(page)) return;

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderCurrentPage();
});

/* =========================
   FILTERS
========================= */
applyOrderFiltersBtn.addEventListener("click", applyOrderFilters);

clearOrderFiltersBtn.addEventListener("click", () => {
  orderSearchInput.value = "";
  statusFilter.value = "";

  filteredOrders = [...allOrders];
  currentPage = 1;
  selectedOrderId = filteredOrders[0]?.id || null;

  renderCurrentPage();

  if (filteredOrders[0]) {
    renderOrderDetails(filteredOrders[0]);
  } else {
    detailPanelInfo.innerText = "Select an order to view details.";
    orderDetailPanel.innerHTML = `<div class="empty-message">No order selected.</div>`;
  }
});

[orderSearchInput, statusFilter].forEach((input) => {
  input.addEventListener("input", applyOrderFilters);
  input.addEventListener("keyup", applyOrderFilters);
  input.addEventListener("change", applyOrderFilters);
});

function applyOrderFilters() {
  const search = orderSearchInput.value.toLowerCase().trim();
  const status = statusFilter.value;

  filteredOrders = allOrders.filter((order) => {
    const itemsText = (order.items || [])
      .map((item) => `${item.model} ${item.material} ${item.type}`)
      .join(" ")
      .toLowerCase();

    const combined = `
      ${order.order_code}
      ${order.status}
      ${itemsText}
    `.toLowerCase();

    const matchesSearch = !search || combined.includes(search);
    const matchesStatus = !status || order.status === status;

    return matchesSearch && matchesStatus;
  });

  currentPage = 1;
  selectedOrderId = filteredOrders[0]?.id || null;

  renderCurrentPage();

  if (filteredOrders[0]) {
    renderOrderDetails(filteredOrders[0]);
  } else {
    detailPanelInfo.innerText = "Select an order to view details.";
    orderDetailPanel.innerHTML = `<div class="empty-message">No order selected.</div>`;
  }
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