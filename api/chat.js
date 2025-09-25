/**
 * Vercel Serverless Function: Proxy to n8n webhook
 * Env vars to set in Vercel Project:
 * - N8N_WEBHOOK_URL (required)
 * - N8N_AUTH_HEADER (optional, e.g. "Authorization")
 * - N8N_AUTH_VALUE (optional, e.g. "Bearer xxx")
 * - CORS_ORIGIN (optional, default "*")
 */
export default async function handler(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";
  const N8N_AUTH_HEADER = process.env.N8N_AUTH_HEADER || "";
  const N8N_AUTH_VALUE = process.env.N8N_AUTH_VALUE || "";

  if (!N8N_WEBHOOK_URL) {
    res.status(500).json({ error: "N8N_WEBHOOK_URL is not configured" });
    return;
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (N8N_AUTH_HEADER && N8N_AUTH_VALUE) {
      headers[N8N_AUTH_HEADER] = N8N_AUTH_VALUE;
    }

    // Node 18+ on Vercel has global fetch
    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body || {})
    });

    const contentType = upstream.headers.get("content-type") || "";
    const status = upstream.status;

    if (contentType.includes("application/json")) {
      const data = await upstream.json();
      res.status(status).json(data);
    } else {
      const text = await upstream.text();
      res.status(status).setHeader("Content-Type", "text/plain; charset=utf-8").send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Upstream request failed" });
  }
}