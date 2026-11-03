'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/platform-icon'
import { useApp, profileColor } from '@/lib/store'
import { PLATFORM_MAP } from '@/lib/platforms'
import {
  fetchAccounts, fetchAnalytics, fetchPosts,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Users, Eye, Heart, MessageCircle, TrendingUp, TrendingDown,
  Sparkles, Plus, ArrowUpRight, Calendar, Zap, AlertCircle,
} from 'lucide-react'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'

interface Account {
  id: string
  platform: string
  handle: string
  displayName: string
  url: string
  followers: number
  following: number
  posts: number
  verified: boolean
}
interface Snapshot {
  platform: string; date: string; followers: number; reach: number;
  impressions: number; engagementRate: number; likes: number;
  comments: number; shares: number; clicks: number;
}
interface Post {
  id: string; caption: string; platforms: string[]; status: string;
  scheduledAt: string | null; publishedAt: string | null; createdAt: string;
}

export function DashboardView() {
  const { openComposer, setView, activeProfileId, profiles } = useApp()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  useEffect(() => {
    if (!activeProfileId) return
    Promise.all([
      fetchAccounts(activeProfileId),
      fetchAnalytics(activeProfileId, 30),
      fetchPosts(activeProfileId),
    ])
      .then(([a, s, p]) => {
        setAccounts(a as Account[])
        setSnapshots(s as Snapshot[])
        setPosts(p as Post[])
      })
      .catch(console.error)
  }, [activeProfileId])

  // No active profile state
  if (!activeProfileId || !activeProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">Shutarang</span>
          </h1>
          <p className="text-muted-foreground mt-1">Create your first profile to get started.</p>
        </div>
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
            <h3 className="font-semibold mb-1">No profile selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Profiles are workspaces where you organize your social accounts, posts, and analytics.
              Create one to get started — it's free and unlimited.
            </p>
            <Button onClick={() => setView('profiles')} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalFollowers = accounts.reduce((s, a) => s + (a.followers ?? 0), 0)
  const todaySnap = snapshots.filter((s) => s.date === snapshots.at(-1)?.date)
  const totalReach = todaySnap.reduce((s, x) => s + (x.reach ?? 0), 0)
  const prevSnap = snapshots.filter((s) => s.date === snapshots.at(-2)?.date)
  const prevReach = prevSnap.reduce((s, x) => s + (x.reach ?? 0), 0)
  const reachChange = prevReach > 0 ? ((totalReach - prevReach) / prevReach) * 100 : 0
  const totalEngagement = todaySnap.reduce((s, x) => s + (x.likes ?? 0) + (x.comments ?? 0) + (x.shares ?? 0), 0)
  const totalImpressions = todaySnap.reduce((s, x) => s + (x.impressions ?? 0), 0)
  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0

  const followersData = (() => {
    const byDate: Record<string, number> = {}
    snapshots.forEach((s) => { byDate[s.date] = (byDate[s.date] ?? 0) + s.followers })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, followers]) => ({ date: date.slice(5), followers }))
  })()

  const platformData = accounts.map((a) => ({
    name: PLATFORM_MAP[a.platform]?.name ?? a.platform,
    followers: a.followers,
    platform: a.platform,
  }))

  const scheduledPosts = posts.filter((p) => p.status === 'scheduled' || p.status === 'draft').slice(0, 5)
  const recentPublished = posts.filter((p) => p.status === 'published').slice(0, 4)

  const stats = [
    { label: 'Total Followers', value: totalFollowers.toLocaleString(), change: '+4.2%', up: true, icon: Users, color: 'from-emerald-500 to-teal-500' },
    { label: 'Reach (today)', value: totalReach.toLocaleString(), change: `${reachChange >= 0 ? '+' : ''}${reachChange.toFixed(1)}%`, up: reachChange >= 0, icon: Eye, color: 'from-violet-500 to-purple-500' },
    { label: 'Engagement', value: totalEngagement.toLocaleString(), change: '+12.8%', up: true, icon: Heart, color: 'from-rose-500 to-pink-500' },
    { label: 'Engagement Rate', value: `${engagementRate.toFixed(2)}%`, change: '+0.4%', up: true, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
  ]

  const pc = profileColor(activeProfile.color)

  return (
    <div className="space-y-6">
      {/* Hero header with profile pill */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('w-7 h-7 rounded-md bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', pc.from, pc.to)}>
              {activeProfile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{activeProfile.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back to <span className="gradient-text">Shutarang</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            All your social media, all in one place. 100% free, unlimited — no plans, ever.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openComposer()} className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
          <Button variant="outline" onClick={() => setView('ai-studio')}>
            <Sparkles className="w-4 h-4 mr-1 text-violet-500" /> AI Studio
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="overflow-hidden relative">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', s.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <Badge variant="outline" className={cn('gap-1 text-[10px] font-medium', s.up ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/30')}>
                    {s.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {s.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-xl md:text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-[11px] md:text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Audience Growth</CardTitle>
                <CardDescription className="text-xs">Total followers across all platforms — last 14 days</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setView('analytics')}>
                Details <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={followersData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={42} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: any) => [Number(v).toLocaleString(), 'Followers']} />
                  <Area type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={3} fill="url(#followersGrad)" fillOpacity={1} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Platform</CardTitle>
            <CardDescription className="text-xs">{accounts.length} connected accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={72} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: any) => [Number(v).toLocaleString(), 'Followers']} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="followers" radius={[0, 6, 6, 0]} barSize={Math.max(8, Math.min(16, 200 / Math.max(1, platformData.length)))} isAnimationActive={false}>
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={PLATFORM_MAP[entry.platform]?.color ?? '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected accounts strip */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Connected Accounts</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setView('connections')}>
              Manage <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No accounts connected yet. Add your first social media link!</p>
              <Button onClick={() => setView('connections')} variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Connect Account
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setView('connections')}
                  className="flex flex-col items-center text-center p-3 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-muted/50 transition-all"
                >
                  <PlatformIcon platform={a.platform} size={40} />
                  <span className="text-xs font-medium mt-2 truncate w-full">{a.displayName}</span>
                  {a.label && <span className="text-[10px] text-muted-foreground truncate w-full">{a.label}</span>}
                  <span className="text-[11px] text-muted-foreground">{(a.followers ?? 0).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> Upcoming Posts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setView('planner')}>
                Open Planner <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Zap className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                Nothing scheduled. Create your first post!
              </div>
            ) : (
              scheduledPosts.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex -space-x-1 mt-0.5">
                    {p.platforms.slice(0, 3).map((pl) => (
                      <PlatformIcon key={pl} platform={pl} size={20} className="ring-2 ring-background" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs line-clamp-2">{p.caption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-[9px] capitalize', p.status === 'scheduled' ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30')}>
                        {p.status}
                      </Badge>
                      {p.scheduledAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(p.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPublished.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No published posts yet.</div>
            ) : (
              recentPublished.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex -space-x-1 mt-0.5">
                    {p.platforms.slice(0, 3).map((pl) => (
                      <PlatformIcon key={pl} platform={pl} size={20} className="ring-2 ring-background" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs line-clamp-2">{p.caption}</p>
                    <span className="text-[10px] text-muted-foreground">
                      Published {new Date(p.publishedAt ?? p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">Live</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
