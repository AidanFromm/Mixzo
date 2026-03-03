'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Plus, Package, Edit, Trash2, ChevronRight, ChevronDown, ScanLine } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { CONDITION_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  brand: string
  size: string
  condition: string
  price: number
  cost: number | null
  quantity: number
  images: string[] | null
  image_url: string | null
  style_id: string | null
  colorway: string | null
  status: string
  created_at: string
}

interface GroupedProduct {
  name: string
  brand: string
  image: string | null
  styleId: string | null
  colorway: string | null
  totalQuantity: number
  variants: Product[]
  avgPrice: number
  totalCost: number
  condition: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [conditionFilter, setConditionFilter] = useState('all')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function deleteProduct(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this product?')) return
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    toast.success('Product deleted')
    loadProducts()
  }

  // Group products by name (same shoe, different sizes = one row with expandable variants)
  const grouped = useMemo(() => {
    const filtered = products.filter(p => {
      if (conditionFilter === 'new' && p.condition !== 'new') return false
      if (conditionFilter === 'preowned' && p.condition === 'new') return false
      if (search) {
        const q = search.toLowerCase()
        return p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.style_id?.toLowerCase().includes(q)
      }
      return true
    })

    const map = new Map<string, GroupedProduct>()
    for (const p of filtered) {
      const key = p.name
      if (!map.has(key)) {
        map.set(key, {
          name: p.name,
          brand: p.brand,
          image: p.image_url || (p.images?.[0] ?? null),
          styleId: p.style_id,
          colorway: p.colorway,
          totalQuantity: 0,
          variants: [],
          avgPrice: 0,
          totalCost: 0,
          condition: p.condition,
        })
      }
      const g = map.get(key)!
      g.variants.push(p)
      g.totalQuantity += p.quantity
      g.totalCost += (p.cost || 0) * p.quantity
    }

    // Calculate averages
    for (const g of map.values()) {
      g.avgPrice = g.variants.reduce((s, v) => s + v.price, 0) / g.variants.length
      // Sort variants by size
      g.variants.sort((a, b) => parseFloat(a.size) - parseFloat(b.size))
    }

    return Array.from(map.values())
  }, [products, search, conditionFilter])

  const totalItems = products.length
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[var(--bg-card)] rounded-lg shimmer" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[var(--bg-card)] rounded-xl shimmer" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {grouped.length} product{grouped.length !== 1 ? 's' : ''} · {totalItems} total items · {formatPrice(totalValue)} value
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/scan" className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--pink)]/30 text-[var(--text-secondary)] hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition">
            <ScanLine size={16} /> Scan
          </Link>
          <Link href="/admin/products/new" className="bg-[#FF2E88] hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={16} /> Add
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand, style ID..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--pink)] focus:outline-none"
          />
        </div>
        <div className="flex gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
          {[['all','All'],['new','New'],['preowned','Preowned']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setConditionFilter(val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                conditionFilter === val ? 'bg-[#FF2E88] text-white' : 'text-[var(--text-secondary)] hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {grouped.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center">
          <Package size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-1">No products found</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Add your first product to get started</p>
          <Link href="/admin/scan" className="inline-flex items-center gap-2 bg-[#FF2E88] hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            <ScanLine size={16} /> Scan Product
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden overflow-x-auto">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_80px_100px_80px_60px_80px] gap-2 px-4 py-3 border-b border-[var(--border)] text-xs font-medium text-[var(--text-muted)] min-w-[640px]">
            <span>Product</span>
            <span>Condition</span>
            <span>Sizes</span>
            <span>Price</span>
            <span>Qty</span>
            <span>Cost</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {grouped.map(g => {
            const isExpanded = expandedGroup === g.name
            const hasVariants = g.variants.length > 1

            return (
              <div key={g.name}>
                {/* Main Row */}
                <div
                  onClick={() => hasVariants ? setExpandedGroup(isExpanded ? null : g.name) : null}
                  className={cn(
                    'grid grid-cols-[1fr_100px_80px_100px_80px_60px_80px] gap-2 px-4 py-3 items-center border-b border-[var(--border)] transition-colors min-w-[640px]',
                    hasVariants ? 'cursor-pointer hover:bg-white/[0.02]' : '',
                    isExpanded ? 'bg-white/[0.02]' : ''
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {hasVariants && (
                      <ChevronRight size={14} className={cn('text-[var(--text-muted)] transition-transform shrink-0', isExpanded && 'rotate-90')} />
                    )}
                    {!hasVariants && <div className="w-3.5" />}
                    {g.image ? (
                      <img src={g.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-white shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0"><Package size={16} className="text-[var(--text-muted)]" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{g.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{g.brand}{g.styleId ? ` · ${g.styleId}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] w-fit">
                    {CONDITION_LABELS[g.condition] || g.condition || 'New'}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {g.variants.length === 1 ? g.variants[0].size : `${g.variants.length} sizes`}
                  </span>
                  <span className="text-sm font-semibold text-white font-mono">{formatPrice(g.avgPrice)}</span>
                  <span className="text-sm text-[var(--text-secondary)] font-mono">{g.totalQuantity}</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {g.totalCost > 0 ? formatPrice(g.totalCost / g.totalQuantity) : '—'}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    {g.variants.length === 1 && (
                      <>
                        <Link href={`/admin/products/${g.variants[0].id}/edit`} onClick={e => e.stopPropagation()} className="p-2 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-white/5">
                          <Edit size={14} />
                        </Link>
                        <button onClick={(e) => deleteProduct(g.variants[0].id, e)} className="p-2 text-[var(--text-muted)] hover:text-red-400 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Variants */}
                {isExpanded && hasVariants && (
                  <div className="bg-[var(--bg)]/50">
                    {g.variants.map(v => (
                      <div key={v.id} className="grid grid-cols-[1fr_100px_80px_100px_80px_60px_80px] gap-2 px-4 py-2.5 items-center border-b border-[var(--border)]/50 ml-8 min-w-[640px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--pink)]/40" />
                          <span className="text-sm text-[var(--text-secondary)]">Size {v.size}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] w-fit">
                          {CONDITION_LABELS[v.condition] || v.condition}
                        </span>
                        <span className="text-sm text-[var(--text-muted)]">{v.size}</span>
                        <span className="text-sm font-medium text-white font-mono">{formatPrice(v.price)}</span>
                        <span className="text-sm text-[var(--text-secondary)] font-mono">{v.quantity}</span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {v.cost ? formatPrice(v.cost) : '—'}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${v.id}/edit`} className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-white/5">
                            <Edit size={13} />
                          </Link>
                          <button onClick={(e) => deleteProduct(v.id, e)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 rounded-lg hover:bg-red-500/10">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
