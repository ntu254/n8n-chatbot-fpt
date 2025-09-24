# TuaTua Chat Web App

A minimal single-page web app to call your n8n chat webhook and display responses.

## Option A — Direct call (same-origin or CORS enabled)

1) Serve the `webapp` folder with any static server (examples):
- Python: `python3 -m http.server -d webapp 8080`
- Node (serve): `npx serve webapp`
- Nginx/Apache: point document root to `webapp/`

2) Open the app in your browser, e.g.:
- http://localhost:8080

3) Paste your public chat webhook URL into the "Webhook URL" field and click "Lưu".
- With your workflow, the public chat trigger node uses `public: true`. The URL usually looks like:
  - https://your-n8n-host/webhook/63917544-ff35-430d-aef1-0c083ba59af1
- If you instead want to call the explicit Webhook node (`Webhook1`), configure authorization as required and update `app.js` headers accordingly.

4) Start chatting.

If you hit CORS errors with your n8n host, use Option B below.

## Option B — Run local proxy (bypass CORS)

1) Create a `.env` file in the `server/` folder based on `.env.example`:
```
PORT=3000
N8N_WEBHOOK_URL=https://your-n8n-host/webhook/b1269f08-4273-48f6-bd24-178d1e8b9816
N8N_AUTH_HEADER=Authorization
N8N_AUTH_VALUE=Bearer YOUR_SUPER_SECRET_TOKEN
CORS_ORIGIN=http://localhost:3000
```
- Use production `/webhook/` URL (avoid `/webhook-test/` for browsers).
- Omit the auth keys if your webhook is public.

2) Install deps and start server:
```
cd server
npm i
npm run dev
```

3) Open http://localhost:3000
- The proxy serves the UI and forwards POST /api/chat → N8N_WEBHOOK_URL with proper headers.
- In the UI’s “Webhook URL” field, enter: /api/chat

## Notes

- The app stores:
  - The webhook URL in `localStorage.webhookUrl`.
  - A `sessionId` in `localStorage` (generated once) so your agent can maintain memory across turns.

## Customization

- Add authentication:
  - In `webapp/app.js`, add an `Authorization` header if calling n8n directly without proxy.
  - Or set `N8N_AUTH_HEADER` and `N8N_AUTH_VALUE` in the proxy `.env`.
- Styling:
  - Modify `webapp/styles.css`.
- Message parsing:
  - The app attempts to parse JSON responses; if not JSON, it displays raw text.