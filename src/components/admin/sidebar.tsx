'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ScanBarcode, Package, ShoppingCart,
  Users, Flame, BarChart3, Settings, Menu, X, LogOut,
  Tag, FileText, Boxes, Truck,
  Activity, Star, Link2, Gift, HelpCircle, Calculator, RefreshCw,
  Receipt, Bell, UserCog, Sparkles, ExternalLink, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/scan', label: 'Scan Product', icon: ScanBarcode },
    ],
  },
  {
    label: 'Products',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/products/new', label: 'Add Product', icon: Boxes },
      { href: '/admin/price-sync', label: 'Price Sync', icon: RefreshCw },
    ],
  },
  {
    label: 'Orders',
    items: [
      { href: '/admin/orders', label: 'All Orders', icon: ShoppingCart },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/admin/customers', label: 'All Customers', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/daily-deals', label: 'Deals', icon: Flame },
      { href: '/admin/discounts', label: 'Discount Codes', icon: Tag },
      { href: '/admin/gift-cards', label: 'Gift Cards', icon: Gift },
    ],
  },
  {
    label: 'Cleaning',
    items: [
      { href: '/admin/cleaning', label: 'Cleaning Requests', icon: Sparkles },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/purchases', label: 'Purchases', icon: Receipt },
      { href: '/admin/reconciliation', label: 'Reconciliation', icon: Calculator },
      { href: '/admin/payment-links', label: 'Payment Links', icon: Link2 },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/admin/staff', label: 'Staff', icon: UserCog },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
      { href: '/admin/settings', label: 'Store Settings', icon: Settings },
      { href: '/admin/help', label: 'Help Center', icon: HelpCircle },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 space-y-5 no-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#4A4A5A] mb-2">
              {section.label}
            </p>
            <nav className="flex flex-col gap-0.5 px-2">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 relative group',
                      active
                        ? 'text-white sidebar-item-active'
                        : 'text-[#6A6A80] hover:text-[#A0A0B8] hover:bg-white/[0.02]'
                    )}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#FF2E88] to-[#FF2E88]/60" />
                    )}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
                      active
                        ? 'bg-[#FF2E88]/10 shadow-sm shadow-[#FF2E88]/10'
                        : 'bg-transparent group-hover:bg-white/[0.03]'
                    )}>
                      <Icon size={16} className={cn(
                        'transition-colors duration-300',
                        active ? 'text-[#FF2E88]' : 'text-[#6A6A80] group-hover:text-[#A0A0B8]'
                      )} />
                    </div>
                    {label}
                    {/* Hover glow */}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-white/[0.01] to-transparent" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1E1E26] p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium text-[#6A6A80] hover:text-[#00C2D6] hover:bg-[#00C2D6]/5 transition-all w-full mb-1"
        >
          <ExternalLink size={14} />
          View Storefront
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#6A6A80] hover:text-red-400 hover:bg-red-500/[0.06] transition-all w-full group"
        >
          <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-[#141418]/95 backdrop-blur-xl border-b border-[#1E1E26]">
        <Link href="/admin" className="text-lg font-black tracking-tight text-white">{SITE_NAME}</Link>
        <button onClick={() => setOpen(!open)} className="text-white p-2 -mr-2 rounded-lg hover:bg-white/5 transition-colors">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0F0F13] border-r border-[#1E1E26] pt-14 flex flex-col transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-60 bg-[#0F0F13]/95 backdrop-blur-xl border-r border-[#1E1E26]/80 flex-col z-40">
        <div className="p-5 pb-4 border-b border-[#1E1E26]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF2E88] to-[#FF2E88]/60 flex items-center justify-center">
              <span className="text-white text-sm font-black">M</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-none">{SITE_NAME}</span>
              <span className="text-[10px] text-[#4A4A5A] font-medium">Admin Panel</span>
            </div>
          </Link>
        </div>
        {navContent}
      </aside>
    </>
  )
}
