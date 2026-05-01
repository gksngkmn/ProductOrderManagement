import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import ProductApi from "../api/ProductApi.js";
import OrderApi from "../api/OrderApi.js";

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
customerInfo.innerText = `${user.company || user.username} • ${user.role}`;

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
    currentOrderItems.innerHTML = `<div class="empty-message">No current order items.</div>`;
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
      currentOrderItems.innerHTML = `<div class="empty-message">No current order items.</div>`;
      completeOrderBtn.disabled = true;
      return;
    }

    currentOrder = activeOrder;
    currentOrderInfo.innerText =
      `Current Order: ${activeOrder.order_code} • ${activeOrder.status}`;
    completeOrderBtn.disabled = false;

    if (!activeOrder.items || activeOrder.items.length === 0) {
      currentOrderItems.innerHTML = `<div class="empty-message">No items in current order.</div>`;
      return;
    }

    const total = activeOrder.items.reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0
    );

    currentOrderItems.innerHTML = `
      <h3>Order Items</h3>

      ${activeOrder.items
        .map(
          (item) => `
          <div class="order-item-row">
            <p><strong>${escapeHtml(item.model)}</strong></p>
            <p>Material: ${escapeHtml(item.material)}</p>
            <p>Qty: ${item.quantity}</p>
            <p>Total: ${item.total_price}</p>
          </div>
        `
        )
        .join("")}

      <div class="order-total-box">
        Total Price: ${total}
      </div>
    `;
  } catch (error) {
    currentOrderItems.innerHTML = `<div class="empty-message">${error.message}</div>`;
  }
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
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="table-empty">${error.message}</td>
      </tr>
    `;

    paginationContainer.innerHTML = "";
    productCountInfo.innerText = "Products could not be loaded.";
  }
}

/* =========================
   PRODUCT RENDER
========================= */
function renderCurrentPage() {
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const productsForPage = filteredProducts.slice(startIndex, endIndex);

  renderProducts(productsForPage);
  renderPagination(totalPages);

  const visibleStart = totalProducts === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(endIndex, totalProducts);

  productCountInfo.innerText =
    `Showing ${visibleStart}-${visibleEnd} of ${totalProducts} products`;
}

function renderProducts(products) {
  if (!products.length) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="table-empty">No products found.</td>
      </tr>
    `;
    return;
  }

  productsTableBody.innerHTML = products
    .map(
      (product) => `
      <tr title="${escapeHtml(product.material)} | ${escapeHtml(product.type)} | ${escapeHtml(product.model)}">
        <td>${escapeHtml(product.material)}</td>
        <td>${escapeHtml(product.type)}</td>
        <td>${escapeHtml(product.model)}</td>
        <td>${product.angle ?? ""}</td>
        <td>${product.nodalLength ?? ""}</td>
        <td>${product.width ?? ""}</td>
        <td>${product.numberOfTeeth ?? ""}</td>
        <td>${product.unitPrice ?? ""}</td>
        <td>
          <input 
            class="quantity-input" 
            type="number" 
            min="1" 
            value="1" 
            id="quantity-${product.id}"
          />
        </td>
        <td class="action-cell">
          <button class="addItemBtn" data-product-id="${product.id}" type="button">
            Add
          </button>
        </td>
      </tr>
    `
    )
    .join("");
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

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;

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
productsTableBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("addItemBtn")) return;

  if (!currentOrder) {
    alert("Please create or load current order first.");
    return;
  }

  const productId = e.target.dataset.productId;
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
   SECURITY HELPER
========================= */
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
loadMyOrders();
loadProducts();