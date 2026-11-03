'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/platform-icon'
import { PLATFORMS, PLATFORM_MAP } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  PieChart,
  Pie,
  Legend,
  Line,
  LineChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, MousePointerClick, Users } from 'lucide-react'

interface Snapshot {
  platform: string
  date: string
  followers: number
  followersGrowth: number
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
  followers: number
  handle: string
}

const PLATFORM_COLORS: Record<string, string> = PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p.color }), {})

export function AnalyticsView() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selected, setSelected] = useState('all')
  const [range, setRange] = useState('30')

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics?platform=all&days=30').then((r) => r.json()),
      fetch('/api/social-accounts').then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setSnapshots(s.snapshots ?? [])
        setAccounts(a.accounts ?? [])
      })
      .catch(console.error)
  }, [])

  const filtered = useMemo(
    () => (selected === 'all' ? snapshots : snapshots.filter((s) => s.platform === selected)),
    [snapshots, selected],
  )

  const totals = useMemo(() => {
    const latestDate = filtered.at(-1)?.date
    const latest = filtered.filter((s) => s.date === latestDate)
    return {
      followers: latest.reduce((s, x) => s + x.followers, 0),
      reach: latest.reduce((s, x) => s + x.reach, 0),
      impressions: latest.reduce((s, x) => s + x.impressions, 0),
      engagement: latest.reduce((s, x) => s + x.likes + x.comments + x.shares, 0),
      likes: latest.reduce((s, x) => s + x.likes, 0),
      comments: latest.reduce((s, x) => s + x.comments, 0),
      shares: latest.reduce((s, x) => s + x.shares, 0),
      clicks: latest.reduce((s, x) => s + x.clicks, 0),
      rate: latest.length > 0 ? latest.reduce((s, x) => s + x.engagementRate, 0) / latest.length : 0,
    }
  }, [filtered])

  const trendData = useMemo(() => {
    const byDate: Record<string, any> = {}
    filtered.forEach((s) => {
      if (!byDate[s.date]) byDate[s.date] = { date: s.date.slice(5), reach: 0, impressions: 0, engagement: 0, followers: 0 }
      byDate[s.date].reach += s.reach
      byDate[s.date].impressions += s.impressions
      byDate[s.date].engagement += s.likes + s.comments + s.shares
      byDate[s.date].followers += s.followers
    })
    return Object.values(byDate).slice(-Number(range))
  }, [filtered, range])

  const platformDistribution = useMemo(() => {
    return accounts
      .filter((a) => selected === 'all' || a.platform === selected)
      .map((a) => ({
        name: PLATFORM_MAP[a.platform]?.name ?? a.platform,
        value: a.followers,
        platform: a.platform,
        color: PLATFORM_COLORS[a.platform] ?? '#10b981',
      }))
  }, [accounts, selected])

  const engagementByPlatform = useMemo(() => {
    const byPlatform: Record<string, { platform: string; rate: number; count: number }> = {}
    snapshots.forEach((s) => {
      if (!byPlatform[s.platform]) byPlatform[s.platform] = { platform: s.platform, rate: 0, count: 0 }
      byPlatform[s.platform].rate += s.engagementRate
      byPlatform[s.platform].count += 1
    })
    return Object.values(byPlatform)
      .map((x) => ({ name: PLATFORM_MAP[x.platform]?.name ?? x.platform, rate: x.rate / x.count, platform: x.platform }))
      .sort((a, b) => b.rate - a.rate)
  }, [snapshots])

  const stats = [
    { label: 'Followers', value: totals.followers.toLocaleString(), change: '+4.2%', up: true, icon: Users, color: 'text-emerald-600' },
    { label: 'Reach', value: totals.reach.toLocaleString(), change: '+8.1%', up: true, icon: Eye, color: 'text-violet-600' },
    { label: 'Impressions', value: totals.impressions.toLocaleString(), change: '+5.7%', up: true, icon: TrendingUp, color: 'text-sky-600' },
    { label: 'Likes', value: totals.likes.toLocaleString(), change: '+12.3%', up: true, icon: Heart, color: 'text-rose-600' },
    { label: 'Comments', value: totals.comments.toLocaleString(), change: '+3.4%', up: true, icon: MessageCircle, color: 'text-amber-600' },
    { label: 'Shares', value: totals.shares.toLocaleString(), change: '-1.2%', up: false, icon: Share2, color: 'text-purple-600' },
    { label: 'Link Clicks', value: totals.clicks.toLocaleString(), change: '+9.8%', up: true, icon: MousePointerClick, color: 'text-cyan-600' },
    { label: 'Engagement Rate', value: `${totals.rate.toFixed(2)}%`, change: '+0.4%', up: true, icon: TrendingUp, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance insights without the headache.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('w-4 h-4', s.color)} />
                  <Badge variant="outline" className={cn('text-[9px] gap-0.5', s.up ? 'text-emerald-600' : 'text-rose-600')}>
                    {s.up ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                    {s.change}
                  </Badge>
                </div>
                <div className="text-xl font-bold tracking-tight">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reach & Engagement over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reach & Engagement Trend</CardTitle>
          <CardDescription className="text-xs">Daily aggregated performance across selected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reachG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="engG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="reach" stroke="#8b5cf6" strokeWidth={3} fill="url(#reachG)" fillOpacity={1} isAnimationActive={false} />
                <Area type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={3} fill="url(#engG)" fillOpacity={1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audience distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience Distribution</CardTitle>
            <CardDescription className="text-xs">Followers share by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {platformDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: any) => [Number(v).toLocaleString(), 'Followers']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement rate by platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Rate by Platform</CardTitle>
            <CardDescription className="text-xs">Average engagement % across all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementByPlatform} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Engagement']}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} barSize={32} isAnimationActive={false}>
                    {engagementByPlatform.map((entry, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[entry.platform] ?? '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Performance</CardTitle>
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
                {accounts.map((a) => {
                  const latest = snapshots.filter((s) => s.platform === a.platform).at(-1)
                  const rate = latest?.engagementRate ?? 0
                  const eng = latest ? latest.likes + latest.comments + latest.shares : 0
                  const reach = latest?.reach ?? 0
                  return (
                    <tr key={a.platform} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={a.platform} size={22} />
                          <span className="font-medium">{PLATFORM_MAP[a.platform]?.name ?? a.platform}</span>
                          <span className="text-xs text-muted-foreground">@{a.handle}</span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{a.followers.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{reach.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{eng.toLocaleString()}</td>
                      <td className="text-right tabular-nums">
                        <Badge variant="outline" className={cn('text-[10px]', rate > 3 ? 'text-emerald-600' : rate > 1.5 ? 'text-amber-600' : 'text-rose-600')}>
                          {rate.toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
