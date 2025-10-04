MedExpress Secure Auth v2
Improvements over previous version:
- Persistent storage for refresh tokens and codes (SQLite)
- Hashing of refresh token identifiers (bcrypt) to reduce risk if DB leaked
- Token rotation: refresh token rotated on use
- SMTP optional, demo returns code to client to draw image
- Endpoints: send-code, verify, refresh, logout, me

Run server:
cd server
cp .env.example .env
npm install
npm run dev

Run client:
cd client
npm install
npm run dev
