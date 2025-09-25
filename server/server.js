import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config
const PORT = process.env.PORT || 3000;
// The upstream n8n webhook URL, e.g. https://nttu254.app.n8n.cloud/webhook/b1269f08-4273-48f6-bd24-178d1e8b9816
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const N8N_AUTH_HEADER = process.env.N8N_AUTH_HEADER || ''; // e.g. "Authorization"
const N8N_AUTH_VALUE = process.env.N8N_AUTH_VALUE || '';   // e.g. "Bearer YOUR_TOKEN"

// Middlewares
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Static webapp (serve ../webapp)
app.use('/', express.static(path.join(__dirname, '..', 'webapp')));

// Proxy endpoint to call n8n webhook with proper headers
app.post('/api/chat', async (req, res) => {
  try {
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL is not configured' });
    }

    // Forward the request body to n8n
    const headers = { 'Content-Type': 'application/json' };
    if (N8N_AUTH_HEADER && N8N_AUTH_VALUE) {
      headers[N8N_AUTH_HEADER] = N8N_AUTH_VALUE;
    }

    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });

    const contentType = upstream.headers.get('content-type') || '';
    const status = upstream.status;

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(status).json(data);
    } else {
      const text = await upstream.text();
      res.status(status).type('text/plain').send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`TuaTua dev server running at http://localhost:${PORT}`);
  console.log(`Serving webapp from ${path.join(__dirname, '..', 'webapp')}`);
  if (N8N_WEBHOOK_URL) {
    console.log(`Proxying /api/chat -> ${N8N_WEBHOOK_URL}`);
  } else {
    console.log('Warning: N8N_WEBHOOK_URL is empty. Set it in .env');
  }
});