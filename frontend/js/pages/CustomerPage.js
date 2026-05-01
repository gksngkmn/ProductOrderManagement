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

const currentOrderInfo = document.getElementById("currentOrderInfo");
const currentOrderItems = document.getElementById("currentOrderItems");
const completeOrderBtn = document.getElementById("completeOrderBtn");

const addItemForm = document.getElementById("addItemForm");
const clearItemFormBtn = document.getElementById("clearItemFormBtn");
const selectedProductIdInput = document.getElementById("selectedProductId");
const selectedProductInfo = document.getElementById("selectedProductInfo");

const materialInput = document.getElementById("materialInput");
const typeInput = document.getElementById("typeInput");
const modelInput = document.getElementById("modelInput");
const angleInput = document.getElementById("angleInput");
const nodalLengthInput = document.getElementById("nodalLengthInput");
const widthInput = document.getElementById("widthInput");
const numberOfTeethInput = document.getElementById("numberOfTeethInput");
const quantityInput = document.getElementById("quantityInput");
const unitPriceInput = document.getElementById("unitPriceInput");

const materialOptions = document.getElementById("materialOptions");
const typeOptions = document.getElementById("typeOptions");
const modelOptions = document.getElementById("modelOptions");
const angleOptions = document.getElementById("angleOptions");
const nodalLengthOptions = document.getElementById("nodalLengthOptions");
const widthOptions = document.getElementById("widthOptions");
const numberOfTeethOptions = document.getElementById("numberOfTeethOptions");
const unitPriceOptions = document.getElementById("unitPriceOptions");

/* =========================
   STATE
========================= */
let currentOrder = null;
let allProducts = [];

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

    alert(`Order completed: ${completedOrder.order_code}`);

    currentOrder = null;
    currentOrderInfo.innerText = "Creating new current order...";
    currentOrderItems.innerHTML = `<div class="empty-message">Preparing new current order...</div>`;
    completeOrderBtn.disabled = true;

    await loadMyOrders();
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
    let activeOrder = orders.find((order) => order.status === "Current");

    if (!activeOrder) {
      activeOrder = await OrderApi.createOrder();
    }

    currentOrder = activeOrder;

    currentOrderInfo.innerText =
      `Current Order: ${activeOrder.order_code} • ${activeOrder.status}`;

    renderCurrentOrderItems(activeOrder);
  } catch (error) {
    currentOrder = null;
    currentOrderInfo.innerText = "Current order could not be loaded.";
    currentOrderItems.innerHTML = `<div class="empty-message">${error.message}</div>`;
    completeOrderBtn.disabled = true;
  }
}

