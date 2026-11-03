'use client'

import { useEffect } from 'react'
import { Sidebar, MobileTopBar } from '@/components/shell/sidebar'
import { Composer } from '@/components/shell/composer'
import { useApp } from '@/lib/store'
import { useProfiles } from '@/lib/use-profiles'
import { DashboardView } from '@/components/views/dashboard-view'
import { PlannerView } from '@/components/views/planner-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { InboxView } from '@/components/views/inbox-view'
import { SmartLinksView } from '@/components/views/smartlinks-view'
import { AiStudioView } from '@/components/views/ai-studio-view'
import { ConnectionsView } from '@/components/views/connections-view'
import { ReportsView } from '@/components/views/reports-view'
import { ProfilesView } from '@/components/views/profiles-view'
import { ApiIntegrationsView } from '@/components/views/api-integrations-view'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const { view } = useApp()
  useProfiles()

  // Auto-seed on first load
  useEffect(() => {
    fetch('/api/seed').catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {view === 'dashboard' && <DashboardView />}
          {view === 'planner' && <PlannerView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'inbox' && <InboxView />}
          {view === 'smartlinks' && <SmartLinksView />}
          {view === 'ai-studio' && <AiStudioView />}
          {view === 'connections' && <ConnectionsView />}
          {view === 'reports' && <ReportsView />}
          {view === 'profiles' && <ProfilesView />}
          {view === 'api-integrations' && <ApiIntegrationsView />}
        </main>
        <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground mt-auto">
          <p>
            <span className="font-semibold gradient-text">Shutarang</span> — Free Social Media Manager ·
            100% Free · Unlimited · No Plans · Powered by Gemini AI + MCP
          </p>
        </footer>
      </div>
      <Composer />
    </div>
  )
}
