import React, { useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  { id: "ivermectin", name: "Ivermectin", price: 19.9, oldPrice: 26.9, rating: 4.8, sold: 312, unit: "per pack", img: "https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop", desc: "Antiparasitic. Follow local laws." },
  { id: "fenbendazole", name: "Fenbendazole", price: 24.5, oldPrice: 29.9, rating: 4.7, sold: 201, unit: "per pack", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop", desc: "Benzimidazole anthelmintic." },
  { id: "mebendazole", name: "Mebendazole", price: 17.0, oldPrice: 22.0, rating: 4.9, sold: 498, unit: "per pack", img: "https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop", desc: "Anthelmintic. Prescription may be required." },
];

const emptyProfile = { firstName:"", lastName:"", address:"", city:"", country:"", postcode:"", email:"", phone:"" };
function currency(n){ return new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR"}).format(n); }

export default function App(){
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(()=>{ try{ const raw=localStorage.getItem("profile"); return raw? JSON.parse(raw): emptyProfile; }catch{return emptyProfile;} });
  const [auth, setAuth] = useState(()=>{ try{ const raw=localStorage.getItem("auth"); return raw? JSON.parse(raw): null; }catch{return null;} });
  const [openLogin,setOpenLogin] = useState(false);
  const [openVerify,setOpenVerify] = useState(false);
  const [loginEmail,setLoginEmail] = useState("");
  const [lastCode,setLastCode] = useState("");
  const [codeImgUrl,setCodeImgUrl] = useState(null);

  const itemsDetailed = useMemo(()=>cart.map(ci=>{
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
      if(f)return prev.map(i=>i.id===id?{...i,qty:i.qty+qty}:i);
      return [...prev,{id,qty}];
    });
  }
  function setQty(id,qty){ setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,qty)}:i)); }
  function removeFromCart(id){ setCart(prev=>prev.filter(i=>i.id!==id)); }

  function genCode(){ return Math.floor(100000+Math.random()*900000).toString(); }
  function renderCodeImagePNG(code){
    const w=320,h=120;
    const canvas=document.createElement("canvas");
    canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#f7f7f7"; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#ff6a00"; ctx.lineWidth=4; ctx.strokeRect(6,6,w-12,h-12);
    ctx.fillStyle="#111"; ctx.font="bold 48px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(code,w/2,h/2);
    return canvas.toDataURL("image/png");
  }
  function sendCode(email){
    const code=genCode();
    const raw=localStorage.getItem("email_verif_codes"); const store=raw?JSON.parse(raw):{};
    store[email]={code,ts:Date.now()};
    localStorage.setItem("email_verif_codes",JSON.stringify(store));
    setLastCode(code); setCodeImgUrl(renderCodeImagePNG(code));
    return true;
  }
  function verify(email,code){
    const raw=localStorage.getItem("email_verif_codes"); const store=raw?JSON.parse(raw):{};
    const entry=store[email]; if(!entry)return false;
    if(entry.code===code){ setAuth({email,verified:true}); return true; }
    return false;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MedExpress Demo (AliExpress style)</h1>
      <button onClick={()=>setOpenLogin(true)} className="px-3 py-1 border rounded">Войти</button>

      {openLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Вход по Email</h3>
            <input className="border p-2 w-full mb-2" placeholder="Email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
            <button className="px-3 py-1 bg-orange-500 text-white rounded" onClick={()=>{ if(loginEmail) sendCode(loginEmail); setOpenVerify(true); }}>Отправить код</button>
            {codeImgUrl && (
              <div className="mt-3">
                <div className="text-xs text-neutral-600 mb-1">Код для входа (демо):</div>
                <img src={codeImgUrl} alt="Demo code" className="border rounded w-full max-w-xs" />
                <div className="text-[11px] text-neutral-500 mt-1">Введите этот код ниже. (Текстом: <b>{lastCode}</b>)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {openVerify && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Подтвердите Email</h3>
            <input id="codeInput" className="border p-2 w-full mb-2" placeholder="Код (6 цифр)" />
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>{
              const code=document.getElementById("codeInput").value;
              if(verify(loginEmail, code)){ setOpenVerify(false); setOpenLogin(false); alert("Вход выполнен"); }
              else alert("Неверный код");
            }}>Подтвердить</button>
          </div>
        </div>
      )}
    </div>
  );
}
