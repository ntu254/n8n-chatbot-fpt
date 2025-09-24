# TuaTua Chat Web App

A minimal single-page web app to call your n8n chat webhook and display responses.

## Setup

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

## Notes

- The app stores:
  - The webhook URL in `localStorage.webhookUrl`.
  - A `sessionId` in `localStorage` (generated once) so your agent can maintain memory across turns.
- If CORS is blocked by your n8n host, either:
  - Enable CORS on your n8n server (recommended), or
  - Host this page on the same origin as n8n, or
  - Use a small reverse proxy to add CORS headers.

## Customization

- Add authentication:
  - In `webapp/app.js`, add an `Authorization` header if your webhook requires it.
- Styling:
  - Modify `webapp/styles.css`.
- Message parsing:
  - The app attempts to parse JSON responses; if not JSON, it displays raw text.