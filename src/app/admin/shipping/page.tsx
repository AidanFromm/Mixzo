'use client'

import { useState, useEffect } from 'react'
import { Truck, Package, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ShippingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter === 'pending') query = query.in('status', ['pending', 'confirmed', 'processing'])
    else if (filter === 'shipped') query = query.eq('status', 'shipped')
    else if (filter === 'delivered') query = query.eq('status', 'delivered')
    const { data, error } = await query
    if (error) toast.error('Failed to load orders')
    setOrders(data || [])
    setLoading(false)
  }

  const filterOptions = [
    { val: 'pending', label: 'Needs Shipping', icon: Clock, color: '#F59E0B' },
    { val: 'shipped', label: 'Shipped', icon: Truck, color: '#00C2D6' },
    { val: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#10B981' },
    { val: 'all', label: 'All', icon: Package, color: '#A0A0B8' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Shipping</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage order fulfillment and tracking</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filterOptions.map(({ val, label, icon: Icon, color }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border',
              filter === val
                ? 'text-white border-transparent shadow-lg'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border)]/80'
            )}
            style={filter === val ? { backgroundColor: color, boxShadow: `0 8px 20px ${color}30` } : undefined}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C2D6]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#00C2D6]/10 border border-[#00C2D6]/20 flex items-center justify-center mx-auto mb-5">
              <Truck size={32} className="text-[#00C2D6]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              {filter === 'all' ? 'No Orders Yet' : 'Nothing to Show'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {filter === 'pending' ? 'No orders waiting to ship — you\'re all caught up!' : 'Orders will appear here once placed'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {orders.map((o, i) => {
            const statusConfig: Record<string, { color: string; bg: string }> = {
              pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              confirmed: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              processing: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
              shipped: { color: 'text-[#00C2D6]', bg: 'bg-[#00C2D6]/10' },
              delivered: { color: 'text-green-400', bg: 'bg-green-500/10' },
            }
            const sc = statusConfig[o.status] || statusConfig.pending

            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border)]/80 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Package size={18} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#FF2E88] transition-colors">
                        {o.order_number || o.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {o.customer_name || o.customer_email} · {Array.isArray(o.items) ? o.items.length : 0} item{Array.isArray(o.items) && o.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black font-mono text-white">{formatPrice(o.total || 0)}</span>
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider', sc.color, sc.bg)}>
                      {o.status}
                    </span>
                    <ArrowRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
