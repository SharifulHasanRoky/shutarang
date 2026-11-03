'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/platform-icon'
import { PLATFORM_MAP } from '@/lib/platforms'
import { useApp, profileColor } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

interface Snapshot {
  platform: string
  date: string
  followers: number
  reach: number
  impressions: number
  engagementRate: number
  likes: number
  comments: number
  shares: number
  clicks: number
}

interface Account {
  platform: string
  handle: string
  followers: number
  posts: number
}

export function ReportsView() {
  const { activeProfileId, profiles } = useApp()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [period, setPeriod] = useState('Last 30 days')

  useEffect(() => {
    if (!activeProfileId) return
    Promise.all([
      fetch(`/api/analytics?profileId=${activeProfileId}&days=30`).then((r) => r.json()),
      fetch(`/api/social-accounts?profileId=${activeProfileId}`).then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setSnapshots(s.snapshots ?? [])
        setAccounts(a.accounts ?? [])
      })
      .catch(console.error)
  }, [activeProfileId])

  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  const totals = useMemo(() => {
    const latest = snapshots.filter((s) => s.date === snapshots.at(-1)?.date)
    return {
      followers: latest.reduce((s, x) => s + x.followers, 0),
      reach: latest.reduce((s, x) => s + x.reach, 0),
      impressions: latest.reduce((s, x) => s + x.impressions, 0),
      likes: latest.reduce((s, x) => s + x.likes, 0),
      comments: latest.reduce((s, x) => s + x.comments, 0),
      shares: latest.reduce((s, x) => s + x.shares, 0),
      clicks: latest.reduce((s, x) => s + x.clicks, 0),
    }
  }, [snapshots])

  const trendData = useMemo(() => {
    const byDate: Record<string, any> = {}
    snapshots.forEach((s) => {
      if (!byDate[s.date]) byDate[s.date] = { date: s.date.slice(5), reach: 0, engagement: 0 }
      byDate[s.date].reach += s.reach
      byDate[s.date].engagement += s.likes + s.comments + s.shares
    })
    return Object.values(byDate)
  }, [snapshots])

  const perPlatform = useMemo(() => {
    return accounts.map((a) => {
      const ss = snapshots.filter((s) => s.platform === a.platform)
      const latest = ss.at(-1)
      return {
        platform: a.platform,
        name: PLATFORM_MAP[a.platform]?.name ?? a.platform,
        followers: a.followers,
        reach: latest?.reach ?? 0,
        engagement: latest ? latest.likes + latest.comments + latest.shares : 0,
        rate: latest?.engagementRate ?? 0,
      }
    })
  }, [snapshots, accounts])

  const handleExport = () => {
    const csv = [
      ['Platform', 'Followers', 'Reach', 'Engagement', 'Rate (%)'].join(','),
      ...perPlatform.map((p) => [p.name, p.followers, p.reach, p.engagement, p.rate.toFixed(2)].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shutarang-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Auto-generated performance reports — ready to share.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <FileText className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Report header */}
      <Card className="print:shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold">Shutarang Performance Report</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <Calendar className="w-3 h-3 inline mr-1" />
                {period} · Generated {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">{totals.followers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Audience</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Reach', value: totals.reach, icon: Eye, color: 'text-violet-600' },
          { label: 'Impressions', value: totals.impressions, icon: TrendingUp, color: 'text-sky-600' },
          { label: 'Likes', value: totals.likes, icon: Heart, color: 'text-rose-600' },
          { label: 'Comments', value: totals.comments, icon: MessageCircle, color: 'text-amber-600' },
          { label: 'Shares', value: totals.shares, icon: Share2, color: 'text-purple-600' },
          { label: 'Clicks', value: totals.clicks, icon: TrendingUp, color: 'text-cyan-600' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <Icon className={cn('w-4 h-4 mb-2', s.color)} />
                <div className="text-lg font-bold tabular-nums">{s.value.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reach & Engagement — Daily</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="e1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="reach" stroke="#8b5cf6" strokeWidth={3} fill="url(#r1)" fillOpacity={1} isAnimationActive={false} />
                <Area type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={3} fill="url(#e1)" fillOpacity={1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-platform table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Platform</th>
                  <th className="pb-2 font-medium text-right">Followers</th>
                  <th className="pb-2 font-medium text-right">Reach</th>
                  <th className="pb-2 font-medium text-right">Engagement</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {perPlatform.map((p) => (
                  <tr key={p.platform} className="border-b last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={p.platform} size={22} />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{p.followers.toLocaleString()}</td>
                    <td className="text-right tabular-nums">{p.reach.toLocaleString()}</td>
                    <td className="text-right tabular-nums">{p.engagement.toLocaleString()}</td>
                    <td className="text-right tabular-nums">
                      <Badge variant="outline" className="text-[10px]">{p.rate.toFixed(2)}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="pt-2.5">Total</td>
                  <td className="text-right tabular-nums pt-2.5">{perPlatform.reduce((s, p) => s + p.followers, 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums pt-2.5">{perPlatform.reduce((s, p) => s + p.reach, 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums pt-2.5">{perPlatform.reduce((s, p) => s + p.engagement, 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums pt-2.5">
                    {(perPlatform.reduce((s, p) => s + p.rate, 0) / Math.max(1, perPlatform.length)).toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-violet-500/10 border-emerald-500/30 print:hidden">
        <CardContent className="p-5 text-center">
          <p className="text-xs text-muted-foreground">
            Report generated by Shutarang — the 100% free, unlimited social media manager.
            <br />No plans. No trials. No watermark. Share freely.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
