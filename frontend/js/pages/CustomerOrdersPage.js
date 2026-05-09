import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import OrderApi from "../api/OrderApi.js";

import OrderTable from "../components/OrderTable.js";
import CustomerInfo from "../components/CustomerInfo.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";
import ExportHelper from "../helpers/ExportHelper.js";

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

const exportCustomerOrdersBtn = document.getElementById("exportCustomerOrdersBtn");
const exportCustomerOrderDetailsBtn = document.getElementById("exportCustomerOrderDetailsBtn");

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

    const orders = await OrderApi.getMyOrders();

    allOrders = orders.filter((order) => order.status === "Completed");
    filteredOrders = [...allOrders];
    currentPage = 1;

    renderStats();
    renderCurrentPage();
  } catch (error) {
    ordersTableBody.innerHTML = DomHelper.tableEmpty(error.message, 6);
    orderStatsContainer.innerHTML = DomHelper.emptyMessage(error.message);
    orderCountInfo.innerText = "Orders could not be loaded.";
    orderDetailPanel.innerHTML = DomHelper.emptyMessage(error.message);
  }
}

/* =========================
   STATS
========================= */
function renderStats() {
  const completed = allOrders.filter((order) => order.status === "Submitted").length;
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
      <div class="stat-label">Submitted</div>
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
    `${selectedOrder.order_code} • ${
      OrderTable.getDisplayStatus(selectedOrder.status)
  }`;

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
   EXPORT ORDERS
========================= */
exportCustomerOrdersBtn.addEventListener("click", () => {
  ExportHelper.exportToExcel(
    `my-orders-${ExportHelper.getTodayFileDate()}`,
    "My Orders",
    [
      { label: "ID", key: "id" },
      { label: "Order Code", key: "order_code" },
      { label: "Status", key: "status" },
      {
        label: "Submission Date",
        key: (order) => formatExportDate(order.submission_date)
      },
      {
        label: "Items",
        key: (order) => Array.isArray(order.items) ? order.items.length : 0
      },
      {
        label: "Total",
        key: (order) => calculateOrderTotal(order)
      }
    ],
    filteredOrders
  );
});

/* =========================
   EXPORT ORDER DETAILS
========================= */
exportCustomerOrderDetailsBtn.addEventListener("click", () => {
  const selectedOrder = currentPageOrders.find(
    (order) => String(order.id) === String(selectedOrderId)
  );

  if (!selectedOrder) {
    alert("Please select an order first.");
    return;
  }

  const items = selectedOrder.items || [];

  ExportHelper.exportToExcel(
    `my-order-details-${selectedOrder.order_code || selectedOrder.id}-${ExportHelper.getTodayFileDate()}`,
    "Order Details",
    [
      { label: "Order Code", key: () => selectedOrder.order_code || "" },
      { label: "Material", key: "material" },
      { label: "Type", key: "type" },
      { label: "Model", key: "model" },
      { label: "Angle", key: "angle" },
      {
        label: "Nodal Length (mm)",
        key: (item) => item.nodalLength ?? item.nodal_length ?? ""
      },
      { label: "Width (mm)", key: "width" },
      {
        label: "Number of Teeth",
        key: (item) => item.numberOfTeeth ?? item.number_of_teeth ?? ""
      },
      {
        label: "Quantity",
        key: (item) => item.quantity ?? item.qty ?? ""
      },
      {
        label: "Unit Price",
        key: (item) => item.unitPrice ?? item.unit_price ?? ""
      },
      {
        label: "Total Price",
        key: (item) => calculateItemTotal(item)
      }
    ],
    items
  );
});


function formatExportDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString();
}

function calculateOrderTotal(order) {
  const items = order.items || [];

  return items.reduce((total, item) => {
    return total + Number(calculateItemTotal(item) || 0);
  }, 0);
}

function calculateItemTotal(item) {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);

  return quantity * unitPrice;
}

/* =========================
   PAGE LOAD
========================= */
loadOrders();