'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tag, Plus, Trash2, Copy, X, Percent, DollarSign, Hash, Clock } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Discount {
  id: string; code: string; type: 'percentage' | 'fixed'; value: number;
  min_order: number; max_uses: number; used: number; active: boolean;
  expires_at: string | null; created_at: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
    setDiscounts(data || [])
    setLoading(false)
  }

  async function createDiscount(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('discounts').insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order: form.min_order ? parseFloat(form.min_order) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      active: true, used: 0,
    })
    if (error) toast.error('Failed to create discount')
    else { toast.success('Discount created'); setShowForm(false); loadData() }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('discounts').update({ active: !active }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    toast.success(active ? 'Deactivated' : 'Activated')
    loadData()
  }

  async function deleteDiscount(id: string) {
    if (!confirm('Delete this discount code?')) return
    const { error } = await supabase.from('discounts').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    loadData()
  }

  const ic = 'w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[#FF2E88] focus:outline-none transition-all'

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  const activeCount = discounts.filter(d => d.active).length
  const totalUses = discounts.reduce((s, d) => s + d.used, 0)

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Discount Codes</h1>
          <p className="text-sm text-[var(--text-muted)]">{discounts.length} codes · {activeCount} active</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]',
            showForm
              ? 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]'
              : 'bg-[#FF2E88] text-white shadow-lg shadow-[#FF2E88]/20'
          )}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Code</>}
        </button>
      </div>

      {/* Stats */}
      {discounts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-[#FF2E88]" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Active Codes</span>
            </div>
            <p className="text-2xl font-black text-white">{activeCount}</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={16} className="text-[#00C2D6]" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Total Uses</span>
            </div>
            <p className="text-2xl font-black text-white">{totalUses}</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-[#A855F7]" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Total Codes</span>
            </div>
            <p className="text-2xl font-black text-white">{discounts.length}</p>
          </div>
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            onSubmit={createDiscount}
          >
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag size={14} className="text-[#FF2E88]" /> Create Discount Code
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Code</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="SAVE20" className={`${ic} uppercase font-mono`} required />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={ic}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === 'percentage' ? '20' : '25'} className={ic} required />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Min Order ($)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm({...form, min_order: e.target.value})} placeholder="0" className={ic} />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} placeholder="Unlimited" className={ic} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Expires</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} className={ic} />
              </div>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all disabled:opacity-50 shadow-lg shadow-[#FF2E88]/20">
                {saving ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      {discounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF2E88]/5 to-[#A855F7]/5 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#FF2E88]/10 border border-[#FF2E88]/20 flex items-center justify-center mx-auto mb-5">
              <Tag size={32} className="text-[#FF2E88]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Discount Codes</h2>
            <p className="text-sm text-[var(--text-secondary)]">Create codes to offer discounts to customers</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {discounts.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:border-[var(--border)]/80 transition-all group"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { navigator.clipboard.writeText(d.code); toast.success('Copied!') }}
                  className="font-mono text-sm font-black text-[#FF2E88] bg-[#FF2E88]/10 border border-[#FF2E88]/20 px-3.5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#FF2E88]/20 transition-all"
                >
                  {d.code} <Copy size={12} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {d.type === 'percentage' ? `${d.value}% off` : `${formatPrice(d.value)} off`}
                    {d.min_order > 0 && <span className="text-[var(--text-muted)] font-normal"> · min {formatPrice(d.min_order)}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">Used {d.used}{d.max_uses ? `/${d.max_uses}` : ''}</span>
                    {d.expires_at && (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock size={10} /> Expires {new Date(d.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(d.id, d.active)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-xl font-bold border transition-all',
                    d.active
                      ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-white'
                  )}
                >
                  {d.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => deleteDiscount(d.id)}
                  className="text-[var(--text-muted)] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
