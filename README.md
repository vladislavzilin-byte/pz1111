# MedShop — Fullstack (Client + Server)

- Client: Vite + React (registration with full address fields, login, verification code input).
- Server: Node + Express + nodemailer (sends code to email, verifies it).

## Quick start
### Server
```bash
cd server
cp .env.example .env  # fill SMTP_*
npm install
npm run dev
```

### Client
```bash
cd client
npm install
# optionally set VITE_API_BASE in .env to your server URL (default: http://localhost:3001/api)
npm run dev
```
