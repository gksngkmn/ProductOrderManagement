import PageGuard from "../core/PageGuard.js";
import AuthManager from "../core/AuthManager.js";

import ProductApi from "../api/ProductApi.js";
import OrderApi from "../api/OrderApi.js";

import CustomerInfo from "../components/CustomerInfo.js";
import DomHelper from "../helpers/DomHelper.js";
import FormatHelper from "../helpers/FormatHelper.js";

PageGuard.requireRole("customer");

/* =========================
   ELEMENTS
========================= */
const customerInfo = document.getElementById("customerInfo");
const logoutBtn = document.getElementById("logoutBtn");
const myOrdersBtn = document.getElementById("myOrdersBtn");
const editCustomerBtn = document.getElementById("editCustomerBtn");

const currentOrderInfo = document.getElementById("currentOrderInfo");
const currentOrderItems = document.getElementById("currentOrderItems");
const completeOrderBtn = document.getElementById("completeOrderBtn");

const addItemForm = document.getElementById("addItemForm");
const selectedProductIdInput = document.getElementById("selectedProductId");

const materialInput = document.getElementById("materialInput");
const typeInput = document.getElementById("typeInput");
const modelInput = document.getElementById("modelInput");
const angleInput = document.getElementById("angleInput");
const nodalLengthInput = document.getElementById("nodalLengthInput");
const widthInput = document.getElementById("widthInput");
const numberOfTeethInput = document.getElementById("numberOfTeethInput");
const quantityInput = document.getElementById("quantityInput");

const selectedProductInfo = document.getElementById("selectedProductInfo");
const clearItemFormBtn = document.getElementById("clearItemFormBtn");

const editOrderItemModal = document.getElementById("editOrderItemModal");
const closeEditOrderItemModalBtn = document.getElementById("closeEditOrderItemModalBtn");
const cancelEditOrderItemBtn = document.getElementById("cancelEditOrderItemBtn");
const editOrderItemForm = document.getElementById("editOrderItemForm");
const editOrderItemMessage = document.getElementById("editOrderItemMessage");

const editOrderItemId = document.getElementById("editOrderItemId");
const editOrderMaterial = document.getElementById("editOrderMaterial");
const editOrderType = document.getElementById("editOrderType");
const editOrderModel = document.getElementById("editOrderModel");
const editOrderAngle = document.getElementById("editOrderAngle");
const editOrderNodalLength = document.getElementById("editOrderNodalLength");
const editOrderWidth = document.getElementById("editOrderWidth");
const editOrderTeeth = document.getElementById("editOrderTeeth");
const editOrderUnitPrice = document.getElementById("editOrderUnitPrice");
const editOrderQuantityInput = document.getElementById("editOrderQuantityInput");
const editOrderTotalPrice = document.getElementById("editOrderTotalPrice");


const materialOptions = document.getElementById("materialOptions");
const typeOptions = document.getElementById("typeOptions");
const modelOptions = document.getElementById("modelOptions");
const angleOptions = document.getElementById("angleOptions");
const nodalLengthOptions = document.getElementById("nodalLengthOptions");
const widthOptions = document.getElementById("widthOptions");
const numberOfTeethOptions = document.getElementById("numberOfTeethOptions");

/* =========================
   STATE
========================= */
let currentOrder = null;
let allProducts = [];
let selectedOrderItem = null;

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

myOrdersBtn.addEventListener("click", () => {
  window.location.href = "/customerOrders.html";
});

editCustomerBtn.addEventListener("click", () => {
  window.location.href = "/editCustomer.html";
});

/* =========================
   LOAD PRODUCTS
========================= */
async function loadProducts() {
  try {
    allProducts = await ProductApi.getProducts();

    updateAvailableOptions();
    updateSelectedProductInfo(null, "No product selected yet.", "default");
  } catch (error) {
    updateSelectedProductInfo(null, error.message, "error");
  }
}

