'use client'

import { useState, useEffect } from 'react'
import { Gift, Plus, CreditCard, Sparkles, DollarSign, Hash, Copy, CheckCircle, Trash2, Eye, EyeOff, Clock, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface GiftCard {
  id: string
  code: string
  initial_balance: number
  current_balance: number
  status: 'active' | 'redeemed' | 'expired' | 'disabled'
  recipient_email?: string
  note?: string
  created_at: string
  expires_at?: string
}

const PRESETS = [25, 50, 75, 100, 150, 200, 250, 500]

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MXZ-'
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all')

  useEffect(() => { loadCards() }, [])

  async function loadCards() {
    try {
      const { data, error } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCards(data || [])
    } catch {
      toast.error('Failed to load gift cards')
    }
    setLoading(false)
  }

  // Create form state
  const [amount, setAmount] = useState(50)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [note, setNote] = useState('')
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set())

  const filtered = cards
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.code.toLowerCase().includes(q) || c.recipient_email?.toLowerCase().includes(q)
    })

  const totalIssued = cards.reduce((s, c) => s + (c.initial_balance || 0), 0)
  const totalOutstanding = cards.filter(c => c.status === 'active').reduce((s, c) => s + (c.current_balance || 0), 0)
  const totalRedeemed = cards.filter(c => c.status === 'redeemed').reduce((s, c) => s + (c.initial_balance || 0), 0)

  async function handleCreate() {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount
    if (!finalAmount || finalAmount < 5 || finalAmount > 1000) {
      toast.error('Amount must be between $5 and $1,000')
      return
    }

    try {
      const { error } = await supabase.from('gift_cards').insert({
        code: generateCode(),
        initial_balance: finalAmount,
        current_balance: finalAmount,
        status: 'active',
        recipient_email: recipientEmail || null,
        note: note || null,
      })
      if (error) throw error
      setShowCreate(false)
      setCustomAmount('')
      setRecipientEmail('')
      setNote('')
      toast.success('Gift card created!')
      loadCards()
    } catch {
      toast.error('Failed to create gift card')
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('Code copied!')
  }

  function toggleReveal(id: string) {
    setRevealedCodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const statusColors: Record<string, { text: string; bg: string; border: string }> = {
    active: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    redeemed: { text: 'text-[var(--text-muted)]', bg: 'bg-white/5', border: 'border-white/10' },
    expired: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    disabled: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
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
          <h1 className="text-2xl font-black text-white tracking-tight">Gift Cards</h1>
          <p className="text-sm text-[var(--text-muted)]">{cards.length} card{cards.length !== 1 ? 's' : ''} issued</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 active:scale-[0.97]"
        >
          <Plus size={16} /> Create Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Issued', value: formatPrice(totalIssued), icon: DollarSign, color: '#FF2E88', sub: `${cards.length} cards` },
          { label: 'Outstanding', value: formatPrice(totalOutstanding), icon: CreditCard, color: '#00C2D6', sub: 'unredeemed balance' },
          { label: 'Redeemed', value: formatPrice(totalRedeemed), icon: Sparkles, color: '#10B981', sub: `${cards.filter(c => c.status === 'redeemed').length} cards` },
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

      {/* Create Modal */}
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
                  <Gift size={18} className="text-[#FF2E88]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">New Gift Card</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Choose an amount and optionally send to a recipient</p>
                </div>
              </div>

              {/* Preset amounts */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Amount</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setAmount(p); setCustomAmount('') }}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-bold transition-all border',
                        amount === p && !customAmount
                          ? 'bg-[#FF2E88] text-white border-[#FF2E88] shadow-lg shadow-[#FF2E88]/20'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#FF2E88]/30 hover:text-white'
                      )}
                    >
                      ${p}
                    </button>
                  ))}
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="number"
                      placeholder="Custom"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setAmount(0) }}
                      className="w-28 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Recipient Email (optional)</label>
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 block">Personal Note (optional)</label>
                  <input
                    type="text"
                    placeholder="Happy birthday!"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 active:scale-[0.97]"
                >
                  <Sparkles size={14} /> Create {formatPrice(customAmount ? parseFloat(customAmount) || 0 : amount)} Card
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
      {cards.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or email..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
            {(['all', 'active', 'redeemed', 'expired'] as const).map(v => (
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

      {/* Card List */}
      {filtered.length === 0 && cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#A855F7]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF2E88]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#A855F7]/15 to-[#FF2E88]/15 border border-[#A855F7]/20 flex items-center justify-center mx-auto mb-6">
              <Gift size={32} className="text-[#A855F7]" />
            </div>

            <h2 className="text-xl font-black text-white mb-3">No Gift Cards Yet</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
              Create your first gift card above. Gift cards generate unique codes that customers can redeem at checkout for store credit.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
              {[
                { icon: DollarSign, label: 'Custom Amounts', desc: '$5 - $1,000', color: '#10B981' },
                { icon: Hash, label: 'Unique Codes', desc: 'Auto-generated', color: '#A855F7' },
                { icon: Sparkles, label: 'Instant Delivery', desc: 'Email or share', color: '#FF2E88' },
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
          </div>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <Search size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No cards match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((card, i) => {
              const colors = statusColors[card.status] || statusColors.active
              const isRevealed = revealedCodes.has(card.id)
              const usagePercent = card.initial_balance > 0 ? Math.round((1 - card.current_balance / card.initial_balance) * 100) : 0
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border)]/80 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A855F7]/15 to-[#FF2E88]/15 border border-[#A855F7]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Gift size={20} className="text-[#A855F7]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold text-white font-mono tracking-wider">
                            {isRevealed ? card.code : card.code.replace(/[A-Z0-9]/g, '•')}
                          </code>
                          <button
                            onClick={() => toggleReveal(card.id)}
                            className="p-1 rounded-md hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all"
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          {isRevealed && (
                            <button
                              onClick={() => copyCode(card.code)}
                              className="p-1 rounded-md hover:bg-white/5 text-[var(--text-muted)] hover:text-[#00C2D6] transition-all"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {card.recipient_email && (
                            <span className="text-xs text-[var(--text-muted)]">{card.recipient_email}</span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                            <Clock size={10} /> {new Date(card.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-white font-mono">{formatPrice(card.current_balance)}</p>
                        {card.current_balance !== card.initial_balance && (
                          <p className="text-[10px] text-[var(--text-muted)]">of {formatPrice(card.initial_balance)} · {usagePercent}% used</p>
                        )}
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border',
                        colors.text, colors.bg, colors.border
                      )}>
                        {card.status}
                      </span>
                    </div>
                  </div>

                  {/* Usage bar */}
                  {usagePercent > 0 && usagePercent < 100 && (
                    <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#FF2E88] transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  )}

                  {card.note && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 italic">&ldquo;{card.note}&rdquo;</p>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
