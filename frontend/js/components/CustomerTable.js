import DomHelper from "../helpers/DomHelper.js";

class CustomerTable {
  static renderRows(customers) {
    if (!customers.length) {
      return DomHelper.tableEmpty("No customers found.", 8);
    }

    return customers
      .map((customer) => {
        const companyName = DomHelper.escapeHtml(customer.companyName);
        const fullName = `${DomHelper.escapeHtml(customer.name)} ${DomHelper.escapeHtml(customer.surname)}`;

        return `
          <tr title="${companyName} | ${DomHelper.escapeHtml(customer.email)}">
            <td>${companyName}</td>
            <td>${fullName}</td>
            <td>${DomHelper.escapeHtml(customer.email)}</td>
            <td>${DomHelper.escapeHtml(customer.phone)}</td>
            <td>${DomHelper.escapeHtml(customer.country)}</td>
            <td>${DomHelper.escapeHtml(customer.city)}</td>
            <td>${DomHelper.escapeHtml(customer.username)}</td>
            <td class="actions-cell">
              <button
                class="detailsCustomerBtn"
                data-id="${customer.id}"
                type="button"
              >
                Details
              </button>

              <button
                class="ordersBtn"
                data-id="${customer.id}"
                type="button"
              >
                Orders
              </button>
              <button
                class="deleteCustomerBtn danger"
                data-id="${customer.id}"
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
}

export default CustomerTable;