'use client'

import { useEffect, useState } from 'react'
import { Settings, CheckCircle, XCircle, Loader2, Store, User, Plug, LogOut, Globe, Phone, Instagram, MapPin, Mail, Shield, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SITE_NAME, BUSINESS_EMAIL, BUSINESS_PHONE, BUSINESS_INSTAGRAM, BUSINESS_LOCATION } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [stockxStatus, setStockxStatus] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          const res = await fetch('/api/auth/role', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          const data = await res.json()
          setRole(data.role || 'unknown')
        }

        try {
          const res = await fetch('/api/stockx/status')
          const data = await res.json()
          setStockxStatus(data.connected ? 'ok' : 'error')
        } catch {
          setStockxStatus('error')
        }
      } catch (err) {
        console.error('Settings load error:', err)
        toast.error('Failed to load settings')
      }
      setLoading(false)
    }
    load()
  }, [])

  const storeFields = [
    { icon: Store, label: 'Store Name', value: SITE_NAME },
    { icon: Mail, label: 'Email', value: BUSINESS_EMAIL },
    { icon: Phone, label: 'Phone', value: BUSINESS_PHONE },
    { icon: Instagram, label: 'Instagram', value: BUSINESS_INSTAGRAM },
    { icon: MapPin, label: 'Location', value: BUSINESS_LOCATION },
  ]

  if (loading) {
    return (
      <div className="space-y-4 page-enter max-w-3xl">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="h-64 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
        <div className="h-32 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Store Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your store configuration and integrations</p>
      </div>

      {/* Store Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF2E88]/10 flex items-center justify-center">
            <Store size={16} className="text-[#FF2E88]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Store Information</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Your public business details</p>
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {storeFields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <Icon size={14} className="text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
              </div>
              <span className="text-sm text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00C2D6]/10 flex items-center justify-center">
            <User size={16} className="text-[#00C2D6]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Account</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Your login and role information</p>
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)] font-medium">Email</span>
            </div>
            <span className="text-sm text-white font-medium">{user?.email || '--'}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <Shield size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)] font-medium">Role</span>
            </div>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full capitalize',
              role === 'owner' ? 'text-[#FF2E88] bg-[#FF2E88]/10' :
              role === 'manager' ? 'text-[#00C2D6] bg-[#00C2D6]/10' :
              'text-[var(--text-secondary)] bg-white/5'
            )}>
              {role || '--'}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <User size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)] font-medium">User ID</span>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">{user?.id?.slice(0, 16) || '--'}...</span>
          </div>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Plug size={16} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Integrations</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Connected services and APIs</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C2D6]/10 flex items-center justify-center">
                <Globe size={18} className="text-[#00C2D6]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">StockX API</p>
                <p className="text-xs text-[var(--text-muted)]">Product lookup and pricing</p>
              </div>
            </div>
            {stockxStatus === 'checking' ? (
              <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
            ) : stockxStatus === 'ok' ? (
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle size={14} /> Connected
              </div>
            ) : (
              <a
                href="/api/stockx/auth"
                className="px-4 py-2 bg-[#FF2E88] text-white text-xs font-bold rounded-xl hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 inline-flex items-center gap-2"
              >
                <ExternalLink size={14} /> Connect
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          className="w-full flex items-center justify-center gap-2 bg-[var(--bg-card)] border border-red-500/20 rounded-2xl p-4 text-red-400 hover:border-red-400/40 hover:bg-red-500/5 transition-all duration-300 font-bold text-sm group"
        >
          <LogOut size={16} className="group-hover:translate-x-[-2px] transition-transform" />
          Sign Out
        </button>
      </motion.div>
    </div>
  )
}
