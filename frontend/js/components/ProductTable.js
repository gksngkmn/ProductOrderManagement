import DomHelper from "../helpers/DomHelper.js";
import FormatHelper from "../helpers/FormatHelper.js";

class ProductTable {
  static renderManagerRows(products) {
    if (!products.length) {
      return DomHelper.tableEmpty("No products found.", 9);
    }

    return products
      .map((product) => {
        const material = DomHelper.escapeHtml(product.material);
        const type = DomHelper.escapeHtml(product.type);
        const model = DomHelper.escapeHtml(product.model);

        return `
          <tr title="${material} | ${type} | ${model}">
            <td>${material}</td>
            <td>${type}</td>
            <td>${model}</td>
            <td>${FormatHelper.dash(product.angle)}</td>
            <td>${FormatHelper.dash(product.nodalLength)}</td>
            <td>${FormatHelper.dash(product.width)}</td>
            <td>${FormatHelper.dash(product.numberOfTeeth)}</td>
            <td>${FormatHelper.money(product.unitPrice)}</td>
            <td class="actions-cell">
              <button
                class="editProductBtn secondary"
                data-id="${product.id}"
                type="button"
              >
                Edit
              </button>

              <button
                class="deleteProductBtn danger"
                data-id="${product.id}"
                type="button"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  static renderCustomerRows(products) {
    if (!products.length) {
      return DomHelper.tableEmpty("No products found.", 10);
    }

    return products
      .map((product) => {
        const material = DomHelper.escapeHtml(product.material);
        const type = DomHelper.escapeHtml(product.type);
        const model = DomHelper.escapeHtml(product.model);

        return `
          <tr title="${material} | ${type} | ${model}">
            <td>${material}</td>
            <td>${type}</td>
            <td>${model}</td>
            <td>${FormatHelper.dash(product.angle)}</td>
            <td>${FormatHelper.dash(product.nodalLength)}</td>
            <td>${FormatHelper.dash(product.width)}</td>
            <td>${FormatHelper.dash(product.numberOfTeeth)}</td>
            <td>${FormatHelper.money(product.unitPrice)}</td>
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
              <button
                class="addItemBtn"
                data-product-id="${product.id}"
                type="button"
              >
                Add
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }
}

export default ProductTable;