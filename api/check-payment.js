// Checks the live status of a NOWPayments payment by payment_id.
// NOWPayments itself is the source of truth — no separate database needed.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { payment_id } = req.query;
  if (!payment_id) {
    return res.status(400).json({ error: "Missing payment_id" });
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

    return res.status(200).json({ status: data.payment_status });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
