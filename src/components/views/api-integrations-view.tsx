'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useApp, profileColor } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Server,
  Terminal,
  Plug,
  Code2,
  Sparkles,
  ExternalLink,
  Shield,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  prefix: string
  profileId: string | null
  scopes: string
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

interface Profile {
  id: string
  name: string
  color: string
}

const V1_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/profiles', desc: 'List all profiles the key has access to' },
  { method: 'GET', path: '/api/v1/accounts?profileId=<id>', desc: 'List social accounts under a profile' },
  { method: 'GET', path: '/api/v1/posts?profileId=<id>&status=scheduled', desc: 'List posts (filter by status)' },
  { method: 'POST', path: '/api/v1/posts', desc: 'Create a draft / scheduled / published post' },
  { method: 'GET', path: '/api/v1/analytics?profileId=<id>&days=30', desc: 'Get analytics summary + snapshots' },
  { method: 'POST', path: '/api/v1/ai/generate', desc: 'Generate captions, hashtags, ideas, replies' },
]

const MCP_TOOLS = [
  'list_profiles', 'list_accounts', 'get_analytics', 'list_posts',
  'create_post', 'generate_caption', 'generate_hashtags', 'generate_reply',
]

export function ApiIntegrationsView() {
  const { activeProfileId, profiles } = useApp()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'all' | string>('all') // 'all' or a profileId
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => {
    fetch('/api/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []))
      .catch(console.error)
  }
  useEffect(load, [])

  const openCreate = () => {
    setName('')
    setScope('all')
    setNewlyCreated(null)
    setOpen(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          profileId: scope === 'all' ? null : scope,
          scopes: 'read,write,ai',
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setNewlyCreated(d.key.raw)
        load()
        toast.success('API key created — copy it now, it will not be shown again!')
      } else {
        toast.error(d.error || 'Failed')
      }
    } catch {
      toast.error('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    const r = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.ok) {
      toast.success('Key revoked')
      load()
    }
  }

  const copyKey = () => {
    if (newlyCreated) {
      navigator.clipboard.writeText(newlyCreated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-shutarang-app.com'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          API & MCP
          <Badge className="bg-gradient-to-r from-emerald-500 to-violet-500 text-white border-0 text-[10px]">NEW</Badge>
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect external AI tools, scripts, and apps to Shutarang. 100% free, unlimited requests.
        </p>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><KeyRound className="w-4 h-4 mr-1.5" /> API Keys</TabsTrigger>
          <TabsTrigger value="rest"><Code2 className="w-4 h-4 mr-1.5" /> REST API</TabsTrigger>
          <TabsTrigger value="mcp"><Server className="w-4 h-4 mr-1.5" /> MCP Server</TabsTrigger>
        </TabsList>

        {/* ===== API Keys tab ===== */}
        <TabsContent value="keys" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Your API Keys</CardTitle>
                  <CardDescription className="text-xs">Use these to authenticate REST API and MCP requests.</CardDescription>
                </div>
                <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" /> New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {keys.length === 0 ? (
                <div className="text-center py-10">
                  <KeyRound className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No API keys yet. Create your first one.</p>
                  <Button onClick={openCreate} variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> Generate Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => {
                    const profile = profiles.find((p) => p.id === k.profileId)
                    const revoked = !!k.revokedAt
                    return (
                      <div key={k.id} className={cn('flex items-center gap-3 p-3 rounded-lg border', revoked && 'opacity-50 bg-muted/30')}>
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <KeyRound className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{k.name}</span>
                            {revoked && (
                              <Badge variant="outline" className="text-[9px] text-rose-600 bg-rose-50 dark:bg-rose-950/30">Revoked</Badge>
                            )}
                            {!revoked && (
                              <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">Active</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">{k.prefix}...</code>
                            {profile ? (
                              <span>· bound to {profile.name}</span>
                            ) : (
                              <span>· all profiles</span>
                            )}
                            <span>· scopes: {k.scopes}</span>
                            {k.lastUsedAt && (
                              <span className="hidden md:inline">· last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {!revoked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600"
                            onClick={() => handleRevoke(k.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info banner */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-violet-500/10 border-emerald-500/30">
            <CardContent className="p-5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Security notes</h3>
                <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                  <li>• Keys are shown <strong>once</strong> at creation. Store them safely.</li>
                  <li>• We hash keys with SHA-256 — the raw value never touches our database.</li>
                  <li>• Bind a key to a single profile for least-privilege access, or leave it unbound for all profiles.</li>
                  <li>• Revoke any key instantly — it stops working immediately.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== REST API tab ===== */}
        <TabsContent value="rest" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">REST API v1</CardTitle>
              <CardDescription className="text-xs">All endpoints accept and return JSON. Authenticate with <code className="px-1 py-0.5 rounded bg-muted font-mono">Authorization: Bearer sk_shutar_...</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {V1_ENDPOINTS.map((e) => (
                <div key={e.path} className="flex items-start gap-3 p-2.5 rounded-lg border border-border">
                  <Badge variant="outline" className={cn('font-mono text-[10px] shrink-0', e.method === 'GET' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-violet-600 bg-violet-50 dark:bg-violet-950/30')}>
                    {e.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono break-all">{e.path}</code>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{e.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example: Create a post via API</CardTitle>
              <CardDescription className="text-xs">Cross-post to multiple platforms in one request.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
{`curl -X POST ${baseUrl}/api/v1/posts \\
  -H "Authorization: Bearer sk_shutar_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "profileId": "<profile id>",
    "caption": "Hello from the API! 🚀",
    "platforms": ["instagram", "tiktok", "twitter", "facebook"],
    "status": "published"
  }'`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example: Generate AI caption</CardTitle>
              <CardDescription className="text-xs">Powered by Gemini — free and unlimited.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
{`curl -X POST ${baseUrl}/api/v1/ai/generate \\
  -H "Authorization: Bearer sk_shutar_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "caption",
    "topic": "launching a new sustainable product line",
    "tone": "exciting",
    "platform": "instagram"
  }'`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== MCP tab ===== */}
        <TabsContent value="mcp" className="mt-4 space-y-4">
          {/* What is MCP */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-violet-500/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Server className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">What is MCP?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The <strong>Model Context Protocol</strong> is an open standard that lets AI tools
                    like Claude Desktop, Cursor, and Windsurf directly call tools in your app.
                    Shutarang ships an MCP server with 8 tools — your AI assistant can list your profiles,
                    check analytics, schedule posts, and generate captions on your behalf.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Option 1: HTTP MCP */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plug className="w-4 h-4 text-emerald-500" /> HTTP MCP Endpoint
                </CardTitle>
                <CardDescription className="text-xs">For AI tools that support remote MCP servers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Endpoint URL</Label>
                  <div className="mt-1 p-2 rounded bg-muted font-mono text-xs break-all">
                    {baseUrl}/api/mcp
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Authentication</Label>
                  <div className="mt-1 p-2 rounded bg-muted font-mono text-xs">
                    Authorization: Bearer sk_shutar_xxx
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Protocol</Label>
                  <div className="mt-1 p-2 rounded bg-muted font-mono text-xs">
                    JSON-RPC 2.0 over HTTP
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-2">
                  Send a <code className="px-1 py-0.5 rounded bg-muted font-mono">POST</code> with <code className="px-1 py-0.5 rounded bg-muted font-mono">{`{"jsonrpc":"2.0","id":1,"method":"tools/list"}`}</code> to discover available tools.
                </p>
              </CardContent>
            </Card>

            {/* Option 2: stdio MCP server */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-500" /> Stdio MCP Server (local)
                </CardTitle>
                <CardDescription className="text-xs">For Claude Desktop, Cursor, Windsurf — runs locally.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Server file</Label>
                  <div className="mt-1 p-2 rounded bg-muted font-mono text-xs break-all">
                    mini-services/mcp-server/index.js
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Required env vars</Label>
                  <div className="mt-1 p-2 rounded bg-muted font-mono text-xs space-y-0.5">
                    <div>SHUTARANG_API_KEY=sk_shutar_xxx</div>
                    <div>SHUTARANG_BASE_URL={baseUrl}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Claude Desktop config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claude Desktop config</CardTitle>
              <CardDescription className="text-xs">Add this to your <code className="px-1 py-0.5 rounded bg-muted font-mono">claude_desktop_config.json</code></CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "shutarang": {
      "command": "node",
      "args": ["/absolute/path/to/shutarang/mini-services/mcp-server/index.js"],
      "env": {
        "SHUTARANG_API_KEY": "sk_shutar_xxx",
        "SHUTARANG_BASE_URL": "${baseUrl}"
      }
    }
  }
}`}
              </pre>
              <p className="text-[11px] text-muted-foreground mt-2">
                On macOS: <code className="px-1 py-0.5 rounded bg-muted font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                <br />On Windows: <code className="px-1 py-0.5 rounded bg-muted font-mono">%APPDATA%\Claude\claude_desktop_config.json</code>
              </p>
            </CardContent>
          </Card>

          {/* Available tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available MCP Tools ({MCP_TOOLS.length})</CardTitle>
              <CardDescription className="text-xs">Your AI assistant can call any of these.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {MCP_TOOLS.map((t) => (
                  <div key={t} className="flex items-start gap-2 p-2.5 rounded-lg border border-border">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <code className="text-xs font-mono">{t}</code>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {t === 'list_profiles' && 'List all profiles the key can access'}
                        {t === 'list_accounts' && 'List connected accounts (filterable by platform)'}
                        {t === 'get_analytics' && 'Get latest metrics summary + 30d trend'}
                        {t === 'list_posts' && 'List recent posts (filterable by status)'}
                        {t === 'create_post' && 'Create a draft/scheduled/published cross-post'}
                        {t === 'generate_caption' && 'AI caption (Gemini)'}
                        {t === 'generate_hashtags' && 'AI hashtag suggestions'}
                        {t === 'generate_reply' && 'AI reply for an inbox message'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create key dialog */}
      <Dialog open={open} onOpenChange={(o) => {
        if (!o && newlyCreated) {
          setNewlyCreated(null)
          setName('')
        }
        setOpen(o)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newlyCreated ? 'API Key Created!' : 'Create New API Key'}</DialogTitle>
          </DialogHeader>
          {newlyCreated ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Copy this key now. For security, it will <strong>never</strong> be shown again.
                  We only store a hash.
                </p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your API Key</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    readOnly
                    value={newlyCreated}
                    className="font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button onClick={copyKey} variant="outline" size="icon">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => { setOpen(false); setNewlyCreated(null); setName('') }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                I've copied it — close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Claude Desktop, My automation script"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Scope</Label>
                <div className="mt-1.5 space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="accent-emerald-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">All profiles</div>
                      <div className="text-[11px] text-muted-foreground">Key can access every profile in your account</div>
                    </div>
                  </label>
                  {profiles.map((p: Profile) => (
                    <label key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === p.id}
                        onChange={() => setScope(p.id)}
                        className="accent-emerald-600"
                      />
                      <div className={cn('w-6 h-6 rounded bg-gradient-to-br', profileColor(p.color).from, profileColor(p.color).to)} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">Limited to this profile only</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                <strong>Scopes granted:</strong> read, write, ai
              </div>
            </div>
          )}
          {!newlyCreated && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Generate Key
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
