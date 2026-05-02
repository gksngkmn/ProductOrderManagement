import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import OrderApi from "../api/OrderApi.js";

import OrderTable from "../components/OrderTable.js";
import CustomerInfo from "../components/CustomerInfo.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";

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
const ordersTableBody = document.getElementById("ordersTableBody");
const paginationContainer = document.getElementById("paginationContainer");

const detailPanelInfo = document.getElementById("detailPanelInfo");
const orderDetailPanel = document.getElementById("orderDetailPanel");

/* =========================
   STATE
========================= */
let allOrders = [];
let filteredOrders = [];
let currentPageOrders = [];

let selectedOrderId = null;
let currentPage = 1;

const ORDERS_PER_PAGE = 10;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
customerInfo.innerText = CustomerInfo.renderCustomerInfo(user);

/* =========================
   NAVIGATION / AUTH
========================= */
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
    ordersTableBody.innerHTML = DomHelper.tableEmpty(error.message, 7);
    orderStatsContainer.innerHTML = DomHelper.emptyMessage(error.message);
    orderCountInfo.innerText = "Orders could not be loaded.";
    orderDetailPanel.innerHTML = DomHelper.emptyMessage(error.message);
  }
}

/* =========================
   STATS
========================= */
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
   RENDER CURRENT PAGE
========================= */
function renderCurrentPage() {
  const pageData = PaginationHelper.getPageData(
    filteredOrders,
    currentPage,
    ORDERS_PER_PAGE
  );

  currentPage = pageData.currentPage;
  currentPageOrders = pageData.pageItems;

  selectedOrderId = currentPageOrders[0]?.id || null;

  renderOrdersTable();
  renderSelectedOrderDetail();

  paginationContainer.innerHTML = PaginationHelper.render(
    pageData.currentPage,
    pageData.totalPages
  );

  orderCountInfo.innerText =
    `Showing ${pageData.visibleStart}-${pageData.visibleEnd} of ${pageData.totalItems} orders`;
}

function renderOrdersTable() {
  ordersTableBody.innerHTML = OrderTable.renderManagerOrderRows(
    currentPageOrders,
    selectedOrderId
  );
}

function renderSelectedOrderDetail() {
  const selectedOrder = currentPageOrders.find(
    (order) => String(order.id) === String(selectedOrderId)
  );

  if (!selectedOrder) {
    detailPanelInfo.innerText = "Select an order to view details.";
    orderDetailPanel.innerHTML = DomHelper.emptyMessage("No order selected.");
    return;
  }

  detailPanelInfo.innerText =
    `${selectedOrder.order_code} • ${selectedOrder.status}`;

  orderDetailPanel.innerHTML = OrderTable.renderOrderDetail(selectedOrder);
}

/* =========================
   PAGINATION EVENTS
========================= */
paginationContainer.addEventListener("click", (event) => {
  const page = PaginationHelper.getClickedPage(event);

  if (!page) return;

  const totalPages = PaginationHelper.getTotalPages(
    filteredOrders.length,
    ORDERS_PER_PAGE
  );

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderCurrentPage();
});

/* =========================
   TABLE EVENTS
========================= */
ordersTableBody.addEventListener("click", (event) => {
  const row = event.target.closest("tr");

  if (!row || !row.dataset.orderId) return;

  selectedOrderId = row.dataset.orderId;

  renderOrdersTable();
  renderSelectedOrderDetail();
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
   PAGE LOAD
========================= */
loadOrders();