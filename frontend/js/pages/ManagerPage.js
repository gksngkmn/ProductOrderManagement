import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import CompanyApi from "../api/CompanyApi.js";
import ProductApi from "../api/ProductApi.js";

import ProductTable from "../components/ProductTable.js";
import CustomerInfo from "../components/CustomerInfo.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";

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
managerInfo.innerText = CustomerInfo.renderManagerInfo(user);

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
    statsContainer.innerHTML = DomHelper.emptyMessage(error.message);
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
    productsTableBody.innerHTML = DomHelper.tableEmpty(error.message, 9);
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

  productsTableBody.innerHTML = ProductTable.renderManagerRows(pageData.pageItems);
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
   CREATE / UPDATE PRODUCT
========================= */
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = getProductFormData();

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
productsTableBody.addEventListener("click", async (event) => {
  const id = event.target.dataset.id;

  if (event.target.classList.contains("editProductBtn")) {
    const product = allProducts.find((item) => String(item.id) === String(id));

    if (!product) {
      alert("Product not found.");
      return;
    }

    fillProductForm(product);
  }

  if (event.target.classList.contains("deleteProductBtn")) {
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
function getProductFormData() {
  return {
    material: materialInput.value.trim(),
    type: typeInput.value.trim(),
    model: modelInput.value.trim(),
    angle: Number(angleInput.value),
    nodalLength: Number(nodalLengthInput.value),
    width: Number(widthInput.value),
    numberOfTeeth: Number(numberOfTeethInput.value),
    unitPrice: Number(unitPriceInput.value)
  };
}

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
   PAGE LOAD
========================= */
loadProducts();