/* =========================================================
   MAIL SERVICE
   Current mode: MOCK or REAL

   Purpose:
   - Send notification emails between manager and customers
   - Send verification code emails
   - Send order emails with Excel attachments
   - Send product update emails with Excel attachments
   - Send account creation emails
========================================================= */

const nodemailer = require("nodemailer");

const MAIL_MODE = process.env.MAIL_MODE || "mock";
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "manager@example.com";

/* =========================
   SMTP TRANSPORTER
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 465),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* =========================
   LOW LEVEL MOCK SENDER
========================= */
async function sendMockEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
}) {
  console.log("\n================ MOCK EMAIL ================");
  console.log("To:", to);
  console.log("Subject:", subject);

  if (text) {
    console.log("Text:\n", text);
  }

  if (html) {
    console.log("HTML: provided");
  }

  if (attachments.length > 0) {
    console.log("Attachments:");
    attachments.forEach((attachment, index) => {
      console.log(
        `${index + 1}) ${attachment.filename || "Unnamed attachment"}`
      );
    });
  } else {
    console.log("Attachments: none");
  }

  console.log("============================================\n");

  return true;
}

/* =========================
   LOW LEVEL REAL SENDER
========================= */
async function sendRealEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
}) {
  if (!to) {
    console.warn("Email address is missing. Mail was not sent.");
    return false;
  }

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("MAIL_USER or MAIL_PASS is missing. Mail was not sent.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Product Order Management"}" <${
        process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER
      }>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Real email sending error:", error.message);
    return false;
  }
}

/* =========================
   GENERAL SENDER
========================= */
async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
}) {
  if (MAIL_MODE === "real") {
    return sendRealEmail({
      to,
      subject,
      text,
      html,
      attachments,
    });
  }

  return sendMockEmail({
    to,
    subject,
    text,
    html,
    attachments,
  });
}

/* =========================
   MANAGER → CUSTOMER
========================= */
async function sendMailFromManagerToCustomer({
  to,
  subject,
  text,
  html,
  attachments = [],
}) {
  if (!to) {
    console.warn("Customer email address is missing. Mail was not sent.");
    return false;
  }

  return sendEmail({
    to,
    subject,
    text,
    html,
    attachments,
  });
}

/* =========================
   SYSTEM / CUSTOMER → MANAGER
========================= */
async function sendMailToManager({
  subject,
  text,
  html,
  attachments = [],
}) {
  return sendEmail({
    to: MANAGER_EMAIL,
    subject,
    text,
    html,
    attachments,
  });
}

