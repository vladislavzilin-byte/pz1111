import React, { useEffect, useMemo, useState } from 'react'

const PRODUCTS = [
  {
    id: 'ivermectin',
    name: 'Ivermectin',
    price: 19.9,
    unit: 'per pack',
    img: 'https://images.unsplash.com/photo-1586015555751-63b1735d4d6e?q=80&w=1200&auto=format&fit=crop',
    desc: 'Antiparasitic. Follow local laws and consult a licensed physician where required.',
  },
  {
    id: 'fenbendazole',
    name: 'Fenbendazole',
    price: 24.5,
    unit: 'per pack',
    img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop',
    desc: 'Broad‑spectrum benzimidazole anthelmintic. Human use may be regulated; check your jurisdiction.',
  },
  {
    id: 'mebendazole',
    name: 'Mebendazole',
    price: 17.0,
    unit: 'per pack',
    img: 'https://images.unsplash.com/photo-1573883430697-4c3479aae6fc?q=80&w=1200&auto=format&fit=crop',
    desc: 'Anthelmintic. Use only as directed and per prescription requirements.',
  },
]

function currency(n) {
  return new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(n)
}

const emptyProfile = { firstName: '', lastName: '', address: '', email: '' }

export default function App() {
  const [cart, setCart] = useState([])
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem('profile')
      return raw ? JSON.parse(raw) : emptyProfile
    } catch {
      return emptyProfile
    }
  })
  const [openReg, setOpenReg] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('profile', JSON.stringify(profile)) } catch {}
  }, [profile])

  const itemsDetailed = useMemo(() =>
    cart
      .map(ci => {
        const p = PRODUCTS.find(pr => pr.id === ci.id)
        return { ...p, qty: ci.qty, line: p.price * ci.qty }
      })
      .filter(i => i && i.qty > 0),
  [cart])

  const subtotal = itemsDetailed.reduce((s, i) => s + i.line, 0)
  const shipping = subtotal > 0 ? 4.9 : 0
  const total = subtotal + shipping

  function addToCart(id) {
    setCart(prev => {
      const found = prev.find(i => i.id === id)
      if (found) return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id, qty: 1 }]
    })
    alert('Добавлено в корзину')
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  async function placeOrder(provider) {
    if (!profile.firstName || !profile.lastName || !profile.address || !profile.email) {
      alert('Сначала заполните регистрацию (имя, фамилия, адрес доставки, email)')
      setOpenReg(true)
      return
    }
    if (itemsDetailed.length === 0) {
      alert('Корзина пуста')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    alert(`Заказ создан. Провайдер: ${provider.toUpperCase()}. (демо)`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <div className="text-lg font-semibold">MedShop • Demo</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded" onClick={() => setOpenReg(true)}>Регистрация</button>
            <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth' })}>Корзина</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <section className="grid md:grid-cols-2 gap-6 items-center my-6">
          <div>
            <h1 className="text-3xl font-bold">Онлайн‑магазин антипаразитарных средств</h1>
            <p className="text-slate-600 mt-2">Ivermectin • Fenbendazole • Mebendazole. Быстрая регистрация и оплата PayPal / Paysera (демо).</p>
            <div className="mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>Перейти к товарам</button>
            </div>
          </div>
          <div className="rounded overflow-hidden shadow">
            <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop" alt="hero" className="w-full h-56 object-cover"/>
          </div>
        </section>

        <section id="catalog" className="grid md:grid-cols-3 gap-6">
          {PRODUCTS.map(p => (
            <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col">
              <div className="h-40 overflow-hidden rounded">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover"/>
              </div>
              <div className="mt-3 flex-1">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{p.desc}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-semibold">{currency(p.price)}</div>
                <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={() => addToCart(p.id)}>В корзину</button>
              </div>
            </div>
          ))}
        </section>

        <section id="cart" className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded shadow p-4">
            <h2 className="font-semibold text-xl">Корзина</h2>
            <div className="mt-4">
              {itemsDetailed.length === 0 ? (
                <p className="text-slate-600">Пусто. Добавьте товары из каталога.</p>
              ) : (
                <div className="divide-y">
                  {itemsDetailed.map(i => (
                    <div key={i.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <img src={i.img} alt={i.name} className="h-16 w-16 object-cover rounded"/>
                        <div>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-sm text-slate-500">{currency(i.price)} × {i.qty}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{currency(i.line)}</div>
                        <button className="text-sm text-red-600 mt-1" onClick={() => removeFromCart(i.id)}>Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold">Итог</h3>
            <div className="mt-3 text-sm">
              <div className="flex justify-between"><span>Сумма</span><span>{currency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Доставка</span><span>{currency(shipping)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t mt-2"><span>Итого</span><span>{currency(total)}</span></div>
            </div>
            <div className="mt-4">
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded mb-2" onClick={() => placeOrder('paypal')} disabled={submitting}>{submitting ? '...' : 'Оплата PayPal (демо)'}</button>
              <button className="w-full px-3 py-2 border rounded" onClick={() => placeOrder('paysera')} disabled={submitting}>{submitting ? '...' : 'Оплата Paysera (демо)'}</button>
            </div>
            <p className="text-xs text-slate-500 mt-3">На проде подключите реальные SDK/API провайдеров.</p>
          </div>
        </section>

        {/* Registration modal (simple) */}
        {openReg && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow max-w-md w-full p-4">
              <h4 className="font-semibold">Лёгкая регистрация</h4>
              <div className="mt-3 grid gap-2">
                <input className="border p-2 rounded" placeholder="Имя" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}/>
                <input className="border p-2 rounded" placeholder="Фамилия" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}/>
                <input className="border p-2 rounded" placeholder="Адрес доставки" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}/>
                <input className="border p-2 rounded" placeholder="Email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}/>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button className="px-3 py-1 border rounded" onClick={() => setOpenReg(false)}>Отмена</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { setOpenReg(false); alert('Профиль сохранён') }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="mt-10 py-6 text-center text-sm text-slate-500">
        Демо‑сайт. Для продажи лекарств требуется соблюдение закона и лицензирование.
      </footer>
    </div>
  )
}
