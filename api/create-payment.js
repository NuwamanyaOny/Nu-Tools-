// Creates a NOWPayments USDT (TRC20) payment for a VIP tool.
// Prices are defined here server-side so a user can't tamper with the amount from the browser.

const VIP_TOOLS = {
  57: { name: "Sharp Bettor Analysis Pro", price: 5 },
  63: { name: "Fixed Correct Score", price: 10 }
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

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const orderId = `nu-${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const response = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        price_amount: tool.price,
        price_currency: "usd",
        pay_currency: "usdttrc20",
        order_id: orderId,
        order_description: `Nu Tools VIP — ${tool.name}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data.message || "Payment creation failed" });
    }

    return res.status(200).json({
      payment_id: data.payment_id,
      pay_address: data.pay_address,
      pay_amount: data.pay_amount,
      pay_currency: data.pay_currency,
      order_id: orderId
    });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
