import React, { useEffect, useMemo, useState } from "react";

// --- Data ---
const PRODUCTS = [
  { id: "ivermectin", name: "Ivermectin", price: 19.9, oldPrice: 26.9, rating: 4.8, sold: 312, unit: "per pack", img: "https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop", desc: "Antiparasitic. Follow local laws and consult a licensed physician where required." },
  { id: "fenbendazole", name: "Fenbendazole", price: 24.5, oldPrice: 29.9, rating: 4.7, sold: 201, unit: "per pack", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop", desc: "Broad-spectrum benzimidazole anthelmintic. Human use may be regulated; check your jurisdiction." },
  { id: "mebendazole", name: "Mebendazole", price: 17.0, oldPrice: 22.0, rating: 4.9, sold: 498, unit: "per pack", img: "https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop", desc: "Anthelmintic. Use only as directed and per prescription requirements." },
];
const emptyProfile = { firstName: "", lastName: "", address: "", city: "", country: "", postcode: "", email: "", phone: "" };
function currency(n){ return new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR"}).format(n); }

export default function App(){
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(()=>{ try{ const raw = localStorage.getItem("profile"); return raw? JSON.parse(raw): emptyProfile; }catch{ return emptyProfile; }});
  const [auth, setAuth] = useState(()=>{ try{ const raw = localStorage.getItem("auth"); return raw? JSON.parse(raw): null; }catch{ return null; }});
  const [openReg, setOpenReg] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openVerify, setOpenVerify] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(()=>{ try{ localStorage.setItem("profile", JSON.stringify(profile)); }catch{} },[profile]);
  useEffect(()=>{ try{ localStorage.setItem("auth", JSON.stringify(auth)); }catch{} },[auth]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return PRODUCTS;
    return PRODUCTS.filter(p => [p.name,p.desc].join(" ").toLowerCase().includes(q));
  },[search]);

  const itemsDetailed = useMemo(()=> cart.map(ci => {
    const p = PRODUCTS.find(pr => pr.id === ci.id);
    return p? { ...p, qty: ci.qty, line: p.price * ci.qty } : null;
  }).filter(Boolean),[cart]);

  const subtotal = itemsDetailed.reduce((s,i)=>s+i.line,0);
  const shipping = subtotal>0? 4.9: 0;
  const total = subtotal+shipping;

  // Cart ops
  function addToCart(id, qty=1){
    if(qty<=0) return;
    setCart(prev=>{
      const found = prev.find(i=>i.id===id);
      if(found) return prev.map(i=> i.id===id? {...i, qty: i.qty+qty}: i);
      return [...prev, {id, qty}];
    });
    toast("Добавлено в корзину");
  }
  function setQty(id, qty){
    setCart(prev=> prev.map(i=> i.id===id? {...i, qty: Math.max(1, Math.min(999, Math.floor(qty||1)))}: i));
  }
  function removeFromCart(id){ setCart(prev=> prev.filter(i=> i.id!==id)); }

  // Email login demo (local-only). For real emails attach server as shown before.
  function genCode(){ return Math.floor(100000+Math.random()*900000).toString(); }
  function sendCode(email){
    const code = genCode();
    try{
      const raw = localStorage.getItem("email_verif_codes"); const store = raw? JSON.parse(raw): {};
      store[email] = { code, ts: Date.now() };
      localStorage.setItem("email_verif_codes", JSON.stringify(store));
      alert(`Код отправлен на ${email} (демо). Откройте консоль браузера.`);
      console.info("VERIF CODE (demo):", email, code);
      return true;
    }catch{ alert("Ошибка отправки кода (demo)"); return false; }
  }
  function verify(email, code){
    try{
      const raw = localStorage.getItem("email_verif_codes"); const store = raw? JSON.parse(raw): {};
      const entry = store[email]; if(!entry) return false;
      const ok = entry.code === code;
      if(ok){ setAuth({ email, verified: true }); delete store[email]; localStorage.setItem("email_verif_codes", JSON.stringify(store)); alert("Email подтверждён. Вход выполнен."); return true; }
      return false;
    }catch{ return false; }
  }

  async function placeOrder(provider){
    if(!auth || !auth.verified){ alert("Сначала войдите и подтвердите email"); setOpenLogin(true); return; }
    const p = profile;
    if(!p.firstName||!p.lastName||!p.address||!p.city||!p.country||!p.postcode||!p.email||!p.phone){ alert("Заполните профиль полностью"); setOpenReg(true); return; }
    if(itemsDetailed.length===0){ alert("Корзина пуста"); return; }
    setSubmitting(true); await new Promise(r=>setTimeout(r,700)); setSubmitting(false);
    alert(`Заказ создан (демо). Провайдер: ${provider}`); setCart([]);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* AliExpress-like topbar */}
      <div className="bg-neutral-900 text-neutral-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between">
          <div>Привет! Добро пожаловать в <b>MedExpress</b></div>
          <div className="flex gap-4">
            {auth && auth.verified ? <span>Вход: {auth.email}</span> : <button onClick={()=>setOpenLogin(true)} className="hover:underline">Войти</button>}
            <button onClick={()=>setOpenReg(true)} className="hover:underline">Регистрация</button>
            <span>🇱🇹 EUR</span>
            <span>Помощь</span>
          </div>
        </div>
      </div>

      {/* Header with logo + search + cart */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-12 items-center gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="text-2xl font-extrabold text-brand-orange">MedExpress</div>
            <div className="text-xs text-neutral-500">Антипаразитарные средства</div>
          </div>
          <div className="col-span-12 md:col-span-7">
            <div className="flex">
              <input value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 border rounded-l px-3 py-2 outline-none" placeholder="Поиск: ivermectin, fenbendazole, mebendazole..." />
              <button className="px-4 py-2 bg-brand-orange text-white rounded-r">Поиск</button>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Популярное: ivermectin • fenbendazole • mebendazole</div>
          </div>
          <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-3">
            <button onClick={()=>document.getElementById("cart")?.scrollIntoView({behavior:"smooth"})} className="relative border px-3 py-2 rounded">
              Корзина
              {itemsDetailed.length>0 && <span className="absolute -top-2 -right-2 text-[10px] ali-badge rounded-full px-2 py-0.5">{itemsDetailed.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Content: left cat menu + product grid */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Left menu */}
        <aside className="hidden md:block col-span-3">
          <div className="bg-white shadow-card rounded">
            <div className="px-3 py-2 font-semibold border-b">Категории</div>
            <ul className="text-sm">
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Антипаразитарные</li>
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Антигельминтные</li>
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Доставка по ЕС</li>
            </ul>
          </div>
          <div className="bg-white shadow-card rounded mt-4 p-3 text-sm">
            <div className="font-semibold mb-2">Купоны магазина</div>
            <div className="ali-badge rounded px-2 py-1 inline-block">-5€ от 50€</div>
          </div>
        </aside>

        {/* Product grid */}
        <section className="col-span-12 md:col-span-9 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white shadow-card rounded overflow-hidden group">
              <div className="relative">
                <img src={p.img} alt={p.name} className="w-full h-44 object-cover group-hover:scale-[1.02] transition" />
                <div className="absolute top-2 left-2 ali-badge text-xs rounded px-2 py-0.5">-{
                  Math.max(0, Math.round((1 - p.price/(p.oldPrice||p.price))*100))
                }%</div>
              </div>
              <div className="p-3">
                <div className="h-12 text-sm">{p.name}</div>
                <div className="flex items-end gap-2 mt-2">
                  <div className="text-xl font-semibold">{currency(p.price)}</div>
                  {p.oldPrice && <div className="text-neutral-400 line-through">{currency(p.oldPrice)}</div>}
                </div>
                <div className="text-[12px] text-neutral-500 mt-1">★ {p.rating} • Продано: {p.sold}</div>

                {/* qty + add */}
                <div className="mt-3 flex items-center gap-2">
                  <button className="px-2 border rounded" onClick={()=>addToCart(p.id, -1)}>-</button>
                  <div className="w-10 text-center">{cart.find(c=>c.id===p.id)?.qty || 0}</div>
                  <button className="px-2 border rounded" onClick={()=>addToCart(p.id, 1)}>+</button>
                  <button className="flex-1 bg-brand-red text-white rounded py-2" onClick={()=>addToCart(p.id, 1)}>В корзину</button>
                </div>

                <div className="text-[11px] text-neutral-500 mt-2">{p.unit}</div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Cart/Checkout like AliExpress right column */}
      <section id="cart" className="max-w-7xl mx-auto px-4 pb-10 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded shadow-card">
          <div className="px-4 py-3 border-b font-semibold">Корзина</div>
          <div>
            {itemsDetailed.length===0 ? (
              <div className="p-4 text-sm text-neutral-600">Пусто. Добавьте товары.</div>
            ) : itemsDetailed.map(i => (
              <div key={i.id} className="px-4 py-3 border-b flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={i.img} alt={i.name} className="h-16 w-16 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-neutral-500">Цена: {currency(i.price)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 border rounded" onClick={()=>setQty(i.id, i.qty-1)}>-</button>
                  <input className="w-12 text-center border rounded py-1" value={i.qty} onChange={e=>setQty(i.id, parseInt(e.target.value.replace(/\D/g,''))||1)} />
                  <button className="px-2 border rounded" onClick={()=>setQty(i.id, i.qty+1)}>+</button>
                </div>
                <div className="w-24 text-right font-semibold">{currency(i.line)}</div>
                <button className="text-brand-red" onClick={()=>removeFromCart(i.id)}>Удалить</button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded shadow-card p-4">
            <div className="font-semibold mb-2">Итого</div>
            <div className="text-sm flex justify-between"><span>Товары</span><span>{currency(subtotal)}</span></div>
            <div className="text-sm flex justify-between"><span>Доставка</span><span>{currency(shipping)}</span></div>
            <div className="border-t mt-2 pt-2 font-semibold flex justify-between"><span>Всего</span><span>{currency(total)}</span></div>
            <div className="grid gap-2 mt-3">
              <button disabled={submitting} onClick={()=>placeOrder("paypal")} className="bg-brand-orange text-white rounded py-2">{submitting? "..." : "Оплатить PayPal (демо)"}</button>
              <button disabled={submitting} onClick={()=>placeOrder("paysera")} className="border rounded py-2">{submitting? "..." : "Оплатить Paysera (демо)"}</button>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2">Перед оплатой войдите и подтвердите email.</div>
          </div>
        </div>
      </section>

      {/* Registration modal */}
      {openReg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-card w-full max-w-md p-4">
            <div className="text-lg font-semibold mb-2">Регистрация / Профиль</div>
            <div className="grid gap-2">
              <input className="border p-2 rounded" placeholder="Имя" value={profile.firstName} onChange={e=>setProfile({...profile, firstName: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Фамилия" value={profile.lastName} onChange={e=>setProfile({...profile, lastName: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Адрес (улица, дом)" value={profile.address} onChange={e=>setProfile({...profile, address: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Город" value={profile.city} onChange={e=>setProfile({...profile, city: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Страна" value={profile.country} onChange={e=>setProfile({...profile, country: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Postcode" value={profile.postcode} onChange={e=>setProfile({...profile, postcode: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Email" value={profile.email} onChange={e=>setProfile({...profile, email: e.target.value})}/>
              <input className="border p-2 rounded" placeholder="Телефон" value={profile.phone} onChange={e=>setProfile({...profile, phone: e.target.value})}/>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-1 border rounded" onClick={()=>setOpenReg(false)}>Отмена</button>
              <button className="px-3 py-1 bg-brand-orange text-white rounded" onClick={()=>{ setOpenReg(false); alert("Профиль сохранён"); }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Login modal */}
      {openLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-card w-full max-w-sm p-4">
            <div className="text-lg font-semibold mb-2">Вход по Email</div>
            <input className="border p-2 rounded w-full mb-2" placeholder="Email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>{ setOpenLogin(false); setOpenReg(true); }}>Регистрация</button>
              <button className="px-3 py-1 bg-brand-orange text-white rounded" onClick={()=>{ if(!loginEmail){ alert("Введите email"); return; } const ok=sendCode(loginEmail); if(ok){ setOpenVerify(true); } }}>Отправить код</button>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2">Демо-режим: код выводится в консоль браузера и сохраняется локально.</div>
          </div>
        </div>
      )}

      {/* Verify modal */}
      {openVerify && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-card w-full max-w-sm p-4">
            <div className="text-lg font-semibold mb-2">Подтвердите Email</div>
            <input className="border p-2 rounded w-full mb-2" placeholder="Код (6 цифр)" id="codeInput" />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>setOpenVerify(false)}>Отмена</button>
              <button className="px-3 py-1 bg-brand-orange text-white rounded" onClick={()=>{ const code=(document.getElementById("codeInput")?.value||"").replace(/\D/g,""); const ok=verify(loginEmail, code); if(ok){ setOpenVerify(false); setOpenLogin(false); } else { alert("Неверный код"); } }}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-neutral-500 grid md:grid-cols-3 gap-4">
          <div><div className="font-semibold text-neutral-700 mb-1">MedExpress</div><p>Демо‑сайт в стиле AliExpress. Фото — стоки. Соблюдайте законы и требования к продаже лекарств в вашей стране.</p></div>
          <div><div className="font-semibold text-neutral-700 mb-1">Оплата</div><ul className="list-disc list-inside"><li>PayPal (демо)</li><li>Paysera (демо)</li></ul></div>
          <div><div className="font-semibold text-neutral-700 mb-1">Контакты</div><p>support@example.com</p></div>
        </div>
      </footer>
    </div>
  );
}

function toast(msg){
  const div = document.createElement("div");
  div.textContent = msg;
  div.style.position="fixed"; div.style.bottom="16px"; div.style.left="50%"; div.style.transform="translateX(-50%)";
  div.style.background="#111"; div.style.color="#fff"; div.style.padding="8px 12px"; div.style.borderRadius="8px"; div.style.fontSize="12px";
  div.style.zIndex=9999; div.style.opacity="0.95";
  document.body.appendChild(div);
  setTimeout(()=>{ div.remove(); }, 1500);
}
