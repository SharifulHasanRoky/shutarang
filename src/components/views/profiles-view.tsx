'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useApp, profileColor } from '@/lib/store'
import { fetchProfiles } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  Users,
  Sparkles,
  Crown,
  Plug,
  FileText,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const COLORS = ['emerald', 'violet', 'sunset', 'ocean', 'rose', 'mono']

interface Profile {
  id: string
  name: string
  description: string | null
  color: string
  isDefault: boolean
  avatarUrl: string | null
}

export function ProfilesView() {
  const { setActiveProfile, setView, setProfiles, activeProfileId } = useApp()
  const [profiles, setLocalProfiles] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('emerald')
  const [saving, setSaving] = useState(false)
  const [counts, setCounts] = useState<Record<string, { accounts: number; posts: number }>>({})

  const load = () => {
    fetchProfiles().then((p: Profile[]) => {
      setLocalProfiles(p)
      setProfiles(p as any)
      // Fetch counts per profile
      Promise.all(
        p.map(async (x) => {
          const [a, posts] = await Promise.all([
            fetch(`/api/social-accounts?profileId=${x.id}`).then((r) => r.json()),
            fetch(`/api/posts?profileId=${x.id}`).then((r) => r.json()),
          ])
          return {
            id: x.id,
            accounts: a.accounts?.length ?? 0,
            posts: posts.posts?.length ?? 0,
          }
        }),
      ).then((c) => {
        const map: Record<string, { accounts: number; posts: number }> = {}
        c.forEach((x) => (map[x.id] = { accounts: x.accounts, posts: x.posts }))
        setCounts(map)
      })
    })
  }
  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setColor('emerald')
    setOpen(true)
  }
  const openEdit = (p: Profile) => {
    setEditing(p)
    setName(p.name)
    setDescription(p.description ?? '')
    setColor(p.color)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/profiles', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing?.id, name, description, color }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success(editing ? 'Profile updated' : 'Profile created!')
        setOpen(false)
        load()
      } else toast.error(d.error || 'Failed')
    } catch {
      toast.error('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile and ALL its accounts, posts, analytics, and messages?')) return
    const r = await fetch(`/api/profiles?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.ok) {
      toast.success('Profile deleted')
      load()
    } else toast.error(d.error || 'Failed')
  }

  const switchTo = (id: string) => {
    setActiveProfile(id)
    setView('dashboard')
    toast.success('Switched profile')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="text-sm text-muted-foreground">
            Workspaces for your brand, clients, or projects. Each profile holds unlimited accounts per platform.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" /> New Profile
        </Button>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const c = profileColor(p.color)
          const isActive = p.id === activeProfileId
          const cnt = counts[p.id] ?? { accounts: 0, posts: 0 }
          return (
            <Card
              key={p.id}
              className={cn(
                'overflow-hidden transition-all',
                isActive && 'ring-2 ring-emerald-500',
              )}
            >
              <div className={cn('h-2 bg-gradient-to-r', c.from, c.to)} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl', c.from, c.to)}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold">{p.name}</h3>
                        {p.isDefault && (
                          <Badge variant="outline" className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Default
                          </Badge>
                        )}
                        {isActive && (
                          <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {p.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Plug className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="text-base font-bold tabular-nums">{cnt.accounts}</div>
                    <div className="text-[10px] text-muted-foreground">accounts</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <FileText className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="text-base font-bold tabular-nums">{cnt.posts}</div>
                    <div className="text-[10px] text-muted-foreground">posts</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => switchTo(p.id)}
                    >
                      Switch to this
                    </Button>
                  )}
                  {isActive && (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      <Check className="w-3.5 h-3.5 mr-1" /> Currently active
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  {!p.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Create new card */}
        <button
          onClick={openCreate}
          className="rounded-xl border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-muted/30 transition-all p-8 flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-foreground"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-medium">Create new profile</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Brand, client, or project workspace</p>
        </button>
      </div>

      {/* Info banner */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-violet-500/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Multiple accounts per platform</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Under each profile you can connect <strong>unlimited</strong> accounts per platform —
                e.g. 3 Instagram accounts, 2 YouTube channels, 4 Facebook pages, all under one workspace.
                Switch profiles any time from the sidebar to focus on that workspace.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Agency, Client X, Personal"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this profile for?"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => {
                  const pc = profileColor(c)
                  return (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-9 h-9 rounded-lg bg-gradient-to-br border-2',
                        pc.from, pc.to,
                        color === c ? 'border-foreground scale-110' : 'border-transparent',
                      )}
                      title={pc.name}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editing ? 'Save changes' : 'Create profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
