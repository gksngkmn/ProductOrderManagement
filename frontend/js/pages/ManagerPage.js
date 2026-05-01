import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";
import CompanyApi from "../api/CompanyApi.js";
import ProductApi from "../api/ProductApi.js";

PageGuard.requireRole("manager");

/* =========================
   ELEMENTS
========================= */
const managerInfo = document.getElementById("managerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const editManagerBtn = document.getElementById("editManagerBtn");
const customerListPageBtn = document.getElementById("customerListPageBtn");

const statsContainer = document.getElementById("statsContainer");

const productsTableBody = document.getElementById("productsTableBody");
const paginationContainer = document.getElementById("paginationContainer");
const productCountInfo = document.getElementById("productCountInfo");

const productSearchInput = document.getElementById("productSearchInput");
const materialFilter = document.getElementById("materialFilter");
const typeFilter = document.getElementById("typeFilter");
const applyProductFiltersBtn = document.getElementById("applyProductFiltersBtn");
const clearProductFiltersBtn = document.getElementById("clearProductFiltersBtn");

const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");

const materialInput = document.getElementById("material");
const typeInput = document.getElementById("type");
const modelInput = document.getElementById("model");
const angleInput = document.getElementById("angle");
const nodalLengthInput = document.getElementById("nodalLength");
const widthInput = document.getElementById("width");
const numberOfTeethInput = document.getElementById("numberOfTeeth");
const unitPriceInput = document.getElementById("unitPrice");

const cancelEditBtn = document.getElementById("cancelEditBtn");

/* =========================
   STATE
========================= */
let allProducts = [];
let filteredProducts = [];
let allCustomers = [];

let currentPage = 1;
const PRODUCTS_PER_PAGE = 25;

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();

managerInfo.innerText = `${user.username} • ${user.role}`;

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

editManagerBtn.addEventListener("click", () => {
  alert("Manager edit feature will be added later.");
});

customerListPageBtn.addEventListener("click", () => {
  window.location.href = "/customerList.html";
});

/* =========================
   DASHBOARD
========================= */
async function loadStats() {
  try {
    if (!allCustomers.length) {
      allCustomers = await CompanyApi.getCompanies();
    }

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${allCustomers.length}</div>
        <div class="stat-label">Customers</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${allProducts.length}</div>
        <div class="stat-label">Products</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">—</div>
        <div class="stat-label">Orders</div>
      </div>
    `;
  } catch (error) {
    statsContainer.innerHTML = `
      <div class="empty-message">${error.message}</div>
    `;
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
    await loadStats();
  } catch (error) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty">${error.message}</td>
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

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  if (currentPage < 1) {
    currentPage = 1;
  }

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
        <td colspan="9" class="table-empty">No products found.</td>
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
        <td class="actions-cell">
          <button class="editProductBtn secondary" data-id="${product.id}" type="button">
            Edit
          </button>
          <button class="deleteProductBtn danger" data-id="${product.id}" type="button">
            Delete
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
   CREATE / UPDATE PRODUCT
========================= */
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const productData = {
    material: materialInput.value.trim(),
    type: typeInput.value.trim(),
    model: modelInput.value.trim(),
    angle: Number(angleInput.value),
    nodalLength: Number(nodalLengthInput.value),
    width: Number(widthInput.value),
    numberOfTeeth: Number(numberOfTeethInput.value),
    unitPrice: Number(unitPriceInput.value)
  };

  try {
    if (productIdInput.value) {
      await ProductApi.updateProduct(productIdInput.value, productData);
      alert("Product updated successfully.");
    } else {
      await ProductApi.createProduct(productData);
      alert("Product added successfully.");
    }

    resetProductForm();
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
});

/* =========================
   EDIT / DELETE PRODUCT
========================= */
productsTableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("editProductBtn")) {
    const product = allProducts.find((item) => String(item.id) === String(id));

    if (!product) {
      alert("Product not found.");
      return;
    }

    fillProductForm(product);
  }

  if (e.target.classList.contains("deleteProductBtn")) {
    const confirmed = confirm("Are you sure you want to delete this product?");

    if (!confirmed) return;

    try {
      await ProductApi.deleteProduct(id);
      alert("Product deleted successfully.");
      await loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }
});

/* =========================
   FORM HELPERS
========================= */
function fillProductForm(product) {
  productIdInput.value = product.id;
  materialInput.value = product.material ?? "";
  typeInput.value = product.type ?? "";
  modelInput.value = product.model ?? "";
  angleInput.value = product.angle ?? "";
  nodalLengthInput.value = product.nodalLength ?? "";
  widthInput.value = product.width ?? "";
  numberOfTeethInput.value = product.numberOfTeeth ?? "";
  unitPriceInput.value = product.unitPrice ?? "";

  cancelEditBtn.style.display = "inline";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", () => {
  resetProductForm();
});

function resetProductForm() {
  productForm.reset();
  productIdInput.value = "";
  cancelEditBtn.style.display = "none";
}

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
loadProducts();