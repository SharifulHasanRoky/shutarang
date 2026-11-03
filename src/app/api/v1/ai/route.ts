import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/v1/ai/generate
// Body: { task: "caption" | "hashtags" | "ideas" | "reply", topic?, tone?, platform?, message? }
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('ai')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires ai' }, { status: 403 })
  }

  const body = await req.json()
  const { task, platform, tone, topic, prompt, message } = body

  const sys = `You are an expert social media strategist for the Shutarang app. Return clean, ready-to-post text only. No markdown code blocks. Use emojis sparingly (1-2 per post).`

  let userPrompt = ''
  switch (task) {
    case 'caption':
      userPrompt = `Write a single engaging social media caption about "${topic || prompt}" for ${platform || 'any platform'}. Tone: ${tone || 'friendly'}. Include a hook and one CTA. Return ONLY the caption.`
      break
    case 'hashtags':
      userPrompt = `Generate 15 relevant hashtags for content about "${topic || prompt}". Return ONLY hashtags separated by spaces, each starting with #.`
      break
    case 'ideas':
      userPrompt = `Generate 7 content ideas for a brand focused on "${topic || prompt}". Numbered list, each idea max 12 words.`
      break
    case 'reply':
      userPrompt = `Write a short, warm reply to this message. 1-2 sentences. Return ONLY the reply text:\n\n"${message || ''}"`
      break
    default:
      userPrompt = prompt || topic || ''
  }

  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
  })
  const text: string =
    completion?.choices?.[0]?.message?.content ??
    completion?.choices?.[0]?.text ??
    (typeof completion === 'string' ? completion : '') ??
    ''
  return NextResponse.json({ ok: true, task, text: text.trim() })
}
