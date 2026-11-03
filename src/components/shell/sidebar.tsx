'use client'

import { useApp, ViewId } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarRange,
  BarChart3,
  Inbox,
  Link2,
  Sparkles,
  Plug,
  FileText,
  Menu,
  X,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

interface NavItem {
  id: ViewId
  label: string
  icon: any
  desc: string
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & quick stats' },
  { id: 'planner', label: 'Planner', icon: CalendarRange, desc: 'Schedule & cross-post' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Performance insights' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, desc: 'Messages & comments' },
  { id: 'smartlinks', label: 'SmartLinks', icon: Link2, desc: 'Link-in-bio builder' },
  { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, desc: 'Gemini-powered creator' },
  { id: 'reports', label: 'Reports', icon: FileText, desc: 'Auto-generated reports' },
  { id: 'connections', label: 'Connections', icon: Plug, desc: 'Manage social accounts' },
]

export function Sidebar() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useApp()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/inbox')
      .then((r) => r.json())
      .then((d) => setUnread(d.messages?.filter((m: any) => !m.isRead).length ?? 0))
      .catch(() => {})
  }, [view])

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed md:sticky top-0 z-50 md:z-auto h-screen w-[260px] shrink-0',
          'bg-sidebar text-sidebar-foreground flex flex-col',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Shutarang</h1>
              <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 uppercase tracking-wider">Free Forever</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Menu
          </p>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id)
                  setSidebarOpen(false)
                }}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-sidebar-primary-foreground')} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'inbox' && unread > 0 && (
                  <Badge className="bg-rose-500 hover:bg-rose-500 text-white border-0 h-5 px-1.5 text-[10px]">
                    {unread}
                  </Badge>
                )}
                {item.id === 'ai-studio' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold uppercase">
                    AI
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Free badge */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-500/30 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">No Plans. No Limits.</span>
            </div>
            <p className="text-[11px] text-sidebar-foreground/70 leading-relaxed">
              Every feature is 100% free and unlimited — forever. No credit card, no upgrade prompts.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileTopBar() {
  const { setSidebarOpen, view } = useApp()
  const current = NAV.find((n) => n.id === view)
  return (
    <div className="md:hidden sticky top-0 z-30 glass border-b border-border flex items-center justify-between px-4 h-14">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 -ml-2 rounded-lg hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-violet-500" />
        <span className="font-semibold">{current?.label ?? 'Shutarang'}</span>
      </div>
      <div className="w-9" />
    </div>
  )
}
