'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import {
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Copy,
  Check,
  Globe,
  Mail,
  ShoppingBag,
  Music,
  Camera,
  Video,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface LinkItem {
  label: string
  url: string
  icon: string
}
interface SmartLink {
  id: string
  title: string
  slug: string
  bio: string
  theme: string
  avatarUrl: string | null
  links: LinkItem[]
  visits: number
  clicks: number
}

const THEMES = [
  { id: 'violet', name: 'Violet', from: 'from-violet-600', to: 'to-fuchsia-600' },
  { id: 'emerald', name: 'Emerald', from: 'from-emerald-600', to: 'to-teal-600' },
  { id: 'sunset', name: 'Sunset', from: 'from-orange-500', to: 'to-rose-600' },
  { id: 'ocean', name: 'Ocean', from: 'from-cyan-600', to: 'to-blue-600' },
  { id: 'mono', name: 'Mono', from: 'from-slate-800', to: 'to-slate-600' },
]

const ICONS: Record<string, any> = {
  globe: Globe,
  mail: Mail,
  shopping: ShoppingBag,
  music: Music,
  camera: Camera,
  video: Video,
}

export function SmartLinksView() {
  const { activeProfileId } = useApp()
  const [links, setLinks] = useState<SmartLink[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SmartLink | null>(null)
  const [copied, setCopied] = useState('')
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [theme, setTheme] = useState('violet')
  const [linkItems, setLinkItems] = useState<LinkItem[]>([{ label: '', url: '', icon: 'globe' }])

  const load = () => {
    if (!activeProfileId) return
    fetch(`/api/smartlinks?profileId=${activeProfileId}`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []))
      .catch(console.error)
  }
  useEffect(load, [activeProfileId])

  const resetForm = () => {
    setTitle('')
    setSlug('')
    setBio('')
    setTheme('violet')
    setLinkItems([{ label: '', url: '', icon: 'globe' }])
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (l: SmartLink) => {
    setEditing(l)
    setTitle(l.title)
    setSlug(l.slug)
    setBio(l.bio)
    setTheme(l.theme)
    setLinkItems(l.links.length ? l.links : [{ label: '', url: '', icon: 'globe' }])
    setOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('Title and slug are required')
      return
    }
    setSaving(true)
    try {
      const cleanedLinks = linkItems.filter((l) => l.label.trim() && l.url.trim())
      const r = await fetch('/api/smartlinks', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing?.id,
          profileId: activeProfileId,
          title,
          slug,
          bio,
          theme,
          links: cleanedLinks,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success(editing ? 'SmartLink updated!' : 'SmartLink created!')
        setOpen(false)
        resetForm()
        load()
      } else {
        toast.error(d.error || 'Failed')
      }
    } catch {
      toast.error('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SmartLink?')) return
    const r = await fetch(`/api/smartlinks?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.ok) {
      toast.success('Deleted')
      load()
    }
  }

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/link/${slug}`)
    setCopied(slug)
    setTimeout(() => setCopied(''), 2000)
    toast.success('Link copied!')
  }

  const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/link/${slug || 'your-slug'}`

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SmartLinks</h1>
          <p className="text-sm text-muted-foreground">Create your link-in-bio pages with real-time tracking.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" /> Create SmartLink
        </Button>
      </div>

      {/* Existing links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {links.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="text-center py-12">
              <Link2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No SmartLinks yet. Create your first link-in-bio page!</p>
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" /> Create SmartLink
              </Button>
            </CardContent>
          </Card>
        ) : (
          links.map((l) => {
            const themeDef = THEMES.find((t) => t.id === l.theme) ?? THEMES[0]
            return (
              <Card key={l.id} className="overflow-hidden">
                <div className={cn('h-20 bg-gradient-to-r', themeDef.from, themeDef.to)} />
                <CardContent className="p-5 -mt-10 relative">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-lg mb-3">
                    <div className={cn('w-full h-full rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl', themeDef.from, themeDef.to)}>
                      {l.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{l.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{l.bio}</p>
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3 h-3" /> {l.visits.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MousePointerClick className="w-3 h-3" /> {l.clicks.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-[9px] capitalize">{l.theme}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-md mb-3">
                    <span className="truncate flex-1">/link/{l.slug}</span>
                    <button onClick={() => copyLink(l.slug)} className="shrink-0">
                      {copied === l.slug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(l)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(previewUrl.replace('your-slug', l.slug), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleDelete(l.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit SmartLink' : 'Create SmartLink'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your Brand" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())} placeholder="your-brand" className="mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">URL: /link/{slug || 'your-brand'}</p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell visitors who you are..." rows={3} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Theme</Label>
                <div className="flex gap-2 flex-wrap">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        'h-8 w-8 rounded-lg bg-gradient-to-br border-2',
                        t.from, t.to,
                        theme === t.id ? 'border-foreground scale-110' : 'border-transparent',
                      )}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Links</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setLinkItems([...linkItems, { label: '', url: '', icon: 'globe' }])}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Link
                  </Button>
                </div>
                <div className="space-y-2">
                  {linkItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const next = [...linkItems]
                          next[i] = { ...item, label: e.target.value }
                          setLinkItems(next)
                        }}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={item.url}
                        onChange={(e) => {
                          const next = [...linkItems]
                          next[i] = { ...item, url: e.target.value }
                          setLinkItems(next)
                        }}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500"
                        onClick={() => setLinkItems(linkItems.filter((_, idx) => idx !== i))}
                        disabled={linkItems.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Link2 className="w-4 h-4 mr-1" />}
                {editing ? 'Update SmartLink' : 'Create SmartLink'}
              </Button>
            </div>

            {/* Live preview */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live Preview</p>
              <div className="rounded-2xl border overflow-hidden">
                <div className={cn('h-24 bg-gradient-to-r', (THEMES.find((t) => t.id === theme) ?? THEMES[0]).from, (THEMES.find((t) => t.id === theme) ?? THEMES[0]).to)} />
                <div className="p-4 -mt-10 text-center bg-card">
                  <div className={cn('w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-lg', (THEMES.find((t) => t.id === theme) ?? THEMES[0]).from, (THEMES.find((t) => t.id === theme) ?? THEMES[0]).to)}>
                    {(title || '?').charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold">{title || 'Your Brand'}</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">{bio || 'Your bio will appear here'}</p>
                  <div className="space-y-2 text-left">
                    {linkItems.filter((l) => l.label && l.url).slice(0, 5).map((l, i) => {
                      const Icon = ICONS[l.icon] ?? Globe
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-emerald-500/50 text-xs">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="truncate">{l.label}</span>
                        </div>
                      )
                    })}
                    {linkItems.filter((l) => l.label && l.url).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Add links to preview them</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
