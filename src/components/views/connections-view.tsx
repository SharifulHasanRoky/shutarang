'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/platform-icon'
import { PLATFORMS } from '@/lib/platforms'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Plug,
  Loader2,
  Zap,
  Shield,
  Infinity as InfinityIcon,
  Users,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Account {
  id: string
  platform: string
  handle: string
  displayName: string
  url: string
  followers: number
  verified: boolean
  label: string | null
  connectedAt: string
}

export function ConnectionsView() {
  const { activeProfileId, profiles, setView } = useApp()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [open, setOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!activeProfileId) return
    fetch(`/api/social-accounts?profileId=${activeProfileId}`)
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(console.error)
  }
  useEffect(load, [activeProfileId])

  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  const handleConnect = async () => {
    if (!handle.trim()) {
      toast.error('Handle is required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfileId,
          platform: selectedPlatform,
          handle: handle.trim().replace(/^@/, ''),
          displayName: displayName.trim() || handle.trim(),
          url: url.trim() || undefined,
          label: label.trim() || null,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Account connected!')
        setOpen(false)
        setHandle('')
        setDisplayName('')
        setUrl('')
        setLabel('')
        load()
      } else {
        toast.error(d.error || 'Failed to connect')
      }
    } catch {
      toast.error('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this account?')) return
    const r = await fetch(`/api/social-accounts?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.ok) {
      toast.success('Account disconnected')
      load()
    }
  }

  const openConnect = (platform: string) => {
    if (!activeProfileId) {
      toast.error('Create a profile first')
      setView('profiles')
      return
    }
    setSelectedPlatform(platform)
    const p = PLATFORMS.find((x) => x.id === platform)
    if (p) setUrl(p.urlBase)
    setOpen(true)
  }

  const totalFollowers = accounts.reduce((s, a) => s + (a.followers ?? 0), 0)
  const connectedPlatforms = new Set(accounts.map((a) => a.platform))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Connect all your social media — paste links. Multiple accounts per platform supported.
        </p>
      </div>

      {/* No active profile warning */}
      {!activeProfileId && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No active profile selected</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Create a profile first to connect social accounts.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView('profiles')}>
              Create profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Plug className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Accounts</span>
            </div>
            <div className="text-xl font-bold">{accounts.length}</div>
            <div className="text-[10px] text-muted-foreground">across {connectedPlatforms.size} platforms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Total reach</span>
            </div>
            <div className="text-xl font-bold">{totalFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <InfinityIcon className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Plan</span>
            </div>
            <div className="text-xl font-bold gradient-text">Free Unlimited</div>
          </CardContent>
        </Card>
      </div>

      {/* Platforms grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Supported Platforms</CardTitle>
          <CardDescription className="text-xs">
            Add <strong>multiple</strong> accounts per platform under the active profile
            {activeProfile && <> — <span className="font-medium text-foreground">{activeProfile.name}</span></>}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const connected = accounts.filter((a) => a.platform === p.id)
              return (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    connected.length > 0 ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-border',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <PlatformIcon platform={p.id} size={36} />
                    {connected.length > 0 ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        {connected.length} connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px]">Free</Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">Connect unlimited {p.name} accounts</p>

                  {connected.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {connected.map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline truncate min-w-0"
                          >
                            <span className="truncate">@{c.handle}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                          <button
                            onClick={() => handleDisconnect(c.id)}
                            className="text-rose-500 hover:text-rose-700 shrink-0"
                            title="Disconnect"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {connected.length > 1 && (
                        <div className="text-[10px] text-muted-foreground/70 pt-0.5">
                          + {connected.length} accounts on this platform
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant={connected.length > 0 ? 'outline' : 'default'}
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => openConnect(p.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {connected.length > 0 ? 'Add Another' : 'Connect'}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Free unlimited banner */}
      <Card className="bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-amber-500/10 border-emerald-500/30">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-bold gradient-text">100% Free Forever</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No plans. No trials. No credit card. Connect unlimited accounts across all 11 platforms
            and post as much as you want.
          </p>
        </CardContent>
      </Card>

      {/* Connect dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlatformIcon platform={selectedPlatform} size={28} />
              Connect {PLATFORMS.find((p) => p.id === selectedPlatform)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="handle" className="text-xs uppercase tracking-wider text-muted-foreground">Username / Handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourbrand"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">Display Name (optional)</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Brand"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="label" className="text-xs uppercase tracking-wider text-muted-foreground">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Main, Backup, EU market, Client X"
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Helps you tell multiple accounts on the same platform apart.
              </p>
            </div>
            <div>
              <Label htmlFor="url" className="text-xs uppercase tracking-wider text-muted-foreground">Profile URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConnect}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plug className="w-4 h-4 mr-1" />}
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
