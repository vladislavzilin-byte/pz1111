import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const PRODUCTS = [
  { id: "ivermectin", name: "Ivermectin", price: 19.9, oldPrice: 26.9, rating: 4.8, sold: 312, unit: "per pack", img: "https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop", desc: "Antiparasitic." },
  { id: "fenbendazole", name: "Fenbendazole", price: 24.5, oldPrice: 29.9, rating: 4.7, sold: 201, unit: "per pack", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop", desc: "Benzimidazole anthelmintic." },
  { id: "mebendazole", name: "Mebendazole", price: 17.0, oldPrice: 22.0, rating: 4.9, sold: 498, unit: "per pack", img: "https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop", desc: "Anthelmintic." },
];
const emptyProfile = { firstName:"", lastName:"", address:"", city:"", country:"", postcode:"", email:"", phone:"" };
function currency(n){ return new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR"}).format(n); }

export default function App(){
  const [view, setView] = useState("home");
  const [search,setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(()=>{ try{ const raw=localStorage.getItem("profile"); return raw? JSON.parse(raw): emptyProfile; }catch{ return emptyProfile; } });
  const [authEmail, setAuthEmail] = useState(null);

  const [openLogin, setOpenLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [codeImgUrl, setCodeImgUrl] = useState(null);
  const [lastCode, setLastCode] = useState("");

  useEffect(()=>{ localStorage.setItem("profile", JSON.stringify(profile)); },[profile]);

  async function fetchMe(){
    try{
      const r = await fetch(`${API}/api/me`, { credentials: "include" });
      const j = await r.json();
      if(j.ok){ setAuthEmail(j.email); } else { setAuthEmail(null); }
    }catch{ setAuthEmail(null); }
  }
  useEffect(()=>{ fetchMe(); },[]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return PRODUCTS;
    return PRODUCTS.filter(p => [p.name,p.desc].join(" ").toLowerCase().includes(q));
  },[search]);
  const itemsDetailed = useMemo(()=> cart.map(ci=>{
    const p=PRODUCTS.find(pr=>pr.id===ci.id);
    return p? {...p, qty:ci.qty, line:p.price*ci.qty}:null;
  }).filter(Boolean),[cart]);
  const subtotal=itemsDetailed.reduce((s,i)=>s+i.line,0);
  const shipping=subtotal>0?4.9:0;
  const total=subtotal+shipping;

  function addToCart(id,qty=1){
    if(qty<=0)return;
    setCart(prev=>{
      const f=prev.find(i=>i.id===id);
      if(f) return prev.map(i=>i.id===id?{...i,qty:i.qty+qty}:i);
      return [...prev,{id,qty}];
    });
  }
  function setQty(id,qty){ setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,Math.min(999,Math.floor(qty||1)))}:i)); }
  function removeFromCart(id){ setCart(prev=>prev.filter(i=>i.id!==id)); }

  function drawCodePNG(code){
    const w=300,h=120;
    const canvas=document.createElement("canvas");
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#f7f7f7"; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#16a34a"; ctx.lineWidth=4; ctx.strokeRect(6,6,w-12,h-12);
    ctx.fillStyle="#111"; ctx.font="bold 48px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(code,w/2,h/2);
    return canvas.toDataURL("image/png");
  }
  async function sendCode(){
    if(!loginEmail){ alert("Введите email"); return; }
    const r = await fetch(`${API}/api/auth/send-code`, { method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include", body: JSON.stringify({ email: loginEmail }) });
    const j = await r.json();
    if(j.ok){ setLastCode(j.demoCode||""); setCodeImgUrl(drawCodePNG(j.demoCode||"000000")); } else { alert("Ошибка отправки кода"); }
  }
  async function verifyCode(){
    const code = document.getElementById("codeInput")?.value?.replace(/\D/g,"");
    if(!code){ alert("Введите код"); return; }
    const r = await fetch(`${API}/api/auth/verify`, { method:"POST", headers:{ "Content-Type":"application/json" }, credentials:"include", body: JSON.stringify({ email: loginEmail, code }) });
    const j = await r.json();
    if(j.ok){ setOpenLogin(false); setCodeImgUrl(null); setLastCode(""); await fetchMe(); setView("account"); }
    else alert("Неверный код");
  }
  async function logout(){
    await fetch(`${API}/api/auth/logout`, { method:"POST", credentials:"include" });
    setAuthEmail(null); setView("home");
  }

  function TopBar(){ return (
    <div className="bg-neutral-900 text-neutral-200 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between">
        <div>Добро пожаловать в <b>MedExpress</b></div>
        <div className="flex gap-4 items-center">
          {authEmail ? (
            <div className="relative group">
              <button className="hover:underline">Welcome back, {authEmail}</button>
              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white text-neutral-700 shadow rounded w-64 p-3 z-30">
                <div className="text-sm mb-2">Личный кабинет</div>
                <div className="text-sm grid gap-2">
                  <button className="text-left hover:underline" onClick={()=>setView("account")}>My Orders</button>
                  <button className="text-left hover:underline" onClick={()=>setView("account")}>Message Center (17)</button>
                  <button className="text-left hover:underline" onClick={()=>setView("account")}>Payment</button>
                </div>
                <div className="border-t my-2"></div>
                <button className="text-left text-red-600 hover:underline" onClick={logout}>Sign Out</button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={()=>setOpenLogin(true)} className="hover:underline">Войти</button>
              <button onClick={()=>alert("Регистрация — заполните профиль при оформлении заказа")} className="hover:underline">Регистрация</button>
            </>
          )}
          <span>🇱🇹 EUR</span>
          <span>Помощь</span>
        </div>
      </div>
    </div>
  );}

  function Header(){ return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 md:col-span-3">
          <div className="text-2xl font-extrabold text-orange-500">MedExpress</div>
          <div className="text-xs text-neutral-500">Антипаразитарные средства</div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <div className="flex">
            <input value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 border rounded-l px-3 py-2 outline-none" placeholder="Поиск товаров..." />
            <button className="px-4 py-2 bg-orange-500 text-white rounded-r">Поиск</button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-3">
          <button onClick={()=>document.getElementById("cart")?.scrollIntoView({behavior:"smooth"})} className="relative border px-3 py-2 rounded">
            Корзина
            {itemsDetailed.length>0 && <span className="absolute -top-2 -right-2 text-[10px] ali-badge rounded-full px-2 py-0.5">{itemsDetailed.length}</span>}
          </button>
        </div>
      </div>
    </header>
  );}

  function Catalog(){ return (
    <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      <section className="col-span-12 md:col-span-9 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white shadow rounded overflow-hidden group">
            <div className="relative"><img src={p.img} alt={p.name} className="w-full h-44 object-cover group-hover:scale-[1.02] transition" /></div>
            <div className="p-3">
              <div className="h-12 text-sm">{p.name}</div>
              <div className="flex items-end gap-2 mt-2">
                <div className="text-xl font-semibold">{currency(p.price)}</div>
                {p.oldPrice && <div className="text-neutral-400 line-through">{currency(p.oldPrice)}</div>}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">★ {p.rating} • Продано: {p.sold}</div>
              <div className="mt-3 flex items-center gap-2">
                <button className="px-2 border rounded" onClick={()=>addToCart(p.id, -1)}>-</button>
                <div className="w-10 text-center">{cart.find(c=>c.id===p.id)?.qty || 0}</div>
                <button className="px-2 border rounded" onClick={()=>addToCart(p.id, 1)}>+</button>
                <button className="flex-1 bg-red-500 text-white rounded py-2" onClick={()=>addToCart(p.id, 1)}>В корзину</button>
              </div>
              <div className="text-[11px] text-neutral-500 mt-2">{p.unit}</div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );}

  function CartTotals(){ return (
    <section id="cart" className="max-w-7xl mx-auto px-4 pb-10 grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 bg-white rounded shadow">
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
              <button className="text-red-500" onClick={()=>removeFromCart(i.id)}>Удалить</button>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2">Итого</div>
          <div className="text-sm flex justify-between"><span>Товары</span><span>{currency(subtotal)}</span></div>
          <div className="text-sm flex justify-between"><span>Доставка</span><span>{currency(shipping)}</span></div>
          <div className="border-t mt-2 pt-2 font-semibold flex justify-between"><span>Всего</span><span>{currency(total)}</span></div>
          <div className="grid gap-2 mt-3">
            <button className="bg-orange-500 text-white rounded py-2">Оплатить PayPal (демо)</button>
            <button className="border rounded py-2">Оплатить Paysera (демо)</button>
          </div>
        </div>
      </div>
    </section>
  );}

  function Account(){ return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3">
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-neutral-200"></div><div className="text-sm">Welcome back<br/><b>{authEmail}</b></div></div>
          <button className="mt-3 text-xs text-red-600 hover:underline" onClick={async()=>{ await fetch(`${API}/api/auth/logout`, { method:"POST", credentials:"include" }); setAuthEmail(null); setView("home"); }}>Sign Out</button>
        </div>
        <nav className="bg-white rounded shadow mt-4 text-sm">
          <div className="px-4 py-2 font-semibold border-b">Меню</div>
          <ul>
            <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">My Orders</li>
            <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">Message Center (17)</li>
            <li className="px-4 py-2 hover:bg-neutral-50 cursor-pointer">Payment</li>
          </ul>
        </nav>
      </aside>
      <section className="col-span-12 md:col-span-9">
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-2">Dashboard</div>
          <p className="text-sm text-neutral-600">Здесь появятся заказы, сообщения и купоны.</p>
        </div>
      </section>
    </div>
  );}

  return (
    <div className="min-h-screen bg-neutral-50">
      {TopBar()}
      {Header()}
      {view==="home" ? (<><Catalog/><CartTotals/></>) : (<Account/>)}

      {openLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow w-full max-w-md p-4">
            <div className="text-lg font-semibold">Register</div>
            <p className="text-sm text-neutral-600 mb-3">Enter code shown on the image:</p>
            <div className="bg-white">
              {codeImgUrl ? (<img src={codeImgUrl} alt="Code" className="border rounded-md mb-2" />) : (<div className="h-[120px] w-[300px] border rounded-md grid place-items-center text-neutral-400">No code yet</div>)}
            </div>
            <div className="flex gap-2 mt-2">
              <input id="codeInput" className="border rounded px-3 py-2 flex-1" placeholder="Code" />
              <button className="bg-green-600 text-white rounded px-4" onClick={verifyCode}>Verify & complete</button>
              <button className="border rounded px-3" onClick={sendCode}>Refresh code</button>
            </div>
            <div className="mt-3 text-xs text-neutral-500">Email: <input className="border rounded px-2 py-1 text-xs" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="you@email.com" /></div>
          </div>
        </div>
      )}
    </div>
  );
}
