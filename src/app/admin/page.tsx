'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DollarSign, Package, ShoppingCart, Users, Plus, FileText,
  ScanLine, AlertTriangle, TrendingUp, TrendingDown, Eye, Clock, Truck,
  CheckCircle, XCircle, MessageSquare, Activity, ArrowUpRight, Sparkles, ExternalLink
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const RechartsArea = dynamic(
  () => import('recharts').then(mod => {
    const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod
    return function Chart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF2E88" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF2E88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#2A2A36" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#2A2A36" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={45} />
            <Tooltip
              contentStyle={{ background: '#141418', border: '1px solid #1E1E26', borderRadius: '12px', fontSize: '11px', padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
              labelStyle={{ color: '#6A6A80', fontSize: '10px' }}
              formatter={((value: number, name: string) => [name === 'revenue' ? `$${value.toFixed(2)}` : value, name === 'revenue' ? 'Revenue' : 'Orders']) as never}
            />
            <Area type="monotone" dataKey="revenue" stroke="#FF2E88" fill="url(#colorRev)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }),
  { ssr: false, loading: () => <div className="h-[200px] shimmer rounded-xl" /> }
)

type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all'

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = start + diff * eased
      setCount(current)
      if (progress < 1) requestAnimationFrame(animate)
      else prevRef.current = target
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

function AnimatedKPI({ label, value, prefix = '', suffix = '', icon: Icon, color, sub }: {
  label: string; value: number; prefix?: string; suffix?: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string; sub: string
}) {
  const animated = useAnimatedCounter(value)
  const isPrice = prefix === '$'

  return (
    <div className="bg-[#141418] border border-[#1E1E26] rounded-2xl p-4 transition-all duration-500 hover:border-[#1E1E26]/80 hover:shadow-lg hover:shadow-black/20 group relative overflow-hidden">
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at 80% 20%, ${color}06, transparent 60%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-[#6A6A80] uppercase tracking-[0.15em] font-semibold">{label}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110" style={{ backgroundColor: `${color}10` }}>
            <Icon size={15} color={color} />
          </div>
        </div>
        <p className="text-2xl font-black text-white font-mono tracking-tight leading-none">
          {prefix}{isPrice ? Math.round(animated).toLocaleString() : Math.round(animated)}{suffix}
        </p>
        <p className="text-[10px] text-[#4A4A5A] mt-1.5 font-medium">{sub}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const [revenue, setRevenue] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [unitCount, setUnitCount] = useState(0)
  const [inventoryValue, setInventoryValue] = useState(0)
  const [inventoryCost, setInventoryCost] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({})

  useEffect(() => { load() }, [timeRange])

  async function load() {
    setLoading(true)
    try {
    const numDays = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const since = new Date(Date.now() - numDays * 86400000).toISOString()

    const [prodRes, ordersRes, allOrdersRes, customersRes, ticketsRes] = await Promise.all([
      supabase.from('products').select('*').eq('status', 'active'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      timeRange === 'all'
        ? supabase.from('orders').select('*')
        : supabase.from('orders').select('*').gte('created_at', since),
      supabase.from('orders').select('customer_email'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ])

    const products = prodRes.data || []
    const allOrders = (allOrdersRes.data || []).filter((o: any) => o.status !== 'cancelled')
    const orders = ordersRes.data || []

    const rev = allOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)
    const units = products.reduce((s: number, p: any) => s + (p.quantity || 0), 0)
    const invValue = products.reduce((s: number, p: any) => s + (p.price || 0) * (p.quantity || 0), 0)
    const invCost = products.reduce((s: number, p: any) => s + ((p.cost || 0) * (p.quantity || 0)), 0)
    const uniqueCustomers = new Set((customersRes.data || []).map((c: any) => c.customer_email)).size
    const pending = allOrders.filter((o: any) => ['pending', 'confirmed', 'processing'].includes(o.status)).length

    const days = Math.min(numDays, 90)
    const chart = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const ds = d.toISOString().split('T')[0]
      const dayOrders = allOrders.filter((o: any) => o.created_at?.startsWith(ds))
      chart.push({
        date: days <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      })
    }

    const productSales: Record<string, { name: string; qty: number; rev: number; image: string }> = {}
    for (const o of allOrders) {
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const key = item.name || item.product_id
          if (!productSales[key]) productSales[key] = { name: item.name || key, qty: 0, rev: 0, image: item.image || '' }
          productSales[key].qty += item.quantity || 1
          productSales[key].rev += (item.price || 0) * (item.quantity || 1)
        }
      }
    }
    const top = Object.values(productSales).sort((a, b) => b.rev - a.rev).slice(0, 5)

    // Pipeline counts from all orders (not just recent 5)
    const pipeline: Record<string, number> = {}
    for (const o of allOrders) pipeline[o.status] = (pipeline[o.status] || 0) + 1
    setPipelineCounts(pipeline)

    setRevenue(rev)
    setOrderCount(allOrders.length)
    setProductCount(products.length)
    setUnitCount(units)
    setInventoryValue(invValue)
    setInventoryCost(invCost)
    setCustomerCount(uniqueCustomers)
    setAvgOrderValue(allOrders.length > 0 ? rev / allOrders.length : 0)
    setPendingOrders(pending)
    setTicketCount(ticketsRes.count || 0)
    setRecentOrders(orders)
    setRecentProducts(products.slice(0, 6))
    setChartData(chart)
    setTopProducts(top)
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-5 page-enter">
        <div className="h-10 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-56 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  const profit = inventoryValue - inventoryCost

  return (
    <div className="space-y-5 page-enter">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
            </span>
          </div>
          <p className="text-xs text-[#6A6A80]">Sales, inventory, and what needs attention</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C2D6] text-white text-sm font-bold hover:bg-[#00C2D6]/90 transition-all duration-300 shadow-lg shadow-[#00C2D6]/20 hover:shadow-[#00C2D6]/30 hover:shadow-xl active:scale-[0.97]"
          >
            <ExternalLink size={16} />
            View Store
          </Link>
          <div className="flex items-center gap-1 bg-[#141418] border border-[#1E1E26] rounded-xl p-1">
            {(['1d','7d','30d','90d','all'] as TimeRange[]).map(v => (
              <button
                key={v}
                onClick={() => setTimeRange(v)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300',
                  timeRange === v
                    ? 'bg-[#FF2E88] text-white shadow-md shadow-[#FF2E88]/20'
                    : 'text-[#6A6A80] hover:text-white hover:bg-white/[0.03]'
                )}
              >
                {v === 'all' ? 'All' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Alerts ─── */}
      {(pendingOrders > 0 || ticketCount > 0) && (
        <div className="flex gap-3 stagger-children">
          {pendingOrders > 0 && (
            <Link href="/admin/orders" className="flex-1 flex items-center gap-4 bg-[#141418] border border-yellow-500/20 rounded-2xl px-5 py-4 hover:border-yellow-500/40 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{pendingOrders} order{pendingOrders > 1 ? 's' : ''} need attention</p>
                <p className="text-[11px] text-[#6A6A80]">Pending or paid, waiting to be processed</p>
              </div>
              <ArrowUpRight size={16} className="text-yellow-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
          {ticketCount > 0 && (
            <Link href="/admin/tickets" className="flex items-center gap-3 bg-[#141418] border border-[#FF2E88]/20 rounded-2xl px-5 py-4 hover:border-[#FF2E88]/40 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-[#FF2E88]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare size={18} className="text-[#FF2E88]" />
              </div>
              <span className="text-sm font-bold text-white">{ticketCount} open ticket{ticketCount > 1 ? 's' : ''}</span>
            </Link>
          )}
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/admin/scan" className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2E88] to-[#FF2E88]/80 text-white text-sm font-bold hover:shadow-lg hover:shadow-[#FF2E88]/20 transition-all duration-300 group active:scale-[0.98]">
          <ScanLine size={17} className="group-hover:rotate-[-5deg] transition-transform" /> Scan Product
        </Link>
        <Link href="/admin/orders/new" className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[#141418] border border-[#1E1E26] text-[#A0A0B8] text-sm font-semibold hover:text-white hover:border-[#FF2E88]/20 transition-all duration-300 active:scale-[0.98]">
          <ShoppingCart size={17} /> Create Order
        </Link>
        <Link href="/admin/products" className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[#141418] border border-[#1E1E26] text-[#A0A0B8] text-sm font-semibold hover:text-white hover:border-[#FF2E88]/20 transition-all duration-300 active:scale-[0.98]">
          <Eye size={17} /> View Inventory
        </Link>
      </div>

      {/* ─── Inventory Overview ─── */}
      <div>
        <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-[0.2em] mb-3">Inventory Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <AnimatedKPI label="Products" value={productCount} icon={Package} color="#FF2E88" sub={`${unitCount} total units`} />
          <AnimatedKPI label="Inventory Value" value={inventoryValue} prefix="$" icon={DollarSign} color="#00C2D6" sub="at sell price" />
          <AnimatedKPI label="Total Cost" value={inventoryCost} prefix="$" icon={TrendingDown} color="#A855F7" sub="cost basis" />
          <AnimatedKPI label="Potential Profit" value={profit} prefix="$" icon={TrendingUp} color={profit >= 0 ? '#10B981' : '#EF4444'} sub={inventoryCost > 0 ? `${((profit / inventoryCost) * 100).toFixed(1)}% margin` : 'no cost data'} />
          <AnimatedKPI label="Avg Unit Price" value={unitCount > 0 ? inventoryValue / unitCount : 0} prefix="$" icon={Activity} color="#F59E0B" sub="per item" />
        </div>
      </div>

      {/* ─── Sales Performance ─── */}
      <div>
        <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-[0.2em] mb-3">Sales Performance</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AnimatedKPI label="Revenue" value={revenue} prefix="$" icon={DollarSign} color="#FF2E88" sub="total sales" />
          <AnimatedKPI label="Orders" value={orderCount} icon={ShoppingCart} color="#00C2D6" sub="completed" />
          <AnimatedKPI label="Avg Order" value={avgOrderValue} prefix="$" icon={TrendingUp} color="#A855F7" sub="per order" />
          <AnimatedKPI label="Customers" value={customerCount} icon={Users} color="#10B981" sub="unique buyers" />
        </div>
      </div>

      {/* ─── Revenue Chart + Recent Orders ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-[#141418] border border-[#1E1E26] rounded-2xl p-5 transition-all hover:border-[#1E1E26]/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Revenue Over Time</h2>
              <p className="text-[10px] text-[#4A4A5A] mt-0.5">Daily revenue breakdown</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FF2E88]/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#FF2E88]" />
            </div>
          </div>
          <RechartsArea data={chartData} />
        </div>

        <div className="lg:col-span-2 bg-[#141418] border border-[#1E1E26] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent Orders</h2>
              <p className="text-[10px] text-[#4A4A5A] mt-0.5">Latest transactions</p>
            </div>
            <Link href="/admin/orders" className="text-[10px] text-[#FF2E88] hover:text-[#FF2E88]/80 font-semibold transition-colors">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingCart size={24} className="text-[#2A2A36] mb-2" />
              <p className="text-xs text-[#4A4A5A]">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((o, idx) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-white/[0.02] transition-all group" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-[#FF2E88] transition-colors">#{(o.order_number || o.id).slice(0, 12)}</p>
                    <p className="text-[10px] text-[#4A4A5A] truncate">{o.customer_name || o.customer_email || 'Guest'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-black text-white font-mono">{formatPrice(o.total || 0)}</p>
                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                      o.status === 'delivered' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      o.status === 'shipped' ? 'bg-[#00C2D6]/10 text-[#00C2D6]' :
                      o.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    )}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recently Added + Top Products ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#141418] border border-[#1E1E26] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recently Added</h2>
              <p className="text-[10px] text-[#4A4A5A] mt-0.5">Latest inventory</p>
            </div>
            <Link href="/admin/products" className="text-[10px] text-[#FF2E88] hover:text-[#FF2E88]/80 font-semibold transition-colors">View all →</Link>
          </div>
          {recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package size={24} className="text-[#2A2A36] mb-2" />
              <p className="text-xs text-[#4A4A5A]">No products yet — scan your first item!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentProducts.map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-white/[0.02] transition-all group" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {(p.image_url || p.images?.[0]) ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <img src={p.image_url || p.images[0]} alt="" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A22] flex items-center justify-center shrink-0">
                      <Package size={14} className="text-[#4A4A5A]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF2E88] transition-colors">{p.name}</p>
                    <p className="text-[10px] text-[#4A4A5A]">Size {p.size} · Qty {p.quantity}</p>
                  </div>
                  <p className="text-xs font-black text-white font-mono shrink-0">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#141418] border border-[#1E1E26] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Top Selling</h2>
              <p className="text-[10px] text-[#4A4A5A] mt-0.5">Best performers</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <Sparkles size={14} className="text-[#F59E0B]" />
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp size={24} className="text-[#2A2A36] mb-2" />
              <p className="text-xs text-[#4A4A5A]">Sales data will appear after orders come in</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 py-2 group">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black',
                    i === 0 ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                    i === 1 ? 'bg-[#A0A0B8]/10 text-[#A0A0B8]' :
                    i === 2 ? 'bg-[#CD7F32]/10 text-[#CD7F32]' :
                    'bg-[#1A1A22] text-[#4A4A5A]'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF2E88] transition-colors">{p.name}</p>
                    <p className="text-[10px] text-[#4A4A5A]">{p.qty} sold</p>
                  </div>
                  <p className="text-xs font-black text-[#FF2E88] font-mono">{formatPrice(p.rev)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Order Pipeline ─── */}
      <div className="bg-[#141418] border border-[#1E1E26] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-white">Order Pipeline</h2>
            <p className="text-[10px] text-[#4A4A5A] mt-0.5">Fulfillment status overview</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Pending', icon: Clock, count: pipelineCounts['pending'] || 0, color: '#F59E0B', bg: '#F59E0B' },
            { label: 'Processing', icon: Activity, count: (pipelineCounts['confirmed'] || 0) + (pipelineCounts['processing'] || 0), color: '#3B82F6', bg: '#3B82F6' },
            { label: 'Shipped', icon: Truck, count: pipelineCounts['shipped'] || 0, color: '#00C2D6', bg: '#00C2D6' },
            { label: 'Delivered', icon: CheckCircle, count: pipelineCounts['delivered'] || 0, color: '#10B981', bg: '#10B981' },
            { label: 'Cancelled', icon: XCircle, count: pipelineCounts['cancelled'] || 0, color: '#EF4444', bg: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="text-center py-4 rounded-2xl bg-[#0F0F13] border border-[#1E1E26]/50 hover:border-[#1E1E26] transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-500 group-hover:scale-110" style={{ backgroundColor: `${s.bg}10` }}>
                <s.icon size={18} color={s.color} />
              </div>
              <p className="text-xl font-black text-white font-mono">{s.count}</p>
              <p className="text-[10px] text-[#4A4A5A] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
