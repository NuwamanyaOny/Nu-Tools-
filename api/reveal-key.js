// Re-verifies the payment status directly with OxaPay (never trusts the client),
// then reveals the real VIP download URL only if the payment is genuinely confirmed.
// The download URL is intentionally NOT stored anywhere in the client-side site code —
// it only ever exists here, server-side, so it can't be found via "view source".

const VIP_TOOLS = {
  63: { name: "Exact Correct Score", price: 15, downloadUrl: "https://devuploads.com/l7e8fqmhtjkn" }
};

const PAID_STATUSES = ["paid", "complete", "completed"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toolId, track_id } = req.query;
  const tool = VIP_TOOLS[toolId];

  if (!tool || !track_id) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
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

    const status = (data.data.status || "").toLowerCase();
    if (!PAID_STATUSES.includes(status)) {
      return res.status(402).json({ error: "Payment not confirmed yet" });
    }

    return res.status(200).json({ downloadUrl: tool.downloadUrl });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
