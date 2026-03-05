'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, RefreshCw, Package, Droplets, Instagram, Star, Zap, CheckCircle, ChevronRight } from 'lucide-react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { HeroShowcase } from '@/components/home/hero-showcase'
import { ProductCard } from '@/components/shop/product-card'
import { FilterTabs } from '@/components/shop/filter-tabs'
import { ProductGridSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BUSINESS_INSTAGRAM } from '@/lib/constants'

interface Product {
  id: string
  name: string
  brand: string
  price: number
  size: string
  condition: string
  image_url: string | null
  status: string
}

const MARQUEE_ITEMS = [
  'AUTHENTICATED PAIRS',
  'FREE SHIPPING OVER $200',
  'DENVER, CO',
  'NEW & PREOWNED',
  'SNEAKER CLEANING',
  'FAIR PRICES',
  'SOLE ICING',
  'VERIFIED AUTHENTIC',
]

const TRUST_SIGNALS = [
  { icon: Shield, label: 'Authenticated', desc: 'Every pair verified', color: '#FF2E88' },
  { icon: Truck, label: 'Fast Shipping', desc: 'Free over $200', color: '#00C2D6' },
  { icon: RefreshCw, label: 'Easy Returns', desc: 'Hassle-free process', color: '#A855F7' },
  { icon: Star, label: '5-Star Service', desc: 'Customer first always', color: '#F59E0B' },
]

const CATEGORIES = [
  { name: 'New Arrivals', desc: 'Fresh heat just dropped', href: '/shop?condition=new', gradient: 'from-[#FF2E88]/20 to-[#FF2E88]/5', icon: Zap },
  { name: 'Preowned', desc: 'Authenticated & affordable', href: '/shop?condition=preowned', gradient: 'from-[#00C2D6]/20 to-[#00C2D6]/5', icon: CheckCircle },
  { name: 'Deals', desc: 'Below retail steals', href: '/deals', gradient: 'from-[#A855F7]/20 to-[#A855F7]/5', icon: Star },
]

