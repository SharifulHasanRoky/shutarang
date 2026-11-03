'use client'

import { useApp } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/platform-icon'
import { PLATFORMS } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Send, Calendar, Image as ImageIcon, Hash, X, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function Composer() {
  const { composerOpen, closeComposer, composerPrefill } = useApp()
  const [caption, setCaption] = useState('')
  const [selected, setSelected] = useState<string[]>(['instagram', 'tiktok', 'twitter', 'facebook'])
  const [hashtags, setHashtags] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    if (composerOpen) {
      setCaption(composerPrefill || '')
      fetch('/api/social-accounts')
        .then((r) => r.json())
        .then((d) => setAccounts(d.accounts ?? []))
        .catch(() => {})
    }
  }, [composerOpen, composerPrefill])

  const connectedPlatforms = useMemo(
    () => new Set(accounts.map((a) => a.platform)),
    [accounts],
  )

  const togglePlatform = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const handleAi = async () => {
    setAiLoading(true)
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'caption', topic: caption || 'a brand update', tone: 'engaging' }),
      })
      const d = await r.json()
      if (d.ok && d.text) {
        setCaption(d.text)
        toast.success('AI-generated caption ready!')
      } else {
        toast.error(d.error || 'AI failed, try again')
      }
    } catch (e: any) {
      toast.error(e?.message || 'AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiHashtags = async () => {
    setAiLoading(true)
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'hashtags', topic: caption || 'social media marketing' }),
      })
      const d = await r.json()
      if (d.ok && d.text) {
        setHashtags(d.text)
        toast.success('Hashtags generated!')
      } else {
        toast.error(d.error || 'AI failed, try again')
      }
    } catch (e: any) {
      toast.error(e?.message || 'AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handlePublish = async (status: 'published' | 'scheduled' | 'draft') => {
    if (!caption.trim()) {
      toast.error('Caption cannot be empty')
      return
    }
    if (selected.length === 0) {
      toast.error('Select at least one platform')
      return
    }
    setPublishing(true)
    try {
      const r = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          platforms: selected,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
          scheduledAt: status === 'scheduled' ? scheduleAt : undefined,
          status,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success(
          status === 'published'
            ? `Posted to ${selected.length} platforms!`
            : status === 'scheduled'
              ? 'Post scheduled!'
              : 'Saved as draft',
        )
        closeComposer()
        setCaption('')
        setHashtags('')
        setScheduleAt('')
      } else {
        toast.error(d.error || 'Failed to save post')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Request failed')
    } finally {
      setPublishing(false)
    }
  }

  const totalReach = accounts
    .filter((a) => selected.includes(a.platform))
    .reduce((sum, a) => sum + (a.followers ?? 0), 0)

  return (
    <Dialog open={composerOpen} onOpenChange={(o) => !o && closeComposer()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Create & Cross-post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Platform selection */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Publish to ({selected.length} selected)
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PLATFORMS.map((p) => {
                const active = selected.includes(p.id)
                const connected = connectedPlatforms.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-border hover:border-muted-foreground/40',
                    )}
                  >
                    <PlatformIcon platform={p.id} size={32} />
                    <span className="text-[11px] font-medium text-center leading-tight">{p.name}</span>
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {!connected && (
                      <span className="absolute -top-1 -left-1 px-1 py-0.5 text-[8px] font-bold uppercase bg-amber-500 text-white rounded">
                        +
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {totalReach > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Estimated reach: <span className="font-semibold text-foreground">{totalReach.toLocaleString()}</span> followers
              </p>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Caption</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAi}
                disabled={aiLoading}
                className="h-7 text-xs text-violet-600 hover:text-violet-700"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Generate with AI
              </Button>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind? Write once — we'll adapt for every platform..."
              rows={5}
              className="resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">{caption.length} characters</span>
              <div className="flex gap-1.5">
                {selected.includes('twitter') && caption.length > 280 && (
                  <Badge variant="destructive" className="text-[10px]">X: {caption.length - 280} over</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" /> Hashtags
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAiHashtags}
                disabled={aiLoading}
                className="h-7 text-xs text-violet-600"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Suggest
              </Button>
            </div>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#yourbrand #social #marketing"
            />
          </div>

          {/* Schedule */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
              <Calendar className="w-3 h-3" /> Schedule (optional)
            </Label>
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              onClick={() => handlePublish('published')}
              disabled={publishing}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1 min-w-[140px]"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              Post Now
            </Button>
            <Button
              onClick={() => handlePublish('scheduled')}
              disabled={publishing || !scheduleAt}
              variant="secondary"
              className="flex-1 min-w-[140px]"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
            <Button
              onClick={() => handlePublish('draft')}
              disabled={publishing}
              variant="outline"
            >
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
