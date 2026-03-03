'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, Package, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { ProductCard } from '@/components/shop/product-card'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  brand: string
  price: number
  size: string
  condition: string
  image_url: string | null
  images: string[] | null
  colorway: string | null
  created_at: string
}

const SIZES = [
  '4','4.5','5','5.5','6','6.5','7','7.5','8','8.5',
  '9','9.5','10','10.5','11','11.5','12','12.5','13','14','15'
]

const BRANDS = ['Nike','Jordan','Adidas','New Balance','Yeezy','Puma','Reebok','Asics','Converse','Vans']

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name', label: 'A → Z' },
]

const easeOutExpo = [0.16, 1, 0.3, 1] as const

export default function ShopPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || 'all')
  const [sort, setSort] = useState('newest')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('id, name, brand, price, size, condition, image_url, images, colorway, created_at')
        .eq('status', 'active')

      if (condition === 'new') query = query.eq('condition', 'new')
      if (condition === 'preowned') query = query.neq('condition', 'new')
      if (selectedBrand) query = query.ilike('brand', `%${selectedBrand}%`)
      if (selectedSize) query = query.eq('size', selectedSize)
      if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,style_id.ilike.%${search}%`)

      if (sort === 'price-asc') query = query.order('price', { ascending: true })
      else if (sort === 'price-desc') query = query.order('price', { ascending: false })
      else if (sort === 'name') query = query.order('name', { ascending: true })
      else query = query.order('created_at', { ascending: false })

      const { data } = await query.limit(60)
      setProducts(data || [])
      setLoading(false)
    }
    load().catch(() => {
      setProducts([])
      setLoading(false)
    })
  }, [condition, sort, selectedBrand, selectedSize, search])

  const clearFilters = () => {
    setCondition('all')
    setSelectedBrand('')
    setSelectedSize('')
    setSearch('')
    setSort('newest')
  }

  const hasFilters = condition !== 'all' || selectedBrand || selectedSize || search
  const activeFilterCount = [condition !== 'all', selectedBrand, selectedSize, search].filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-20 pb-mobile-nav">
        {/* Hero Banner */}
        <div className="relative bg-[#141418] border-b border-[#1E1E26] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E88]/[0.03] to-[#00C2D6]/[0.03]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF2E88] mb-2">Browse Collection</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Shop</h1>
              <p className="text-[#6A6A80] text-sm mt-2">Authenticated new & preowned sneakers</p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search + Controls */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOutExpo }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A5A] group-focus-within:text-[#FF2E88] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, brand, or style ID..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#141418] border border-[#1E1E26] text-sm text-white placeholder:text-[#4A4A5A] focus:outline-none focus:border-[#FF2E88]/50 focus:shadow-lg focus:shadow-[#FF2E88]/5 transition-all duration-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-[#1A1A22] flex items-center justify-center hover:bg-[#2A2A36] transition-colors">
                  <X size={12} className="text-[#6A6A80]" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'h-12 px-5 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all duration-300',
                  filtersOpen || hasFilters
                    ? 'bg-[#FF2E88]/10 border-[#FF2E88]/30 text-[#FF2E88]'
                    : 'bg-[#141418] border-[#1E1E26] text-[#A0A0B8] hover:border-[#2A2A36]'
                )}
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF2E88] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 px-4 pr-8 rounded-xl bg-[#141418] border border-[#1E1E26] text-sm text-[#A0A0B8] focus:outline-none focus:border-[#FF2E88]/50 appearance-none cursor-pointer transition-colors"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </motion.div>

          {/* Condition Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: easeOutExpo }}
            className="flex gap-2 mb-6"
          >
            {[
              { value: 'all', label: 'All' },
              { value: 'new', label: 'New' },
              { value: 'preowned', label: 'Preowned' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setCondition(tab.value)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  condition === tab.value
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-[#141418] text-[#6A6A80] border border-[#1E1E26] hover:border-[#2A2A36] hover:text-[#A0A0B8]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Expanded Filters */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-6 rounded-2xl bg-[#141418] border border-[#1E1E26] space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Brand */}
                <div>
                  <label className="text-[10px] font-bold text-[#4A4A5A] mb-3 block uppercase tracking-[0.15em]">Brand</label>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map(b => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                        className={cn(
                          'px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all duration-300',
                          selectedBrand === b
                            ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-md shadow-[#FF2E88]/20'
                            : 'bg-[#1A1A22] border-[#1E1E26] text-[#6A6A80] hover:border-[#FF2E88]/30 hover:text-[#A0A0B8]'
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="text-[10px] font-bold text-[#4A4A5A] mb-3 block uppercase tracking-[0.15em]">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                        className={cn(
                          'w-11 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 text-center',
                          selectedSize === s
                            ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-md shadow-[#FF2E88]/20'
                            : 'bg-[#1A1A22] border-[#1E1E26] text-[#6A6A80] hover:border-[#FF2E88]/30 hover:text-[#A0A0B8]'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-[#FF2E88] hover:text-[#FF2E88]/80 font-semibold flex items-center gap-1 transition-colors">
                  <X size={12} /> Clear all filters
                </button>
              )}
            </motion.div>
          )}

          {/* Results count */}
          {!loading && (
            <p className="text-[10px] text-[#4A4A5A] mb-5 uppercase tracking-[0.15em] font-bold">
              {products.length} {products.length === 1 ? 'product' : 'products'}
              {hasFilters && ' found'}
            </p>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#141418] border border-[#1E1E26] overflow-hidden">
                  <div className="aspect-square bg-[#1A1A22] shimmer" />
                  <div className="p-3.5 space-y-2.5">
                    <div className="h-3 w-16 bg-[#1A1A22] rounded shimmer" />
                    <div className="h-4 w-full bg-[#1A1A22] rounded shimmer" />
                    <div className="h-4 w-20 bg-[#1A1A22] rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#141418] border border-[#1E1E26] flex items-center justify-center mb-6">
                <Package size={32} className="text-[#4A4A5A]" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                {hasFilters ? 'No matches' : 'Coming soon'}
              </h3>
              <p className="text-sm text-[#6A6A80] max-w-sm mb-8">
                {hasFilters
                  ? 'Try adjusting your filters or search terms.'
                  : 'Fresh inventory dropping soon. Check back or follow us for updates.'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#FF2E88]/20 transition-all active:scale-[0.97]"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.5, ease: easeOutExpo }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
