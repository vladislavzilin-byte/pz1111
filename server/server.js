import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ACCESS_TTL_MIN = parseInt(process.env.ACCESS_TTL_MIN || "15");
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || "7");

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const codes = new Map();
const refreshStore = new Map();
const rate = new Map();

function rateLimited(key, limit=5, windowMs=10*60*1000){
  const now = Date.now();
  const arr = rate.get(key) || [];
  const recent = arr.filter(t => now - t < windowMs);
  recent.push(now);
  rate.set(key, recent);
  return recent.length > limit;
}

function signAccess(email){ return jwt.sign({ sub: email, typ: "access" }, JWT_SECRET, { expiresIn: `${ACCESS_TTL_MIN}m` }); }
function signRefresh(email){
  const jti = uuidv4();
  const exp = Date.now() + REFRESH_TTL_DAYS*24*60*60*1000;
  refreshStore.set(jti, { email, exp });
  return jwt.sign({ sub: email, jti, typ: "refresh" }, JWT_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}
function clearRefresh(jti){ refreshStore.delete(jti); }

function setAuthCookies(res, email){
  const access = signAccess(email);
  const refresh = signRefresh(email);
  const secure = false;
  res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure, maxAge: ACCESS_TTL_MIN*60*1000, path: "/" });
  res.cookie("refresh_token", refresh, { httpOnly: true, sameSite: "lax", secure, maxAge: REFRESH_TTL_DAYS*24*60*60*1000, path: "/api/auth/refresh" });
  const csrf = uuidv4();
  res.cookie("csrf_token", csrf, { httpOnly: false, sameSite: "lax", secure, maxAge: REFRESH_TTL_DAYS*24*60*60*1000, path: "/" });
  return { access, refresh, csrf };
}

function requireAuth(req, res, next){
  const token = req.cookies["access_token"];
  if(!token) return res.status(401).json({ ok: false });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload.sub;
    next();
  }catch(e){ return res.status(401).json({ ok:false }); }
}

const hasSMTP = !!process.env.SMTP_HOST && !!process.env.SMTP_USER;
const transporter = hasSMTP ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE||"false")==="true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }

app.post("/api/auth/send-code", async (req, res) => {
  const { email } = req.body || {};
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok:false, error:"invalid email" });
  if(rateLimited(`${email}|send`, 5, 10*60*1000)) return res.status(429).json({ ok:false, error:"too many requests" });
  const code = genCode();
  codes.set(email, { code, ts: Date.now() });
  if(transporter){
    try{
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@medexpress.demo",
        to: email,
        subject: "Your MedExpress verification code",
        text: `Your code: ${code} (valid 15 minutes)`,
        html: `<p>Your code: <b>${code}</b></p><p>Valid 15 minutes.</p>`
      });
    }catch(e){ console.error("SMTP error:", e.message); }
  }
  res.json({ ok:true, demoCode: code });
});

app.post("/api/auth/verify", (req, res) => {
  const { email, code } = req.body || {};
  const entry = codes.get(email);
  if(!entry) return res.json({ ok:false });
  const valid = entry.code === code && (Date.now()-entry.ts) < 15*60*1000;
  if(!valid) return res.json({ ok:false });
  codes.delete(email);
  setAuthCookies(res, email);
  res.json({ ok:true });
});

app.post("/api/auth/refresh", (req,res) => {
  const token = req.cookies["refresh_token"];
  if(!token) return res.status(401).json({ ok:false });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const { jti, sub } = payload;
    const rec = refreshStore.get(jti);
    if(!rec || rec.email !== sub || rec.exp < Date.now()) return res.status(401).json({ ok:false });
    clearRefresh(jti);
    setAuthCookies(res, sub);
    res.json({ ok:true });
  }catch(e){ return res.status(401).json({ ok:false }); }
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies["refresh_token"];
  if(token){
    try{
      const payload = jwt.verify(token, JWT_SECRET);
      if(payload?.jti) clearRefresh(payload.jti);
    }catch{}
  }
  res.clearCookie("access_token", { path:"/" });
  res.clearCookie("refresh_token", { path:"/api/auth/refresh" });
  res.clearCookie("csrf_token", { path:"/" });
  res.json({ ok:true });
});

app.get("/api/me", requireAuth, (req, res) => { res.json({ ok:true, email: req.user }); });

app.listen(PORT, () => console.log("Auth server listening on", PORT));
