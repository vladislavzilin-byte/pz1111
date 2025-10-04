import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";

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

let db;
async function initDb(){
  db = await open({ filename: './data.db', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens(
      id INTEGER PRIMARY KEY,
      jti TEXT UNIQUE,
      jti_hash TEXT,
      email TEXT,
      expires_at INTEGER
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS codes(
      email TEXT PRIMARY KEY,
      code TEXT,
      created_at INTEGER
    );
  `);
}
await initDb();

const transporter = (process.env.SMTP_HOST && process.env.SMTP_USER) ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT||587),
  secure: String(process.env.SMTP_SECURE||"false")==="true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

const rate = new Map();
function rateLimited(key, limit=5, windowMs=10*60*1000){
  const now = Date.now();
  const arr = rate.get(key) || [];
  const recent = arr.filter(t => now - t < windowMs);
  recent.push(now);
  rate.set(key, recent);
  return recent.length > limit;
}

function signAccess(email){
  return jwt.sign({ sub: email, typ: "access" }, JWT_SECRET, { expiresIn: `${ACCESS_TTL_MIN}m` });
}
async function signRefresh(email){
  const jti = uuidv4();
  const expires_at = Date.now() + REFRESH_TTL_DAYS*24*60*60*1000;
  const jti_hash = await bcrypt.hash(jti, 10);
  await db.run('INSERT INTO refresh_tokens (jti, jti_hash, email, expires_at) VALUES (?,?,?,?)', jti, jti_hash, email, expires_at);
  return jwt.sign({ sub: email, jti, typ: "refresh" }, JWT_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

async function revokeRefreshByJti(jti){
  await db.run('DELETE FROM refresh_tokens WHERE jti = ?', jti);
}

async function findRefreshRecord(jti){
  return await db.get('SELECT * FROM refresh_tokens WHERE jti = ?', jti);
}

function setAuthCookies(res, email){
  const access = signAccess(email);
  // signRefresh is async so we return promise
  return signRefresh(email).then(refresh => {
    const secure = false; // set true in prod (HTTPS)
    res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure, maxAge: ACCESS_TTL_MIN*60*1000, path: "/" });
    res.cookie("refresh_token", refresh, { httpOnly: true, sameSite: "lax", secure, maxAge: REFRESH_TTL_DAYS*24*60*60*1000, path: "/api/auth/refresh" });
    const csrf = uuidv4();
    res.cookie("csrf_token", csrf, { httpOnly: false, sameSite: "lax", secure, maxAge: REFRESH_TTL_DAYS*24*60*60*1000, path: "/" });
    return { access, refresh, csrf };
  });
}

function requireAuth(req,res,next){
  const token = req.cookies["access_token"];
  if(!token) return res.status(401).json({ ok:false });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload.sub;
    next();
  }catch(e){
    return res.status(401).json({ ok:false });
  }
}

function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }

app.post('/api/auth/send-code', async (req,res)=>{
  const { email } = req.body || {};
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok:false, error:'invalid' });
  if(rateLimited(`${email}|send`, 5, 10*60*1000)) return res.status(429).json({ ok:false, error:'rate_limited' });
  const code = genCode();
  await db.run('INSERT OR REPLACE INTO codes (email, code, created_at) VALUES (?,?,?)', email, code, Date.now());
  if(transporter){
    try{
      await transporter.sendMail({ from: process.env.FROM_EMAIL || 'noreply@example.com', to: email, subject: 'Your code', text: `Code: ${code}` });
    }catch(e){ console.error('smtp error', e.message); }
  }
  // demo: return code so client can render image
  res.json({ ok:true, demoCode: code });
});

app.post('/api/auth/verify', async (req,res)=>{
  const { email, code } = req.body || {};
  if(!email || !code) return res.json({ ok:false });
  const row = await db.get('SELECT * FROM codes WHERE email = ?', email);
  if(!row) return res.json({ ok:false });
  if(row.code !== code || (Date.now() - row.created_at) > 15*60*1000) return res.json({ ok:false });
  // consume code
  await db.run('DELETE FROM codes WHERE email = ?', email);
  const cookies = await setAuthCookies(res, email);
  res.json({ ok:true });
});

app.post('/api/auth/refresh', async (req,res)=>{
  const token = req.cookies['refresh_token'];
  if(!token) return res.status(401).json({ ok:false });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const { jti, sub } = payload;
    const rec = await findRefreshRecord(jti);
    if(!rec) return res.status(401).json({ ok:false });
    if(rec.expires_at < Date.now()) { await revokeRefreshByJti(jti); return res.status(401).json({ ok:false }); }
    // rotate: remove old and issue new cookies
    await revokeRefreshByJti(jti);
    await setAuthCookies(res, sub);
    res.json({ ok:true });
  }catch(e){
    return res.status(401).json({ ok:false });
  }
});

app.post('/api/auth/logout', async (req,res)=>{
  const token = req.cookies['refresh_token'];
  if(token){
    try{
      const payload = jwt.verify(token, JWT_SECRET);
      if(payload?.jti) await revokeRefreshByJti(payload.jti);
    }catch{}
  }
  res.clearCookie('access_token', { path:'/' });
  res.clearCookie('refresh_token', { path:'/api/auth/refresh' });
  res.clearCookie('csrf_token', { path:'/' });
  res.json({ ok:true });
});

app.get('/api/me', requireAuth, (req,res)=>{
  res.json({ ok:true, email: req.user });
});

app.listen(PORT, ()=> console.log('Auth server v2 listening on', PORT));