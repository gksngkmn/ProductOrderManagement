import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import ProductApi from "../api/ProductApi.js";
import OrderApi from "../api/OrderApi.js";

import ProductTable from "../components/ProductTable.js";
import CustomerInfo from "../components/CustomerInfo.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";
import FormatHelper from "../helpers/FormatHelper.js";

PageGuard.requireRole("customer");

/* =========================
   ELEMENTS
========================= */
const customerInfo = document.getElementById("customerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const myOrdersBtn = document.getElementById("myOrdersBtn");

const createOrderBtn = document.getElementById("createOrderBtn");
const currentOrderInfo = document.getElementById("currentOrderInfo");
const currentOrderItems = document.getElementById("currentOrderItems");
const completeOrderBtn = document.getElementById("completeOrderBtn");

const productsTableBody = document.getElementById("productsTableBody");
const paginationContainer = document.getElementById("paginationContainer");
const productCountInfo = document.getElementById("productCountInfo");

const productSearchInput = document.getElementById("productSearchInput");
const materialFilter = document.getElementById("materialFilter");
const typeFilter = document.getElementById("typeFilter");
const applyProductFiltersBtn = document.getElementById("applyProductFiltersBtn");
const clearProductFiltersBtn = document.getElementById("clearProductFiltersBtn");

/* =========================
   STATE
========================= */
let currentOrder = null;

let allProducts = [];
let filteredProducts = [];

let currentPage = 1;
const PRODUCTS_PER_PAGE = 25;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
customerInfo.innerText = CustomerInfo.renderCustomerInfo(user);

/* =========================
   AUTH / NAVIGATION
========================= */
logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

myOrdersBtn.addEventListener("click", () => {
  window.location.href = "/customerOrders.html";
});

/* =========================
   ORDER ACTIONS
========================= */
createOrderBtn.addEventListener("click", async () => {
  try {
    currentOrder = await OrderApi.createOrder();

    currentOrderInfo.innerText =
      `Current Order: ${currentOrder.order_code} • ${currentOrder.status}`;

    completeOrderBtn.disabled = false;

    await loadMyOrders();
  } catch (error) {
    currentOrderInfo.innerText = error.message;
  }
});

completeOrderBtn.addEventListener("click", async () => {
  if (!currentOrder) {
    alert("No active order.");
    return;
  }

  const confirmed = confirm("Complete this order?");

  if (!confirmed) return;

  try {
    const completedOrder = await OrderApi.completeOrder(currentOrder.id);

    alert(`Order completed: ${completedOrder.order_code}`);

    currentOrder = null;
    currentOrderInfo.innerText = "No active order loaded.";
    currentOrderItems.innerHTML = DomHelper.emptyMessage("No current order items.");
    completeOrderBtn.disabled = true;
  } catch (error) {
    alert(error.message);
  }
});

/* =========================
   LOAD CURRENT ORDER
========================= */
async function loadMyOrders() {
  try {
    const orders = await OrderApi.getMyOrders();
    const activeOrder = orders.find((order) => order.status === "Current");

    if (!activeOrder) {
      currentOrder = null;
      currentOrderInfo.innerText = "No active order loaded.";
      currentOrderItems.innerHTML = DomHelper.emptyMessage("No current order items.");
      completeOrderBtn.disabled = true;
      return;
    }

    currentOrder = activeOrder;
    currentOrderInfo.innerText =
      `Current Order: ${activeOrder.order_code} • ${activeOrder.status}`;
    completeOrderBtn.disabled = false;

    renderCurrentOrderItems(activeOrder);
  } catch (error) {
    currentOrderItems.innerHTML = DomHelper.emptyMessage(error.message);
  }
}

function renderCurrentOrderItems(order) {
  if (!order.items || order.items.length === 0) {
    currentOrderItems.innerHTML = DomHelper.emptyMessage("No items in current order.");
    return;
  }

  const total = order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  currentOrderItems.innerHTML = `
    <h3>Order Items</h3>

    ${order.items
      .map(
        (item) => `
        <div class="order-item-row">
          <p><strong>${DomHelper.escapeHtml(item.model)}</strong></p>
          <p>Material: ${DomHelper.escapeHtml(item.material)}</p>
          <p>Qty: ${FormatHelper.dash(item.quantity)}</p>
          <p>Total: ${FormatHelper.money(item.total_price)}</p>
        </div>
      `
      )
      .join("")}

    <div class="order-total-box">
      Total Price: ${FormatHelper.money(total)}
    </div>
  `;
}

/* =========================
   PRODUCTS LOAD
========================= */
async function loadProducts() {
  try {
    productCountInfo.innerText = "Loading products...";

    allProducts = await ProductApi.getProducts();
    filteredProducts = [...allProducts];
    currentPage = 1;

    renderCurrentPage();
  } catch (error) {
    productsTableBody.innerHTML = DomHelper.tableEmpty(error.message, 10);
    paginationContainer.innerHTML = "";
    productCountInfo.innerText = "Products could not be loaded.";
  }
}

/* =========================
   PRODUCT RENDER
========================= */
function renderCurrentPage() {
  const pageData = PaginationHelper.getPageData(
    filteredProducts,
    currentPage,
    PRODUCTS_PER_PAGE
  );

  currentPage = pageData.currentPage;

  productsTableBody.innerHTML = ProductTable.renderCustomerRows(pageData.pageItems);
  paginationContainer.innerHTML = PaginationHelper.render(
    pageData.currentPage,
    pageData.totalPages
  );

  productCountInfo.innerText =
    `Showing ${pageData.visibleStart}-${pageData.visibleEnd} of ${pageData.totalItems} products`;
}

/* =========================
   PAGINATION EVENTS
========================= */
paginationContainer.addEventListener("click", (event) => {
  const page = PaginationHelper.getClickedPage(event);

  if (!page) return;

  const totalPages = PaginationHelper.getTotalPages(
    filteredProducts.length,
    PRODUCTS_PER_PAGE
  );

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderCurrentPage();
});

/* =========================
   FILTERS
========================= */
applyProductFiltersBtn.addEventListener("click", applyProductFilters);

clearProductFiltersBtn.addEventListener("click", () => {
  productSearchInput.value = "";
  materialFilter.value = "";
  typeFilter.value = "";

  filteredProducts = [...allProducts];
  currentPage = 1;
  renderCurrentPage();
});

[productSearchInput, materialFilter, typeFilter].forEach((input) => {
  input.addEventListener("input", applyProductFilters);
  input.addEventListener("keyup", applyProductFilters);
  input.addEventListener("change", applyProductFilters);
});

function applyProductFilters() {
  const search = productSearchInput.value.toLowerCase().trim();
  const material = materialFilter.value.toLowerCase().trim();
  const type = typeFilter.value.toLowerCase().trim();

  filteredProducts = allProducts.filter((product) => {
    const productMaterial = String(product.material || "").toLowerCase();
    const productType = String(product.type || "").toLowerCase();
    const productModel = String(product.model || "").toLowerCase();

    const combined = `
      ${productMaterial}
      ${productType}
      ${productModel}
      ${product.angle ?? ""}
      ${product.nodalLength ?? ""}
      ${product.width ?? ""}
      ${product.numberOfTeeth ?? ""}
      ${product.unitPrice ?? ""}
    `.toLowerCase();

    const matchesSearch = !search || combined.includes(search);
    const matchesMaterial = !material || productMaterial.includes(material);
    const matchesType = !type || productType.includes(type);

    return matchesSearch && matchesMaterial && matchesType;
  });

  currentPage = 1;
  renderCurrentPage();
}

/* =========================
   ADD ITEM
========================= */
productsTableBody.addEventListener("click", async (event) => {
  if (!event.target.classList.contains("addItemBtn")) return;

  if (!currentOrder) {
    alert("Please create or load current order first.");
    return;
  }

  const productId = event.target.dataset.productId;
  const quantityInput = document.getElementById(`quantity-${productId}`);
  const quantity = Number(quantityInput.value);

  if (!quantity || quantity <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  try {
    await OrderApi.addItemToOrder(currentOrder.id, productId, quantity);
    alert("Product added to order.");
    await loadMyOrders();
  } catch (error) {
    alert(error.message);
  }
});

/* =========================
   PAGE LOAD
========================= */
loadMyOrders();
loadProducts();