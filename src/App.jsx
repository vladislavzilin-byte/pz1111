import React, { useEffect, useMemo, useState } from "react";

// --- Data ---
const PRODUCTS = [
  { id: "ivermectin", name: "Ivermectin", price: 19.9, oldPrice: 26.9, rating: 4.8, sold: 312, unit: "per pack", img: "https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop", desc: "Antiparasitic. Follow local laws and consult a physician." },
  { id: "fenbendazole", name: "Fenbendazole", price: 24.5, oldPrice: 29.9, rating: 4.7, sold: 201, unit: "per pack", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop", desc: "Benzimidazole anthelmintic." },
  { id: "mebendazole", name: "Mebendazole", price: 17.0, oldPrice: 22.0, rating: 4.9, sold: 498, unit: "per pack", img: "https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop", desc: "Anthelmintic; prescription may be required." },
];
const emptyProfile = { firstName: "", lastName: "", address: "", city: "", country: "", postcode: "", email: "", phone: "" };
function currency(n){ return new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR"}).format(n); }

export default function App(){
  const [view, setView] = useState("home"); // 'home' | 'account'
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(()=>{ try{ const raw = localStorage.getItem("profile"); return raw? JSON.parse(raw): emptyProfile; }catch{ return emptyProfile; } });
  const [auth, setAuth] = useState(()=>{ try{ const raw = localStorage.getItem("auth"); return raw? JSON.parse(raw): null; }catch{ return null; } });

  const [openReg, setOpenReg] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openVerify, setOpenVerify] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [codeImgUrl, setCodeImgUrl] = useState(null);
  const [lastCode, setLastCode] = useState("");

  useEffect(()=>{ localStorage.setItem("profile", JSON.stringify(profile)); },[profile]);
  useEffect(()=>{ localStorage.setItem("auth", JSON.stringify(auth)); },[auth]);

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

  // cart
  function addToCart(id, qty=1){
    if(qty<=0) return;
    setCart(prev => {
      const f = prev.find(i=>i.id===id);
      if(f) return prev.map(i => i.id===id? {...i, qty: i.qty+qty} : i);
      return [...prev, {id, qty}];
    });
  }
  function setQty(id, qty){ setCart(prev => prev.map(i => i.id===id? {...i, qty: Math.max(1, Math.min(999, Math.floor(qty||1)))} : i)); }
  function removeFromCart(id){ setCart(prev => prev.filter(i => i.id !== id)); }

  // login with visible code image (demo)
  function genCode(){ return Math.floor(100000 + Math.random() * 900000).toString(); }
  function renderCodeImagePNG(code){
    const w=260,h=90;
    const canvas=document.createElement("canvas");
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext("2d");
    // bg
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h);
    // noise squares
    for(let i=0;i<40;i++){ 
      ctx.fillStyle=`hsla(${Math.random()*360},50%,85%,0.8)`; 
      const s=6+Math.random()*8; ctx.fillRect(Math.random()*w, Math.random()*h, s, s);
    }
    // frame
    ctx.strokeStyle="#16a34a"; ctx.lineWidth=3; ctx.strokeRect(4,4,w-8,h-8);
    // code
    ctx.fillStyle="#111"; ctx.font="bold 36px system-ui, -apple-system, Segoe UI, Roboto"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(code, 18, h/2);
    return canvas.toDataURL("image/png");
  }
  function sendCode(email){
    const code = genCode();
    try{
      const raw = localStorage.getItem("email_verif_codes"); const store = raw? JSON.parse(raw): {};
      store[email] = { code, ts: Date.now() };
      localStorage.setItem("email_verif_codes", JSON.stringify(store));
      setLastCode(code); setCodeImgUrl(renderCodeImagePNG(code));
      return true;
    }catch{ return false; }
  }
  function verify(email, code){
    const raw = localStorage.getItem("email_verif_codes"); const store = raw? JSON.parse(raw): {};
    const entry = store[email]; if(!entry) return false;
    if(entry.code === code){ setAuth({ email, verified: true }); return true; }
    return false;
  }
  function signOut(){ setAuth(null); setView("home"); }

  // ----- UI Sections -----
  function TopBar(){
    return (
      <div className="bg-neutral-900 text-neutral-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between">
          <div>Добро пожаловать в <b>MedExpress</b></div>
          <div className="flex gap-4 items-center">
            {auth && auth.verified ? (
              <div className="relative group">
                <button className="hover:underline">Welcome back, {auth.email}</button>
                <div className="absolute right-0 mt-2 hidden group-hover:block bg-white text-neutral-700 shadow-card rounded w-64 p-3 z-30">
                  <div className="text-sm mb-2">Личный кабинет</div>
                  <div className="text-sm grid gap-2">
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>My Orders</button>
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>My Coins</button>
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>Message Center (17)</button>
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>Payment</button>
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>Wish List</button>
                    <button className="text-left hover:underline" onClick={()=>setView("account")}>My Coupons</button>
                  </div>
                  <div className="border-t my-2"></div>
                  <div className="text-xs text-neutral-500">Settings</div>
                  <div className="text-sm grid gap-1 mb-2">
                    <button className="text-left text-neutral-500">Return & refund policy</button>
                    <button className="text-left text-neutral-500">Help Center</button>
                    <button className="text-left text-neutral-500">Disputes & Reports</button>
                  </div>
                  <button className="text-left text-red-600 hover:underline" onClick={signOut}>Sign Out</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={()=>setOpenLogin(true)} className="hover:underline">Войти</button>
                <button onClick={()=>setOpenReg(true)} className="hover:underline">Регистрация</button>
              </>
            )}
            <span>🇱🇹 EUR</span>
            <span>Помощь</span>
          </div>
        </div>
      </div>
    );
  }

  function Header(){
    return (
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-12 items-center gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="text-2xl font-extrabold text-brand-orange">MedExpress</div>
            <div className="text-xs text-neutral-500">Антипаразитарные средства</div>
          </div>
          <div className="col-span-12 md:col-span-7">
            <div className="flex">
              <input value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 border rounded-l px-3 py-2 outline-none" placeholder="Поиск товаров..." />
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
    );
  }

  function Catalog(){
    return (
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="hidden md:block col-span-3">
          <div className="bg-white shadow-card rounded">
            <div className="px-3 py-2 font-semibold border-b">Категории</div>
            <ul className="text-sm">
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Антипаразитарные</li>
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Антигельминтные</li>
              <li className="px-3 py-2 hover:bg-neutral-50 cursor-pointer">Доставка по ЕС</li>
            </ul>
          </div>
        </aside>
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
    );
  }

  function CartTotals(){
    return (
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
              <button className="bg-brand-orange text-white rounded py-2">Оплатить PayPal (демо)</button>
              <button className="border rounded py-2">Оплатить Paysera (демо)</button>
            </div>
            <div className="text-[11px] text-neutral-500 mt-2">Перед оплатой войдите и подтвердите email.</div>
          </div>
        </div>
      </section>
    );
  }

  function Account(){
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white rounded shadow-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-neutral-200"></div>
              <div className="text-sm">Welcome back<br/><b>{auth?.email}</b></div>
            </div>
            <button className="mt-3 text-xs text-red-600 hover:underline" onClick={signOut}>Sign Out</button>
          </div>
          <nav className="bg-white rounded shadow-card mt-4 text-sm">
            <div className="px-4 py-2 font-semibold border-b">Меню</div>
            <ul>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">My Orders</li>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">My Coins</li>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">Message Center (17)</li>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">Payment</li>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">Wish List</li>
              <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">My Coupons</li>
              <div className="border-t my-2"></div>
              <li className="px-4 py-2 text-neutral-500">Return & refund policy</li>
              <li className="px-4 py-2 text-neutral-500">Help Center</li>
              <li className="px-4 py-2 text-neutral-500">Disputes & Reports</li>
            </ul>
          </nav>
        </aside>
        <section className="col-span-12 md:col-span-9">
          <div className="bg-white rounded shadow-card p-4">
            <div className="text-lg font-semibold mb-2">Dashboard</div>
            <p className="text-sm text-neutral-600">Это демонстрационный «личный кабинет» в стиле AliExpress. Здесь можно вывести ваши заказы, сообщения, список желаемого и т. д.</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Stat label="Orders" value="0" />
              <Stat label="Messages" value="17" />
              <Stat label="Coupons" value="3" />
            </div>
          </div>
        </section>
      </div>
    );
  }
  function Stat({label,value}){ return (
    <div className="border rounded p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  );}

  return (
    <div className="min-h-screen bg-neutral-50">
      {TopBar()}
      {Header()}
      {view==="home" ? (<>
        {Catalog()}
        {CartTotals()}
      </>) : (<Account />)}

      {/* Login modal with image code like screenshot */}
      {openLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-card w-full max-w-md p-4">
            <div className="text-lg font-semibold">Register</div>
            <p className="text-sm text-neutral-600 mb-3">Enter code shown on the image below (in production it would be sent to the provided email):</p>
            <div className="bg-white">
              {codeImgUrl ? (
                <img src={codeImgUrl} alt="Code" className="border rounded-md mb-2" />
              ) : (
                <div className="h-[90px] w-[260px] border rounded-md grid place-items-center text-neutral-400">No code yet</div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input id="codeField" className="border rounded px-3 py-2 flex-1" placeholder="Code" />
              <button className="bg-green-600 text-white rounded px-4" onClick={()=>{
                const code = document.getElementById("codeField").value.trim();
                if(!loginEmail){ alert("Введите email вверху"); return; }
                if(verify(loginEmail, code)){ setOpenLogin(false); setView("account"); alert("Готово! Email подтверждён"); }
                else alert("Неверный код");
              }}>Verify & complete</button>
              <button className="border rounded px-3" onClick={()=>{ if(!loginEmail){ const em=prompt("Введите email для отправки кода:",""); if(em){ setLoginEmail(em); } else return; } sendCode(loginEmail); }}>Refresh code</button>
            </div>
            <div className="mt-3 text-xs text-neutral-500">Email: <input className="border rounded px-2 py-1 text-xs" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="you@email.com" /></div>
          </div>
        </div>
      )}

      {/* Simple footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-neutral-500 grid md:grid-cols-3 gap-4">
          <div><div className="font-semibold text-neutral-700 mb-1">MedExpress</div><p>Демо‑сайт. Фото — стоки. Соблюдайте местные законы.</p></div>
          <div><div className="font-semibold text-neutral-700 mb-1">Оплата</div><p>PayPal / Paysera (демо)</p></div>
          <div><div className="font-semibold text-neutral-700 mb-1">Контакты</div><p>support@example.com</p></div>
        </div>
      </footer>
    </div>
  );
}
