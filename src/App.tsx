import React, { useEffect, useMemo, useState } from "react";


const subtotal = itemsDetailed.reduce((s, i) => s + i.line, 0);
const shipping = subtotal > 0 ? 4.9 : 0;
const total = subtotal + shipping;


function addToCart(id: string, qty = 1) {
setCart(prev => {
const found = prev.find(i => i.id === id);
if (found) return prev.map(i => (i.id === id ? { ...i, qty: i.qty + qty } : i));
return [...prev, { id, qty }];
});
toast.success("Добавлено в корзину");
}


function setQty(id: string, qty: number) {
setCart(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
}


function removeFromCart(id: string) {
setCart(prev => prev.filter(i => i.id !== id));
}


async function placeOrder(provider: "paypal" | "paysera") {
if (!profile.firstName || !profile.lastName || !profile.address || !profile.email) {
toast.error("Сначала заполните регистрацию (имя, фамилия, адрес доставки, email)");
setOpenReg(true);
return;
}
if (itemsDetailed.length === 0) {
toast.error("Корзина пуста");
return;
}
setSubmitting(true);
await new Promise(r => setTimeout(r, 800));
setSubmitting(false);
toast.success(`Заказ создан. Провайдер: ${provider.toUpperCase()}. (демо)`, { duration: 4000 });
}


return (
<div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
<Toaster position="top-center" richColors />


{/* Catalog */}
<section id="catalog" className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
{PRODUCTS.map(p => (
<Card key={p.id} className="rounded-2xl shadow-sm">
<CardHeader className="p-0">
<div className="aspect-[4/3] overflow-hidden rounded-t-2xl">
<img src={p.img} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition"/>
</div>
</CardHeader>
<CardContent className="p-4">
<div className="flex items-start justify-between">
<div>
<h3 className="font-semibold text-lg">{p.name}</h3>
<p className="text-slate-600 text-sm mt-1">{p.desc}</p>
</div>
<div className="text-right ml-3">
<div className="font-semibold">{currency(p.price)}</div>
<div className="text-xs text-slate-500">{p.unit}</div>
</div>
</div>
<div className="flex items-center mt-3 gap-2">
<Button size="icon" onClick={()=>addToCart(p.id, -1)}><Minus className="h-4 w-4"/></Button>
<span className="font-semibold">{cart.find(c=>c.id===p.id)?.qty || 0}</span>
<Button size="icon" onClick={()=>addToCart(p.id, 1)}><Plus className="h-4 w-4"/></Button>
</div>
</CardContent>
<CardFooter className="p-4 pt-0">
<Button className="w-full" onClick={()=>addToCart(p.id, 1)}>
<ShoppingCart className="h-4 w-4 mr-2"/>Добавить
</Button>
</CardFooter>
</Card>
))}
</section>


{/* Cart */}
<section id="cart" className="max-w-6xl mx-auto px-4 py-10">
{itemsDetailed.map(i => (
<div key={i.id} className="flex items-center justify-between py-4 border-b">
<div className="flex items-center gap-4">
<img src={i.img} alt={i.name} className="h-16 w-16 rounded-md object-cover"/>
<div>
<div className="font-medium">{i.name}</div>
<div className="text-sm text-slate-500">{currency(i.price)} × {i.qty}</div>
</div>
</div>
<div className="flex items-center gap-2">
<Button size="icon" onClick={()=>setQty(i.id, i.qty-1)}><Minus className="h-4 w-4"/></Button>
<span>{i.qty}</span>
<Button size="icon" onClick={()=>setQty(i.id, i.qty+1)}><Plus className="h-4 w-4"/></Button>
<div className="w-24 text-right font-medium">{currency(i.line)}</div>
<Button variant="ghost" size="icon" onClick={()=>removeFromCart(i.id)}>
<Trash2 className="h-4 w-4"/>
</Button>
</div>
</div>
))}
</section>
</div>
);
}
