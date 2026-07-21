const ExcelJS = require("exceljs");

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

async function generateOrderExcel({ customer, order, items }) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Product Order Management";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Order Details");

  /*
    TOP ORDER INFORMATION
  */
  worksheet.addRow(["ORDER DETAILS"]);
  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  worksheet.addRow([]);
  worksheet.addRow(["Order Code", safeValue(order.order_code || order.id)]);
  worksheet.addRow(["Status", safeValue(order.status)]);
  worksheet.addRow(["Submission Date", formatDate(order.submission_date)]);

  worksheet.addRow([]);
  worksheet.addRow(["CUSTOMER INFORMATION"]);
  worksheet.getCell(`A${worksheet.rowCount}`).font = {
    bold: true,
    size: 14,
  };

  worksheet.addRow([
    "Customer Name",
    `${safeValue(customer.name)} ${safeValue(customer.surname)}`.replace(
      "- -",
      "-"
    ),
  ]);
  worksheet.addRow([
    "Company",
    safeValue(customer.company_name || customer.companyName),
  ]);
  worksheet.addRow(["Email", safeValue(customer.email)]);
  worksheet.addRow(["Phone", safeValue(customer.phone)]);
  worksheet.addRow(["Username", safeValue(customer.username)]);

  worksheet.addRow([]);
  worksheet.addRow(["ORDER ITEMS"]);

  const orderItemsTitleRow = worksheet.rowCount;
  worksheet.getCell(`A${orderItemsTitleRow}`).font = {
    bold: true,
    size: 14,
  };

  worksheet.addRow([]);

  /*
    TABLE HEADER
  */
  const headerRow = worksheet.addRow([
    "No",
    "Material",
    "Type",
    "Model",
    "Angle",
    "Nodal Length",
    "Width",
    "Number of Teeth",
    "Quantity",
    "Unit Price",
    "Total Price",
    "Currency",
  ]);

  headerRow.font = {
    bold: true,
  };

  headerRow.eachCell((cell) => {
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
  });

  /*
    TABLE BODY
  */
  let grandTotal = 0;

  if (!items || items.length === 0) {
    worksheet.addRow([
      "-",
      "No order items found",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
    ]);
  } else {
    items.forEach((item, index) => {
      const totalPrice = Number(item.total_price || 0);
      grandTotal += totalPrice;

      worksheet.addRow([
        index + 1,
        safeValue(item.material),
        safeValue(item.type),
        safeValue(item.model),
        safeValue(item.angle),
        safeValue(item.nodal_length),
        safeValue(item.width),
        safeValue(item.number_of_teeth),
        safeValue(item.quantity),
        safeValue(item.unit_price),
        safeValue(item.total_price),
        safeValue(item.currency || "USD"),
      ]);
    });
  }

  /*
    GRAND TOTAL
  */
  worksheet.addRow([]);

  const totalRow = worksheet.addRow([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Grand Total",
    grandTotal,
  ]);

  totalRow.font = {
    bold: true,
  };

  /*
    COLUMN WIDTHS
  */
  worksheet.columns = [
    { width: 8 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
  ];

  /*
    GENERAL ALIGNMENT
  */
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return buffer;
}

module.exports = {
  generateOrderExcel,
};
