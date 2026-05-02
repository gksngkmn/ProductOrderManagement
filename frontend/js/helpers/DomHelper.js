class DomHelper {
  static escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  static setHtml(element, html) {
    if (!element) return;
    element.innerHTML = html;
  }

  static setText(element, text) {
    if (!element) return;
    element.innerText = text;
  }

  static tableEmpty(message, colspan) {
    return `
      <tr>
        <td colspan="${colspan}" class="table-empty">
          ${this.escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  static emptyMessage(message) {
    return `
      <div class="empty-message">
        ${this.escapeHtml(message)}
      </div>
    `;
  }
}

export default DomHelper;