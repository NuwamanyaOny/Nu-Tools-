// Creates an OxaPay invoice for a VIP tool.
// Prices are defined here server-side so a user can't tamper with the amount from the browser.

const VIP_TOOLS = {
  63: { name: "Exact Correct Score", price: 15 }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toolId } = req.body || {};
  const tool = VIP_TOOLS[toolId];

  if (!tool) {
    return res.status(400).json({ error: "Unknown tool" });
  }

  const apiKey = process.env.OXAPAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const orderId = `nu-${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const response = await fetch("https://api.oxapay.com/v1/payment/invoice", {
      method: "POST",
      headers: {
        "merchant_api_key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: tool.price,
        currency: "USD",
        lifetime: 60,
        order_id: orderId,
        description: `Nu Tools VIP — ${tool.name}`
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      return res.status(502).json({ error: `Non-JSON response (status ${response.status})` });
    }

    if (!response.ok || !data.data || !data.data.track_id) {
      return res.status(502).json({ error: (data.message || data.error?.message) || "Payment creation failed" });
    }

    return res.status(200).json({
      track_id: data.data.track_id,
      payment_url: data.data.payment_url,
      order_id: orderId,
      amount: tool.price
    });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error: " + (err.message || String(err)) });
  }
}
