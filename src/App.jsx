import React, { useEffect, useMemo, useState } from "react"; 

const PRODUCTS = [
  { id: "ivermectin", name: "Ivermectin", price: 19.9, unit: "per pack", img: "https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop", desc: "Antiparasitic. Follow local laws and consult a licensed physician where required." },
  { id: "fenbendazole", name: "Fenbendazole", price: 24.5, unit: "per pack", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop", desc: "Broad-spectrum benzimidazole anthelmintic. Human use may be regulated; check your jurisdiction." },
  { id: "mebendazole", name: "Mebendazole", price: 17.0, unit: "per pack", img: "https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop", desc: "Anthelmintic. Use only as directed and per prescription requirements." },
];

function currency(n) { return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(n); }

const emptyProfile = { firstName: "", lastName: "", address: "", city: "", country: "", postcode: "", email: "", phone: "" };

export default function App() {
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(() => { try { const raw = localStorage.getItem("profile"); return raw ? JSON.parse(raw) : emptyProfile; } catch { return emptyProfile; } });
  const [auth, setAuth] = useState(() => { try { const raw = localStorage.getItem("auth"); return raw ? JSON.parse(raw) : null; } catch { return null; } });

  const [openReg, setOpenReg] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openVerify, setOpenVerify] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { try { localStorage.setItem("profile", JSON.stringify(profile)); } catch {} }, [profile]);
  useEffect(() => { try { localStorage.setItem("auth", JSON.stringify(auth)); } catch {} }, [auth]);

  // items
  const itemsDetailed = useMemo(() => cart.map(ci => { const p = PRODUCTS.find(pr => pr.id === ci.id); return { ...p, qty: ci.qty, line: p.price * ci.qty }; }).filter(i => i && i.qty > 0), [cart]);
  const subtotal = itemsDetailed.reduce((s, i) => s + i.line, 0);
  const shipping = subtotal > 0 ? 4.9 : 0;
  const total = subtotal + shipping;

  // cart ops
  function addToCart(id, qty = 1) {
    if (qty <= 0) return;
    setCart(prev => {
      const found = prev.find(i => i.id === id);
      if (found) return prev.map(i => i.id === id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { id, qty }];
    });
    alert("Добавлено в корзину");
  }
  function setQty(id, qty) { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, Math.min(999, Math.floor(qty || 1))) } : i)); }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }

  // Auth demo (localStorage)
  function generateCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

  function sendVerificationCode(email) {
    const code = generateCode();
    try {
      const raw = localStorage.getItem("email_verif_codes");
      const store = raw ? JSON.parse(raw) : {};
      store[email] = { code, ts: Date.now() };
      localStorage.setItem("email_verif_codes", JSON.stringify(store));
      alert(`Код отправлен на ${email} (демо). Посмотрите консоль браузера.`); // quick feedback
      console.info("VERIF CODE (demo):", email, code);
      return true;
    } catch (e) {
      alert("Ошибка при отправке кода (demo)");
      return false;
    }
  }

  function verifyCode(email, code) {
    try {
      const raw = localStorage.getItem("email_verif_codes");
      const store = raw ? JSON.parse(raw) : {};
      const entry = store[email];
      if (!entry) return false;
      const ok = entry.code === code;
      if (ok) {
        setAuth({ email, verified: true });
        delete store[email];
        localStorage.setItem("email_verif_codes", JSON.stringify(store));
        alert("Email подтверждён. Вы вошли в аккаунт.");
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  async function placeOrder(provider) {
    if (!auth || !auth.verified) { alert("Сначала войдите и подтвердите email"); setOpenLogin(true); return; }
    if (!profile.firstName || !profile.lastName || !profile.address || !profile.city || !profile.country || !profile.postcode || !profile.email || !profile.phone) { alert("Заполните профиль (все поля)"); setOpenReg(true); return; }
    if (itemsDetailed.length === 0) { alert("Корзина пуста"); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    alert(`Заказ создан (демо). Провайдер: ${provider}`);
    setCart([]);
  }

  // Simple UI (unstyled for brevity). Integrate into your UI framework/markup as needed.
  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">MedShop — Demo</h1>
        <div className="flex gap-2">
          <button onClick={()=>setOpenReg(true)} className="px-3 py-1 border rounded">Профиль</button>
          {auth && auth.verified ? <div className="px-3 py-1 bg-green-100 rounded">Вход: {auth.email}</div> : <button onClick={()=>setOpenLogin(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Войти</button>}
          <button onClick={()=>document.getElementById('cart')?.scrollIntoView()} className="px-3 py-1 border rounded">Корзина</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PRODUCTS.map(p => (
          <div key={p.id} className="border p-3 rounded">
            <img src={p.img} alt={p.name} className="w-full h-32 object-cover mb-2"/>
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm mb-2">{p.desc}</p>
            <div className="flex justify-between items-center">
              <div>{currency(p.price)}</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>addToCart(p.id, -1)} className="px-2">-</button>
                <div>{cart.find(c=>c.id===p.id)?.qty || 0}</div>
                <button onClick={()=>addToCart(p.id, 1)} className="px-2">+</button>
              </div>
            </div>
            <button onClick={()=>addToCart(p.id, 1)} className="mt-3 w-full bg-slate-800 text-white py-2 rounded">Добавить</button>
          </div>
        ))}
      </section>

      <section id="cart" className="mb-6">
        <h2 className="font-semibold mb-2">Корзина</h2>
        {itemsDetailed.length === 0 ? <p>Пусто</p> : itemsDetailed.map(i => (
          <div key={i.id} className="flex items-center justify-between border-b py-2">
            <div className="flex items-center gap-3">
              <img src={i.img} alt={i.name} className="h-12 w-12 object-cover"/>
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-sm">{currency(i.price)} × {i.qty}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setQty(i.id, i.qty-1)}>-</button>
              <input value={i.qty} onChange={e=>setQty(i.id, parseInt(e.target.value.replace(/\D/g, '')) || 1)} className="w-12 text-center"/>
              <button onClick={()=>setQty(i.id, i.qty+1)}>+</button>
              <div className="w-24 text-right">{currency(i.line)}</div>
              <button onClick={()=>removeFromCart(i.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <div className="mb-3">Сумма: {currency(subtotal)} — Доставка: {currency(shipping)} — Итого: {currency(total)}</div>
        <div className="flex gap-2">
          <button onClick={()=>placeOrder('paypal')} className="px-4 py-2 bg-blue-600 text-white rounded">Оплата PayPal</button>
          <button onClick={()=>placeOrder('paysera')} className="px-4 py-2 border rounded">Оплата Paysera</button>
        </div>
      </section>

      {/* registration modal (simplified) */}
      {openReg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded max-w-md w-full">
            <h3 className="font-semibold mb-2">Регистрация / Профиль</h3>
            <div className="grid gap-2">
              <input placeholder="Имя" value={profile.firstName} onChange={e=>setProfile({...profile, firstName: e.target.value})} className="border p-2"/>
              <input placeholder="Фамилия" value={profile.lastName} onChange={e=>setProfile({...profile, lastName: e.target.value})} className="border p-2"/>
              <input placeholder="Адрес (улица, дом)" value={profile.address} onChange={e=>setProfile({...profile, address: e.target.value})} className="border p-2"/>
              <input placeholder="Город" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})} className="border p-2"/>
              <input placeholder="Страна" value={profile.country} onChange={e=>setProfile({...profile, country: e.target.value})} className="border p-2"/>
              <input placeholder="Postcode" value={profile.postcode} onChange={e=>setProfile({...profile, postcode: e.target.value})} className="border p-2"/>
              <input placeholder="Email" value={profile.email} onChange={e=>setProfile({...profile, email: e.target.value})} className="border p-2"/>
              <input placeholder="Телефон" value={profile.phone} onChange={e=>setProfile({...profile, phone: e.target.value})} className="border p-2"/>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setOpenReg(false)} className="px-3 py-1 border rounded">Отмена</button>
              <button onClick={()=>{ setOpenReg(false); alert('Профиль сохранён'); }} className="px-3 py-1 bg-green-600 text-white rounded">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* login modal */}
      {openLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded max-w-sm w-full">
            <h3 className="font-semibold mb-2">Вход по Email</h3>
            <input placeholder="Email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="border p-2 w-full mb-2"/>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{ setOpenLogin(false); setOpenReg(true); }} className="px-3 py-1 border rounded">Регистрация</button>
              <button onClick={()=>{ if(!loginEmail){ alert('Введите email'); return; } const ok = sendVerificationCode(loginEmail); if(ok){ setOpenVerify(true); } }} className="px-3 py-1 bg-blue-600 text-white rounded">Отправить код</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Демо: код также выводится в консоль и хранится в localStorage. Для реальной отправки нужен сервер.</div>
          </div>
        </div>
      )}

      {/* verify modal */}
      {openVerify && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded max-w-sm w-full">
            <h3 className="font-semibold mb-2">Подтвердите Email</h3>
            <input placeholder="Код (6 цифр)" className="border p-2 w-full mb-2" id="verifCodeInput"/>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setOpenVerify(false)} className="px-3 py-1 border rounded">Отмена</button>
              <button onClick={()=>{ const code = (document.getElementById('verifCodeInput')?.value||'').replace(/\D/g,''); const ok = verifyCode(loginEmail, code); if(ok){ setOpenVerify(false); setOpenLogin(false); } else { alert('Неверный код'); } }} className="px-3 py-1 bg-green-600 text-white rounded">Подтвердить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}