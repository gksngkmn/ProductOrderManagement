async function sendMailFromManagerToCustomer({ to, subject, text }) {
  console.log("=== MOCK EMAIL TO CUSTOMER ===");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Text:", text);
  console.log("==============================");

  return true;
}

async function sendMailToManager({ subject, text }) {
  console.log("=== MOCK EMAIL TO MANAGER ===");
  console.log("Subject:", subject);
  console.log("Text:", text);
  console.log("=============================");

  return true;
}

module.exports = {
  sendMailFromManagerToCustomer,
  sendMailToManager
};