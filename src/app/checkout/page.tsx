'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertTriangle, Lock, CreditCard, Sparkles, Droplets } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, generateOrderId } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, getCleaningTotal, setCleaning, clear } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
  })

  const subtotal = getTotal()
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 14.99
  const total = subtotal + shipping

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    const required = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip'] as const
    for (const field of required) {
      if (!form[field].trim()) {
        toast.error('Please fill in all required fields')
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.id, size: i.size, quantity: i.quantity })),
          customer: {
            email: form.email,
            name: `${form.firstName} ${form.lastName}`,
            phone: form.phone,
          },
          shipping_address: {
            line1: form.address,
            city: form.city,
            state: form.state,
            postal_code: form.zip,
            country: 'US',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      clear()
      router.push(`/checkout/confirmation?order=${data.order_number}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 flex flex-col items-center justify-center text-center px-6 md:px-12 lg:px-16">
          <CreditCard className="w-16 h-16 text-text-muted mb-4" />
          <h1 className="text-2xl font-bold mb-2">Nothing to checkout</h1>
          <p className="text-text-muted mb-6">Add some items to your cart first.</p>
          <Link href="/shop"><Button>Shop Now</Button></Link>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-6 md:px-12 lg:px-16 pb-12 pb-mobile-nav">
        <div className="max-w-5xl mx-auto">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>

          {/* Step progress */}
          <div className="flex items-center gap-2 sm:gap-3 mb-8 overflow-x-auto no-scrollbar">
            {['Shipping', 'Review', 'Payment'].map((step, i) => (
              <div key={step} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${i === 0 ? 'bg-pink text-white' : 'bg-card border border-border text-text-muted'}`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{i + 1}</span>
                  {step}
                </div>
                {i < 2 && <div className="w-6 sm:w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            {/* Shipping form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="First name *" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                  <Input placeholder="Last name *" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                  <div className="sm:col-span-2"><Input placeholder="Email *" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
                  <div className="sm:col-span-2"><Input placeholder="Phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
                  <div className="sm:col-span-2"><Input placeholder="Address *" value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
                  <Input placeholder="City *" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="State *" value={form.state} onChange={(e) => update('state', e.target.value)} />
                    <Input placeholder="ZIP *" value={form.zip} onChange={(e) => update('zip', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Cleaning Add-on for preowned items */}
              {items.some(i => i.condition === 'used' || i.condition === 'used_like_new') && (
                <div className="rounded-xl bg-card border border-[#00C2D6]/20 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-[#00C2D6]" />
                    <h2 className="text-lg font-semibold">Add Sneaker Cleaning?</h2>
                  </div>
                  <p className="text-sm text-text-muted mb-4">Get your preowned kicks looking fresh on arrival.</p>
                  <div className="space-y-3">
                    {items.filter(i => i.condition === 'used' || i.condition === 'used_like_new').map(item => (
                      <div key={item.id} className="rounded-lg bg-elevated border border-border p-4">
                        <p className="text-sm font-medium mb-3 truncate">{item.name} <span className="text-text-muted">— Size {item.size}</span></p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => setCleaning(item.id, item.cleaning === 'cleaning' ? null : 'cleaning')}
                            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              item.cleaning === 'cleaning'
                                ? 'border-[#00C2D6] bg-[#00C2D6]/10 text-[#00C2D6]'
                                : 'border-border text-text-muted hover:border-[#00C2D6]/40'
                            }`}
                          >
                            <Droplets className="w-4 h-4" />
                            Cleaning — $20
                          </button>
                          <button
                            type="button"
                            onClick={() => setCleaning(item.id, item.cleaning === 'cleaning_icing' ? null : 'cleaning_icing')}
                            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              item.cleaning === 'cleaning_icing'
                                ? 'border-[#FF2E88] bg-[#FF2E88]/10 text-[#FF2E88]'
                                : 'border-border text-text-muted hover:border-[#FF2E88]/40'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                            Cleaning + Icing — $30
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-3 leading-relaxed">
                    ⚠️ Results from icing vary by pair. Some soles bounce back to DS, others only lighten. The more yellowed the sole, the less likely a full restore. We&apos;ll always be upfront about expected results.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold mb-2">Payment</h2>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-elevated text-sm text-text-muted">
                  <Lock className="w-5 h-5 text-cyan shrink-0" />
                  Secure payment processing. Orders will be confirmed via email.
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-card border border-border p-6 sticky top-20 space-y-4">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-elevated relative shrink-0 overflow-hidden">
                        {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="56px" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-xs text-text-muted">Size {item.size} x {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-3 border-t border-border text-sm">
                  <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  {getCleaningTotal() > 0 && (
                    <div className="flex justify-between"><span className="text-text-secondary">Cleaning Services</span><span className="text-[#00C2D6]">{formatPrice(getCleaningTotal())}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-text-secondary">Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-elevated text-xs text-text-muted">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-pink mt-0.5" />
                  All sales are final. Please review your order carefully.
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
