const crypto = require("crypto");
const axios = require("axios");

const PHONEPE_HOST = process.env.PHONEPE_HOST || "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

function assertPhonePeConfig() {
  if (!MERCHANT_ID || !SALT_KEY) {
    throw new Error("PhonePe merchant credentials are not configured");
  }
}

function generateChecksum(payload, endpoint) {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const stringToHash = base64Payload + endpoint + SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return { checksum: `${sha256}###${SALT_INDEX}`, base64Payload };
}

async function initiatePayment({ amount, merchantTransactionId, userId, redirectUrl, callbackUrl }) {
  assertPhonePeConfig();
  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // paise
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    paymentInstrument: { type: "PAY_PAGE" },
  };

  const endpoint = "/pg/v1/pay";
  const { checksum, base64Payload } = generateChecksum(payload, endpoint);

  const response = await axios.post(
    `${PHONEPE_HOST}${endpoint}`,
    { request: base64Payload },
    {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
    }
  );

  return response.data;
}

async function verifyPayment(merchantTransactionId) {
  assertPhonePeConfig();
  const endpoint = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
  const stringToHash = endpoint + SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
  const checksum = `${sha256}###${SALT_INDEX}`;

  const response = await axios.get(`${PHONEPE_HOST}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": MERCHANT_ID,
    },
  });

  return response.data;
}

module.exports = { initiatePayment, verifyPayment };
