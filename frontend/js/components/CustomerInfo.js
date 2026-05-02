import DomHelper from "../helpers/DomHelper.js";

class CustomerInfo {
  static getDisplayName(user) {
    if (!user) return "Unknown user";

    if (user.role === "manager") {
      return `${user.username || "manager"} • manager`;
    }

    if (user.role === "customer") {
      return `${user.company || user.username || "customer"} • customer`;
    }

    return `${user.username || "user"} • ${user.role || "unknown"}`;
  }

  static renderManagerInfo(user) {
    if (!user) {
      return "Manager information unavailable";
    }

    return `${DomHelper.escapeHtml(user.username)} • ${DomHelper.escapeHtml(user.role)}`;
  }

  static renderCustomerInfo(user) {
    if (!user) {
      return "Customer information unavailable";
    }

    return `${DomHelper.escapeHtml(user.company || user.username)} • ${DomHelper.escapeHtml(user.role)}`;
  }

  static renderProfileCard(user) {
    if (!user) {
      return DomHelper.emptyMessage("User information unavailable.");
    }

    if (user.role === "manager") {
      return `
        <div class="item-card">
          <h3>${DomHelper.escapeHtml(user.name || "Manager")}</h3>
          <p><strong>Username:</strong> ${DomHelper.escapeHtml(user.username)}</p>
          <p><strong>Email:</strong> ${DomHelper.escapeHtml(user.email)}</p>
          <p><strong>Phone:</strong> ${DomHelper.escapeHtml(user.phone)}</p>
          <p><strong>Role:</strong> ${DomHelper.escapeHtml(user.role)}</p>
        </div>
      `;
    }

    return `
      <div class="item-card">
        <h3>${DomHelper.escapeHtml(user.company || "Customer")}</h3>
        <p><strong>Name:</strong> ${DomHelper.escapeHtml(user.name)} ${DomHelper.escapeHtml(user.surname)}</p>
        <p><strong>Username:</strong> ${DomHelper.escapeHtml(user.username)}</p>
        <p><strong>Email:</strong> ${DomHelper.escapeHtml(user.email)}</p>
        <p><strong>Phone:</strong> ${DomHelper.escapeHtml(user.phone)}</p>
        <p><strong>City:</strong> ${DomHelper.escapeHtml(user.city)}</p>
        <p><strong>Country:</strong> ${DomHelper.escapeHtml(user.country)}</p>
      </div>
    `;
  }
}

export default CustomerInfo;