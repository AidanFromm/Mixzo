'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, X, Loader2, ChevronRight, User, Headphones } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Ticket {
  id: string
  subject: string
  customer_name: string
  customer_email: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'staff'
  sender_name: string
  message: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  in_progress: { label: 'In Progress', color: 'text-[var(--cyan)]', bg: 'bg-[var(--cyan)]/10' },
  resolved: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/10' },
  closed: { label: 'Closed', color: 'text-[var(--text-muted)]', bg: 'bg-white/5' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-[var(--text-muted)]' },
  normal: { label: 'Normal', color: 'text-[var(--text-secondary)]' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' },
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filter, setFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    const { data, error } = await supabase.from('support_tickets').select('*').order('updated_at', { ascending: false })
    if (error) { setLoading(false); return }
    setTickets(data || [])
    setLoading(false)
  }

  async function loadMessages(ticketId: string) {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    await loadMessages(ticket.id)
    // Auto mark as in_progress if open
    if (ticket.status === 'open') {
      await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticket.id)
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'in_progress' } : t))
      setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null)
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_type: 'staff',
      sender_name: 'Mixzo Support',
      message: reply.trim(),
    })
    if (error) { toast.error('Failed to send'); setSending(false); return }
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id)
    setReply('')
    setSending(false)
    loadMessages(selectedTicket.id)
    toast.success('Reply sent')
  }

  async function updateStatus(status: string) {
    if (!selectedTicket) return
    setUpdatingStatus(true)
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', selectedTicket.id)
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status } : t))
    setSelectedTicket(prev => prev ? { ...prev, status } : null)
    setUpdatingStatus(false)
    toast.success(`Ticket marked as ${status.replace('_', ' ')}`)
  }

  const filtered = tickets.filter(t => filter === 'all' || t.status === filter)
  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage customer support requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {[
          { val: 'all', label: 'All' },
          { val: 'open', label: 'Open' },
          { val: 'in_progress', label: 'In Progress' },
          { val: 'resolved', label: 'Resolved' },
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => setFilter(tab.val)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              filter === tab.val ? 'bg-[#FF2E88] text-white' : 'text-[var(--text-secondary)] hover:text-white'
            )}
          >
            {tab.label}
            <span className={cn('text-[10px]', filter === tab.val ? 'text-white/70' : 'text-[var(--text-muted)]')}>
              {counts[tab.val as keyof typeof counts] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-240px)] min-h-[400px]">
        {/* Ticket List */}
        <div className={cn(
          'w-full lg:w-[400px] shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col',
          selectedTicket ? 'hidden lg:flex' : 'flex'
        )}>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 shimmer rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare size={32} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-medium text-white mb-1">No tickets</p>
              <p className="text-xs text-[var(--text-muted)]">Tickets from the contact form will appear here</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
              {filtered.map(t => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.open
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={cn(
                      'w-full text-left p-4 transition-colors',
                      selectedTicket?.id === t.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-white truncate pr-2">{t.subject}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{timeAgo(t.updated_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">{t.customer_name} — {t.customer_email}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', sc.bg, sc.color)}>{sc.label}</span>
                      {t.category && t.category !== 'general' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">{t.category}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Conversation Panel */}
        <div className={cn(
          'flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col',
          !selectedTicket ? 'hidden lg:flex' : 'flex'
        )}>
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                  <div>
                  <h2 className="text-base font-semibold text-white">{selectedTicket.subject}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{selectedTicket.customer_name} — {selectedTicket.customer_email}</p>
                  </div>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={e => updateStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--pink)]"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={cn('flex', m.sender_type === 'staff' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-3',
                      m.sender_type === 'staff'
                        ? 'bg-[#FF2E88] text-white rounded-br-md'
                        : 'bg-[var(--bg-elevated)] text-white rounded-bl-md'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {m.sender_type === 'staff' ? (
                          <Headphones size={12} className="opacity-70" />
                        ) : (
                          <User size={12} className="opacity-70" />
                        )}
                        <span className="text-[10px] font-medium opacity-70">{m.sender_name}</span>
                        <span className="text-[10px] opacity-50">{timeAgo(m.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{m.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-[var(--border)]">
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }}}
                    placeholder="Type your reply..."
                    className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--pink)] focus:outline-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="bg-[#FF2E88] text-white px-4 rounded-xl hover:opacity-90 transition disabled:opacity-40 flex items-center"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={48} className="text-[var(--text-muted)] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">Select a ticket</h3>
              <p className="text-sm text-[var(--text-muted)]">Click a ticket from the left to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
