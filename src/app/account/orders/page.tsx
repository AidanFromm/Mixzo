'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  items: Array<{ name: string; size: string; quantity: number }>
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-purple-500/10 text-purple-400',
  shipped: 'bg-cyan-500/10 text-cyan-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await supabase
        .from('orders')
        .select('id, created_at, status, total, items')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full">
          <div className="skeleton h-6 w-32 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full pb-mobile-nav">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} />
        Account
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Order History</h1>

      {orders.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No orders yet</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Your order history will appear here</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white text-sm font-semibold px-6 py-3 rounded-xl">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const itemCount = order.items?.reduce((sum: number, i: { quantity: number }) => sum + (i.quantity || 1), 0) || 0
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--pink)]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-secondary)]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  <p className="text-sm font-semibold text-white">{formatPrice(order.total)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
