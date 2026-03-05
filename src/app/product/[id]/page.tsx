'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Truck, Shield, Package, ChevronLeft, ChevronRight, Share2, Heart, Star, CheckCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { ProductCard } from '@/components/shop/product-card'
import { ConditionBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  brand: string
  price: number
  size: string
  condition: string
  image_url: string | null
  images: string[] | null
  description: string | null
  colorway: string | null
  style_id: string | null
  stockx_price: number | null
  has_box: boolean | null
  status: string
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Pick<Product, 'id' | 'name' | 'brand' | 'price' | 'size' | 'condition' | 'image_url'>[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageDirection, setImageDirection] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setProduct(data)
        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .neq('id', id)
          .ilike('brand', `%${data.brand}%`)
          .limit(4)
        setRelated(rel || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const gallery: string[] = []
  if (product?.images?.length) {
    gallery.push(...product.images)
  } else if (product?.image_url) {
    gallery.push(product.image_url)
  }

  const navigateImage = (dir: number) => {
    setImageDirection(dir)
    setSelectedImage(prev => {
      const next = prev + dir
      if (next < 0) return gallery.length - 1
      if (next >= gallery.length) return 0
      return next
    })
  }

  const [showCleaningUpsell, setShowCleaningUpsell] = useState(false)
  const setCleaning = useCartStore((s) => s.setCleaning)

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      size: product.size,
      price: product.price,
      condition: product.condition,
      image_url: gallery[0] || product.image_url,
    })
    setAddedToCart(true)

    // Show cleaning upsell for preowned sneakers
    if (product.condition && product.condition.toLowerCase() !== 'new' && product.condition.toLowerCase() !== 'ds') {
      setShowCleaningUpsell(true)
    } else {
      toast.success('Added to cart')
    }
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleCleaningChoice = (tier: 'cleaning' | 'cleaning_icing' | null) => {
    if (!product) return
    if (tier) {
      setCleaning(product.id, tier)
      toast.success(tier === 'cleaning' ? 'Cleaning added (+$20)' : 'Cleaning + Icing added (+$30)')
    } else {
      toast.success('Added to cart')
    }
    setShowCleaningUpsell(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url: window.location.href })
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-28 px-6 md:px-12 lg:px-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 rounded-3xl bg-[#141418] border border-[#1E1E26] flex items-center justify-center mb-6">
            <Package className="w-8 h-8 text-[#4A4A5A]" />
          </div>
          <h1 className="text-2xl font-black mb-2">Product not found</h1>
          <p className="text-[#6A6A80] mb-8">This product may have been removed or sold.</p>
          <Link href="/shop"><Button variant="secondary">Back to Shop</Button></Link>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  const savingsPercent = product.stockx_price && product.stockx_price > product.price
    ? Math.round((1 - product.price / product.stockx_price) * 100)
    : null

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-28 px-6 md:px-12 lg:px-16 pb-mobile-nav">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-sm text-[#4A4A5A] mb-8"
          >
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-[#2A2A36]">/</span>
            <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
            <span className="text-[#2A2A36]">/</span>
            <span className="text-[#6A6A80] truncate max-w-[200px]">{product.name}</span>
          </motion.nav>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* ─── Image Gallery ─── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
              className="space-y-4"
            >
              <div className="aspect-square relative rounded-3xl bg-gradient-to-br from-[#f0f0f0] via-[#e8e8e8] to-[#d8d8d8] border border-[#1E1E26] overflow-hidden group">
                {gallery.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0, x: imageDirection * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: imageDirection * -40 }}
                        transition={{ duration: 0.3, ease: easeOutExpo }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={gallery[selectedImage]}
                          alt={product.name}
                          fill
                          className="object-contain p-10 md:p-12"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                          quality={85}
                          style={{ filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.15))' }}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation arrows */}
                    {gallery.length > 1 && (
                      <>
                        <button
                          onClick={() => navigateImage(-1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0C0C0C]/60 backdrop-blur-md border border-[#1E1E26]/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-[#0C0C0C]/80 hover:scale-110"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigateImage(1)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0C0C0C]/60 backdrop-blur-md border border-[#1E1E26]/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-[#0C0C0C]/80 hover:scale-110"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0C0C0C]/50 backdrop-blur-sm px-3 py-2 rounded-full">
                          {gallery.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => { setImageDirection(i > selectedImage ? 1 : -1); setSelectedImage(i) }}
                              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${i === selectedImage ? 'bg-[#FF2E88] w-6' : 'bg-white/30 hover:bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Savings badge */}
                    {savingsPercent && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-[#10B981]/90 text-white text-xs font-bold shadow-lg">
                        Save {savingsPercent}%
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4A4A5A]">No Image</div>
                )}
              </div>

              {/* Thumbnail strip */}
              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setImageDirection(i > selectedImage ? 1 : -1); setSelectedImage(i) }}
                      className={`w-18 h-18 rounded-xl border-2 overflow-hidden shrink-0 cursor-pointer transition-all duration-300 ${
                        i === selectedImage ? 'border-[#FF2E88] shadow-lg shadow-[#FF2E88]/20' : 'border-[#1E1E26] hover:border-[#2A2A36]'
                      }`}
                    >
                      <Image src={img} alt="" width={72} height={72} className="w-full h-full object-contain p-1.5 bg-[#e8e8e8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ─── Details ─── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.1 }}
              className="py-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold text-[#6A6A80] uppercase tracking-[0.2em]">{product.brand}</p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mt-2 leading-tight tracking-tight">{product.name}</h1>
                </div>
                <button
                  onClick={handleShare}
                  className="shrink-0 w-11 h-11 rounded-xl bg-[#141418] border border-[#1E1E26] flex items-center justify-center text-[#6A6A80] hover:text-white hover:border-[#2A2A36] transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {product.colorway && <p className="text-sm text-[#A0A0B8] mt-2">{product.colorway}</p>}
              {product.style_id && <p className="text-xs text-[#4A4A5A] mt-1 font-mono">{product.style_id}</p>}

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <ConditionBadge condition={product.condition} />
                <span className="text-xs text-[#6A6A80] bg-[#141418] border border-[#1E1E26] px-3 py-1 rounded-lg font-medium">
                  Size {product.size}
                </span>
                {product.has_box !== null && (
                  <span className="text-xs px-3 py-1 rounded-lg bg-[#141418] border border-[#1E1E26] text-[#6A6A80] font-medium">
                    {product.has_box ? '📦 With Box' : 'No Box'}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mt-8 p-5 rounded-2xl bg-[#141418] border border-[#1E1E26]">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black tracking-tight">{formatPrice(product.price)}</span>
                  {product.stockx_price && product.stockx_price > product.price && (
                    <span className="text-lg text-[#4A4A5A] line-through font-medium">{formatPrice(product.stockx_price)}</span>
                  )}
                </div>
                {savingsPercent && (
                  <p className="mt-2 text-sm text-[#10B981] font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    You save {formatPrice(product.stockx_price! - product.price)} ({savingsPercent}% below retail)
                  </p>
                )}
              </div>

              {/* Add to cart */}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className={`w-full mt-6 h-14 text-base rounded-2xl transition-all duration-300 ${addedToCart ? 'bg-[#10B981] hover:bg-[#10B981]' : ''}`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart — {formatPrice(product.price)}
                  </>
                )}
              </Button>

              {/* Description */}
              {product.description && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold mb-3 text-white">Description</h3>
                  <p className="text-sm text-[#A0A0B8] leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-8 space-y-0 rounded-2xl bg-[#141418] border border-[#1E1E26] overflow-hidden divide-y divide-[#1E1E26]">
                <div className="flex items-center gap-4 px-5 py-4 group">
                  <div className="w-9 h-9 rounded-xl bg-[#FF2E88]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Truck className="w-4 h-4 text-[#FF2E88]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {product.price >= FREE_SHIPPING_THRESHOLD ? 'Free Shipping' : 'Shipping'}
                    </p>
                    <p className="text-[11px] text-[#4A4A5A]">
                      {product.price >= FREE_SHIPPING_THRESHOLD ? 'This item ships free' : `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-4 group">
                  <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Authenticity Guaranteed</p>
                    <p className="text-[11px] text-[#4A4A5A]">Every pair verified before it ships</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Related Products ─── */}
          {related.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
              className="mt-24 pb-12"
            >
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF2E88] mb-1">More From {product.brand}</p>
                  <h2 className="text-2xl font-black tracking-tight">You Might Also Like</h2>
                </div>
                <Link href="/shop" className="text-sm text-[#6A6A80] hover:text-[#FF2E88] transition-colors font-medium flex items-center gap-1 group">
                  View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                {related.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />

      {/* Cleaning Upsell Modal — shows for preowned sneakers */}
      {showCleaningUpsell && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => handleCleaningChoice(null)} />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative bg-[#141418] border border-[#1E1E26] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 pb-8 sm:p-8 shadow-2xl"
          >
            <div className="w-10 h-1 bg-[#2A2A36] rounded-full mx-auto mb-6 sm:hidden" />
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#FF2E88]/10 border border-[#FF2E88]/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Fresh it up?</h3>
              <p className="text-sm text-[#6A6A80]">Add professional cleaning to your preowned pair</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCleaningChoice('cleaning')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#1E1E26] bg-[#1A1A22] hover:border-[#FF2E88]/40 transition-all group cursor-pointer"
              >
                <div className="text-left">
                  <p className="font-semibold text-white group-hover:text-[#FF2E88] transition-colors">Basic Cleaning</p>
                  <p className="text-xs text-[#6A6A80] mt-0.5">Deep clean, deodorize, restore freshness</p>
                </div>
                <span className="text-[#FF2E88] font-bold text-lg">+$20</span>
              </button>

              <button
                onClick={() => handleCleaningChoice('cleaning_icing')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#00C2D6]/30 bg-[#00C2D6]/5 hover:border-[#00C2D6]/60 transition-all group cursor-pointer"
              >
                <div className="text-left">
                  <p className="font-semibold text-white group-hover:text-[#00C2D6] transition-colors">Cleaning + Sole Icing</p>
                  <p className="text-xs text-[#6A6A80] mt-0.5">Full clean + yellowed sole restoration</p>
                </div>
                <div className="text-right">
                  <span className="text-[#00C2D6] font-bold text-lg">+$30</span>
                  <p className="text-[10px] text-[#00C2D6]/70 font-semibold">POPULAR</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => handleCleaningChoice(null)}
              className="w-full py-3 text-sm text-[#6A6A80] hover:text-white font-medium transition-colors cursor-pointer"
            >
              No thanks, just the sneakers
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
