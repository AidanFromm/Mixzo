'use client'

import { useEffect, useState } from 'react'
import { Loader2, DollarSign, TrendingUp, Package, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const Charts = dynamic(
  () => import('recharts').then(mod => {
    const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } = mod

    const COLORS = ['#FF2E88', '#00C2D6', '#FF5C9A', '#33D1E0', '#A855F7', '#22C55E']
    const ttStyle = {
      contentStyle: { background: '#141418', border: '1px solid #1E1E26', borderRadius: 8, color: '#F4F4F4', fontSize: 12 },
      itemStyle: { color: '#A0A0B8' },
    }

    return function AllCharts({ revenueData, topProducts, brandData, conditionData, ordersByDay }: any) {
      return (
        <>
          {/* Revenue Chart */}
          <div className="bg-[#141418] border border-[#1E1E26] rounded-xl p-5 col-span-full">
            <h2 className="font-semibold mb-4 text-sm">Revenue Over Time</h2>
            {revenueData.length === 0 ? (
              <p className="text-sm text-[#6A6A80] py-12 text-center">No revenue data yet. Revenue will appear here once orders come in.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF2E88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF2E88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#6A6A80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6A6A80', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip {...ttStyle} formatter={((v: number) => [`$${v}`, 'Revenue']) as any} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF2E88" fill="url(#grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Orders by Day */}
          <div className="bg-[#141418] border border-[#1E1E26] rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-sm">Orders by Day</h2>
            {ordersByDay.length === 0 ? (
              <p className="text-sm text-[#6A6A80] py-12 text-center">No orders yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ordersByDay}>
                  <XAxis dataKey="date" tick={{ fill: '#6A6A80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6A6A80', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...ttStyle} />
                  <Bar dataKey="orders" fill="#00C2D6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-[#141418] border border-[#1E1E26] rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-sm">Top Products by Price</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-[#6A6A80] py-12 text-center">No products yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6A6A80', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#A0A0B8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...ttStyle} formatter={((v: number) => [`$${v}`, 'Price']) as any} />
                  <Bar dataKey="price" fill="#FF2E88" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Brand Breakdown */}
          <div className="bg-[#141418] border border-[#1E1E26] rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-sm">Inventory by Brand</h2>
            {brandData.length === 0 ? (
              <p className="text-sm text-[#6A6A80] py-12 text-center">No inventory yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={brandData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {brandData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...ttStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {brandData.slice(0, 6).map((b: any, i: number) => (
                    <div key={b.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-[#A0A0B8]">{b.name}</span>
                      </div>
                      <span className="font-medium text-white">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Condition Breakdown */}
          <div className="bg-[#141418] border border-[#1E1E26] rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-sm">New vs Preowned</h2>
            {conditionData.length === 0 ? (
              <p className="text-sm text-[#6A6A80] py-12 text-center">No inventory yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={conditionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {conditionData.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? '#00C2D6' : '#FF2E88'} />)}
                    </Pie>
                    <Tooltip {...ttStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {conditionData.map((c: any, i: number) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: i === 0 ? '#00C2D6' : '#FF2E88' }} />
                        <span className="text-[#A0A0B8]">{c.name}</span>
                      </div>
                      <span className="font-bold text-white">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )
    }
  }),
  { ssr: false, loading: () => <div className="skeleton h-80 w-full rounded-xl col-span-full" /> }
)

type TimeRange = '7d' | '30d' | '90d' | 'all'
const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<TimeRange>('30d')
  const [data, setData] = useState<any>({
    totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0,
    avgOrderValue: 0, conversionRate: 0,
    revenueData: [], topProducts: [], brandData: [], conditionData: [], ordersByDay: [],
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
      const since = new Date()
      since.setDate(since.getDate() - days)

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        range === 'all'
          ? supabase.from('orders').select('total, created_at, status')
          : supabase.from('orders').select('total, created_at, status').gte('created_at', since.toISOString()),
        supabase.from('products').select('name, brand, condition, quantity, price, cost').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      ])

      const orders = (ordersRes.data || []).filter((o: any) => o.status !== 'cancelled')
      const products = productsRes.data || []

      const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Revenue by day
      const byDay: Record<string, { revenue: number; orders: number }> = {}
      for (let i = Math.min(days, 90) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        byDay[key] = { revenue: 0, orders: 0 }
      }
      orders.forEach((o: any) => {
        const key = o.created_at?.split('T')[0]
        if (byDay[key]) {
          byDay[key].revenue += o.total || 0
          byDay[key].orders += 1
        }
      })
      const revenueData = Object.entries(byDay).map(([key, v]) => ({
        date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: v.revenue,
      }))
      const ordersByDay = Object.entries(byDay).map(([key, v]) => ({
        date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: v.orders,
      }))

      // Top products
      const topProducts = [...products].sort((a: any, b: any) => b.price - a.price).slice(0, 8).map((p: any) => ({
        name: (p.name || '').slice(0, 18),
        price: p.price,
      }))

      // Brand breakdown
      const brandCounts: Record<string, number> = {}
      products.forEach((p: any) => {
        const brand = (p.brand || 'Unknown').charAt(0).toUpperCase() + (p.brand || 'unknown').slice(1).toLowerCase()
        brandCounts[brand] = (brandCounts[brand] || 0) + (p.quantity || 1)
      })
      const brandData = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

      // Condition breakdown
      const condCounts: Record<string, number> = {}
      products.forEach((p: any) => {
        const label = p.condition === 'new' ? 'New' : 'Preowned'
        condCounts[label] = (condCounts[label] || 0) + (p.quantity || 1)
      })
      const conditionData = Object.entries(condCounts).map(([name, value]) => ({ name, value }))

      // Total inventory value & cost
      const inventoryValue = products.reduce((s: number, p: any) => s + (p.price || 0) * (p.quantity || 1), 0)
      const inventoryCost = products.reduce((s: number, p: any) => s + (p.cost || 0) * (p.quantity || 1), 0)

      setData({
        totalRevenue, totalOrders, totalProducts: products.length,
        totalCustomers: customersRes.count || 0,
        avgOrderValue, inventoryValue, inventoryCost,
        revenueData, topProducts, brandData, conditionData, ordersByDay,
      })
      } catch (err) {
        console.error('Analytics load error:', err)
        toast.error('Failed to load analytics')
      }
      setLoading(false)
    }
    load()
  }, [range])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    )
  }

  const kpis = [
    { label: 'Revenue', value: formatPrice(data.totalRevenue), icon: DollarSign, color: 'bg-[#FF2E88]/10 text-[#FF2E88]' },
    { label: 'Orders', value: data.totalOrders.toString(), icon: ShoppingCart, color: 'bg-[#00C2D6]/10 text-[#00C2D6]' },
    { label: 'Avg Order', value: formatPrice(data.avgOrderValue), icon: TrendingUp, color: 'bg-purple-500/10 text-purple-400' },
    { label: 'Products', value: data.totalProducts.toString(), icon: Package, color: 'bg-green-500/10 text-green-400' },
    { label: 'Customers', value: data.totalCustomers.toString(), icon: Users, color: 'bg-orange-500/10 text-orange-400' },
    { label: 'Inventory Value', value: formatPrice(data.inventoryValue), icon: DollarSign, color: 'bg-cyan-500/10 text-cyan-400' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex items-center gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === value ? 'bg-[#FF2E88] text-white' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#141418] border border-[#1E1E26] rounded-xl p-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color} mb-2`}>
              <Icon size={16} />
            </div>
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Charts
          revenueData={data.revenueData}
          topProducts={data.topProducts}
          brandData={data.brandData}
          conditionData={data.conditionData}
          ordersByDay={data.ordersByDay}
        />
      </div>
    </div>
  )
}
