class ExportHelper {
  static exportToExcel(filename, sheetName, columns, rows) {
    if (!rows || !rows.length) {
      alert("There is no data to export.");
      return;
    }

    const safeSheetName = this.escapeHtml(sheetName || "Sheet1");

    const tableHead = columns
      .map((column) => `<th>${this.escapeHtml(column.label)}</th>`)
      .join("");

    const tableRows = rows
      .map((row) => {
        const cells = columns
          .map((column) => {
            const value = this.getValue(row, column.key);
            return `<td>${this.escapeHtml(this.formatValue(value))}</td>`;
          })
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>${tableHead}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = this.ensureExcelExtension(filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static exportTableToExcel(filename, tableElementId) {
    const table = document.getElementById(tableElementId);

    if (!table) {
      alert("Export table could not be found.");
      return;
    }

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          ${table.outerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = this.ensureExcelExtension(filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static getValue(row, key) {
    if (!key) return "";

    if (typeof key === "function") {
      return key(row);
    }

    return key.split(".").reduce((value, part) => {
      if (value === null || value === undefined) return "";
      return value[part];
    }, row);
  }

  static formatValue(value) {
    if (value === null || value === undefined) return "";

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  static escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  static ensureExcelExtension(filename) {
    if (!filename) return "export.xls";

    return filename.endsWith(".xls") ? filename : `${filename}.xls`;
  }

  static getTodayFileDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export default ExportHelper;