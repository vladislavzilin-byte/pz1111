# MedShop Demo — Minimal Vite + React + Tailwind

This is a minimal single-page demo of an e-commerce store with 3 products:
- Ivermectin
- Fenbendazole
- Mebendazole

Features:
- Simple registration (name, family name, shipping address, email) saved to localStorage
- Catalog of 3 items
- Cart and mocked checkout buttons (PayPal / Paysera) — demo-mode, no real payments

How to run locally:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`

Notes:
- This is a demo. For production you must implement a proper backend, real payment provider integration, legal pages, and follow medicine/regulatory rules in your jurisdiction.
