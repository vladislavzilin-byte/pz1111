import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-memory store for verification codes (use Redis/DB in production)
const codes = new Map(); // key: email, value: { code, ts }
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT = new Map(); // key: ip|email, value: [timestamps]

function rateLimited(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const arr = RATE_LIMIT.get(key) || [];
  const recent = arr.filter(t => now - t < windowMs);
  recent.push(now);
  RATE_LIMIT.set(key, recent);
  return recent.length > limit;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/api/send-code", async (req, res) => {
  const { email } = req.body || {};
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }
  if (rateLimited(`${ip}|send`, 10, 10 * 60 * 1000) || rateLimited(`${email}|send`, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const code = generateCode();
  codes.set(email, { code, ts: Date.now() });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || "noreply@example.com",
      to: email,
      subject: "Ваш код подтверждения",
      text: `Ваш код: ${code}. Действителен 15 минут.`,
      html: `<p>Ваш код: <b>${code}</b></p><p>Код действителен 15 минут.</p>`,
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error("Email error:", e);
    return res.status(500).json({ ok: false, error: "Email send failed" });
  }
});

app.post("/api/verify-code", (req, res) => {
  const { email, code } = req.body || {};
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";

  if (!email || !code) return res.status(400).json({ ok: false, error: "Missing email or code" });
  if (rateLimited(`${ip}|verify`, 20, 10 * 60 * 1000) || rateLimited(`${email}|verify`, 20, 10 * 60 * 1000)) {
    return res.status(429).json({ ok: false, error: "Too many attempts" });
  }

  const entry = codes.get(email);
  if (!entry) return res.json({ ok: false });
  const expired = Date.now() - entry.ts > CODE_TTL_MS;
  const match = entry.code === code;
  if (!expired && match) {
    codes.delete(email);
    return res.json({ ok: true });
  }
  return res.json({ ok: false });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log("Server listening on", PORT));
