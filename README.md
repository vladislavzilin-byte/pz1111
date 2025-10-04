# MedExpress Secure Auth (access/refresh tokens, cookies)
Server issues short-lived access token and rotating refresh token in HttpOnly cookies. Client uses email + code flow with code image (demo).

Run:
1) Server
   cd server && cp .env.example .env && npm install && npm run dev
2) Client
   cd client && npm install && npm run dev

Set VITE_API_BASE=http://localhost:3001 if needed.