const easeOutExpo = [0.16, 1, 0.3, 1] as const

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, brand, price, size, condition, image_url, status')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(12)
        setProducts(data || [])
      } catch {
        // Silently fail — empty state will show
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'all' ? products
    : filter === 'new' ? products.filter(p => p.condition === 'new')
    : products.filter(p => p.condition !== 'new')

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />

      {/* ─── Marquee Ticker ─── */}
      <motion.div style={{ opacity: heroOpacity }} className="fixed top-16 md:top-20 left-0 right-0 z-30 bg-[#0C0C0C] border-b border-[#1E1E26]/50 overflow-hidden pointer-events-auto">
        <div className="marquee-track py-2">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-3 px-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6A6A80] whitespace-nowrap">
              {item}
              <span className="w-1 h-1 rounded-full bg-[#FF2E88]" />
            </span>
          ))}
        </div>
      </motion.div>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-48 pb-32 md:pt-64 md:pb-52 px-6 md:px-12 lg:px-16 overflow-hidden">
        {/* Parallax video background */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            poster="/hero-bg.webp"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C]/70 via-[#0C0C0C]/30 to-[#0C0C0C]" />
          {/* Side fade for desktop */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/80 via-transparent to-[#0C0C0C]/80 hidden md:block" />
        </motion.div>

        {/* Ambient glows */}
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-[#FF2E88]/[0.06] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00C2D6]/[0.04] blur-[120px] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity }} className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: easeOutExpo }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#141418]/80 border border-[#1E1E26] text-xs text-[#6A6A80] mb-8 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2E88] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2E88]" />
                </span>
                LIVE INVENTORY — Denver, CO
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: easeOutExpo, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-[-0.03em]"
              >
                Premium
                <br />
                Kicks,
                <br />
                <span className="text-gradient">Fair Prices</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.2 }}
                className="mt-8 text-lg md:text-xl text-[#A0A0B8] max-w-lg leading-relaxed"
              >
                Shop authenticated new and preowned sneakers. Every pair verified, every purchase backed by our guarantee.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.35 }}
                className="flex flex-wrap gap-4 mt-10"
              >
                <Link href="/shop">
                  <Button size="lg" className="group">
                    Shop Now
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/cleaning">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#00C2D6] hover:bg-[#00C2D6]/90 text-white transition-all shadow-lg shadow-[#00C2D6]/25 cursor-pointer">
                    <Droplets className="w-4 h-4" />
                    Cleaning Service
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Right: Hero Showcase */}
            <HeroShowcase />
          </div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.5 }}
            className="mt-24"
          >
            <div className="glow-line mb-10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_SIGNALS.map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className="group flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 border"
                    style={{
                      backgroundColor: `${color}08`,
                      borderColor: `${color}15`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-[#6A6A80]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Category Spotlights ─── */}
      <section className="px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: easeOutExpo }}
              >
                <Link href={cat.href}>
                  <div className={`relative rounded-2xl bg-gradient-to-br ${cat.gradient} border border-[#1E1E26] p-6 md:p-8 overflow-hidden group transition-all duration-500 hover:border-[#FF2E88]/20 hover:shadow-xl hover:shadow-black/30`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-[40px] group-hover:w-40 group-hover:h-40 transition-all duration-700" />
                    <cat.icon className="w-8 h-8 text-white/20 mb-4 group-hover:text-white/40 transition-colors duration-500" />
                    <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
                    <p className="text-sm text-[#A0A0B8] mb-4">{cat.desc}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-[#FF2E88] group-hover:gap-2 transition-all duration-300">
                      Browse <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products Section ─── */}
      <section className="px-6 md:px-12 lg:px-16 pt-12 pb-32 pb-mobile-nav">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
          >
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF2E88] mb-2"
              >
                Latest Inventory
              </motion.p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Fresh Heat</h2>
              <p className="text-sm text-[#6A6A80] mt-2">Authenticated sneakers, updated daily</p>
            </div>
            <FilterTabs
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'new', label: 'New' },
                { value: 'preowned', label: 'Preowned' },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </motion.div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-[#141418] border border-[#1E1E26] flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-[#6A6A80]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Inventory Coming Soon</h3>
              <p className="text-sm text-[#6A6A80] max-w-xs">
                New inventory coming soon. Follow us on Instagram to get notified first.
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: i * 0.04, duration: 0.5, ease: easeOutExpo }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
              {products.length >= 12 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex justify-center mt-14"
                >
                  <Link href="/shop">
                    <Button variant="secondary" size="lg" className="group">
                      View All Products
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ─── Cleaning Service CTA ─── */}
      <section className="px-6 md:px-12 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOutExpo }}
            className="relative rounded-3xl overflow-hidden border border-[#1E1E26] noise"
          >
            {/* Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#141418] via-[#0F0F13] to-[#0C0C0C]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00C2D6]/[0.04] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#FF2E88]/[0.03] rounded-full blur-[100px]" />

            <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00C2D6]/10 border border-[#00C2D6]/20 text-[#00C2D6] text-xs font-medium mb-6">
                  <Droplets className="w-3.5 h-3.5" />
                  Professional Service
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[0.95] tracking-tight">
                  Sneaker
                  <br />
                  Cleaning
                  <br />
                  <span className="text-[#00C2D6]">& Restoration</span>
                </h2>
                <p className="mt-6 text-[#A0A0B8] leading-relaxed max-w-md">
                  Got a pair that needs some love? Our professional cleaning service brings your kicks back to life. From basic cleans to sole icing — starting at just $20.
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link href="/cleaning">
                    <Button size="lg" className="group">
                      Learn More
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="grid grid-cols-2 gap-6 max-w-md">
                  {[
                    { label: 'Sneaker Cleaning', price: '$20', features: ['Full exterior clean', 'Lace cleaning', 'Deodorize', 'Quick turnaround'] },
                    { label: 'Cleaning + Icing', price: '$30', features: ['Full deep clean', 'Sole icing', 'Sanitize', 'All surfaces scrubbed'], popular: true },
                  ].map((tier) => (
                    <motion.div
                      key={tier.label}
                      whileHover={{ y: -6, scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-2xl bg-[#141418]/80 backdrop-blur-sm border p-8 transition-shadow duration-300 ${
                        tier.popular
                          ? 'border-[#00C2D6]/30 shadow-lg shadow-[#00C2D6]/5'
                          : 'border-[#1E1E26] hover:border-[#00C2D6]/20'
                      }`}
                    >
                      {tier.popular && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#00C2D6] bg-[#00C2D6]/10 px-3 py-1 rounded-full mb-3">Popular</span>
                      )}
                      <p className="text-base font-semibold mb-2">{tier.label}</p>
                      <p className="text-4xl font-black text-[#00C2D6] mb-1">{tier.price}</p>
                      <p className="text-xs text-[#6A6A80] mb-5">per pair</p>
                      <ul className="space-y-3">
                        {tier.features.map(f => (
                          <li key={f} className="text-sm text-[#A0A0B8] flex items-center gap-2.5">
                            <CheckCircle className="w-4 h-4 text-[#00C2D6] shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Instagram CTA ─── */}
      <section className="px-6 md:px-12 lg:px-16 pb-28 pb-mobile-nav">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Stay in the Loop</h2>
            <p className="text-[#A0A0B8] max-w-lg mx-auto mb-10 leading-relaxed">
              Follow us on Instagram for first looks at new drops, behind-the-scenes cleaning transformations, and exclusive deals.
            </p>
            <a
              href={`https://instagram.com/${BUSINESS_INSTAGRAM.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 bg-[#141418] border border-[#1E1E26]"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                <Instagram className="w-4.5 h-4.5 text-white" />
              </span>
              Follow {BUSINESS_INSTAGRAM}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
