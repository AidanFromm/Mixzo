'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Settings, ShoppingBag, User, ChevronRight, LogOut, Sparkles, Heart, DollarSign } from 'lucide-react'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { formatPrice, formatDate } from '@/lib/utils'

interface Profile {
  full_name: string
  email: string
  phone?: string
}

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  items: Array<{ name: string; size: string; condition: string }>
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', session.user.id)
        .single()

      const { data: ords } = await supabase
        .from('orders')
        .select('id, created_at, status, total, items')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setProfile(prof)
      setOrders(ords || [])
      setLoading(false)
    }
    load()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full">
          <div className="skeleton h-8 w-48 mb-8" />
          <div className="skeleton h-32 w-full rounded-2xl mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  const menuItems = [
    { href: '/account/orders', label: 'Order History', desc: `${orders.length} recent orders`, icon: ShoppingBag },
    { href: '/account/cleaning', label: 'Cleaning Requests', desc: 'Track your sneaker cleanings', icon: Sparkles },
    { href: '/wishlist', label: 'Wishlist', desc: 'Saved items', icon: Heart },
    { href: '/account/settings', label: 'Account Settings', desc: 'Profile, address, password', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full pb-mobile-nav">
      <h1 className="text-2xl font-bold text-white mb-6">My Account</h1>

      {/* Profile card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--pink)] to-[var(--cyan)] flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-lg truncate">{profile?.full_name || 'Customer'}</p>
            <p className="text-sm text-[var(--text-secondary)] truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <ShoppingBag size={18} className="text-[var(--pink)] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{orders.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Orders</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <DollarSign size={18} className="text-[var(--cyan)] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{formatPrice(totalSpent)}</p>
          <p className="text-xs text-[var(--text-muted)]">Total Spent</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-6">
        {menuItems.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--pink)]/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
              <Icon size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link href="/account/orders" className="text-xs text-[var(--pink)] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--pink)]/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{formatPrice(order.total)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(order.created_at)}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                  order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                  order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
      >
        <LogOut size={16} />
        Sign Out
      </button>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
