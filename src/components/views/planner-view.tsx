'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlatformIcon } from '@/components/platform-icon'
import { useApp } from '@/lib/store'
import { PLATFORM_MAP } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import {
  Plus,
  Calendar,
  List,
  Clock,
  CheckCircle2,
  FileEdit,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface Post {
  id: string
  caption: string
  platforms: string[]
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  hashtags: string[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function PlannerView() {
  const { openComposer } = useApp()
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState('calendar')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const load = () => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(console.error)
  }
  useEffect(load, [])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(month)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const startWeekday = firstDay.getDay()
    const totalDays = lastDay.getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [month])

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {}
    posts.forEach((p) => {
      const dateStr = (p.scheduledAt ?? p.publishedAt ?? p.createdAt).slice(0, 10)
      ;(map[dateStr] ??= []).push(p)
    })
    return map
  }, [posts])

  const today = new Date().toISOString().slice(0, 10)
  const isToday = (d: Date) => d.toISOString().slice(0, 10) === today

  const stats = useMemo(
    () => ({
      published: posts.filter((p) => p.status === 'published').length,
      scheduled: posts.filter((p) => p.status === 'scheduled').length,
      drafts: posts.filter((p) => p.status === 'draft').length,
    }),
    [posts],
  )

  const handlePublish = async (id: string) => {
    const r = await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'published' }),
    })
    const d = await r.json()
    if (d.ok) {
      toast.success('Post published to all platforms!')
      load()
    } else {
      toast.error(d.error || 'Failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const r = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.ok) {
      toast.success('Post deleted')
      load()
    }
  }

  const renderPostCard = (p: Post, compact = false) => (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-2 hover:shadow-sm transition-all',
        p.status === 'published' && 'border-emerald-200 dark:border-emerald-900',
        p.status === 'scheduled' && 'border-sky-200 dark:border-sky-900',
        p.status === 'draft' && 'border-amber-200 dark:border-amber-900',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex -space-x-1 shrink-0">
          {p.platforms.slice(0, 3).map((pl) => (
            <PlatformIcon key={pl} platform={pl} size={compact ? 16 : 20} className="ring-2 ring-card" />
          ))}
          {p.platforms.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-muted text-[9px] flex items-center justify-center ring-2 ring-card">
              +{p.platforms.length - 3}
            </div>
          )}
        </div>
        <p className={cn('text-xs flex-1 line-clamp-2', compact && 'line-clamp-1')}>{p.caption}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] capitalize',
            p.status === 'published' && 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
            p.status === 'scheduled' && 'text-sky-600 bg-sky-50 dark:bg-sky-950/30',
            p.status === 'draft' && 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
          )}
        >
          {p.status}
        </Badge>
        {!compact && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {p.status !== 'published' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-emerald-600"
                onClick={() => handlePublish(p.id)}
                title="Publish now"
              >
                <Send className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-rose-600"
              onClick={() => handleDelete(p.id)}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planner</h1>
          <p className="text-sm text-muted-foreground">Drag, drop, and schedule. Write once, post everywhere.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />{stats.published} published
            </span>
            <span className="px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400">
              <Clock className="w-3 h-3 inline mr-1" />{stats.scheduled} scheduled
            </span>
            <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
              <FileEdit className="w-3 h-3 inline mr-1" />{stats.drafts} drafts
            </span>
          </div>
          <Button onClick={openComposer} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-1.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" /> List View</TabsTrigger>
        </TabsList>

        {/* Calendar view */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const d = new Date()
                      setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
                {calendarDays.map((d, i) => {
                  if (!d) return <div key={i} className="min-h-[80px] md:min-h-[110px] rounded-md bg-muted/30" />
                  const dateStr = d.toISOString().slice(0, 10)
                  const dayPosts = postsByDate[dateStr] ?? []
                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[80px] md:min-h-[110px] p-1.5 rounded-md border border-border hover:border-emerald-500/40 transition-all overflow-hidden',
                        isToday(d) && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500',
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          'text-[11px] font-medium',
                          isToday(d) && 'text-emerald-700 dark:text-emerald-400 font-bold',
                        )}>
                          {d.getDate()}
                        </span>
                        {dayPosts.length > 0 && (
                          <span className="text-[9px] text-muted-foreground">{dayPosts.length}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 2).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => openComposer(p.caption)}
                            className="block w-full text-left"
                          >
                            {renderPostCard(p, true)}
                          </button>
                        ))}
                        {dayPosts.length > 2 && (
                          <button
                            onClick={() => setTab('list')}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            +{dayPosts.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List view */}
        <TabsContent value="list" className="mt-4 space-y-4">
          {['scheduled', 'draft', 'published'].map((status) => {
            const items = posts.filter((p) => p.status === status)
            if (items.length === 0) return null
            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 capitalize">
                    {status === 'scheduled' && <Clock className="w-4 h-4 text-sky-500" />}
                    {status === 'draft' && <FileEdit className="w-4 h-4 text-amber-500" />}
                    {status === 'published' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {status} <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((p) => (
                    <div key={p.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1">
                          {p.platforms.map((pl) => (
                            <PlatformIcon key={pl} platform={pl} size={22} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-3">{p.caption}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[11px] text-muted-foreground">
                              {p.scheduledAt
                                ? `Scheduled for ${new Date(p.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                                : p.publishedAt
                                  ? `Published ${new Date(p.publishedAt).toLocaleDateString()}`
                                  : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                            </span>
                            {p.hashtags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.hashtags.slice(0, 4).map((h, i) => (
                                  <span key={i} className="text-[10px] text-violet-600">{h}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7"
                            onClick={() => openComposer(p.caption)}
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </Button>
                          {status !== 'published' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-emerald-600"
                              onClick={() => handlePublish(p.id)}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-rose-600"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
          {posts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No posts yet. Create your first one!</p>
                <Button onClick={openComposer} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" /> New Post
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
