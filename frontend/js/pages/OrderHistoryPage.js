import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import OrderApi from "../api/OrderApi.js";

import OrderTable from "../components/OrderTable.js";
import DomHelper from "../helpers/DomHelper.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const ordersTableBody = document.getElementById("ordersTableBody");
const orderCountInfo = document.getElementById("orderCountInfo");

const detailPanelInfo = document.getElementById("detailPanelInfo");
const orderDetailPanel = document.getElementById("orderDetailPanel");

const yearFilter = document.getElementById("yearFilter");
const monthFilter = document.getElementById("monthFilter");
const applyDateFiltersBtn = document.getElementById("applyDateFiltersBtn");
const clearDateFiltersBtn = document.getElementById("clearDateFiltersBtn");

const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   STATE
========================= */
let allOrders = [];
let filteredOrders = [];
let selectedOrderId = null;

const params = new URLSearchParams(window.location.search);
const companyId = params.get("companyId");

/* =========================
   NAVIGATION / AUTH
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
    renderEmptyOrders("No company selected.");
    return;
  }

  try {
    orderCountInfo.innerText = "Loading orders...";

    allOrders = await OrderApi.getOrdersByCompany(companyId);
    filteredOrders = [...allOrders];

    populateYearFilter();

    if (!filteredOrders.length) {
      renderEmptyOrders("No orders found.");
      return;
    }

    selectedOrderId = filteredOrders[0].id;

    renderOrdersTable();
    renderSelectedOrderDetail();
    updateOrderCountInfo();
  } catch (error) {
    ordersTableBody.innerHTML = DomHelper.tableEmpty(error.message, 7);
    orderCountInfo.innerText = "Orders could not be loaded.";
    detailPanelInfo.innerText = "Select an order to view details.";
    orderDetailPanel.innerHTML = DomHelper.emptyMessage(error.message);
  }
}

/* =========================
   DATE FILTERS
========================= */
function populateYearFilter() {
  const years = [
    ...new Set(
      allOrders
        .map((order) => getYear(order.created_at))
        .filter(Boolean)
    )
  ].sort((a, b) => b - a);

  yearFilter.innerHTML = `
    <option value="">All Years</option>
    ${years
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("")}
  `;
}

applyDateFiltersBtn.addEventListener("click", applyDateFilters);
yearFilter.addEventListener("change", applyDateFilters);
monthFilter.addEventListener("change", applyDateFilters);

clearDateFiltersBtn.addEventListener("click", () => {
  yearFilter.value = "";
  monthFilter.value = "";

  filteredOrders = [...allOrders];
  selectedOrderId = filteredOrders[0]?.id || null;

  if (!filteredOrders.length) {
    renderEmptyOrders("No orders found.");
    return;
  }

  renderOrdersTable();
  renderSelectedOrderDetail();
  updateOrderCountInfo();
});

function applyDateFilters() {
  const selectedYear = yearFilter.value;
  const selectedMonth = monthFilter.value;

  filteredOrders = allOrders.filter((order) => {
    const orderYear = getYear(order.created_at);
    const orderMonth = getMonth(order.created_at);

    const matchesYear =
      !selectedYear || String(orderYear) === String(selectedYear);

    const matchesMonth =
      !selectedMonth || String(orderMonth) === String(selectedMonth);

    return matchesYear && matchesMonth;
  });

  selectedOrderId = filteredOrders[0]?.id || null;

  if (!filteredOrders.length) {
    renderEmptyOrders("No orders found for selected date filter.");
    return;
  }

  renderOrdersTable();
  renderSelectedOrderDetail();
  updateOrderCountInfo();
}

function getYear(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return date.getFullYear();
}

function getMonth(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return date.getMonth() + 1;
}

/* =========================
   RENDER
========================= */
function renderOrdersTable() {
  ordersTableBody.innerHTML = OrderTable.renderManagerOrderRows(
    filteredOrders,
    selectedOrderId
  );
}

function renderSelectedOrderDetail() {
  const selectedOrder = filteredOrders.find(
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

function renderEmptyOrders(message) {
  ordersTableBody.innerHTML = DomHelper.tableEmpty(message, 7);
  orderCountInfo.innerText = "0 orders found.";
  detailPanelInfo.innerText = "Select an order to view details.";
  orderDetailPanel.innerHTML = DomHelper.emptyMessage("No order selected.");
}

function updateOrderCountInfo() {
  const total = allOrders.length;
  const filtered = filteredOrders.length;

  if (filtered === total) {
    orderCountInfo.innerText = `${total} orders found.`;
  } else {
    orderCountInfo.innerText = `${filtered} of ${total} orders shown.`;
  }
}

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
   PAGE LOAD
========================= */
loadOrders();