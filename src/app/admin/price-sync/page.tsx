'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Package, DollarSign, Activity, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Product { id: string; name: string; price: number; stockx_id?: string; market_price?: number; image_url?: string }

export default function PriceSyncPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('products').select('id, name, price, stockx_id, market_price, image_url').eq('status', 'active').not('stockx_id', 'is', null)
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/price-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_ids: products.map(p => p.id) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      toast.success(`Synced ${data.synced}/${data.total} products`)
      setLastSync(new Date().toLocaleString())
      // Reload products to show updated market prices
      const { data: updated } = await supabase.from('products').select('id, name, price, stockx_id, market_price, image_url').eq('status', 'active').not('stockx_id', 'is', null)
      if (updated) setProducts(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Price sync failed')
    }
    setSyncing(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  const withMarket = products.filter(p => p.market_price)
  const aboveMarket = withMarket.filter(p => p.price > (p.market_price || 0)).length
  const belowMarket = withMarket.filter(p => p.price < (p.market_price || 0)).length

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00C2D6]/10 border border-[#00C2D6]/20 flex items-center justify-center">
            <Activity size={20} className="text-[#00C2D6]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Price Sync</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {products.length} products with StockX IDs{lastSync && ` · Last sync: ${lastSync}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C2D6] text-white text-sm font-bold hover:bg-[#00C2D6]/90 transition-all shadow-lg shadow-[#00C2D6]/20 disabled:opacity-50 active:scale-[0.97]"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      {/* Stats */}
      {withMarket.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Above Market</span>
            </div>
            <p className="text-2xl font-black text-white">{aboveMarket}</p>
            <p className="text-[10px] text-[var(--text-muted)]">priced higher than market</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Below Market</span>
            </div>
            <p className="text-2xl font-black text-white">{belowMarket}</p>
            <p className="text-[10px] text-[var(--text-muted)]">priced lower than market</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-[#00C2D6]" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Synced</span>
            </div>
            <p className="text-2xl font-black text-white">{withMarket.length}</p>
            <p className="text-[10px] text-[var(--text-muted)]">with market data</p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C2D6]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#00C2D6]/10 border border-[#00C2D6]/20 flex items-center justify-center mx-auto mb-5">
              <RefreshCw size={32} className="text-[#00C2D6]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Synced Products</h2>
            <p className="text-sm text-[var(--text-secondary)]">Add StockX IDs to products to enable market price syncing</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => {
            const diff = p.market_price ? p.price - p.market_price : 0
            const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus
            const diffColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'
            const diffBg = diff > 0 ? 'bg-green-500/10' : diff < 0 ? 'bg-red-500/10' : 'bg-white/5'

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:border-[var(--border)]/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {p.image_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 group-hover:scale-105 transition-transform">
                      <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                      <Package size={18} className="text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[250px]">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{p.stockx_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-black text-white font-mono">{formatPrice(p.price)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Your price</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-[var(--text-secondary)]">{p.market_price ? formatPrice(p.market_price) : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Market</p>
                  </div>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', diffBg)}>
                    <Icon size={14} className={diffColor} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
