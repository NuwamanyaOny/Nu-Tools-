// Re-verifies the payment status directly with NOWPayments (never trusts the client),
// then reveals the VIP access key only if the payment is genuinely confirmed.

const VIP_TOOLS = {
  57: { name: "Sharp Bettor Analysis Pro", price: 13, key: "NU-CG0CP7QT" },
  63: { name: "Fixed Correct Score", price: 15, key: "NU-QEL4AS6E" }
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

    return res.status(200).json({ key: tool.key });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
