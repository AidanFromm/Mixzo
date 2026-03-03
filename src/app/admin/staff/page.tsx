'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Plus, Shield, UserCog, User, Clock, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Staff { id: string; full_name: string; email: string; role: string; last_sign_in_at?: string; created_at: string }

const roleIcon: Record<string, any> = { owner: Shield, manager: UserCog, staff: User }
const roleColor: Record<string, { text: string; bg: string; border: string }> = {
  owner: { text: 'text-[#FF2E88]', bg: 'bg-[#FF2E88]/10', border: 'border-[#FF2E88]/20' },
  manager: { text: 'text-[#00C2D6]', bg: 'bg-[#00C2D6]/10', border: 'border-[#00C2D6]/20' },
  staff: { text: 'text-[var(--text-secondary)]', bg: 'bg-white/5', border: 'border-white/10' },
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').in('role', ['owner', 'manager', 'staff']).order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load staff')
        setStaff(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-40 shimmer rounded-xl" />
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Staff</h1>
          <p className="text-sm text-[var(--text-muted)]">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => toast.info('To add staff, invite them via Supabase Auth and assign their role in the profiles table')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2E88] text-white text-sm font-bold hover:bg-[#FF2E88]/90 transition-all shadow-lg shadow-[#FF2E88]/20 active:scale-[0.97]"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00C2D6]/5 to-[#FF2E88]/5 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#00C2D6]/10 border border-[#00C2D6]/20 flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-[#00C2D6]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No Team Members</h2>
            <p className="text-sm text-[var(--text-secondary)]">Add staff members to help manage your store</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {staff.map((s, i) => {
            const Icon = roleIcon[s.role] || User
            const colors = roleColor[s.role] || roleColor.staff
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between hover:border-[var(--border)]/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2E88] to-[#00C2D6] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#FF2E88]/10 group-hover:scale-105 transition-transform">
                    {(s.full_name || s.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{s.full_name || 'Unnamed'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail size={11} className="text-[var(--text-muted)]" />
                      <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border capitalize',
                    colors.text, colors.bg, colors.border
                  )}>
                    <Icon size={12} /> {s.role}
                  </span>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock size={10} />
                      Joined {formatDate(s.created_at)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
