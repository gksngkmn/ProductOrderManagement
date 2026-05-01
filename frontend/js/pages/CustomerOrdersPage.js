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

/* =========================
   STATE
========================= */
let allOrders = [];
let filteredOrders = [];

let currentPage = 1;
const ORDERS_PER_PAGE = 10;

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
   RENDER ORDERS
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
    return;
  }

  ordersContainer.innerHTML = orders
    .map((order) => {
      const total = calculateOrderTotal(order);
      const statusClass =
        order.status === "Completed" ? "badge success" : "badge warning";

      const itemsHtml = order.items?.length
        ? order.items
            .map(
              (item) => `
              <div class="order-item-row">
                <p><strong>${escapeHtml(item.model)}</strong></p>
                <p>${escapeHtml(item.material)}</p>
                <p>Qty: ${item.quantity}</p>
                <p>Unit: ${item.unit_price}</p>
                <p>Total: ${item.total_price}</p>
              </div>
            `
            )
            .join("")
        : `<div class="empty-message">No items in this order.</div>`;

      return `
        <article class="order-card">
          <div class="order-card-header">
            <div>
              <h3>${escapeHtml(order.order_code)}</h3>
              <p>Created: ${formatDate(order.created_at)}</p>
              ${
                order.completed_at
                  ? `<p>Completed: ${formatDate(order.completed_at)}</p>`
                  : ""
              }
            </div>

            <div class="order-meta">
              <span class="${statusClass}">${escapeHtml(order.status)}</span>
            </div>
          </div>

          <div class="order-items">
            ${itemsHtml}
          </div>

          <div class="order-total-box">
            Total Price: ${total}
          </div>
        </article>
      `;
    })
    .join("");
}

function calculateOrderTotal(order) {
  if (!order.items?.length) return 0;

  return order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );
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
  renderCurrentPage();
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
      .map((item) => `${item.model} ${item.material}`)
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
  renderCurrentPage();
}

/* =========================
   HELPERS
========================= */
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