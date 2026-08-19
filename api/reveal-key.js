// Re-verifies the payment status directly with NOWPayments (never trusts the client),
// then reveals the actual VIP download URL only if the payment is genuinely confirmed.
// The download URL is intentionally NOT stored anywhere in the client-side site code —
// it only ever exists here, server-side, so it can't be found via "view source".

const VIP_TOOLS = {
  63: { name: "Exact Correct Score", price: 15, downloadUrl: "https://devuploads.com/l7e8fqmhtjkn" }
};

const PAID_STATUSES = ["finished", "confirmed"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toolId, payment_id } = req.query;
  const tool = VIP_TOOLS[toolId];

  if (!tool || !payment_id) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${payment_id}`, {
      headers: { "x-api-key": apiKey }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data.message || "Status check failed" });
    }

    if (!PAID_STATUSES.includes(data.payment_status)) {
      return res.status(402).json({ error: "Payment not confirmed yet" });
    }

    return res.status(200).json({ downloadUrl: tool.downloadUrl });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
