'use client'

import { useEffect, useState } from 'react'
import { Calculator, DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ReconciliationPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    inventoryValue: 0,
    inventoryCost: 0,
    totalRevenue: 0,
    totalCOGS: 0,
    productCount: 0,
    unitCount: 0,
    ordersCount: 0,
    missingCost: 0,
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
    const [{ data: products, error: prodErr }, { data: orders, error: ordErr }] = await Promise.all([
      supabase.from('products').select('price, cost, quantity').eq('status', 'active'),
      supabase.from('orders').select('total, items, status').neq('status', 'cancelled'),
    ])
    if (prodErr || ordErr) toast.error('Failed to load reconciliation data')

    const prods = products || []
    const ords = orders || []

    const inventoryValue = prods.reduce((s, p: any) => s + (p.price || 0) * (p.quantity || 0), 0)
    const inventoryCost = prods.reduce((s, p: any) => s + (p.cost || 0) * (p.quantity || 0), 0)
    const totalRevenue = ords.reduce((s, o: any) => s + (o.total || 0), 0)
    const missingCost = prods.filter((p: any) => !p.cost || p.cost === 0).length

    let totalCOGS = 0
    for (const o of ords) {
      if (Array.isArray((o as any).items)) {
        for (const item of (o as any).items) {
          totalCOGS += (item.cost || 0) * (item.quantity || 1)
        }
      }
    }

    setStats({
      inventoryValue,
      inventoryCost,
      totalRevenue,
      totalCOGS,
      productCount: prods.length,
      unitCount: prods.reduce((s, p: any) => s + (p.quantity || 0), 0),
      ordersCount: ords.length,
      missingCost,
    })
    } catch (err) {
      console.error('Reconciliation load error:', err)
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  const grossProfit = stats.totalRevenue - stats.totalCOGS
  const potentialProfit = stats.inventoryValue - stats.inventoryCost
  const margin = stats.totalRevenue > 0 ? (grossProfit / stats.totalRevenue * 100) : 0

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: '#FF2E88', sub: `${stats.ordersCount} orders` },
    { label: 'Cost of Goods Sold', value: formatPrice(stats.totalCOGS), icon: TrendingDown, color: '#A855F7', sub: 'from order items' },
    { label: 'Gross Profit', value: formatPrice(grossProfit), icon: TrendingUp, color: grossProfit >= 0 ? '#10B981' : '#EF4444', sub: `${margin.toFixed(1)}% margin` },
    { label: 'Inventory Value', value: formatPrice(stats.inventoryValue), icon: Package, color: '#00C2D6', sub: `${stats.unitCount} units at sell price` },
    { label: 'Inventory Cost', value: formatPrice(stats.inventoryCost), icon: Calculator, color: '#F59E0B', sub: 'cost basis' },
    { label: 'Potential Profit', value: formatPrice(potentialProfit), icon: TrendingUp, color: potentialProfit >= 0 ? '#10B981' : '#EF4444', sub: 'if all sold at ask' },
  ]

  return (
    <div className="space-y-6 page-enter max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Reconciliation</h1>
        <p className="text-sm text-[var(--text-muted)]">Financial overview — revenue, costs, and margins</p>
      </div>

      {/* Warning if missing costs */}
      {stats.missingCost > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-5 py-4"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{stats.missingCost} product{stats.missingCost > 1 ? 's' : ''} missing cost data</p>
            <p className="text-xs text-[var(--text-muted)]">Add cost prices to get accurate margin calculations</p>
          </div>
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => {
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

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle size={14} className="text-[#00C2D6]" /> Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">Active Products</span>
            <span className="text-sm font-bold text-white">{stats.productCount} ({stats.unitCount} units)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">Completed Orders</span>
            <span className="text-sm font-bold text-white">{stats.ordersCount}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">Average Order Value</span>
            <span className="text-sm font-bold text-white">{stats.ordersCount > 0 ? formatPrice(stats.totalRevenue / stats.ordersCount) : '$0'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-secondary)]">Gross Margin</span>
            <span className={cn('text-sm font-bold', margin >= 0 ? 'text-green-400' : 'text-red-400')}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
