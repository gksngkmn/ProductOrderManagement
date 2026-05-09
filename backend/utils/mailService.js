/* =========================================================
   MAIL SERVICE
   Current mode: MOCK or REAL
   Purpose:
   - Send notification emails between manager and customers
   - Send verification code emails
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
async function sendMockEmail({ to, subject, text }) {
  console.log("\n================ MOCK EMAIL ================");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Text:\n", text);
  console.log("============================================\n");

  return true;
}

/* =========================
   LOW LEVEL REAL SENDER
========================= */
async function sendRealEmail({ to, subject, text }) {
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
async function sendEmail({ to, subject, text }) {
  if (MAIL_MODE === "real") {
    return sendRealEmail({ to, subject, text });
  }

  return sendMockEmail({ to, subject, text });
}

/* =========================
   MANAGER → CUSTOMER
========================= */
async function sendMailFromManagerToCustomer({ to, subject, text }) {
  if (!to) {
    console.warn("Customer email address is missing. Mail was not sent.");
    return false;
  }

  return sendEmail({
    to,
    subject,
    text,
  });
}

/* =========================
   SYSTEM / CUSTOMER → MANAGER
========================= */
async function sendMailToManager({ subject, text }) {
  return sendEmail({
    to: MANAGER_EMAIL,
    subject,
    text,
  });
}

/* =========================
   NEW PRODUCT MARKETING MAIL
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
   CUSTOMER UPDATED OWN INFO
   CUSTOMER → MANAGER
========================= */
async function sendCustomerUpdatedInfoMailToManager({
  customer,
  updatedFields,
}) {
  const subject = "Customer Information Updated";

  const text = `
A customer updated their information.

Customer:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

Updated Fields:
${formatUpdatedFields(updatedFields)}

Please review the customer record if needed.

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
A customer changed their password.

Customer:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.companyName || customer.company_name || "-"}
- Email: ${customer.email || "-"}
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

Your customer/company information has been updated by a manager.

Updated Fields:
${formatUpdatedFields(updatedFields)}

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
   PRODUCT UPDATES NEWSLETTER
   MANAGER → CUSTOMERS
========================= */
async function sendProductUpdatesMailToCustomer({
  customerEmail,
  customerName,
  products,
  periodLabel
}) {
  const subject = `Product Updates - ${periodLabel || "New Products"}`;

  const productListText = products
    .map((product, index) => {
      return `
${index + 1}) ${product.type || "-"} ${product.model || "-"}
- Material: ${product.material || "-"}
- Angle: ${product.angle ?? "-"}
- Nodal Length: ${product.nodal_length ?? product.nodalLength ?? "-"} mm
- Width: ${product.width ?? "-"} mm
- Number of Teeth: ${product.number_of_teeth ?? product.numberOfTeeth ?? "-"}
- Unit Price: ${product.unit_price ?? product.unitPrice ?? "-"}
`;
    })
    .join("\n");

  const text = `
Hello ${customerName || "Customer"},

Here are the new product updates for ${periodLabel || "the selected period"}.

${productListText}

You can login to your customer panel to create an order.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customerEmail,
    subject,
    text
  });
}

/* =========================
   ORDER SUBMITTED MAIL
   CUSTOMER CONFIRMATION
========================= */
async function sendOrderSubmittedMailToCustomer({
  customer,
  order,
  items
}) {
  const subject = `Order Submitted: ${order.order_code || order.id}`;

  const text = `
Hello ${customer.name || "Customer"},

Your order has been submitted successfully.

Order Information:
- Order Code: ${order.order_code || "-"}
- Status: ${order.status || "-"}
- Submission Date: ${order.submission_date || "-"}

Order Items:
${formatOrderItems(items)}

Thank you for your order.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text
  });
}

/* =========================
   ORDER SUBMITTED MAIL
   MANAGER NOTIFICATION
========================= */
async function sendOrderSubmittedMailToManager({
  customer,
  order,
  items
}) {
  const subject = `New Order Submitted: ${order.order_code || order.id}`;

  const text = `
A customer submitted a new order.

Customer Information:
- Name: ${customer.name || "-"} ${customer.surname || ""}
- Company: ${customer.company_name || customer.companyName || "-"}
- Email: ${customer.email || "-"}
- Phone: ${customer.phone || "-"}
- Username: ${customer.username || "-"}

Order Information:
- Order Code: ${order.order_code || "-"}
- Status: ${order.status || "-"}
- Submission Date: ${order.submission_date || "-"}

Order Items:
${formatOrderItems(items)}

Please review the order in the manager panel.

Product Order Management
`;

  return sendMailToManager({
    subject,
    text
  });
}

/* =========================
   MANAGER UPDATED CUSTOMER PASSWORD
   MANAGER → CUSTOMER
========================= */
async function sendManagerUpdatedCustomerPasswordMail({
  customer,
  newPassword
}) {
  const subject = "Your Password Has Been Updated";

  const text = `
Hello ${customer.name || "Customer"},

Your password has been updated by the manager.

New Password:
${newPassword}

Please login with your new password.

If you did not expect this change, please contact the manager.

Product Order Management
`;

  return sendMailFromManagerToCustomer({
    to: customer.email,
    subject,
    text
  });
}

/* =========================
   ORDER HELPERS
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
   HELPERS
========================= */
function formatUpdatedFields(updatedFields = []) {
  if (!updatedFields.length) {
    return "- No field details provided.";
  }

  return updatedFields.map((field) => `- ${field}`).join("\n");
}

module.exports = {
  sendMailFromManagerToCustomer,
  sendMailToManager,

  sendNewProductMailToCustomer,
  sendProductUpdatesMailToCustomer,

  sendCustomerUpdatedInfoMailToManager,
  sendCustomerPasswordChangedMailToManager,
  sendManagerUpdatedCustomerInfoMail,
  sendManagerUpdatedCustomerPasswordMail,

  sendOrderSubmittedMailToCustomer,
  sendOrderSubmittedMailToManager,

  sendVerificationCodeMail,
};