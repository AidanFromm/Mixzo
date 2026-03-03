'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Clock, CheckCircle, Truck, Package, Wrench, Eye } from 'lucide-react'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { formatDate } from '@/lib/utils'

interface CleaningRequest {
  id: string
  created_at: string
  tier: string
  price: number
  status: string
  notes?: string
  photos?: string[]
  before_photos?: string[]
  after_photos?: string[]
  tracking_to_us?: string
  tracking_to_customer?: string
  shipping_address: { name: string; line1: string; city: string; state: string; zip: string }
}

const STATUSES = ['pending', 'quoted', 'approved', 'shipped_to_us', 'in_progress', 'completed', 'shipped_back']
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', quoted: 'Quoted', approved: 'Approved',
  shipped_to_us: 'Shipped to Us', in_progress: 'In Progress',
  completed: 'Completed', shipped_back: 'Shipped Back',
}
const STATUS_ICONS = [Clock, Eye, CheckCircle, Truck, Wrench, Sparkles, Package]

const TIER_LABELS: Record<string, string> = { cleaning: 'Sneaker Cleaning', cleaning_icing: 'Cleaning + Icing', basic: 'Basic Clean', deep: 'Deep Clean', restoration: 'Full Restoration' }

export default function MyCleaningPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<CleaningRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      try {
        const { data } = await supabase
          .from('cleaning_requests')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        setRequests(data || [])
      } catch { /* table may not exist */ }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-32 w-full rounded-xl" />)}</div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader />
      <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full pb-mobile-nav">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} /> Account
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Cleaning Requests</h1>
        <Link href="/cleaning/request" className="text-xs bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white px-4 py-2 rounded-lg font-semibold">
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No cleaning requests</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Get your kicks looking fresh again</p>
          <Link href="/cleaning/request" className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] text-white text-sm font-semibold px-6 py-3 rounded-xl">
            Request a Cleaning
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const currentIdx = STATUSES.indexOf(req.status)
            const isExpanded = expanded === req.id
            return (
              <div key={req.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : req.id)} className="w-full text-left p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{TIER_LABELS[req.tier] || req.tier}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(req.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        req.status === 'completed' || req.status === 'shipped_back' ? 'bg-green-500/10 text-green-400' :
                        req.status === 'in_progress' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                      <p className="text-sm font-bold text-[var(--pink)] mt-1">${req.price}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
                    {/* Timeline */}
                    <div className="space-y-3 mb-4">
                      {STATUSES.map((s, i) => {
                        const Icon = STATUS_ICONS[i]
                        const active = i <= currentIdx
                        return (
                          <div key={s} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              active ? 'bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)]' : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
                            }`}>
                              <Icon size={12} className={active ? 'text-white' : 'text-[var(--text-muted)]'} />
                            </div>
                            <span className={`text-xs ${active ? 'text-white font-medium' : 'text-[var(--text-muted)]'}`}>
                              {STATUS_LABELS[s]}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Tracking */}
                    {req.tracking_to_us && (
                      <div className="text-xs text-[var(--text-secondary)] mb-2">
                        <span className="text-[var(--text-muted)]">Tracking (to us):</span> {req.tracking_to_us}
                      </div>
                    )}
                    {req.tracking_to_customer && (
                      <div className="text-xs text-[var(--text-secondary)] mb-2">
                        <span className="text-[var(--text-muted)]">Tracking (return):</span> {req.tracking_to_customer}
                      </div>
                    )}

                    {/* Before/After photos */}
                    {(req.before_photos?.length || req.after_photos?.length) ? (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {req.before_photos?.length ? (
                          <div>
                            <p className="text-xs text-[var(--text-muted)] mb-2">Before</p>
                            <div className="flex gap-1">{req.before_photos.map((p, i) => (
                              <img key={i} src={p} alt="Before" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]" />
                            ))}</div>
                          </div>
                        ) : null}
                        {req.after_photos?.length ? (
                          <div>
                            <p className="text-xs text-[var(--text-muted)] mb-2">After</p>
                            <div className="flex gap-1">{req.after_photos.map((p, i) => (
                              <img key={i} src={p} alt="After" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]" />
                            ))}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
