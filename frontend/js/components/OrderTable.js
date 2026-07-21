import DomHelper from "../helpers/DomHelper.js";
import FormatHelper from "../helpers/FormatHelper.js";

class OrderTable {
  static formatOrderTotal(order) {
    if (!order.items?.length) return FormatHelper.money(0, "USD");
    const totals = new Map();
    for (const item of order.items) {
      const currency = item.currency || "USD";
      totals.set(currency, (totals.get(currency) || 0) + Number(item.total_price || 0));
    }
    return [...totals.entries()]
      .map(([currency, total]) => FormatHelper.money(total, currency))
      .join(" + ");
  }

  static getDisplayStatus(status) {
  if (status === "Completed") {
    return "Submitted";
  }

  return status || "-";
}

  static renderManagerOrderRows(orders, selectedOrderId = null) {
    if (!orders.length) {
      return DomHelper.tableEmpty("No orders found.", 6);
    }

    return orders
      .map((order) => {
        const total = this.formatOrderTotal(order);
        const itemCount = order.items?.length || 0;
        const isSelected = String(order.id) === String(selectedOrderId);

        return `
          <tr
            class="${isSelected ? "selected-row" : ""}"
            data-order-id="${order.id}"
          >
            <td>${order.id}</td>
            <td title="${DomHelper.escapeHtml(order.order_code)}">
              ${DomHelper.escapeHtml(order.order_code)}
            </td>
            <td>${DomHelper.escapeHtml(this.getDisplayStatus(order.status))}</td>
            <td>${FormatHelper.date(order.submission_date)}</td>
            <td>${itemCount}</td>
            <td>${total}</td>
          </tr>
        `;
      })
      .join("");
  }

  static renderOrderDetail(order) {
    if (!order) {
      return DomHelper.emptyMessage("No order selected.");
    }

    const total = this.formatOrderTotal(order);

    const itemsHtml = order.items?.length
      ? `
        <div class="detail-table-wrapper">
          <table class="detail-items-table">
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
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      : DomHelper.emptyMessage("No items in this order.");

    return `
      <div class="detail-summary">
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Status:</strong> ${DomHelper.escapeHtml(this.getDisplayStatus(order.status))}</p>
        <p><strong>Submission Date:</strong> ${FormatHelper.date(order.submission_date)}</p>
        <p><strong>Items:</strong> ${order.items?.length || 0}</p>
        <p><strong>Total:</strong> ${total}</p>
      </div>

      ${itemsHtml}

      <div class="order-total-box">
        Total Price: ${total}
      </div>
    `;
  }

  static renderCustomerOrderCards(orders) {
    if (!orders.length) {
      return DomHelper.emptyMessage("No orders found.");
    }

    return orders
      .map((order) => {
        const total = this.formatOrderTotal(order);
        const statusClass =
          order.status === "Submitted" ? "badge success" : "badge warning";

        const itemsHtml = order.items?.length
          ? order.items
              .map(
                (item) => `
                <div class="order-item-row">
                  <p><strong>${DomHelper.escapeHtml(item.model)}</strong></p>
                  <p>${DomHelper.escapeHtml(item.material)}</p>
                  <p>Qty: ${FormatHelper.dash(item.quantity)}</p>
                  <p>Unit: ${FormatHelper.money(item.unit_price, item.currency)}</p>
                  <p>Total: ${FormatHelper.money(item.total_price, item.currency)}</p>
                </div>
              `
              )
              .join("")
          : DomHelper.emptyMessage("No items in this order.");

        return `
          <article class="order-card">
            <div class="order-card-header">
              <div>
                <h3>${DomHelper.escapeHtml(order.order_code)}</h3>
                <p>Created: ${FormatHelper.date(order.submission_date)}</p>
                ${
                  order.submission_date
                    ? `<p>Submission Date: ${FormatHelper.date(order.submission_date)}</p>`
                    : ""
                }
              </div>

              <div class="order-meta">
                <span class="${statusClass}">
                  ${DomHelper.escapeHtml(order.status)}
                </span>
              </div>
            </div>

            <div class="order-items">
              ${itemsHtml}
            </div>

            <div class="order-total-box">
              Total Price: ${total}
            </div>
          </article>
        `;
      })
      .join("");
  }
}

export default OrderTable;