/* =========================
   NEW PRODUCT MARKETING MAIL
   Single product notification
========================= */
async function sendNewProductMailToCustomer({
  customerEmail,
  customerName,
  product,
}) {
  const subject = `New Product Added: ${product.type || ""} ${
    product.model || ""
  }`.trim();

  const text = `
Hello ${customerName || "Customer"},

A new product has been added to our product list.

Product Information:
- Material: ${product.material || "-"}
- Type: ${product.type || "-"}
- Model: ${product.model || "-"}
- Angle: ${product.angle ?? "-"}
- Nodal Length: ${product.nodal_length ?? product.nodalLength ?? "-"} mm
- Width: ${product.width ?? "-"} mm
- Number of Teeth: ${
    product.number_of_teeth ?? product.numberOfTeeth ?? "-"
  }
- Unit Price: ${product.unit_price ?? product.unitPrice ?? "-"}

You can login to your customer panel to create an order.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customerEmail,
    subject,
    text,
  });
}

/* =========================
   PRODUCT UPDATES NEWSLETTER
   MANAGER → CUSTOMERS
   WITH EXCEL ATTACHMENT
========================= */
async function sendProductUpdatesMailToCustomer({
  customerEmail,
  customerName,
  products = [],
  periodLabel,
  productsExcelBuffer,
}) {
  const subject = `Product Updates - ${periodLabel || "New Products"}`;

  const text = `
Hello ${customerName || "Customer"},

New product updates are available for ${periodLabel || "the selected period"}.

Please find the product update list in the attached Excel file.

Number of products: ${products.length}

You can login to your customer panel to review products and create an order.

Product Order Management
`;

  const attachments = createProductExcelAttachments({
    productsExcelBuffer,
    periodLabel,
  });

  return sendMailFromManagerToCustomer({
    to: customerEmail,
    subject,
    text,
    attachments,
  });
}

/* =========================
   CUSTOMER UPDATED OWN INFO
   CUSTOMER → MANAGER
========================= */
async function sendCustomerUpdatedInfoMailToManager({
  customer,
  updatedFields,
}) {
  const subject = "Customer Information Updated";

  const text = `
A customer updated their own information.

Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || customer.company || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

Updated Fields:
${formatDetailedUpdatedFields(updatedFields)}

Please review the customer record in the manager panel if needed.

Product Order Management
`;

  return sendMailToManager({
    subject,
    text,
  });
}

/* =========================
   CUSTOMER PASSWORD CHANGED
   CUSTOMER → MANAGER
========================= */
async function sendCustomerPasswordChangedMailToManager({ customer }) {
  const subject = "Customer Password Changed";

  const text = `
A customer changed or reset their password.

Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || customer.company || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

Security note:
The new password is not included in this email.

Product Order Management
`;

  return sendMailToManager({
    subject,
    text,
  });
}

/* =========================
   MANAGER UPDATED CUSTOMER INFO
   MANAGER → CUSTOMER
========================= */
async function sendManagerUpdatedCustomerInfoMail({
  customer,
  updatedFields,
}) {
  const subject = "Your Customer Information Has Been Updated";

  const text = `
Hello ${customer.name || "Customer"},

Your customer information has been updated by the manager.

Updated Fields:
${formatDetailedUpdatedFields(updatedFields)}

Current Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || customer.company || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

If you did not expect this change, please contact your manager.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text,
  });
}

/* =========================
   MANAGER UPDATED CUSTOMER PASSWORD
   MANAGER → CUSTOMER
========================= */
async function sendManagerUpdatedCustomerPasswordMail({
  customer,
  newPassword,
}) {
  const subject = "Your Password Has Been Updated";

  const text = `
Hello ${customer.name || "Customer"},

Your password has been updated by the manager.

Login Information:
- Username: ${customer.username || "-"}
- New Password: ${newPassword || "-"}

Please login with your new password.

For security, we recommend changing your password after login.

If you did not expect this change, please contact the manager.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text,
  });
}

/* =========================
   NEW CUSTOMER ACCOUNT CREATED
   MANAGER → CUSTOMER
========================= */
async function sendNewCustomerAccountMail({
  customer,
  plainPassword,
}) {
  const subject = "Your Customer Account Has Been Created";

  const text = `
Hello ${customer.name || "Customer"},

Your customer account has been created by the manager.

Login Information:
- Username: ${customer.username || "-"}
- Password: ${plainPassword || "-"}

Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || customer.company || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Address: ${customer.address || "-"}
- Country: ${customer.country || "-"}
- City: ${customer.city || "-"}
- Company Phone: ${customer.companyPhone || customer.company_phone || "-"}

Please login with the information above.

For security, we recommend changing your password after your first login.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text,
  });
}

/* =========================
   VERIFICATION CODE MAIL
   Used for edit / password / forgot password
========================= */
async function sendVerificationCodeMail({ to, name, code, reason }) {
  const subject = "Your Verification Code";

  const text = `
Hello ${name || "User"},

Your verification code is:

${code}

Reason:
${reason || "Account verification"}

This code should not be shared with anyone.

Product Order Management
`;

  return sendEmail({
    to,
    subject,
    text,
  });
}

/* =========================
   ORDER SUBMITTED MAIL
   CUSTOMER CONFIRMATION
   WITH EXCEL ATTACHMENT
========================= */
async function sendOrderSubmittedMailToCustomer({
  customer,
  order,
  excelBuffer,
}) {
  const orderCode = order.order_code || order.id || "Unknown";

  const subject = `Order Submitted: ${orderCode}`;

  const text = `
Hello ${customer.name || "Customer"},

Your order has been submitted successfully.

Order Information:
- Order Code: ${orderCode}
- Status: ${order.status || "-"}
- Submission Date: ${formatDateForMail(order.submission_date)}

Please find your order details in the attached Excel file.

Thank you for your order.

Product Order Management
`;

  const attachments = createOrderExcelAttachments({
    order,
    excelBuffer,
  });

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text,
    attachments,
  });
}

