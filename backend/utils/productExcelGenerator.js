const ExcelJS = require("exceljs");

function safeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

async function generateProductUpdatesExcel({ products = [], periodLabel }) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Product Order Management";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Product Updates");

  worksheet.addRow(["PRODUCT UPDATES"]);
  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  worksheet.addRow(["Period", periodLabel || "New Products"]);
  worksheet.addRow([]);

  const headerRow = worksheet.addRow([
    "No",
    "Material",
    "Type",
    "Model",
    "Angle",
    "Nodal Length",
    "Width",
    "Number of Teeth",
    "Unit Price",
    "Currency",
  ]);

  headerRow.font = {
    bold: true,
  };

  if (!products.length) {
    worksheet.addRow([
      "-",
      "No product updates found",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
    ]);
  } else {
    products.forEach((product, index) => {
      worksheet.addRow([
        index + 1,
        safeValue(product.material),
        safeValue(product.type),
        safeValue(product.model),
        safeValue(product.angle),
        safeValue(product.nodal_length ?? product.nodalLength),
        safeValue(product.width),
        safeValue(product.number_of_teeth ?? product.numberOfTeeth),
        safeValue(product.unit_price ?? product.unitPrice),
        safeValue(product.currency || "USD"),
      ]);
    });
  }

  worksheet.columns = [
    { width: 8 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 14 },
  ];

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
  generateProductUpdatesExcel,
};
