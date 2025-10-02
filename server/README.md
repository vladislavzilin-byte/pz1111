# MedShop Server (Email Verification)

Sends verification codes via SMTP and verifies them.

## Setup
1. Copy `.env.example` to `.env` and fill SMTP credentials.
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
3. The API runs at `http://localhost:3001/api`

## Endpoints
- `POST /api/send-code` { email }
- `POST /api/verify-code` { email, code }

Notes:
- This uses in-memory storage. For production, use Redis/DB and HTTPS.
- Add proper auth/JWT after verification if needed.
