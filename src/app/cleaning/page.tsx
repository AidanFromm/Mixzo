'use client'

import Link from 'next/link'
import { ArrowRight, Send, MessageSquare, Package, Sparkles, RotateCcw, ChevronDown, Droplets, Shield, Clock, Star, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const STEPS = [
  { icon: Send, label: 'Submit', desc: 'Tell us about your kicks and what they need', color: '#00C2D6' },
  { icon: MessageSquare, label: 'Quote', desc: 'We\'ll send you a price and timeline', color: '#00A8BA' },
  { icon: Package, label: 'Ship', desc: 'Send your sneakers to us (or drop off in Denver)', color: '#0090A0' },
  { icon: Sparkles, label: 'Clean', desc: 'Our team works their magic on your kicks', color: '#FF2E88' },
  { icon: RotateCcw, label: 'Return', desc: 'Get your fresh kicks back, looking brand new', color: '#00C2D6' },
]

const TIERS = [
  {
    value: 'cleaning',
    name: 'Sneaker Cleaning',
    price: '$20',
    features: ['Full exterior deep clean', 'Lace cleaning & whitening', 'Deodorize treatment', 'Quick turnaround (2-3 days)'],
    popular: false,
    accent: '#00C2D6',
    icon: Droplets,
  },
  {
    value: 'cleaning_icing',
    name: 'Cleaning + Icing',
    price: '$30',
    features: ['Everything in Cleaning', 'Sole icing & whitening', 'Deep scrub all surfaces', 'Deodorize & sanitize', '3-7 day turnaround'],
    popular: true,
    accent: '#FF2E88',
    icon: Sparkles,
  },
]

const TRUST = [
  { icon: Shield, label: 'Safe Process', desc: 'Premium products, tested methods' },
  { icon: Clock, label: 'Fast Turnaround', desc: '2-7 business days' },
  { icon: Star, label: '5-Star Quality', desc: 'Meticulous attention to detail' },
]

const FAQS = [
  {
    q: 'How long does the cleaning process take?',
    a: 'Basic cleans take 2-3 business days. Deep cleans with icing take 3-7 days. Full restorations can take 1-2 weeks depending on the work needed.',
  },
  {
    q: 'Can I drop off my sneakers in person?',
    a: 'Yes! We\'re based in Denver, CO and accept local drop-offs. Contact us to arrange a time.',
  },
  {
    q: 'What if my sneakers can\'t be restored?',
    a: 'We\'ll always be upfront with you. If we don\'t think we can improve them significantly, we\'ll let you know before starting any work.',
  },
  {
    q: 'Do you clean all brands?',
    a: 'Yes — Nike, Jordan, Adidas, Yeezy, New Balance, and more. We work with all sneaker brands and materials.',
  },
  {
    q: 'How do I ship my sneakers to you?',
    a: 'After you submit a request, we\'ll send you a prepaid shipping label. Just box them up and drop them off at any carrier location.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#00C2D6]/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="font-medium text-text group-hover:text-[#00C2D6] transition-colors pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#00C2D6]/50 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-[#00C2D6]' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-text-secondary leading-relaxed -mt-1">{a}</p>
      </motion.div>
    </div>
  )
}

export default function CleaningPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />

      <main className="flex-1 pt-24 pb-24 pb-mobile-nav px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="text-center mb-24 relative"
          >
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00C2D6]/8 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FF2E88]/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C2D6]/10 border border-[#00C2D6]/20 mb-6"
              >
                <Droplets size={14} className="text-[#00C2D6]" />
                <span className="text-sm text-[#00C2D6] font-semibold">Professional Sneaker Care</span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                Give Your Kicks
                <br />
                <span className="bg-gradient-to-r from-[#00C2D6] to-[#00E5F5] bg-clip-text text-transparent">New Life</span>
              </h1>
              <p className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Professional sneaker cleaning and restoration from Denver, CO. From a quick refresh to a complete rehab — we bring your kicks back to life.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link href="#pricing">
                  <Button size="lg" className="bg-[#00C2D6] hover:bg-[#00A8BA] shadow-lg shadow-[#00C2D6]/20 hover:shadow-[#00C2D6]/30">
                    View Pricing
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/cleaning/request">
                  <Button size="lg" variant="outline" className="border-[#00C2D6]/30 text-[#00C2D6] hover:border-[#00C2D6]/60 hover:text-[#00C2D6]">
                    Submit Request
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-4 mb-24"
          >
            {TRUST.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-[#00C2D6]/5 border border-[#00C2D6]/10 hover:border-[#00C2D6]/25 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#00C2D6]/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-[#00C2D6]" />
                </div>
                <h3 className="font-bold text-sm mb-1">{label}</h3>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#00C2D6] uppercase tracking-[0.2em]">The Process</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2">How It Works</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {STEPS.map(({ icon: Icon, label, desc, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center group"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg border"
                    style={{
                      backgroundColor: `${color}10`,
                      borderColor: `${color}20`,
                      boxShadow: `0 0 0 0 ${color}00`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-[10px] font-bold text-[#00C2D6] uppercase tracking-wider mb-1">Step {i + 1}</div>
                  <h3 className="font-bold text-sm mb-1">{label}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Pricing */}
          <motion.section
            id="pricing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#00C2D6] uppercase tracking-[0.2em]">Pricing</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2">Service Tiers</h2>
              <p className="text-text-secondary mt-3 max-w-lg mx-auto text-sm">
                Choose the level of care your kicks need. Not sure? We&apos;ll help you decide after seeing them.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {TIERS.map((tier) => {
                const TierIcon = tier.icon
                return (
                  <motion.div
                    key={tier.name}
                    whileHover={{ y: -4 }}
                    className={`rounded-2xl bg-card border p-8 transition-all duration-300 relative overflow-hidden ${
                      tier.popular
                        ? 'border-[#FF2E88]/40 shadow-xl shadow-[#FF2E88]/10'
                        : 'border-[#00C2D6]/20 hover:border-[#00C2D6]/40 hover:shadow-lg hover:shadow-[#00C2D6]/10'
                    }`}
                  >
                    {/* Background glow */}
                    <div
                      className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30"
                      style={{ background: tier.accent }}
                    />

                    {tier.popular && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-xl bg-[#FF2E88] text-white text-xs font-bold shadow-lg shadow-[#FF2E88]/20">
                        Most Popular
                      </div>
                    )}

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tier.accent}15` }}>
                          <TierIcon className="w-5 h-5" style={{ color: tier.accent }} />
                        </div>
                        <h3 className="text-lg font-bold">{tier.name}</h3>
                      </div>

                      <p className="text-4xl font-black mb-6" style={{ color: tier.accent }}>{tier.price}</p>

                      <ul className="space-y-3 mb-8">
                        {tier.features.map((f) => (
                          <li key={f} className="flex items-start gap-3 text-sm text-text-secondary">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: tier.accent }} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Link href={`/cleaning/request?tier=${tier.value}`} className="block">
                        <Button
                          variant={tier.popular ? 'primary' : 'outline'}
                          className={`w-full ${!tier.popular ? 'border-[#00C2D6]/30 text-[#00C2D6] hover:border-[#00C2D6]/60 hover:bg-[#00C2D6]/5' : ''}`}
                        >
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>

          {/* Icing Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mb-24 rounded-2xl bg-[#FF2E88]/5 border border-[#FF2E88]/15 p-6 md:p-8"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF2E88]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#FF2E88]" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">A Note on Sole Icing</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Results from sole icing vary from pair to pair. Some shoes bounce back to deadstock condition while others may only lighten the yellowing. Generally, the more yellowed the sole, the less likely it will fully restore to DS. Every pair reacts differently to the icing process — we&apos;ll always give you an honest assessment upfront.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Before/After placeholder */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#00C2D6] uppercase tracking-[0.2em]">Results</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2">The Results Speak</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-card border border-[#00C2D6]/10 overflow-hidden hover:border-[#00C2D6]/25 transition-all duration-300">
                  <div className="grid grid-cols-2">
                    <div className="aspect-square bg-elevated flex items-center justify-center border-r border-[#00C2D6]/10">
                      <div className="text-center">
                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Before</p>
                      </div>
                    </div>
                    <div className="aspect-square bg-[#00C2D6]/5 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs text-[#00C2D6] font-bold uppercase tracking-wider">After</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-center border-t border-[#00C2D6]/10">
                    <p className="text-sm font-semibold">Coming Soon</p>
                    <p className="text-xs text-text-muted">Before &amp; after photos</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section
            id="faq"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#00C2D6] uppercase tracking-[0.2em]">FAQ</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-2xl mx-auto rounded-2xl bg-card border border-[#00C2D6]/15 p-6 md:p-8">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </motion.section>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center relative py-12"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#00C2D6]/8 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <Droplets className="w-8 h-8 text-[#00C2D6] mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-3">Ready to Refresh Your Kicks?</h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">Submit a request and we&apos;ll take care of the rest. Professional results, every time.</p>
              <Link href="/cleaning/request">
                <Button size="lg" className="bg-[#00C2D6] hover:bg-[#00A8BA] shadow-lg shadow-[#00C2D6]/20">
                  Submit Request
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
