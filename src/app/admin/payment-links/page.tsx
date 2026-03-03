'use client'

import { useState, useEffect } from 'react'
import { Link2, CreditCard, ExternalLink, Zap, Shield, Copy, Plus, DollarSign, Clock, CheckCircle, Trash2, Search, Send, Eye, Hash, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/constants'

interface PaymentLink {
  id: string
  title: string
  amount: number
  status: 'active' | 'paid' | 'expired' | 'cancelled'
  url: string
  customer_name?: string
  customer_email?: string
  note?: string
  created_at: string
  paid_at?: string
  views: number
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paid' | 'expired'>('all')

  useEffect(() => { loadLinks() }, [])

  async function loadLinks() {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/payment-links', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setLinks(data.payment_links || [])
      else toast.error('Failed to load payment links')
    } catch {
      toast.error('Failed to load payment links')
    }
    setLoading(false)
  }

  // Create form
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [note, setNote] = useState('')

  const filtered = links
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => {
      if (!search) return true
      const q = search.toLowerCase()
      return l.title?.toLowerCase().includes(q) || l.customer_name?.toLowerCase().includes(q) || l.customer_email?.toLowerCase().includes(q)
    })

  const totalCollected = links.filter(l => l.status === 'paid').reduce((s, l) => s + l.amount, 0)
  const totalPending = links.filter(l => l.status === 'active').reduce((s, l) => s + l.amount, 0)
  const paidCount = links.filter(l => l.status === 'paid').length

  async function handleCreate() {
    const parsedAmount = parseFloat(amount)
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!parsedAmount || parsedAmount < 1) {
      toast.error('Enter a valid amount ($1+)')
      return
    }

    try {
      const linkId = Math.random().toString(36).slice(2, 10).toUpperCase()
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          url: `${SITE_URL}/pay/${linkId}`,
          customer_name: customerName.trim() || null,
          customer_email: customerEmail.trim() || null,
          note: note.trim() || null,
          views: 0,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setShowCreate(false)
      setTitle(''); setAmount(''); setCustomerName(''); setCustomerEmail(''); setNote('')
      toast.success('Payment link created!')
      loadLinks()
    } catch {
      toast.error('Failed to create payment link')
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from('payment_links').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: 'paid' as const, paid_at: new Date().toISOString() } : l))
    toast.success('Marked as paid')
  }

  async function cancelLink(id: string) {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`/api/admin/payment-links?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    setLinks(prev => prev.filter(l => l.id !== id))
    toast.success('Link deleted')
  }

  const statusColors: Record<string, { text: string; bg: string; border: string; dot: string }> = {
    active: { text: 'text-[#00C2D6]', bg: 'bg-[#00C2D6]/10', border: 'border-[#00C2D6]/20', dot: 'bg-[#00C2D6]' },
    paid: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400' },
    expired: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
    cancelled: { text: 'text-[var(--text-muted)]', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-gray-500' },
  }

  if (loading) {
    return (
      <div className="space-y-4 page-enter max-w-4xl">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)}</div>
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Payment Links</h1>
          <p className="text-sm text-[var(--text-muted)]">Send customers a link to pay for custom orders, deposits, or holds</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 active:scale-[0.97]"
        >
          <Plus size={16} /> Create Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Collected', value: formatPrice(totalCollected), icon: DollarSign, color: '#10B981', sub: `${paidCount} paid` },
          { label: 'Pending', value: formatPrice(totalPending), icon: Clock, color: '#00C2D6', sub: `${links.filter(l => l.status === 'active').length} active` },
          { label: 'Total Links', value: links.length.toString(), icon: Link2, color: '#FF2E88', sub: 'created' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 group hover:border-[var(--border)]/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-bold">{card.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${card.color}10` }}>
                  <Icon size={15} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-black text-white font-mono tracking-tight">{card.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-card)] border border-[#FF2E88]/20 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF2E88]/10 flex items-center justify-center">
                  <Link2 size={18} className="text-[#FF2E88]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">New Payment Link</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Create a unique URL for any payment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Jordan 4 Deposit"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Amount *</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Customer Name (optional)</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Customer Email (optional)</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 50% deposit for custom order"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                />
              </div>

              {/* Quick amount buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)] mr-1">Quick:</span>
                {[25, 50, 100, 150, 200, 500].map(p => (
                  <button
                    key={p}
                    onClick={() => setAmount(p.toString())}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all border',
                      parseFloat(amount) === p
                        ? 'bg-[#FF2E88]/10 border-[#FF2E88]/30 text-[#FF2E88]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border)]/80'
                    )}
                  >
                    ${p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 active:scale-[0.97]"
                >
                  <Zap size={14} /> Create Link
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filter */}
      {links.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, customer..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
            {(['all', 'active', 'paid', 'expired'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                  filter === v
                    ? 'bg-[#FF2E88] text-white shadow-md shadow-[#FF2E88]/20'
                    : 'text-[var(--text-muted)] hover:text-white'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Links List */}
      {filtered.length === 0 && links.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2E88]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00C2D6]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF2E88]/15 to-[#00C2D6]/15 border border-[#FF2E88]/20 flex items-center justify-center mx-auto mb-6">
              <Link2 size={32} className="text-[#FF2E88]" />
            </div>

            <h2 className="text-xl font-black text-white mb-3">No Payment Links Yet</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
              Create a unique payment link for any amount. Send it via text or DM — customer clicks, pays, and you get notified.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
              {[
                { icon: Zap, label: 'Instant', desc: 'Create in seconds', color: '#00C2D6' },
                { icon: Shield, label: 'Secure', desc: 'Stripe-powered', color: '#FF2E88' },
                { icon: DollarSign, label: 'Flexible', desc: 'Any amount', color: '#10B981' },
              ].map(f => (
                <div key={f.label} className="text-center p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${f.color}10` }}>
                    <f.icon size={18} style={{ color: f.color }} />
                  </div>
                  <p className="text-xs font-bold text-white">{f.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              {['Custom Orders', 'Deposits', 'Layaways', 'Hold Fees'].map(tag => (
                <span key={tag} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <Search size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No links match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((link, i) => {
              const colors = statusColors[link.status] || statusColors.active
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border)]/80 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105',
                        colors.bg, colors.border
                      )}>
                        <Link2 size={20} className={colors.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{link.title}</h3>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0',
                            colors.text, colors.bg, colors.border
                          )}>
                            {link.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {link.customer_name && (
                            <span className="text-xs text-[var(--text-muted)]">{link.customer_name}</span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                            <Clock size={10} /> {new Date(link.created_at).toLocaleDateString()}
                          </span>
                          {link.paid_at && (
                            <span className="text-[10px] text-green-400 flex items-center gap-1">
                              <CheckCircle size={10} /> Paid {new Date(link.paid_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {link.note && (
                          <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">{link.note}</p>
                        )}
                        {/* URL */}
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-[11px] text-[#00C2D6] font-mono bg-[#00C2D6]/5 px-2.5 py-1 rounded-lg truncate max-w-[280px]">
                            {link.url}
                          </code>
                          <button
                            onClick={() => copyLink(link.url)}
                            className="p-1.5 rounded-lg hover:bg-[#00C2D6]/10 text-[var(--text-muted)] hover:text-[#00C2D6] transition-all shrink-0"
                            title="Copy link"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black text-white font-mono">{formatPrice(link.amount)}</p>
                      </div>
                      {link.status === 'active' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => markPaid(link.id)}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-[var(--text-muted)] hover:text-green-400 transition-all"
                            title="Mark as paid"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => cancelLink(link.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                            title="Cancel"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