/* =========================
   PRODUCT OPTIONS
========================= */
function updateAvailableOptions(changedInput = null) {
  const selectedMaterial = normalize(materialInput.value);
  const selectedType = normalize(typeInput.value);
  const selectedModel = normalize(modelInput.value);
  const selectedAngle = normalizeNumber(angleInput.value);
  const selectedNodalLength = normalizeNumber(nodalLengthInput.value);
  const selectedWidth = normalizeNumber(widthInput.value);
  const selectedNumberOfTeeth = normalizeNumber(numberOfTeethInput.value);

  populateDatalistOptions(
    materialOptions,
    filterProductsByFields({
      type: selectedType,
      model: selectedModel,
      angle: selectedAngle,
      nodalLength: selectedNodalLength,
      width: selectedWidth,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "material"
  );

  populateDatalistOptions(
    typeOptions,
    filterProductsByFields({
      material: selectedMaterial,
      model: selectedModel,
      angle: selectedAngle,
      nodalLength: selectedNodalLength,
      width: selectedWidth,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "type"
  );

  populateDatalistOptions(
    modelOptions,
    filterProductsByFields({
      material: selectedMaterial,
      type: selectedType,
      angle: selectedAngle,
      nodalLength: selectedNodalLength,
      width: selectedWidth,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "model"
  );

  populateDatalistOptions(
    angleOptions,
    filterProductsByFields({
      material: selectedMaterial,
      type: selectedType,
      model: selectedModel,
      nodalLength: selectedNodalLength,
      width: selectedWidth,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "angle"
  );

  populateDatalistOptions(
    nodalLengthOptions,
    filterProductsByFields({
      material: selectedMaterial,
      type: selectedType,
      model: selectedModel,
      angle: selectedAngle,
      width: selectedWidth,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "nodalLength"
  );

  populateDatalistOptions(
    widthOptions,
    filterProductsByFields({
      material: selectedMaterial,
      type: selectedType,
      model: selectedModel,
      angle: selectedAngle,
      nodalLength: selectedNodalLength,
      numberOfTeeth: selectedNumberOfTeeth
    }),
    "width"
  );

  populateDatalistOptions(
    numberOfTeethOptions,
    filterProductsByFields({
      material: selectedMaterial,
      type: selectedType,
      model: selectedModel,
      angle: selectedAngle,
      nodalLength: selectedNodalLength,
      width: selectedWidth
    }),
    "numberOfTeeth"
  );
}

function filterProductsByFields(filters) {
  return allProducts.filter((product) => {
    const checks = [];

    if (filters.material) {
      checks.push(normalize(product.material) === filters.material);
    }

    if (filters.type) {
      checks.push(normalize(product.type) === filters.type);
    }

    if (filters.model) {
      checks.push(normalize(product.model) === filters.model);
    }

    if (filters.angle) {
      checks.push(normalizeNumber(product.angle) === filters.angle);
    }

    if (filters.nodalLength) {
      checks.push(normalizeNumber(product.nodalLength) === filters.nodalLength);
    }

    if (filters.width) {
      checks.push(normalizeNumber(product.width) === filters.width);
    }

    if (filters.numberOfTeeth) {
      checks.push(normalizeNumber(product.numberOfTeeth) === filters.numberOfTeeth);
    }

    return checks.every(Boolean);
  });
}


function populateDatalistOptions(datalistElement, products, fieldName) {
  if (!datalistElement) return;

  const values = [
    ...new Set(
      products
        .map((product) => product[fieldName])
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  datalistElement.innerHTML = values
    .map((value) => `<option value="${DomHelper.escapeHtml(value)}"></option>`)
    .join("");
}

/* =========================
   PRODUCT MATCHING
========================= */
[
  materialInput,
  typeInput,
  modelInput,
  angleInput,
  nodalLengthInput,
  widthInput,
  numberOfTeethInput
].forEach((input) => {
  input.addEventListener("input", handleProductInputChange);
  input.addEventListener("change", handleProductInputChange);
});

function handleProductInputChange(event) {
  updateAvailableOptions(event.target);

  const matchedProduct = findMatchingProduct();

  if (!matchedProduct) {
    selectedProductIdInput.value = "";

    const possibleProducts = getPossibleProductsByCurrentInputs();

    if (possibleProducts.length > 0) {
      updateSelectedProductInfo(
        null,
        `${possibleProducts.length} matching product option(s). Continue selecting product details.`,
        "default"
      );
    } else {
      updateSelectedProductInfo(
        null,
        "No product matches these selected values.",
        "error"
      );
    }

    return;
  }

  selectedProductIdInput.value = matchedProduct.id;
  updateSelectedProductInfo(matchedProduct);
}


function getPossibleProductsByCurrentInputs() {
  const material = normalize(materialInput.value);
  const type = normalize(typeInput.value);
  const model = normalize(modelInput.value);
  const angle = normalizeNumber(angleInput.value);
  const nodalLength = normalizeNumber(nodalLengthInput.value);
  const width = normalizeNumber(widthInput.value);
  const numberOfTeeth = normalizeNumber(numberOfTeethInput.value);

  return filterProductsByFields({
    material,
    type,
    model,
    angle,
    nodalLength,
    width,
    numberOfTeeth
  });
}


function findMatchingProduct() {
  const material = normalize(materialInput.value);
  const type = normalize(typeInput.value);
  const model = normalize(modelInput.value);
  const angle = normalizeNumber(angleInput.value);
  const nodalLength = normalizeNumber(nodalLengthInput.value);
  const width = normalizeNumber(widthInput.value);
  const numberOfTeeth = normalizeNumber(numberOfTeethInput.value);

  // Ürün seçimi için tüm temel alanlar dolu olmalı.
  // Böylece sadece Material yazınca sistem kafasına göre ürün seçmez.
  if (
    !material ||
    !type ||
    !model ||
    !nodalLength ||
    !width ||
    !numberOfTeeth
  ) {
    return null;
  }

  return allProducts.find((product) => {
    const productMaterial = normalize(product.material);
    const productType = normalize(product.type);
    const productModel = normalize(product.model);
    const productAngle = normalizeNumber(product.angle);
    const productNodalLength = normalizeNumber(product.nodalLength);
    const productWidth = normalizeNumber(product.width);
    const productNumberOfTeeth = normalizeNumber(product.numberOfTeeth);

    return (
      productMaterial === material &&
      productType === type &&
      productModel === model &&
      productNodalLength === nodalLength &&
      productWidth === width &&
      productNumberOfTeeth === numberOfTeeth
    );
  });
}

function fillFormWithProduct(product) {
  materialInput.value = product.material ?? "";
  typeInput.value = product.type ?? "";
  modelInput.value = product.model ?? "";
  angleInput.value = product.angle ?? "";
  nodalLengthInput.value = product.nodalLength ?? "";
  widthInput.value = product.width ?? "";
  numberOfTeethInput.value = product.numberOfTeeth ?? "";
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "";
  }

  return String(numberValue);
}

/* =========================
   SELECTED PRODUCT INFO
========================= */
function updateSelectedProductInfo(product, message = "", type = "success") {
  if (!selectedProductInfo) return;

  if (!product) {
    selectedProductInfo.innerText = message || "No product selected yet.";
    selectedProductInfo.className =
      type === "error"
        ? "selected-product-info error"
        : "selected-product-info";
    return;
  }

  selectedProductInfo.innerHTML = `
    <strong>Selected Product:</strong><br>
    ${DomHelper.escapeHtml(product.material)} /
    ${DomHelper.escapeHtml(product.type)} /
    ${DomHelper.escapeHtml(product.model)}<br>
    Angle: ${FormatHelper.dash(product.angle)} |
    Nodal Length: ${FormatHelper.dash(product.nodalLength)} |
    Width: ${FormatHelper.dash(product.width)} |
    Teeth: ${FormatHelper.dash(product.numberOfTeeth)}<br>
    Unit Price: ${FormatHelper.money(product.unitPrice, product.currency)}
  `;

  selectedProductInfo.className = "selected-product-info success";
}

/* =========================
   LOAD CURRENT ORDER
========================= */
async function loadMyOrders() {
  try {
    const orders = await OrderApi.getMyOrders();
    const activeOrder = orders.find((order) => order.status === "Current");

    if (!activeOrder) {
      currentOrder = await OrderApi.createOrder();
    } else {
      currentOrder = activeOrder;
    }

    currentOrderInfo.innerText =
      `Current Order: ${currentOrder.order_code} • ${currentOrder.status}`;

    // scompleteOrderBtn.disabled = false;

    renderCurrentOrderItems(currentOrder);
  } catch (error) {
    currentOrder = null;
    currentOrderInfo.innerText = error.message;
    currentOrderItems.innerHTML = DomHelper.emptyMessage(error.message);
    completeOrderBtn.disabled = true;
  }
}

function renderCurrentOrderItems(order) {
  if (!order.items || order.items.length === 0) {
    currentOrderItems.innerHTML = DomHelper.emptyMessage("No items in current order.");
    return;
  }

  completeOrderBtn.disabled = false;

  const totals = new Map();
  for (const item of order.items) {
    const currency = item.currency || "USD";
    totals.set(currency, (totals.get(currency) || 0) + Number(item.total_price || 0));
  }
  const total = [...totals.entries()]
    .map(([currency, value]) => FormatHelper.money(value, currency))
    .join(" + ");

  currentOrderItems.innerHTML = `
    <h3>Order Items</h3>

    <div class="order-table-wrapper">
      <table class="order-items-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Type</th>
            <th>Model</th>
            <th>Angle</th>
            <th>Nodal Length</th>
            <th>Width</th>
            <th>Teeth</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${order.items
            .map(
              (item) => `
                <tr>
                  <td>${DomHelper.escapeHtml(item.material)}</td>
                  <td>${DomHelper.escapeHtml(item.type)}</td>
                  <td>${DomHelper.escapeHtml(item.model)}</td>
                  <td>${FormatHelper.dash(item.angle)}</td>
                  <td>${FormatHelper.dash(item.nodal_length)}</td>
                  <td>${FormatHelper.dash(item.width)}</td>
                  <td>${FormatHelper.dash(item.number_of_teeth)}</td>
                  <td>${FormatHelper.dash(item.quantity)}</td>
                  <td>${FormatHelper.money(item.unit_price, item.currency)}</td>
                  <td>${FormatHelper.money(item.total_price, item.currency)}</td>
                  <td class="order-actions-cell">
                    <div class="order-actions-wrapper">
                      <button
                        class="editOrderItemBtn secondary"
                        type="button"
                        data-item-id="${item.id}"
                        data-quantity="${item.quantity}"
                      >
                        Edit Quantity
                      </button>

                      <button
                        class="deleteOrderItemBtn danger"
                        type="button"
                        data-item-id="${item.id}"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
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
   CURRENT ORDER ITEM ACTIONS
========================= */
currentOrderItems.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".editOrderItemBtn");
  const deleteBtn = event.target.closest(".deleteOrderItemBtn");

  if (!currentOrder) {
    alert("Current order could not be loaded.");
    return;
  }

  if (editBtn) {
    const itemId = editBtn.dataset.itemId;
    const item = currentOrder.items.find(
      (orderItem) => String(orderItem.id) === String(itemId)
    );

    if (!item) {
      alert("Order item not found.");
      return;
    }

    openEditOrderItemModal(item);
    return;
  }

  if (deleteBtn) {
    const itemId = deleteBtn.dataset.itemId;

    const confirmed = confirm("Are you sure you want to delete this item?");

    if (!confirmed) return;

    try {
      await OrderApi.deleteOrderItem(currentOrder.id, itemId);

      alert("Order item deleted successfully.");
      await loadMyOrders();
    } catch (error) {
      alert(error.message);
    }
  }
});


/* =========================
   EDIT ORDER ITEM MODAL
========================= */
function openEditOrderItemModal(item) {
  selectedOrderItem = item;

  editOrderItemId.value = item.id;

  editOrderMaterial.innerText = item.material || "-";
  editOrderType.innerText = item.type || "-";
  editOrderModel.innerText = item.model || "-";
  editOrderAngle.innerText = FormatHelper.dash(item.angle);
  editOrderNodalLength.innerText = FormatHelper.dash(item.nodal_length);
  editOrderWidth.innerText = FormatHelper.dash(item.width);
  editOrderTeeth.innerText = FormatHelper.dash(item.number_of_teeth);
  editOrderUnitPrice.innerText = FormatHelper.money(item.unit_price, item.currency);

  editOrderQuantityInput.value = item.quantity || 1;

  updateEditOrderTotalPrice();

  editOrderItemMessage.innerText = "";
  editOrderItemMessage.className = "edit-order-item-message";

  editOrderItemModal.classList.remove("hidden");
}

function closeEditOrderItemModal() {
  selectedOrderItem = null;

  editOrderItemModal.classList.add("hidden");
  editOrderItemForm.reset();
  editOrderItemId.value = "";

  editOrderItemMessage.innerText = "";
  editOrderItemMessage.className = "edit-order-item-message";
}

function updateEditOrderTotalPrice() {
  if (!selectedOrderItem) {
    editOrderTotalPrice.innerText = "-";
    return;
  }

  const unitPrice = Number(selectedOrderItem.unit_price || 0);
  const quantity = Number(editOrderQuantityInput.value || 0);
  const total = unitPrice * quantity;

  editOrderTotalPrice.innerText = FormatHelper.money(total, selectedOrderItem.currency);
}

function showEditOrderItemMessage(message, type = "success") {
  editOrderItemMessage.innerText = message;
  editOrderItemMessage.className = `edit-order-item-message ${type}`;
}

editOrderQuantityInput.addEventListener("input", updateEditOrderTotalPrice);
editOrderQuantityInput.addEventListener("change", updateEditOrderTotalPrice);

closeEditOrderItemModalBtn.addEventListener("click", () => {
  closeEditOrderItemModal();
});

cancelEditOrderItemBtn.addEventListener("click", () => {
  closeEditOrderItemModal();
});

editOrderItemModal.addEventListener("click", (event) => {
  if (event.target === editOrderItemModal) {
    closeEditOrderItemModal();
  }
});

editOrderItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentOrder) {
    showEditOrderItemMessage("Current order could not be loaded.", "error");
    return;
  }

  const itemId = editOrderItemId.value;
  const quantity = Number(editOrderQuantityInput.value);

  if (!itemId) {
    showEditOrderItemMessage("Order item ID is missing.", "error");
    return;
  }

  if (!quantity || quantity <= 0) {
    showEditOrderItemMessage("Quantity must be greater than 0.", "error");
    return;
  }

  try {
    showEditOrderItemMessage("Updating item...", "success");

    await OrderApi.updateOrderItem(currentOrder.id, itemId, quantity);

    showEditOrderItemMessage("Item updated successfully.", "success");

    await loadMyOrders();

    setTimeout(() => {
      closeEditOrderItemModal();
    }, 500);
  } catch (error) {
    showEditOrderItemMessage(error.message, "error");
  }
});

/* =========================
   ADD ITEM
========================= */
addItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentOrder) {
    alert("Current order could not be loaded.");
    return;
  }

  const productId = selectedProductIdInput.value;
  const quantity = Number(quantityInput.value);

  if (!productId) {
    updateSelectedProductInfo(
      null,
      "Please select an existing product before adding item.",
      "error"
    );
    return;
  }

  if (!quantity || quantity <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  try {
    await OrderApi.addItemToOrder(currentOrder.id, productId, quantity);
    alert("Product added to order.");

    clearItemForm();
    await loadMyOrders();
  } catch (error) {
    alert(error.message);
  }
});

clearItemFormBtn.addEventListener("click", () => {
  clearItemForm();
});

function clearItemForm() {
  addItemForm.reset();
  selectedProductIdInput.value = "";
  quantityInput.value = 1;

  updateAvailableOptions();
  updateSelectedProductInfo(null, "No product selected yet.", "default");
}

/* =========================
   COMPLETE ORDER
========================= */
completeOrderBtn.addEventListener("click", async () => {
  if (!currentOrder) {
    alert("No active order.");
    return;
  }

  if (!currentOrder.items || currentOrder.items.length === 0) {
    alert("You cannot complete an empty order.");
    completeOrderBtn.disabled = true;
    return;
  }

  const confirmed = confirm("Complete this order?");

  if (!confirmed) return;

  try {
  const completedOrder = await OrderApi.completeOrder(currentOrder.id);

  const completedOrderCode =
    completedOrder?.order_code ||
    currentOrder?.order_code ||
    currentOrder?.id ||
    "Order";

  alert(`Order completed: ${completedOrderCode}`);

  currentOrder = null;
  currentOrderInfo.innerText = "No active order loaded.";
  currentOrderItems.innerHTML = DomHelper.emptyMessage("No current order items.");
  completeOrderBtn.disabled = true;

  await loadMyOrders();
} catch (error) {
  alert(error.message);
}
});

/* =========================
   PAGE LOAD
========================= */
loadProducts();
loadMyOrders();
