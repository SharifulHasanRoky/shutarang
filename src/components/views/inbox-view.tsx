'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { PlatformIcon } from '@/components/platform-icon'
import { cn } from '@/lib/utils'
import { Mail, MessageCircle, AtSign, Sparkles, Send, CheckCheck, Loader2, Inbox as InboxIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  platform: string
  senderName: string
  senderHandle: string
  senderAvatar: string | null
  message: string
  type: string
  postCaption: string | null
  isRead: boolean
  isReplied: boolean
  reply: string | null
  createdAt: string
}

const typeIcon: Record<string, any> = {
  comment: MessageCircle,
  dm: Mail,
  mention: AtSign,
}

export function InboxView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied'>('all')

  const load = () => {
    fetch('/api/inbox')
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? [])
        if (d.messages?.length > 0 && !selectedId) setSelectedId(d.messages[0].id)
      })
      .catch(console.error)
  }
  useEffect(load, [])

  const filtered = messages.filter((m) =>
    filter === 'unread' ? !m.isRead : filter === 'replied' ? m.isReplied : true,
  )

  const selectedMsg = messages.find((m) => m.id === selectedId)

  const handleAi = async () => {
    if (!selectedMsg) return
    setAiLoading(true)
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'reply', message: selectedMsg.message, platform: selectedMsg.platform }),
      })
      const d = await r.json()
      if (d.ok && d.text) {
        setReply(d.text)
        toast.success('AI reply drafted!')
      } else toast.error(d.error || 'AI failed')
    } catch {
      toast.error('Request failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSend = async () => {
    if (!selectedMsg || !reply.trim()) return
    setSending(true)
    try {
      const r = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMsg.id, reply }),
      })
      const d = await r.json()
      if (d.ok) {
        toast.success('Reply sent!')
        setReply('')
        load()
      } else toast.error(d.error || 'Failed')
    } catch {
      toast.error('Request failed')
    } finally {
      setSending(false)
    }
  }

  const counts = {
    all: messages.length,
    unread: messages.filter((m) => !m.isRead).length,
    replied: messages.filter((m) => m.isReplied).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">All your messages and comments, neatly in one place.</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(['all', 'unread', 'replied'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md capitalize transition-all',
                filter === f ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Message list */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="overflow-y-auto h-full divide-y">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <InboxIcon className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No messages</p>
                </div>
              ) : (
                filtered.map((m) => {
                  const Icon = typeIcon[m.type] ?? Mail
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-all',
                        selectedId === m.id && 'bg-muted',
                        !m.isRead && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                      )}
                    >
                      <PlatformIcon platform={m.platform} size={32} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{m.senderName}</span>
                          {!m.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{m.senderHandle}</p>
                        <p className="text-xs line-clamp-2 mt-1">{m.message}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <Icon className="w-2 h-2" /> {m.type}
                          </Badge>
                          {m.isReplied && (
                            <Badge variant="outline" className="text-[9px] text-emerald-600">
                              <CheckCheck className="w-2 h-2" /> replied
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card>
          <CardContent className="p-0 h-full flex flex-col">
            {selectedMsg ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-start gap-3">
                    <PlatformIcon platform={selectedMsg.platform} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{selectedMsg.senderName}</h3>
                        {selectedMsg.isReplied && (
                          <Badge variant="outline" className="text-[9px] text-emerald-600">
                            <CheckCheck className="w-2 h-2" /> Replied
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedMsg.senderHandle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] capitalize">{selectedMsg.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(selectedMsg.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedMsg.postCaption && (
                    <div className="mt-3 p-2.5 rounded-lg bg-muted text-xs italic border-l-2 border-muted-foreground/30">
                      <span className="text-muted-foreground">on post: </span>
                      "{selectedMsg.postCaption.slice(0, 100)}"
                    </div>
                  )}
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                    {selectedMsg.message}
                  </div>
                  {selectedMsg.reply && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-emerald-500 text-sm">
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">YOUR REPLY</p>
                      {selectedMsg.reply}
                    </div>
                  )}
                </div>
                {!selectedMsg.reply && (
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Reply</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAi}
                        disabled={aiLoading}
                        className="h-7 text-xs text-violet-600"
                      >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Generate with AI
                      </Button>
                    </div>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write your reply..."
                      className="flex-1 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                        Send Reply
                      </Button>
                      <Button variant="outline" onClick={() => setReply('')}>Clear</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <InboxIcon className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Select a message to view</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
