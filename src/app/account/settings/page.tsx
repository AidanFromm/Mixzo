'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { ShopHeader } from '@/components/layout/shop-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { toast } from 'sonner'

interface Profile {
  full_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({
    full_name: '', email: '', phone: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, phone, address_line1, address_line2, city, state, zip')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile({ ...profile, ...data })
      setLoading(false)
    }
    load()
  }, [router])

  const set = (key: string, val: string) => setProfile(p => ({ ...p, [key]: val }))

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address_line1: profile.address_line1,
          address_line2: profile.address_line2,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
        })
        .eq('id', session.user.id)
      if (error) throw error
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated')
      setPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password'
      toast.error(message)
    } finally {
      setSavingPw(false)
    }
  }

  const inputClass = 'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--pink)] focus:outline-none transition-colors'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ShopHeader />
        <main className="flex-1 pt-24 px-4 max-w-2xl mx-auto w-full">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-96 w-full rounded-2xl" />
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
        <ArrowLeft size={16} />
        Account
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

      {/* Profile */}
      <form onSubmit={saveProfile} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Full Name</label>
            <input value={profile.full_name} onChange={e => set('full_name', e.target.value)} className={inputClass} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Email</label>
            <input value={profile.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Phone</label>
            <input value={profile.phone} onChange={e => set('phone', e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white mt-6 mb-4">Shipping Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Address Line 1</label>
            <input value={profile.address_line1} onChange={e => set('address_line1', e.target.value)} className={inputClass} placeholder="123 Main St" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Address Line 2</label>
            <input value={profile.address_line2} onChange={e => set('address_line2', e.target.value)} className={inputClass} placeholder="Apt, suite, etc." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">City</label>
              <input value={profile.city} onChange={e => set('city', e.target.value)} className={inputClass} placeholder="Denver" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">State</label>
              <input value={profile.state} onChange={e => set('state', e.target.value)} className={inputClass} placeholder="CO" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">ZIP</label>
              <input value={profile.zip} onChange={e => set('zip', e.target.value)} className={inputClass} placeholder="80202" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full bg-gradient-to-r from-[var(--pink)] to-[var(--cyan)] py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={changePassword} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-medium">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirm password" />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingPw || !password}
          className="mt-6 w-full border border-[var(--border)] py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm hover:bg-white/5 transition-colors"
        >
          {savingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {savingPw ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
