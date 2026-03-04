'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Keyboard, Camera, Search, Loader2, Check, X, Package, RotateCcw, Sparkles, ShoppingBag, Box, ImagePlus, Zap, ScanBarcode, ArrowRight, ChevronRight, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { isBarcode, isStyleId, normalizeStyleId, barcodeSearchQueries } from '@/lib/barcode-utils'

type Tab = 'scan' | 'camera' | 'search'
type ScanState = 'idle' | 'looking_up' | 'found' | 'not_found' | 'adding' | 'added'

interface ProductResult {
  id: string
  name: string
  brand: string | null
  colorway: string | null
  styleId: string | null
  size: string | null
  retailPrice: number | null
  imageUrl: string
  imageUrls: string[]
  source: 'cache' | 'goat' | 'upc' | 'stockx'
  goatProductId?: string
  availableSizes?: string[]
}

// Fetch StockX product detail for sizes + better images

const SNEAKER_SIZES = [
  '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5',
  '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5',
  '14', '14.5', '15', '16', '17', '18',
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function ScanPage() {
  const [tab, setTab] = useState<Tab>('scan')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [barcode, setBarcode] = useState('')
  
  const [result, setResult] = useState<ProductResult | null>(null)
  
  

  const [selectedSize, setSelectedSize] = useState('')
  const [condition, setCondition] = useState<'new' | 'preowned'>('new')
  const [hasBox, setHasBox] = useState(true)
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const lastKeyTime = useRef(0)
  const rapidBuffer = useRef('')

  useEffect(() => {
    if (tab === 'scan' && scanState === 'idle') setTimeout(() => inputRef.current?.focus(), 100)
    if (tab === 'search') setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [tab, scanState])


  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return
    setScanState('looking_up')
    setResult(null)

    const makeResult = (p: any, source: 'cache' | 'goat' | 'upc' | 'stockx'): ProductResult => ({
      id: p.id || '',
      name: p.name || '',
      brand: p.brand || null,
      colorway: p.colorway || null,
      styleId: p.styleId || p.sku || null,
      size: p.size || null,
      retailPrice: p.retailPrice || null,
      imageUrl: p.image || p.thumb || p.imageUrl || '',
      imageUrls: [p.image || p.thumb || p.imageUrl || ''].filter(Boolean),
      source,
      goatProductId: p.goatProductId || p.id,
      availableSizes: p.availableSizes || undefined,
    })

    try {
      // ── Step 1: Always check barcode cache first ──
      try {
        const cacheRes = await fetch(`/api/admin/barcode-cache?barcode=${encodeURIComponent(code)}`)
        const cacheData = await cacheRes.json()
        if (cacheData.found && cacheData.product) {
          const cp = cacheData.product
          setResult({
            id: cp.goatProductId || cp.stockxProductId || code,
            name: cp.name,
            brand: cp.brand,
            colorway: cp.colorway,
            styleId: cp.styleId,
            size: cp.size,
            retailPrice: cp.retailPrice,
            imageUrl: cp.imageUrl || '',
            imageUrls: cp.imageUrls || [],
            source: 'cache',
            goatProductId: cp.goatProductId,
          })
          if (cp.size) setSelectedSize(cp.size)
          if (cp.retailPrice) setPrice(cp.retailPrice.toString())
          setScanState('found')
          toast.success(`Found (scan #${cacheData.scanCount}): ${cp.name}`)
          // Fetch sizes from StockX if we have a product ID
          return
        }
      } catch {}

      const codeIsBarcode = isBarcode(code)

      // ── Step 2: Text queries (style IDs, shoe names) → search GOAT directly ──
      if (!codeIsBarcode) {
        const searchTerm = isStyleId(code) ? normalizeStyleId(code) : code
        const res = await fetch(`/api/stockx/search?q=${encodeURIComponent(searchTerm)}`)
        const data = await res.json()
        const products = data.products || []

        if (products.length > 0) {
          const p = products[0]
          const product = makeResult(p, 'stockx')
          setResult(product)
          if (p.retailPrice) setPrice(p.retailPrice.toString())
          setScanState('found')
          toast.success(`Found: ${p.name}`)
          return
        }

        // Text search failed — show not found
        setScanState('not_found')
        toast('No products found — try different keywords')
        return
      }

      // ── Step 3: Barcode path — try GOAT direct barcode search ──
      const queries = barcodeSearchQueries(code)
      for (const q of queries) {
        try {
          const res = await fetch(`/api/stockx/search?q=${encodeURIComponent(q)}`)
          const data = await res.json()
          const products = data.products || []
          if (products.length > 0) {
            const p = products[0]
            const product = makeResult(p, 'stockx')
            setResult(product)
            if (p.retailPrice) setPrice(p.retailPrice.toString())
            setScanState('found')
            toast.success(`Found: ${p.name}`)
            saveToCache(code, product)
            return
          }
        } catch {}
      }

      // ── Step 4: UPC database lookup → get product name → GOAT search ──
      try {
        const upcRes = await fetch(`/api/upc-lookup?upc=${encodeURIComponent(code)}`)
        const upcData = await upcRes.json()
        if (upcData.title || upcData.brand) {
          const searchTerm = upcData.title || upcData.brand
          const res = await fetch(`/api/stockx/search?q=${encodeURIComponent(searchTerm)}`)
          const data = await res.json()
          if ((data.products || []).length > 0) {
            const p = data.products[0]
            const product = makeResult(p, 'stockx')
            setResult(product)
            if (p.retailPrice) setPrice(p.retailPrice.toString())
            setScanState('found')
            toast.success(`Found via UPC: ${p.name}`)
            saveToCache(code, product)
            return
          }
        }
      } catch {}

      // ── Step 5: Nothing found — auto-switch to search tab ──
      setScanState('not_found')
      setTab('search')
      setSearchQuery('')
      toast('Barcode not in database — search by shoe name or style ID')
    } catch (err) {
      console.error('Lookup error:', err)
      setScanState('not_found')
      setTab('search')
      toast.error('Lookup failed — try searching by name')
    }
  }, [])

  const saveToCache = (barcodeVal: string, product: ProductResult) => {
    fetch('/api/admin/barcode-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: barcodeVal,
        productName: product.name,
        brand: product.brand,
        colorway: product.colorway,
        styleId: product.styleId,
        size: product.size,
        retailPrice: product.retailPrice,
        imageUrl: product.imageUrl,
        imageUrls: product.imageUrls,
        goatProductId: product.goatProductId || product.id,
      }),
    }).catch(() => {})
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/stockx/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.products || [])
      if ((data.products || []).length === 0) toast('No products found — try different keywords')
    } catch { toast.error('Search failed') }
    setSearching(false)
  }

  const handleSearchSelect = async (p: any) => {
    const product: ProductResult = {
      id: p.id || '',
      name: p.name || '',
      brand: p.brand || null,
      colorway: p.colorway || null,
      styleId: p.styleId || p.sku || null,
      size: null,
      retailPrice: p.retailPrice || null,
      imageUrl: p.image || p.thumb || '',
      imageUrls: [p.image || p.thumb || ''].filter(Boolean),
      source: 'goat',
      goatProductId: p.id,
      availableSizes: p.availableSizes || undefined,
    }

    setResult(product)
    if (p.retailPrice) setPrice(p.retailPrice.toString())
    setSelectedSize('')
    setSearchResults([])
    setTab('scan')
    setScanState('found')
    toast.success(`Selected: ${p.name}`)
  }

  const handleAdd = async () => {
    if (!result || !selectedSize || !price) {
      toast.error('Fill in size and price')
      return
    }
    setScanState('adding')
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          brand: result.brand,
          style_id: result.styleId,
          size: selectedSize,
          condition,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : null,
          quantity: parseInt(quantity) || 1,
          image_url: result.imageUrl || null,
          images: condition === 'preowned' && photos.length > 0
            ? photos
            : result.imageUrls.length > 0 ? result.imageUrls : [],
          status: 'active',
          colorway: result.colorway,
          tags: hasBox ? ['has_box'] : [],
        }),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to add')
      toast.success('Added to inventory!')
      setScanState('added')
      setTimeout(resetScan, 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add product')
      setScanState('found')
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) setPhotos(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const resetScan = () => {
    setScanState('idle')
    setResult(null)
    setBarcode('')
    setSelectedSize('')
    setCondition('new')
    setHasBox(true)
    setPrice('')
    setCost('')
    setQuantity('1')
    setPhotos([])
    setSearchQuery('')
    setSearchResults([])
    setTab('scan')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const tabs = [
    { id: 'scan' as Tab, label: 'Scan / Type', icon: ScanBarcode, desc: 'UPC or Style ID' },
    { id: 'camera' as Tab, label: 'Camera', icon: Camera, desc: 'Coming soon' },
    { id: 'search' as Tab, label: 'Search', icon: Search, desc: 'By name' },
  ]

  return (
    <div className="space-y-6 page-enter max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF2E88] to-[#FF2E88]/60 flex items-center justify-center shadow-lg shadow-[#FF2E88]/20">
              <ScanBarcode size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Scan Product</h1>
              <p className="text-xs text-[var(--text-muted)]">Scan a barcode, type a UPC/style ID, or search</p>
            </div>
          </div>
        </div>
        {(result || scanState === 'not_found') && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={resetScan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:text-white hover:border-[#00C2D6]/40 hover:bg-[#00C2D6]/5 transition-all duration-300"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-90deg] transition-transform" /> New Scan
          </motion.button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {tabs.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border text-sm font-semibold transition-all duration-300 overflow-hidden group',
              tab === id
                ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-lg shadow-[#FF2E88]/20'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF2E88]/30 hover:text-white'
            )}
          >
            {tab === id && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-[#FF2E88]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={18} className={tab === id ? '' : 'group-hover:scale-110 transition-transform'} />
              {label}
            </span>
            <span className={cn('relative z-10 text-[10px] font-normal', tab === id ? 'text-white/70' : 'text-[var(--text-muted)]')}>
              {desc}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Tab: Scan / Type ── */}
      <AnimatePresence mode="wait">
        {tab === 'scan' && scanState !== 'found' && scanState !== 'added' && (
          <motion.form
            key="scan-form"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={(e) => { e.preventDefault(); lookupBarcode(barcode) }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden"
          >
            {/* Decorative corner glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF2E88]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00C2D6]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3 font-semibold uppercase tracking-wider">
                <Zap size={12} className="text-[#00C2D6]" />
                UPC / Barcode / Style ID
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupBarcode(barcode) } }}
                    placeholder="Scan with gun or type..."
                    className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl px-5 py-4 text-lg text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none font-mono tracking-wider transition-all duration-300 focus:shadow-lg focus:shadow-[#FF2E88]/10"
                    autoFocus
                    autoComplete="off"
                  />
                  {barcode && (
                    <button
                      type="button"
                      onClick={() => setBarcode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition"
                    >
                      <X size={16} className="text-[var(--text-muted)]" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={scanState === 'looking_up' || !barcode.trim()}
                  className="bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white px-8 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-lg shadow-[#FF2E88]/20 hover:shadow-xl hover:shadow-[#FF2E88]/30 transition-all duration-300 active:scale-[0.97]"
                >
                  {scanState === 'looking_up' ? <Loader2 size={18} className="animate-spin" /> : <><Search size={16} /> Look Up</>}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5"><ScanBarcode size={12} className="text-[#00C2D6]" /> Barcode scanner supported</span>
                <span className="w-px h-3 bg-[var(--border)]" />
                <span className="flex items-center gap-1.5"><Keyboard size={12} className="text-[#FF2E88]" /> Type UPC or style ID</span>
              </div>
            </div>
          </motion.form>
        )}

        {/* ── Tab: Search ── */}
        {tab === 'search' && (
          <motion.div
            key="search-tab"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#00C2D6]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3 font-semibold uppercase tracking-wider">
                  <Search size={12} className="text-[#00C2D6]" />
                  Search by Name or Style ID
                </label>
                <div className="flex gap-3">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                    placeholder="Jordan 4 Retro, DH6927-111..."
                    className="flex-1 bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#00C2D6] focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-[#00C2D6]/10"
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="bg-[#FF2E88] hover:bg-[#FF2E88]/90 text-white px-6 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-lg shadow-[#FF2E88]/20 transition-all duration-300 active:scale-[0.97]"
                  >
                    {searching ? <Loader2 size={18} className="animate-spin" /> : <><Search size={16} /> Search</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider px-1">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  {searchResults.map((p: any, i: number) => (
                    <motion.button
                      key={p.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSearchSelect(p)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[#FF2E88]/40 hover:shadow-lg hover:shadow-[#FF2E88]/5 transition-all duration-300 text-left group"
                    >
                      {(p.image || p.thumb) ? (
                        <div className="w-18 h-18 rounded-xl overflow-hidden bg-white shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <img src={p.image || p.thumb} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                      ) : (
                        <div className="w-18 h-18 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                          <Package size={24} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate group-hover:text-[#FF2E88] transition-colors">{p.name}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {p.brand}{p.colorway ? ` · ${p.colorway}` : ''}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {(p.styleId || p.sku) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#00C2D6]/10 text-[#00C2D6] font-mono font-medium border border-[#00C2D6]/20">
                              {p.styleId || p.sku}
                            </span>
                          )}
                          {p.retailPrice > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FF2E88]/10 text-[#FF2E88] font-semibold border border-[#FF2E88]/20">
                              ${p.retailPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-[#FF2E88] font-semibold group-hover:translate-x-0.5 transition-transform">
                          Select <ChevronRight size={14} />
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Tab: Camera ── */}
        {tab === 'camera' && (
          <motion.div
            key="camera-tab"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00C2D6]/5 to-[#FF2E88]/5 pointer-events-none" />
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#00C2D6]/10 border border-[#00C2D6]/20 flex items-center justify-center mx-auto mb-5">
                <Camera size={32} className="text-[#00C2D6]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Camera Scanning</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">Coming soon — use a USB barcode scanner or type the UPC manually for now</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ── */}
      <AnimatePresence>
        {scanState === 'looking_up' && tab === 'scan' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[#FF2E88]/20 border-t-[#FF2E88] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanBarcode size={20} className="text-[#FF2E88]" />
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-5 font-medium">Looking up product...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Checking cache, then searching databases</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Found ── */}
      <AnimatePresence>
        {scanState === 'found' && result && (
          <motion.div
            key="product-found"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Product Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden relative">
              {/* Source badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-2.5 py-1 rounded-lg bg-[#00C2D6]/15 border border-[#00C2D6]/25 text-[10px] text-[#00C2D6] uppercase tracking-wider font-bold">
                  via {result.source}
                </span>
              </div>

              <div className="flex flex-col md:flex-row">
                <div className="md:w-80 bg-white/[0.03] flex items-center justify-center p-8 shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF2E88]/5 to-transparent pointer-events-none" />
                  {result.imageUrl ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      src={result.imageUrl}
                      alt={result.name}
                      className="w-full max-h-64 object-contain drop-shadow-2xl relative z-10"
                    />
                  ) : (
                    <Package className="w-20 h-20 text-[var(--text-muted)]" />
                  )}
                </div>

                <div className="flex-1 p-6 space-y-4">
                  <div>
                    {result.brand && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-bold text-[#FF2E88] uppercase tracking-[0.15em]"
                      >
                        {result.brand}
                      </motion.p>
                    )}
                    <h2 className="text-xl font-black text-white mt-1.5 leading-tight">{result.name}</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.styleId && (
                      <span className="px-3 py-1.5 bg-[#00C2D6]/10 border border-[#00C2D6]/20 rounded-xl text-xs font-mono text-[#00C2D6] font-medium">
                        {result.styleId}
                      </span>
                    )}
                    {result.colorway && (
                      <span className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-secondary)]">
                        {result.colorway}
                      </span>
                    )}
                    {result.retailPrice != null && (
                      <span className="px-3 py-1.5 bg-[#FF2E88]/10 border border-[#FF2E88]/20 rounded-xl text-xs text-[#FF2E88] font-semibold">
                        Retail: ${result.retailPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Form */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2E88]/3 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-[#00C2D6]" />
                  Add to Inventory
                </h3>
              </div>

              {/* Size Grid */}
              <div className="relative">
                <label className="text-xs text-[var(--text-secondary)] mb-3 block font-semibold uppercase tracking-wider">
                  Size {selectedSize && <span className="text-[#FF2E88] normal-case tracking-normal">— {selectedSize}</span>}
                  {result?.availableSizes && result.availableSizes.length > 0 && (
                    <span className="text-[#00C2D6] ml-2 normal-case tracking-normal">{result.availableSizes.length} available</span>
                  )}
                </label>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                  {(result?.availableSizes && result.availableSizes.length > 0 ? result.availableSizes : SNEAKER_SIZES).map(s => (
                    <motion.button
                      key={s}
                      variants={scaleIn}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border',
                        selectedSize === s
                          ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-lg shadow-[#FF2E88]/25 scale-105'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF2E88]/40 hover:text-white hover:bg-[#FF2E88]/5'
                      )}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              </div>

              {/* Condition + Box Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2.5 block font-semibold uppercase tracking-wider">Condition</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition('new')}
                      className={cn(
                        'py-3.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-center gap-2',
                        condition === 'new'
                          ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-lg shadow-[#FF2E88]/20'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF2E88]/40'
                      )}
                    >
                      <Sparkles size={14} className={condition === 'new' ? 'animate-pulse' : ''} />
                      New / DS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('preowned')}
                      className={cn(
                        'py-3.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-center gap-2',
                        condition === 'preowned'
                          ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-lg shadow-[#FF2E88]/20'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF2E88]/40'
                      )}
                    >
                      <ShoppingBag size={14} />
                      Preowned
                    </button>
                  </div>
                </div>

                {/* Has Box Toggle */}
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2.5 block font-semibold uppercase tracking-wider">Box</label>
                  <button
                    type="button"
                    onClick={() => setHasBox(!hasBox)}
                    className={cn(
                      'flex items-center justify-between w-full rounded-xl px-4 py-3 border transition-all duration-300',
                      hasBox
                        ? 'bg-[#00C2D6]/10 border-[#00C2D6]/30'
                        : 'bg-[var(--bg)] border-[var(--border)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Box size={16} className={hasBox ? 'text-[#00C2D6]' : 'text-[var(--text-muted)]'} />
                      <span className={cn('text-xs font-semibold', hasBox ? 'text-white' : 'text-[var(--text-secondary)]')}>
                        Original Box
                      </span>
                    </div>
                    <div className={cn(
                      'relative w-10 h-5.5 rounded-full transition-colors duration-300',
                      hasBox ? 'bg-[#00C2D6]' : 'bg-[var(--border)]'
                    )}>
                      <div className={cn(
                        'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        hasBox ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Photo Upload (for preowned) */}
              <AnimatePresence>
                {condition === 'preowned' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-xs text-[var(--text-secondary)] mb-2.5 block font-semibold uppercase tracking-wider">
                      Photos <span className="text-[var(--text-muted)] normal-case tracking-normal">(show actual condition)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)] group">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[#00C2D6]/40 hover:text-[#00C2D6] transition-all duration-300"
                      >
                        <ImagePlus size={20} />
                        <span className="text-[10px] mt-1 font-medium">Add</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Price / Cost / Qty */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block font-semibold uppercase tracking-wider">
                    Sell Price <span className="text-[#FF2E88]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl pl-8 pr-3 py-3 text-sm text-white font-mono focus:border-[#FF2E88] focus:outline-none transition-all"
                      placeholder="250"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block font-semibold uppercase tracking-wider">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={e => setCost(e.target.value)}
                      className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl pl-8 pr-3 py-3 text-sm text-white font-mono focus:border-[#00C2D6] focus:outline-none transition-all"
                      placeholder="150"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block font-semibold uppercase tracking-wider">Qty</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl px-3.5 py-3 text-sm text-white font-mono focus:border-[#00C2D6] focus:outline-none transition-all text-center"
                    min="1"
                  />
                </div>
              </div>

              {/* Margin */}
              <AnimatePresence>
                {price && cost && parseFloat(cost) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 bg-gradient-to-r from-[#00C2D6]/10 to-transparent border border-[#00C2D6]/20 rounded-xl px-4 py-3"
                  >
                    <Tag size={14} className="text-[#00C2D6]" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      Margin: <span className="text-white font-bold">${(parseFloat(price) - parseFloat(cost)).toFixed(2)}</span>
                      <span className="text-[#00C2D6] ml-1.5 font-semibold">
                        ({((parseFloat(price) - parseFloat(cost)) / parseFloat(cost) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleAdd}
                disabled={(scanState as string) === 'adding' || !selectedSize || !price}
                className="w-full bg-[#FF2E88] text-white font-black py-4.5 rounded-xl text-base flex items-center justify-center gap-2.5 hover:bg-[#FF2E88]/90 transition-all duration-300 disabled:opacity-40 shadow-lg shadow-[#FF2E88]/20 hover:shadow-xl hover:shadow-[#FF2E88]/30 active:scale-[0.98]"
              >
                {(scanState as string) === 'adding' ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                {(scanState as string) === 'adding' ? 'Adding...' : 'Add to Inventory'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Added Success ── */}
      <AnimatePresence>
        {scanState === 'added' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-green-500/15 border border-green-500/25 flex items-center justify-center mb-5"
            >
              <Check size={36} className="text-green-400" />
            </motion.div>
            <h3 className="text-xl font-black text-white mb-2">Product Added!</h3>
            <p className="text-sm text-[var(--text-muted)]">Scanning next product...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