/* =========================
   ORDER SUBMITTED MAIL
   MANAGER NOTIFICATION
   WITH EXCEL ATTACHMENT
========================= */
async function sendOrderSubmittedMailToManager({
  customer,
  order,
  excelBuffer,
}) {
  const orderCode = order.order_code || order.id || "Unknown";

  const subject = `New Order Submitted: ${orderCode}`;

  const text = `
A customer submitted a new order.

Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.company_name || customer.companyName || customer.company || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

Order Information:
- Order Code: ${orderCode}
- Status: ${order.status || "-"}
- Submission Date: ${formatDateForMail(order.submission_date)}

Please find the full order details in the attached Excel file.

Product Order Management
`;

  const attachments = createOrderExcelAttachments({
    order,
    excelBuffer,
  });

  return sendMailToManager({
    subject,
    text,
    attachments,
  });
}

/* =========================
   ORDER EXCEL ATTACHMENT HELPER
========================= */
function createOrderExcelAttachments({ order, excelBuffer }) {
  if (!excelBuffer) {
    console.warn("Excel buffer is missing. Email will be sent without attachment.");
    return [];
  }

  const orderCode = order.order_code || order.id || "order";

  return [
    {
      filename: `Order_${sanitizeFileName(orderCode)}.xlsx`,
      content: excelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ];
}

/* =========================
   PRODUCT EXCEL ATTACHMENT HELPER
========================= */
function createProductExcelAttachments({ productsExcelBuffer, periodLabel }) {
  if (!productsExcelBuffer) {
    console.warn("Products Excel buffer is missing. Email will be sent without attachment.");
    return [];
  }

  const safePeriod = sanitizeFileName(periodLabel || "Product_Updates");

  return [
    {
      filename: `Product_Updates_${safePeriod}.xlsx`,
      content: productsExcelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ];
}

/* =========================
   ORDER HELPER
   Kept for backward compatibility.
   New order emails should use Excel attachment instead.
========================= */
function formatOrderItems(items = []) {
  if (!items.length) {
    return "- No order items found.";
  }

  return items
    .map((item, index) => {
      return `
${index + 1}) ${item.type || "-"} ${item.model || "-"}
- Material: ${item.material || "-"}
- Angle: ${item.angle ?? "-"}
- Nodal Length: ${item.nodal_length ?? "-"} mm
- Width: ${item.width ?? "-"} mm
- Number of Teeth: ${item.number_of_teeth ?? "-"}
- Quantity: ${item.quantity ?? "-"}
- Unit Price: ${item.unit_price ?? "-"}
- Total Price: ${item.total_price ?? "-"}
`;
    })
    .join("\n");
}

/* =========================
   GENERAL HELPERS
========================= */
function formatUpdatedFields(updatedFields = []) {
  if (!updatedFields.length) {
    return "- No field details provided.";
  }

  return updatedFields.map((field) => `- ${field}`).join("\n");
}

function formatDetailedUpdatedFields(updatedFields = []) {
  if (!updatedFields.length) {
    return "- No field details provided.";
  }

  return updatedFields
    .map((field) => {
      if (typeof field === "string") {
        return `- ${field}`;
      }

      return `- ${field.label}: ${field.oldValue || "-"} → ${
        field.newValue || "-"
      }`;
    })
    .join("\n");
}

function formatDateForMail(value) {
  if (!value) {
    return "-";
  }

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

function sanitizeFileName(value) {
  return String(value || "file")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_");
}

module.exports = {
  sendEmail,

  sendMailFromManagerToCustomer,
  sendMailToManager,

  sendNewProductMailToCustomer,
  sendProductUpdatesMailToCustomer,

  sendCustomerUpdatedInfoMailToManager,
  sendCustomerPasswordChangedMailToManager,

  sendManagerUpdatedCustomerInfoMail,
  sendManagerUpdatedCustomerPasswordMail,

  sendNewCustomerAccountMail,

  sendOrderSubmittedMailToCustomer,
  sendOrderSubmittedMailToManager,

  sendVerificationCodeMail,
};