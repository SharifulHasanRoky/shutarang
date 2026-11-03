'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Hash,
  Lightbulb,
  Wand2,
  Clock,
  MessageSquareReply,
  Copy,
  Check,
  Loader2,
  Send,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { toast } from 'sonner'

interface Tool {
  id: string
  label: string
  desc: string
  icon: any
  color: string
  task: 'caption' | 'hashtags' | 'ideas' | 'rewrite' | 'schedule-tip' | 'reply' | 'custom'
  placeholder: string
  needsTextarea?: boolean
  cta: string
}

const TOOLS: Tool[] = [
  {
    id: 'caption',
    label: 'Caption Writer',
    desc: 'Generate an engaging caption for any topic',
    icon: Wand2,
    color: 'from-emerald-500 to-teal-500',
    task: 'caption',
    placeholder: 'e.g. launching a new sustainable product line',
    cta: 'Generate Caption',
  },
  {
    id: 'hashtags',
    label: 'Hashtag Finder',
    desc: 'Get 15 relevant hashtags for max reach',
    icon: Hash,
    color: 'from-violet-500 to-purple-500',
    task: 'hashtags',
    placeholder: 'topic or niche, e.g. fitness coaching',
    cta: 'Generate Hashtags',
  },
  {
    id: 'ideas',
    label: 'Content Ideas',
    desc: '7 fresh content ideas for your brand',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    task: 'ideas',
    placeholder: 'what is your brand about?',
    cta: 'Get Ideas',
  },
  {
    id: 'rewrite',
    label: 'Caption Rewriter',
    desc: 'Make any caption more engaging',
    icon: Sparkles,
    color: 'from-rose-500 to-pink-500',
    task: 'rewrite',
    placeholder: 'paste your caption here',
    needsTextarea: true,
    cta: 'Rewrite',
  },
  {
    id: 'schedule',
    label: 'Best Time Tips',
    desc: 'When to post for max reach',
    icon: Clock,
    color: 'from-cyan-500 to-blue-500',
    task: 'schedule-tip',
    placeholder: 'optional: choose platform',
    cta: 'Get Tips',
  },
]

export function AiStudioView() {
  const { openComposer } = useApp()
  const [activeTool, setActiveTool] = useState<Tool>(TOOLS[0])
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('friendly')
  const [platform, setPlatform] = useState('any')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!topic && activeTool.task !== 'schedule-tip') {
      toast.error('Please enter a topic')
      return
    }
    setLoading(true)
    setResult('')
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: activeTool.task,
          topic,
          tone,
          platform,
          prompt: topic,
        }),
      })
      const d = await r.json()
      if (d.ok && d.text) {
        setResult(d.text)
        toast.success('Generated!')
      } else {
        toast.error(d.error || 'AI failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  const useAsCaption = () => {
    openComposer(result)
    toast.success('Loaded into composer!')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          AI Studio
          <Badge className="bg-gradient-to-r from-emerald-500 to-violet-500 text-white border-0 text-[10px]">
            GEMINI POWERED
          </Badge>
        </h1>
        <p className="text-sm text-muted-foreground">Generate captions, hashtags, ideas and more — free, unlimited.</p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOOLS.map((t) => {
          const Icon = t.icon
          const active = activeTool.id === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t)
                setResult('')
                setTopic('')
              }}
              className={cn(
                'rounded-xl p-4 border-2 text-left transition-all',
                active
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                  : 'border-border hover:border-emerald-500/40',
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2.5', t.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold">{t.label}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <activeTool.icon className="w-4 h-4 text-emerald-500" />
              {activeTool.label}
            </CardTitle>
            <CardDescription className="text-xs">{activeTool.desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {activeTool.task === 'rewrite' ? 'Your Caption' : 'Topic / Subject'}
              </Label>
              {activeTool.needsTextarea ? (
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={activeTool.placeholder}
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={activeTool.placeholder}
                  className="mt-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              )}
            </div>

            {activeTool.task === 'caption' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tone</Label>
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="friendly, witty, formal..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Platform</Label>
                  <Input
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="any, instagram, tiktok..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-10"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating with Gemini...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> {activeTool.cta}</>
              )}
            </Button>

            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-3 text-xs text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900">
              <p className="font-semibold mb-1">Free & Unlimited</p>
              <p>Powered by Gemini. Generate as much as you want — no quotas, no plan, no credits.</p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Result</CardTitle>
              {result && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={copyResult}>
                    {copied ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={useAsCaption}>
                    <Send className="w-3 h-3 mr-1" /> Use
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">Gemini is thinking...</p>
              </div>
            ) : result ? (
              <div className="rounded-lg bg-muted/50 p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Your generated content will appear here</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Pick a tool and start creating</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
