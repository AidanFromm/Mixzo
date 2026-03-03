'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Upload, X, Sparkles, Droplets, Wrench, Package } from 'lucide-react'
import { toast } from 'sonner'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

const TIERS = [
  { id: 'cleaning', name: 'Sneaker Cleaning', price: 20, icon: Droplets, desc: 'Full exterior clean, lace cleaning, deodorize', time: '2-3 days' },
  { id: 'cleaning_icing', name: 'Cleaning + Icing', price: 30, icon: Sparkles, desc: 'Full deep clean, sole icing & whitening, sanitize', time: '3-7 days' },
]

export default function CleaningRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state — pre-select tier from query param if provided
  const initialTier = searchParams.get('tier') || ''
  const [tier, setTier] = useState(TIERS.some(t => t.id === initialTier) ? initialTier : '')
  const [photos, setPhotos] = useState<string[]>([])
  const [address, setAddress] = useState({ name: '', line1: '', line2: '', city: '', state: '', zip: '' })
  const [useSaved, setUseSaved] = useState(false)
  const [savedAddress, setSavedAddress] = useState<typeof address | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/cleaning/request'); return }
      setUserId(session.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, address_line1, address_line2, city, state, zip')
        .eq('id', session.user.id)
        .single()

      if (profile?.address_line1) {
        const saved = {
          name: profile.full_name || '',
          line1: profile.address_line1 || '',
          line2: profile.address_line2 || '',
          city: profile.city || '',
          state: profile.state || '',
          zip: profile.zip || '',
        }
        setSavedAddress(saved)
        setAddress(saved)
        setUseSaved(true)
      }
      setLoading(false)
    }
    check()
  }, [router])

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos')
      return
    }
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotos(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }, [photos.length])

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('cleaning_requests').insert({
        user_id: userId,
        tier,
        price: TIERS.find(t => t.id === tier)?.price || 0,
        photos,
        shipping_address: useSaved ? savedAddress : address,
        notes,
        status: 'pending',
      })
      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      console.error('Cleaning request error:', err)
      toast.error('Failed to submit request. The service may not be available yet.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-6 md:px-12 lg:px-16"><div className="max-w-2xl mx-auto py-12"><div className="skeleton h-96 w-full rounded-2xl" /></div></main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-6 md:px-12 lg:px-16 pb-mobile-nav">
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Request Submitted!</h1>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Ship your sneakers to us and we&apos;ll get started. You&apos;ll receive updates on your cleaning progress.
            </p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 text-left mb-6 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Package size={16} /> Ship To:</h3>
              <div className="text-sm text-[var(--text-secondary)] space-y-1">
                <p className="text-white font-medium">MixzoKickz</p>
                <p>Denver, CO</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Exact address will be provided via email</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/account/cleaning" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white text-sm font-semibold">
                Track Request
              </Link>
              <Link href="/shop" className="px-6 py-3 rounded-xl border border-[var(--border)] text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  const selectedTier = TIERS.find(t => t.id === tier)
  const canNext = step === 1 ? !!tier : step === 2 ? photos.length > 0 : step === 3 ? !!(useSaved ? savedAddress?.line1 : address.line1) : true

  const inputClass = 'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--pink)] focus:outline-none transition-colors'

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-6 md:px-12 lg:px-16 pb-mobile-nav">
        <div className="max-w-2xl mx-auto py-6">
          <Link href="/cleaning" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} /> Cleaning Service
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">Request a Cleaning</h1>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  s <= step ? 'bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'
                }`}>{s < step ? <Check size={14} /> : s}</div>
                {s < 4 && <div className={`h-0.5 flex-1 rounded ${s < step ? 'bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)]' : 'bg-[var(--border)]'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Tier */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] mb-4">Choose your cleaning service:</p>
              {TIERS.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className={`w-full text-left bg-[var(--bg-card)] border rounded-xl p-5 transition-all ${
                      tier === t.id ? 'border-[var(--pink)] ring-1 ring-[var(--pink)]/30' : 'border-[var(--border)] hover:border-[var(--pink)]/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tier === t.id ? 'bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)]' : 'bg-[var(--bg-elevated)]'}`}>
                        <Icon size={20} className={tier === t.id ? 'text-white' : 'text-[var(--text-secondary)]'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{t.name}</p>
                          <p className="text-lg font-bold text-[var(--pink)]">${t.price}</p>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{t.desc}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Turnaround: {t.time}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Upload photos of your sneakers (up to 5):</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--pink)]/50 transition-colors">
                    <Upload size={24} className="text-[var(--text-muted)] mb-1" />
                    <span className="text-xs text-[var(--text-muted)]">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">Show all angles — top, sides, sole, any damage areas</p>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Where should we ship your cleaned sneakers back?</p>
              {savedAddress && (
                <button
                  onClick={() => { setUseSaved(true); setAddress(savedAddress) }}
                  className={`w-full text-left bg-[var(--bg-card)] border rounded-xl p-4 mb-3 transition-all ${
                    useSaved ? 'border-[var(--pink)] ring-1 ring-[var(--pink)]/30' : 'border-[var(--border)]'
                  }`}
                >
                  <p className="text-sm font-medium text-white mb-1">Use saved address</p>
                  <p className="text-xs text-[var(--text-secondary)]">{savedAddress.line1}, {savedAddress.city}, {savedAddress.state} {savedAddress.zip}</p>
                </button>
              )}
              <button
                onClick={() => setUseSaved(false)}
                className={`w-full text-left bg-[var(--bg-card)] border rounded-xl p-4 mb-4 transition-all ${
                  !useSaved ? 'border-[var(--pink)] ring-1 ring-[var(--pink)]/30' : 'border-[var(--border)]'
                }`}
              >
                <p className="text-sm font-medium text-white">Enter new address</p>
              </button>
              {!useSaved && (
                <div className="space-y-3">
                  <input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} className={inputClass} placeholder="Full name" />
                  <input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} className={inputClass} placeholder="Address line 1" />
                  <input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} className={inputClass} placeholder="Apt, suite (optional)" />
                  <div className="grid grid-cols-3 gap-3">
                    <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className={inputClass} placeholder="City" />
                    <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} className={inputClass} placeholder="State" />
                    <input value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} className={inputClass} placeholder="ZIP" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && selectedTier && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Service</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{selectedTier.name}</span>
                  <span className="text-sm font-bold text-[var(--pink)]">${selectedTier.price}</span>
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Photos ({photos.length})</h3>
                <div className="flex gap-2">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]" />
                  ))}
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Return Address</h3>
                <div className="text-sm text-[var(--text-secondary)]">
                  <p>{address.name}</p>
                  <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Any special instructions or areas of concern..."
                />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
