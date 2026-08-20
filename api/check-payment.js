// Checks the live status of an OxaPay payment by track_id.
// OxaPay itself is the source of truth — no separate database needed.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { track_id } = req.query;
  if (!track_id) {
    return res.status(400).json({ error: "Missing track_id" });
  }

  const apiKey = process.env.OXAPAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const response = await fetch(`https://api.oxapay.com/v1/payment/${track_id}`, {
      headers: {
        "merchant_api_key": apiKey,
        "Content-Type": "application/json"
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      return res.status(502).json({ error: `Non-JSON response (status ${response.status})` });
    }

    if (!response.ok || !data.data) {
      return res.status(502).json({ error: (data.message || data.error?.message) || "Status check failed" });
    }

    return res.status(200).json({
      status: (data.data.status || "").toLowerCase(),
      amount: data.data.amount,
      currency: data.data.currency
    });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
