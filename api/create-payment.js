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

  async function attemptPayment(amount, attemptOrderId) {
    const response = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdttrc20",
        order_id: attemptOrderId,
        order_description: `Nu Tools VIP — ${tool.name}`
      })
    });
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: `Non-JSON response (status ${response.status})` };
    }
    return { ok: response.ok, data };
  }

  try {
    const baseOrderId = `nu-${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let amount = tool.price;
    let attempt = 0;
    let orderId = `${baseOrderId}-${attempt}`;
    let result = await attemptPayment(amount, orderId);

    // NOWPayments enforces a minimum crypto amount that can fluctuate with
    // network conditions. If our price falls under it, bump up and retry
    // with a fresh order_id each time (NOWPayments rejects duplicates).
    while (!result.ok && /less than minimal/i.test(result.data.message || "") && attempt < 4) {
      attempt++;
      amount += 2;
      orderId = `${baseOrderId}-${attempt}`;
      result = await attemptPayment(amount, orderId);
    }

    if (!result.ok) {
      return res.status(502).json({ error: result.data.message || "Payment creation failed" });
    }

    const data = result.data;
    return res.status(200).json({
      payment_id: data.payment_id,
      pay_address: data.pay_address,
      pay_amount: data.pay_amount,
      pay_currency: data.pay_currency,
      order_id: orderId,
      charged_usd: amount
    });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error: " + (err.message || String(err)) });
  }
}
