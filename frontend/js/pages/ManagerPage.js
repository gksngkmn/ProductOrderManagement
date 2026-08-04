import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import CompanyApi from "../api/CompanyApi.js";
import ProductApi from "../api/ProductApi.js";

import ProductTable from "../components/ProductTable.js";
import CustomerInfo from "../components/CustomerInfo.js";

import DomHelper from "../helpers/DomHelper.js";
import PaginationHelper from "../helpers/PaginationHelper.js";
import ExportHelper from "../helpers/ExportHelper.js";

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

const typeSort = document.getElementById("typeSort");

const exportProductsBtn = document.getElementById("exportProductsBtn");
const importProductsBtn = document.getElementById("importProductsBtn");
const importProductsInput = document.getElementById("importProductsInput");
const importProductsResult = document.getElementById("importProductsResult");
const importProductsSummary = document.getElementById("importProductsSummary");
const downloadImportReportBtn = document.getElementById("downloadImportReportBtn");

const sendProductUpdatesBtn = document.getElementById("sendProductUpdatesBtn");
const sendProductUpdatesModal = document.getElementById("sendProductUpdatesModal");
const closeSendProductUpdatesModalBtn = document.getElementById("closeSendProductUpdatesModalBtn");
const cancelSendProductUpdatesBtn = document.getElementById("cancelSendProductUpdatesBtn");
const sendProductUpdatesForm = document.getElementById("sendProductUpdatesForm");
const productUpdatePeriod = document.getElementById("productUpdatePeriod");
const customProductUpdateDateFields = document.getElementById("customProductUpdateDateFields");
const productUpdateStartDate = document.getElementById("productUpdateStartDate");
const productUpdateEndDate = document.getElementById("productUpdateEndDate");
const sendProductUpdatesMessage = document.getElementById("sendProductUpdatesMessage");
const confirmSendProductUpdatesBtn = document.getElementById("confirmSendProductUpdatesBtn");

const productSearchInput = document.getElementById("productSearchInput");
const materialFilter = document.getElementById("materialFilter");
const typeFilter = document.getElementById("typeFilter");
const clearProductFiltersBtn = document.getElementById("clearProductFiltersBtn");

const productForm = document.getElementById("productForm");

const materialInput = document.getElementById("material");
const typeInput = document.getElementById("type");
const modelInput = document.getElementById("model");
const angleInput = document.getElementById("angle");
const nodalLengthInput = document.getElementById("nodalLength");
const widthInput = document.getElementById("width");
const numberOfTeethInput = document.getElementById("numberOfTeeth");
const unitPriceInput = document.getElementById("unitPrice");
const currencyInput = document.getElementById("currency");

const editProductModal = document.getElementById("editProductModal");
const closeEditProductModalBtn = document.getElementById("closeEditProductModalBtn");
const cancelEditProductBtn = document.getElementById("cancelEditProductBtn");
const editProductForm = document.getElementById("editProductForm");
const editProductMessage = document.getElementById("editProductMessage");

const editProductId = document.getElementById("editProductId");
const editMaterial = document.getElementById("editMaterial");
const editType = document.getElementById("editType");
const editModel = document.getElementById("editModel");
const editAngle = document.getElementById("editAngle");
const editNodalLength = document.getElementById("editNodalLength");
const editWidth = document.getElementById("editWidth");
const editNumberOfTeeth = document.getElementById("editNumberOfTeeth");
const editUnitPrice = document.getElementById("editUnitPrice");
const editCurrency = document.getElementById("editCurrency");
/* =========================
   STATE
========================= */
let allProducts = [];
let filteredProducts = [];
let allCustomers = [];
let lastImportReport = null;

let currentPage = 1;
const PRODUCTS_PER_PAGE = 25;

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(new Error("Excel file could not be read.")));
    reader.readAsDataURL(file);
  });
}

function safeCsvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadImportReport(report) {
  const headers = [
    "Row", "Status", "Message", "Material", "Type", "Model", "Angle",
    "Nodal Length", "Width", "Number of Teeth", "Unit Price", "Currency"
  ];
  const rows = report.results.map((item) => [
    item.rowNumber, item.status, item.message, item.product.material,
    item.product.type, item.product.model, item.product.angle,
    item.product.nodalLength, item.product.width, item.product.numberOfTeeth,
    item.product.unitPrice, item.product.currency
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `product-import-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

importProductsBtn.addEventListener("click", () => importProductsInput.click());
downloadImportReportBtn.addEventListener("click", () => {
  if (lastImportReport) downloadImportReport(lastImportReport);
});

importProductsInput.addEventListener("change", async () => {
  const file = importProductsInput.files?.[0];
  importProductsInput.value = "";
  if (!file) return;
  if (!/\.xlsx$/i.test(file.name)) {
    alert("Only .xlsx files can be imported.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("Excel file must be smaller than 10 MB.");
    return;
  }
  if (!confirm(`Import products from ${file.name}?`)) return;

  importProductsBtn.disabled = true;
  importProductsBtn.innerText = "Importing...";
  importProductsResult.classList.remove("hidden", "error");
  importProductsSummary.innerText = "Reading and validating Excel rows...";
  downloadImportReportBtn.classList.add("hidden");

  try {
    const dataBase64 = await readFileAsBase64(file);
    lastImportReport = await ProductApi.importProducts(file.name, dataBase64);
    importProductsSummary.innerText =
      `${lastImportReport.totalRows} rows processed: ` +
      `${lastImportReport.importedCount} imported, ${lastImportReport.failedCount} failed.`;
    if (lastImportReport.failedCount) importProductsResult.classList.add("error");
    downloadImportReportBtn.classList.remove("hidden");
    await loadProducts();
  } catch (error) {
    lastImportReport = null;
    importProductsResult.classList.add("error");
    importProductsSummary.innerText = error.message;
  } finally {
    importProductsBtn.disabled = false;
    importProductsBtn.innerText = "Import Excel";
  }
});

/* =========================
   INIT
========================= */
const user = AuthManager.getUser();
managerInfo.innerText = CustomerInfo.renderManagerInfo(user);

logoutBtn.addEventListener("click", () => {
  AuthManager.logout();
});

editManagerBtn.addEventListener("click", () => {
  window.location.href = "/editManager.html";
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

    populateProductFilterOptions();

    renderCurrentPage();
    await loadStats();
  } catch (error) {
    productsTableBody.innerHTML = DomHelper.tableEmpty(error.message, 9);
    paginationContainer.innerHTML = "";
    productCountInfo.innerText = "Products could not be loaded.";
  }
}
/* =========================
   PRODUCT FILTER OPTIONS
========================= */
function populateProductFilterOptions() {
  populateSelectOptions(materialFilter, allProducts, "material");
  populateSelectOptions(typeFilter, allProducts, "type");
}

function getUniqueProductValues(products, fieldName) {
  return [
    ...new Set(
      products
        .map((product) => product[fieldName])
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function populateSelectOptions(selectElement, products, fieldName) {
  if (!selectElement) return;

  const previousValue = selectElement.value;
  const values = getUniqueProductValues(products, fieldName);
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All";

  const valueOptions = values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    return option;
  });

  selectElement.replaceChildren(allOption, ...valueOptions);
  selectElement.value = values.includes(previousValue) ? previousValue : "";
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
clearProductFiltersBtn.addEventListener("click", () => {
  productSearchInput.value = "";
  materialFilter.value = "";
  typeFilter.value = "";
  typeSort.value = "";

  filteredProducts = [...allProducts];
  currentPage = 1;

  renderCurrentPage();
});

[productSearchInput, materialFilter, typeFilter, typeSort].forEach((input) => {
  input.addEventListener("input", applyProductFilters);
  input.addEventListener("keyup", applyProductFilters);
  input.addEventListener("change", applyProductFilters);
});

function applyProductFilters() {
  const search = productSearchInput.value.toLowerCase().trim();
  const material = materialFilter.value.toLowerCase().trim();
  const type = typeFilter.value.toLowerCase().trim();
  const sort = typeSort.value;
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
    const matchesMaterial =
      !material ||
      productMaterial === material;

    const matchesType =
      !type ||
      productType === type;

    return matchesSearch && matchesMaterial && matchesType;
  });

  applyTypeSort();

  currentPage = 1;
  renderCurrentPage();
}

function applyTypeSort() {
  const sortValue = typeSort.value;

  if (!sortValue) return;

  filteredProducts.sort((a, b) => {
    const typeA = String(a.type || "").toLowerCase();
    const typeB = String(b.type || "").toLowerCase();

    if (sortValue === "type-asc") {
      return typeA.localeCompare(typeB);
    }

    if (sortValue === "type-desc") {
      return typeB.localeCompare(typeA);
    }

    return 0;
  });
}

/* =========================
   CREATE PRODUCT
========================= */
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = getProductFormData();

  try {
    await ProductApi.createProduct(productData);
    alert("Product added successfully.");

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

    openEditProductModal(product);
    return;
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
    unitPrice: Number(unitPriceInput.value),
    currency: currencyInput.value
  };
}

function resetProductForm() {
  productForm.reset();
}


function openEditProductModal(product) {
  editProductId.value = product.id;
  editMaterial.value = product.material ?? "";
  editType.value = product.type ?? "";
  editModel.value = product.model ?? "";
  editAngle.value = product.angle ?? "";
  editNodalLength.value = product.nodalLength ?? "";
  editWidth.value = product.width ?? "";
  editNumberOfTeeth.value = product.numberOfTeeth ?? "";
  editUnitPrice.value = product.unitPrice ?? "";
  editCurrency.value = product.currency || "USD";

  editProductMessage.innerText = "";
  editProductMessage.className = "edit-product-message";

  editProductModal.classList.remove("hidden");
}

function closeEditProductModal() {
  editProductModal.classList.add("hidden");
  editProductForm.reset();
  editProductId.value = "";
  editProductMessage.innerText = "";
  editProductMessage.className = "edit-product-message";
}

function openSendProductUpdatesModal() {
  sendProductUpdatesForm.reset();
  productUpdatePeriod.value = "7d";
  customProductUpdateDateFields.classList.add("hidden");
  sendProductUpdatesMessage.innerText = "";
  sendProductUpdatesMessage.className = "edit-product-message";
  confirmSendProductUpdatesBtn.disabled = false;

  sendProductUpdatesModal.classList.remove("hidden");
}

function closeSendProductUpdatesModal() {
  sendProductUpdatesModal.classList.add("hidden");
  sendProductUpdatesForm.reset();
  customProductUpdateDateFields.classList.add("hidden");
  sendProductUpdatesMessage.innerText = "";
  sendProductUpdatesMessage.className = "edit-product-message";
  confirmSendProductUpdatesBtn.disabled = false;
}

function showSendProductUpdatesMessage(message, type = "success") {
  sendProductUpdatesMessage.innerText = message;
  sendProductUpdatesMessage.className = `edit-product-message ${type}`;
}

function getProductUpdatesPayload() {
  const selectedPeriod = productUpdatePeriod.value;

  if (selectedPeriod === "custom") {
    const startDate = productUpdateStartDate.value;
    const endDate = productUpdateEndDate.value;

    if (!startDate || !endDate) {
      throw new Error("Please select both start date and end date.");
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error("Start date cannot be later than end date.");
    }

    return {
      startDate,
      endDate
    };
  }

  return {
    period: selectedPeriod
  };
}

function getEditProductFormData() {
  return {
    material: editMaterial.value.trim(),
    type: editType.value.trim(),
    model: editModel.value.trim(),
    angle: Number(editAngle.value),
    nodalLength: Number(editNodalLength.value),
    width: Number(editWidth.value),
    numberOfTeeth: Number(editNumberOfTeeth.value),
    unitPrice: Number(editUnitPrice.value),
    currency: editCurrency.value
  };
}

function showEditProductMessage(message, type = "success") {
  editProductMessage.innerText = message;
  editProductMessage.className = `edit-product-message ${type}`;
}

closeEditProductModalBtn.addEventListener("click", () => {
  closeEditProductModal();
});

cancelEditProductBtn.addEventListener("click", () => {
  closeEditProductModal();
});

editProductModal.addEventListener("click", (event) => {
  if (event.target === editProductModal) {
    closeEditProductModal();
  }
});

editProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = editProductId.value;

  if (!id) {
    showEditProductMessage("Product ID is missing.", "error");
    return;
  }

  const productData = getEditProductFormData();

  try {
    showEditProductMessage("Updating product...", "success");

    await ProductApi.updateProduct(id, productData);

    showEditProductMessage("Product updated successfully.", "success");

    await loadProducts();

    setTimeout(() => {
      closeEditProductModal();
    }, 500);
  } catch (error) {
    showEditProductMessage(error.message, "error");
  }
});


/* =========================
   SEND PRODUCT UPDATES
========================= */
sendProductUpdatesBtn.addEventListener("click", () => {
  openSendProductUpdatesModal();
});

closeSendProductUpdatesModalBtn.addEventListener("click", () => {
  closeSendProductUpdatesModal();
});

cancelSendProductUpdatesBtn.addEventListener("click", () => {
  closeSendProductUpdatesModal();
});

sendProductUpdatesModal.addEventListener("click", (event) => {
  if (event.target === sendProductUpdatesModal) {
    closeSendProductUpdatesModal();
  }
});

productUpdatePeriod.addEventListener("change", () => {
  if (productUpdatePeriod.value === "custom") {
    customProductUpdateDateFields.classList.remove("hidden");
  } else {
    customProductUpdateDateFields.classList.add("hidden");
    productUpdateStartDate.value = "";
    productUpdateEndDate.value = "";
  }
});

sendProductUpdatesForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = getProductUpdatesPayload();

    confirmSendProductUpdatesBtn.disabled = true;
    showSendProductUpdatesMessage("Sending product updates...", "success");

    const result = await ProductApi.sendProductUpdates(payload);

    showSendProductUpdatesMessage(
      `${result.message} Sent: ${result.sentCount}, Failed: ${result.failedCount}, Products: ${result.productCount}`,
      "success"
    );
  } catch (error) {
    showSendProductUpdatesMessage(error.message, "error");
  } finally {
    confirmSendProductUpdatesBtn.disabled = false;
  }
});


/* =========================
   EXPORT PRODUCTS
========================= */
exportProductsBtn.addEventListener("click", () => {
  ExportHelper.exportToExcel(
    `products-${ExportHelper.getTodayFileDate()}`,
    "Products",
    [
      { label: "Material", key: "material" },
      { label: "Type", key: "type" },
      { label: "Model", key: "model" },
      { label: "Angle", key: "angle" },
      {
        label: "Nodal Length (mm)",
        key: (product) => product.nodalLength ?? product.nodal_length ?? ""
      },
      { label: "Width (mm)", key: "width" },
      {
        label: "Number of Teeth",
        key: (product) => product.numberOfTeeth ?? product.number_of_teeth ?? ""
      },
      {
        label: "Unit Price",
        key: (product) => product.unitPrice ?? product.unit_price ?? ""
      }
    ],
    filteredProducts
  );
});

/* =========================
   PAGE LOAD
========================= */
loadProducts();
