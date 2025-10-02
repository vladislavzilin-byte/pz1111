# MedExpress — AliExpress-style Demo

AliExpress-like layout with the same features:
- 3 products (Ivermectin, Fenbendazole, Mebendazole)
- Quantity selectors in catalog and cart
- Simple registration (first/last name, address, city, country, postcode, email, phone)
- Login with email + 6-digit code (demo: saved to localStorage and printed to console)
- Checkout buttons for PayPal / Paysera (demo only)

## Run
```bash
npm install
npm run dev
```

## Notes
- Email verification is local-only. For real emails, add the server from the previous package (Express + nodemailer).
- Replace images/prices with your own.
