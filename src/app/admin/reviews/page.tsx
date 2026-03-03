'use client'

import { useState, useEffect } from 'react'
import { Star, Search, MessageSquare, ThumbsUp, ThumbsDown, Filter, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Review {
  id: string
  product_name: string
  customer_name: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function ReviewsPage() {
  const [search, setSearch] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
      setReviews(data || [])
    } catch {
      setReviews([])
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
    if (error) { toast.error('Failed to update review'); return }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    toast.success(`Review ${status}`)
  }

  const filtered = reviews
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.product_name?.toLowerCase().includes(search.toLowerCase()) || r.customer_name?.toLowerCase().includes(search.toLowerCase()))

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-40 shimmer rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reviews</h1>
          <p className="text-sm text-[var(--text-muted)]">{reviews.length} total reviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Avg Rating</span>
          </div>
          <p className="text-2xl font-black text-white">{avgRating}</p>
          <p className="text-[10px] text-[var(--text-muted)]">out of 5.0</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-[#00C2D6]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Total</span>
          </div>
          <p className="text-2xl font-black text-white">{reviews.length}</p>
          <p className="text-[10px] text-[var(--text-muted)]">reviews</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-[#FF2E88]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Pending</span>
          </div>
          <p className="text-2xl font-black text-white">{reviews.filter(r => r.status === 'pending').length}</p>
          <p className="text-[10px] text-[var(--text-muted)]">need review</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product or customer..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
          {(['all', 'pending', 'approved'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                filter === v
                  ? 'bg-[#FF2E88] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Empty / Reviews List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/5 to-[#FF2E88]/5 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mx-auto mb-5">
              <MessageSquare size={32} className="text-[#F59E0B]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Reviews Yet</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-sm mx-auto">
              Product reviews will appear here for moderation once customers start leaving feedback.
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={20} className="text-[#F59E0B]/20" />
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border)]/80 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{review.product_name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">by {review.customer_name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < review.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[var(--text-muted)]'} />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{review.comment}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase',
                  review.status === 'approved' ? 'text-green-400 bg-green-500/10' :
                  review.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                  'text-[#F59E0B] bg-[#F59E0B]/10'
                )}>
                  {review.status}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateStatus(review.id, 'approved')} className="p-2 rounded-lg hover:bg-green-500/10 text-[var(--text-muted)] hover:text-green-400 transition-all" title="Approve">
                    <ThumbsUp size={14} />
                  </button>
                  <button onClick={() => updateStatus(review.id, 'rejected')} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all" title="Reject">
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
