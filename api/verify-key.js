// Verifies a manually-entered VIP access key server-side and, only if it matches,
// returns the real download URL. The key and URL never live in client-side code.

const VIP_TOOLS = {
  57: { key: "NU-5W08YSTQ", downloadUrl: "https://devuploads.com/nsdkf8cvr44g" },
  63: { key: "NU-O40QUQDS", downloadUrl: "https://devuploads.com/dw3owtzbf8l9" }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toolId, key } = req.body || {};
  const tool = VIP_TOOLS[toolId];

  if (!tool || !key) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  if (key.trim() !== tool.key) {
    return res.status(401).json({ error: "Wrong access key" });
  }

  return res.status(200).json({ downloadUrl: tool.downloadUrl });
}
