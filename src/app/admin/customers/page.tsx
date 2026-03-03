'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Users, User, Mail, Phone, ShoppingBag, DollarSign, TrendingUp, Clock, ChevronRight, ArrowUpDown, Download } from 'lucide-react'
import { formatDate, formatPrice, timeAgo } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Customer {
  id: string
  full_name: string
  email: string
  phone?: string
  created_at: string
  role: string
}

interface OrderSummary {
  customer_id: string
  count: number
  total: number
  last_order: string
}

type SortKey = 'name' | 'date' | 'orders' | 'spent'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orderMap, setOrderMap] = useState<Record<string, OrderSummary>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function load() {
      try {
      const [{ data: profiles, error: profilesErr }, { data: orders, error: ordersErr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
        supabase.from('orders').select('customer_id, total, created_at, status').neq('status', 'cancelled'),
      ])
      if (profilesErr || ordersErr) toast.error('Failed to load customer data')

      setCustomers(profiles || [])

      // Build order summaries per customer
      const map: Record<string, OrderSummary> = {}
      for (const o of (orders || []) as any[]) {
        if (!o.customer_id) continue
        if (!map[o.customer_id]) {
          map[o.customer_id] = { customer_id: o.customer_id, count: 0, total: 0, last_order: o.created_at }
        }
        map[o.customer_id].count++
        map[o.customer_id].total += o.total || 0
        if (o.created_at > map[o.customer_id].last_order) {
          map[o.customer_id].last_order = o.created_at
        }
      }
      setOrderMap(map)
      } catch (err) {
        console.error('Customers load error:', err)
        toast.error('Failed to load customers')
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = customers.filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
    })

    list.sort((a, b) => {
      const aOrders = orderMap[a.id]
      const bOrders = orderMap[b.id]
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = (a.full_name || '').localeCompare(b.full_name || '')
          break
        case 'date':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'orders':
          cmp = (aOrders?.count || 0) - (bOrders?.count || 0)
          break
        case 'spent':
          cmp = (aOrders?.total || 0) - (bOrders?.total || 0)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return list
  }, [customers, search, sortBy, sortDir, orderMap])

  const totalCustomers = customers.length
  const totalRevenue = Object.values(orderMap).reduce((s, o) => s + o.total, 0)
  const avgOrderValue = Object.values(orderMap).length > 0
    ? totalRevenue / Object.values(orderMap).reduce((s, o) => s + o.count, 0)
    : 0
  const repeatCustomers = Object.values(orderMap).filter(o => o.count > 1).length

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
        <div className="h-12 shimmer rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customers</h1>
          <p className="text-sm text-[var(--text-muted)]">{totalCustomers} total customer{totalCustomers !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: totalCustomers.toString(), icon: Users, color: '#FF2E88', sub: 'registered accounts' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: '#10B981', sub: 'from all orders' },
          { label: 'Avg Order Value', value: formatPrice(avgOrderValue), icon: TrendingUp, color: '#00C2D6', sub: 'per transaction' },
          { label: 'Repeat Buyers', value: repeatCustomers.toString(), icon: ShoppingBag, color: '#A855F7', sub: `${totalCustomers > 0 ? Math.round(repeatCustomers / totalCustomers * 100) : 0}% of customers` },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 group hover:border-[var(--border)]/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-bold">{card.label}</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}10` }}
                >
                  <Icon size={15} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-black text-white font-mono tracking-tight">{card.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
          {([
            { key: 'date' as SortKey, label: 'Recent' },
            { key: 'spent' as SortKey, label: 'Top Spenders' },
            { key: 'orders' as SortKey, label: 'Most Orders' },
            { key: 'name' as SortKey, label: 'A-Z' },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                sortBy === s.key
                  ? 'bg-[#FF2E88] text-white shadow-md shadow-[#FF2E88]/20'
                  : 'text-[var(--text-muted)] hover:text-white'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF2E88]/5 to-[#00C2D6]/5 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#FF2E88]/10 border border-[#FF2E88]/20 flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-[#FF2E88]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              {search ? 'No Matches Found' : 'No Customers Yet'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
              {search
                ? `No customers match "${search}". Try a different search.`
                : 'Customers will appear here after they create an account or place an order.'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const summary = orderMap[c.id]
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 hover:border-[#FF2E88]/20 transition-all duration-300 group"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2E88] to-[#00C2D6] flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg shadow-[#FF2E88]/10 group-hover:scale-105 transition-transform">
                      {(c.full_name || c.email)?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover:text-[#FF2E88] transition-colors">
                        {c.full_name || 'No name'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] truncate">
                          <Mail size={11} className="shrink-0" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Phone size={11} className="shrink-0" /> {c.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      {summary ? (
                        <>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white font-mono">{formatPrice(summary.total)}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{summary.count} order{summary.count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(summary.last_order)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] px-3 py-1 rounded-lg bg-white/[0.03]">No orders</span>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[#FF2E88] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
