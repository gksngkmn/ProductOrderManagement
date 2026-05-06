/* =========================================================
   SMS SERVICE
   Current mode: MOCK or REAL
   Provider for REAL mode: Netgsm
========================================================= */

const SMS_MODE = process.env.SMS_MODE || "mock";

/* =========================
   LOW LEVEL MOCK SENDER
========================= */
async function sendMockSms({ to, message }) {
  console.log("\n================ MOCK SMS ================");
  console.log("To:", to);
  console.log("Message:\n", message);
  console.log("==========================================\n");

  return true;
}

/* =========================
   PHONE FORMAT HELPER
========================= */
function normalizePhoneNumber(phone) {
  if (!phone) return null;

  let normalized = String(phone).replace(/\D/g, "");

  if (normalized.startsWith("90")) {
    return normalized;
  }

  if (normalized.startsWith("0")) {
    return `9${normalized}`;
  }

  if (normalized.length === 10) {
    return `90${normalized}`;
  }

  return normalized;
}

/* =========================
   LOW LEVEL NETGSM SENDER
========================= */
async function sendNetgsmSms({ to, message }) {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const msgheader = process.env.NETGSM_MSGHEADER;

  if (!usercode || !password || !msgheader) {
    console.warn("Netgsm configuration is missing. SMS was not sent.");
    return false;
  }

  const gsmno = normalizePhoneNumber(to);

  if (!gsmno) {
    console.warn("Phone number is missing. SMS was not sent.");
    return false;
  }

  try {
    const response = await fetch("https://api.netgsm.com.tr/sms/send/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        usercode,
        password,
        gsmno,
        message,
        msgheader,
        dil: "TR"
      })
    });

    const responseText = await response.text();

    console.log("Netgsm SMS response:", responseText);

    if (!response.ok) {
      return false;
    }

    const firstCode = responseText.split(" ")[0];

    if (firstCode === "00" || firstCode === "01" || firstCode === "02") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Netgsm SMS sending error:", error.message);
    return false;
  }
}

/* =========================
   GENERAL SMS SENDER
========================= */
async function sendSms({ to, message }) {
  if (!to) {
    console.warn("Phone number is missing. SMS was not sent.");
    return false;
  }

  if (SMS_MODE === "real") {
    return sendNetgsmSms({ to, message });
  }

  return sendMockSms({ to, message });
}

/* =========================
   VERIFICATION SMS
========================= */
async function sendVerificationCodeSms({ to, code, reason }) {
  const message = `Your verification code is: ${code}. Reason: ${
    reason || "Account verification"
  }. Product Order Management`;

  return sendSms({
    to,
    message
  });
}

module.exports = {
  sendSms,
  sendVerificationCodeSms
};