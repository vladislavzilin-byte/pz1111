import React, {useEffect,useState} from "react";
const API = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function App(){
  const [email,setEmail]=useState("");
  const [codeImg,setCodeImg]=useState(null);
  const [demoCode,setDemoCode]=useState("");
  const [me,setMe]=useState(null);

  async function sendCode(){
    if(!email) return alert("Введите email");
    const r=await fetch(`${API}/api/auth/send-code`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email})});
    const j=await r.json();
    if(j.ok){ setDemoCode(j.demoCode||""); setCodeImg(draw(j.demoCode||"000000")); alert("Код отправлен (demo)"); }
    else alert("Ошибка");
  }
  function draw(code){
    const w=300,h=120; const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h; const ctx=canvas.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#16a34a"; ctx.lineWidth=4; ctx.strokeRect(6,6,w-12,h-12); ctx.fillStyle="#111"; ctx.font="bold 48px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(code,w/2,h/2); return canvas.toDataURL("image/png");
  }
  async function verify(){
    const code=document.getElementById("codeInput").value.replace(/\D/g,"");
    if(!code) return alert("Введите код");
    const r=await fetch(`${API}/api/auth/verify`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email,code})});
    const j=await r.json();
    if(j.ok){ setCodeImg(null); setDemoCode(""); await fetchMe(); alert("Успешно"); }
    else alert("Неверный код");
  }
  async function fetchMe(){ try{ const r=await fetch(`${API}/api/me`,{credentials:"include"}); const j=await r.json(); if(j.ok) setMe(j.email); else setMe(null);}catch{setMe(null);} }
  async function logout(){ await fetch(`${API}/api/auth/logout`,{method:"POST",credentials:"include"}); setMe(null); }

  useEffect(()=>{ fetchMe(); },[]);

  return (<div className="p-6">
    <div className="max-w-lg mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Secure Login V2</h2>
      {me ? (<div>Signed in as <b>{me}</b> <button onClick={logout} className="ml-3">Sign Out</button></div>) : (
        <div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="border p-2 w-full mb-2" />
          <div className="flex gap-2 mb-2">
            <button onClick={sendCode} className="bg-green-600 text-white px-3 py-1 rounded">Send code</button>
            <button onClick={()=>{ setCodeImg(draw(demoCode||"000000")); }} className="border px-3 py-1 rounded">Re-draw</button>
          </div>
          {codeImg && <img src={codeImg} alt="code" className="mb-2 border rounded" />}
          <div className="flex gap-2">
            <input id="codeInput" className="border p-2 flex-1" placeholder="Code" />
            <button onClick={verify} className="bg-blue-600 text-white px-3 py-1 rounded">Verify</button>
          </div>
        </div>
      )}
    </div>
  </div>);
}