function renderCurrentOrderItems(order) {
  const hasItems = order.items && order.items.length > 0;

  completeOrderBtn.disabled = !hasItems;

  if (!hasItems) {
    currentOrderItems.innerHTML = `
      <div class="empty-message">No items in current order.</div>
    `;
    return;
  }

  const total = order.items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  currentOrderItems.innerHTML = `
    <div class="order-table-wrapper">
      <table class="order-items-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Type</th>
            <th>Model</th>
            <th>Angle</th>
            <th>Nodal Length (mm)</th>
            <th>Width (mm)</th>
            <th>Teeth</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
              <tr>
                <td>${escapeHtml(item.material)}</td>
                <td>${escapeHtml(item.type)}</td>
                <td>${escapeHtml(item.model)}</td>
                <td>${item.angle ?? "-"}</td>
                <td>${item.nodal_length ?? "-"}</td>
                <td>${item.width ?? "-"}</td>
                <td>${item.number_of_teeth ?? "-"}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price}</td>
                <td>${item.total_price}</td>
                <td class="order-actions-cell">
                  <div class="order-actions-wrapper">
                    <button class="editOrderItemBtn secondary" data-item-id="${item.id}" type="button">
                      Edit
                    </button>
                    <button class="deleteOrderItemBtn danger" data-item-id="${item.id}" type="button">
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

currentOrderItems.addEventListener("click", async (e) => {
  if (!currentOrder) return;

  const itemId = e.target.dataset.itemId;

  if (e.target.classList.contains("editOrderItemBtn")) {
    const item = currentOrder.items.find(
      (orderItem) => String(orderItem.id) === String(itemId)
    );

    if (!item) {
      alert("Order item not found.");
      return;
    }

    const newQuantity = prompt("Enter new quantity:", item.quantity);

    if (newQuantity === null) return;

    const quantity = Number(newQuantity);

    if (!quantity || quantity <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    try {
      await OrderApi.updateOrderItem(currentOrder.id, itemId, quantity);
      alert("Order item updated successfully.");
      await loadMyOrders();
    } catch (error) {
      alert(error.message);
    }
  }

  if (e.target.classList.contains("deleteOrderItemBtn")) {
    const confirmed = confirm("Delete this item from current order?");

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
   PRODUCTS FOR AUTOCOMPLETE
========================= */
async function loadProducts() {
  try {
    allProducts = await ProductApi.getProducts();
    renderDatalistOptions();
    updateSelectedProductInfo();
  } catch (error) {
    selectedProductInfo.innerText = error.message;
    selectedProductInfo.classList.add("error");
  }
}

function renderDatalistOptions() {
  fillDatalist(materialOptions, getUniqueValues("material"));
  fillDatalist(typeOptions, getUniqueValues("type"));
  fillDatalist(modelOptions, getUniqueValues("model"));
  fillDatalist(angleOptions, getUniqueValues("angle"));
  fillDatalist(nodalLengthOptions, getUniqueValues("nodalLength"));
  fillDatalist(widthOptions, getUniqueValues("width"));
  fillDatalist(numberOfTeethOptions, getUniqueValues("numberOfTeeth"));
  fillDatalist(unitPriceOptions, getUniqueValues("unitPrice"));
}

function getUniqueValues(key) {
  return [
    ...new Set(
      allProducts
        .map((product) => product[key])
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map(String)
    )
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function fillDatalist(datalist, values) {
  datalist.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

/* =========================
   ADD ITEM FORM
========================= */
[
  materialInput,
  typeInput,
  modelInput,
  angleInput,
  nodalLengthInput,
  widthInput,
  numberOfTeethInput,
  unitPriceInput
].forEach((input) => {
  input.addEventListener("input", handleProductInputChange);
  input.addEventListener("change", handleProductInputChange);
});

function handleProductInputChange(e) {
  const matchedProduct = findBestMatchingProduct();

  if (matchedProduct) {
    selectedProductIdInput.value = matchedProduct.id;
    fillProductForm(matchedProduct, {
      keepQuantity: true,
      avoidOverwritingFocusedInput: e?.target
    });
  } else {
    selectedProductIdInput.value = "";
  }

  updateSelectedProductInfo();
}

function findBestMatchingProduct() {
  const material = normalize(materialInput.value);
  const type = normalize(typeInput.value);
  const model = normalize(modelInput.value);
  const angle = normalizeNumber(angleInput.value);
  const nodalLength = normalizeNumber(nodalLengthInput.value);
  const width = normalizeNumber(widthInput.value);
  const numberOfTeeth = normalizeNumber(numberOfTeethInput.value);
  const unitPrice = normalizeNumber(unitPriceInput.value);

  const exactFullMatch = allProducts.find((product) => {
    return (
      normalize(product.material) === material &&
      normalize(product.type) === type &&
      normalize(product.model) === model &&
      numbersEqual(product.angle, angle) &&
      numbersEqual(product.nodalLength, nodalLength) &&
      numbersEqual(product.width, width) &&
      numbersEqual(product.numberOfTeeth, numberOfTeeth) &&
      numbersEqual(product.unitPrice, unitPrice)
    );
  });

  if (exactFullMatch) return exactFullMatch;

  const exactModelMatches = allProducts.filter(
    (product) => normalize(product.model) === model && model
  );

  if (exactModelMatches.length === 1) {
    return exactModelMatches[0];
  }

  const partialMatches = allProducts.filter((product) => {
    if (material && normalize(product.material) !== material) return false;
    if (type && normalize(product.type) !== type) return false;
    if (model && normalize(product.model) !== model) return false;
    if (angle !== "" && !numbersEqual(product.angle, angle)) return false;
    if (nodalLength !== "" && !numbersEqual(product.nodalLength, nodalLength)) return false;
    if (width !== "" && !numbersEqual(product.width, width)) return false;
    if (numberOfTeeth !== "" && !numbersEqual(product.numberOfTeeth, numberOfTeeth)) return false;
    if (unitPrice !== "" && !numbersEqual(product.unitPrice, unitPrice)) return false;

    return true;
  });

  return partialMatches.length === 1 ? partialMatches[0] : null;
}

function fillProductForm(product, options = {}) {
  const focused = options.avoidOverwritingFocusedInput;

  setValueIfAllowed(materialInput, product.material, focused);
  setValueIfAllowed(typeInput, product.type, focused);
  setValueIfAllowed(modelInput, product.model, focused);
  setValueIfAllowed(angleInput, product.angle, focused);
  setValueIfAllowed(nodalLengthInput, product.nodalLength, focused);
  setValueIfAllowed(widthInput, product.width, focused);
  setValueIfAllowed(numberOfTeethInput, product.numberOfTeeth, focused);
  setValueIfAllowed(unitPriceInput, product.unitPrice, focused);

  if (!options.keepQuantity) {
    quantityInput.value = 1;
  }
}

function setValueIfAllowed(input, value, focusedInput) {
  if (input === focusedInput) return;
  input.value = value ?? "";
}

function updateSelectedProductInfo() {
  const productId = selectedProductIdInput.value;
  const product = allProducts.find((item) => String(item.id) === String(productId));

  if (!product) {
    selectedProductInfo.className = "selected-product-info";
    selectedProductInfo.innerText =
      "No exact product selected. Choose a suggestion from the existing products.";
    return;
  }

  selectedProductInfo.className = "selected-product-info success";
  selectedProductInfo.innerHTML = `
    Selected product:
    <strong>${escapeHtml(product.model)}</strong>
    • ${escapeHtml(product.material)}
    • ${escapeHtml(product.type)}
    • Angle: ${product.angle ?? "-"}
  `;
}

clearItemFormBtn.addEventListener("click", () => {
  clearItemForm();
});

function clearItemForm() {
  selectedProductIdInput.value = "";

  materialInput.value = "";
  typeInput.value = "";
  modelInput.value = "";
  angleInput.value = "";
  nodalLengthInput.value = "";
  widthInput.value = "";
  numberOfTeethInput.value = "";
  quantityInput.value = 1;
  unitPriceInput.value = "";

  updateSelectedProductInfo();
}

addItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentOrder) {
    alert("Please create or load current order first.");
    return;
  }

  const product = findBestMatchingProduct();
  const quantity = Number(quantityInput.value);

  if (!quantity || quantity <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  if (!product) {
    alert(
      "This item does not match an existing product. Please select a valid product suggestion from the product list."
    );
    return;
  }

  try {
    selectedProductIdInput.value = product.id;

    await OrderApi.addItemToOrder(currentOrder.id, product.id, quantity);

    alert("Product added to order.");

    clearItemForm();
    await loadMyOrders();
  } catch (error) {
    alert(error.message);
  }
});

/* =========================
   HELPERS
========================= */
function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isNaN(number) ? "" : number;
}

function numbersEqual(a, b) {
  if (a === "" || b === "") return false;

  const first = Number(a);
  const second = Number(b);

  if (Number.isNaN(first) || Number.isNaN(second)) return false;

  return Math.abs(first - second) < 0.000001;
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
loadMyOrders();
loadProducts();