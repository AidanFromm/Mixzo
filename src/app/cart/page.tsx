'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, X, ShoppingBag, ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { toast } from 'sonner'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null)
  const subtotal = getTotal()
  const discountAmount = appliedDiscount ? subtotal * (appliedDiscount.percent / 100) : 0
  const afterDiscount = subtotal - discountAmount
  const shipping = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 14.99
  const total = afterDiscount + shipping

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountLoading(true)
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        toast.error(data.error || 'Invalid discount code')
        setAppliedDiscount(null)
      } else {
        setAppliedDiscount({ code: discountCode.trim().toUpperCase(), percent: data.percent })
        toast.success(`Discount applied: ${data.percent}% off`)
      }
    } catch {
      toast.error('Could not validate discount code')
    } finally {
      setDiscountLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-6 md:px-12 lg:px-16 pb-mobile-nav">
        <div className="max-w-4xl mx-auto">
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1 className="text-2xl font-bold mb-8">Your Cart</h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="w-16 h-16 text-text-muted mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-text-muted mb-6">Browse our collection and find your next pair.</p>
              <Link href="/shop"><Button>Shop Now</Button></Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="w-24 h-24 rounded-lg bg-elevated relative shrink-0 overflow-hidden">
                      {item.image_url && (
                        <Image src={item.image_url} alt={item.name} fill className="object-contain p-2" sizes="96px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-text-muted uppercase">{item.brand}</p>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">Size {item.size}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="rounded-xl bg-card border border-border p-6 sticky top-20 space-y-4">
                  <h3 className="font-semibold text-lg">Order Summary</h3>

                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">{appliedDiscount.code}</span>
                        <span className="text-xs text-green-400/70">({appliedDiscount.percent}% off)</span>
                      </div>
                      <button onClick={() => { setAppliedDiscount(null); setDiscountCode('') }} className="text-xs text-text-muted hover:text-red-400 transition-colors">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      />
                      <Button variant="secondary" size="sm" className="shrink-0" onClick={handleApplyDiscount} disabled={discountLoading}>
                        {discountLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">Discount ({appliedDiscount.percent}%)</span>
                        <span className="text-green-400">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                    </div>
                    {afterDiscount < FREE_SHIPPING_THRESHOLD && afterDiscount > 0 && (
                      <p className="text-xs text-cyan">
                        Add {formatPrice(FREE_SHIPPING_THRESHOLD - afterDiscount)} more for free shipping
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-elevated text-xs text-text-muted">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-pink mt-0.5" />
                    All sales are final. Please review your order carefully before checkout.
                  </div>

                  <Link href="/checkout" className="block">
                    <Button className="w-full" size="lg">Checkout</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
