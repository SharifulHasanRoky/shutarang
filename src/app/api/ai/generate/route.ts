import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface GenerateBody {
  task: 'caption' | 'hashtags' | 'ideas' | 'rewrite' | 'schedule-tip' | 'reply' | 'custom'
  prompt?: string
  platform?: string
  tone?: string
  topic?: string
  message?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody
    const { task, platform, tone, topic, prompt, message } = body

    const sys = `You are an expert social media strategist. Always return content as clean text, ready to post. Use emojis sparingly (1-2 per post). Never wrap in markdown code blocks. Adapt length to the platform. The user is using a free unlimited social media management tool inspired by Metricool.`

    let userPrompt = ''
    switch (task) {
      case 'caption':
        userPrompt = `Write a single engaging social media caption about "${topic || prompt}" for ${platform || 'any platform'}. Tone: ${tone || 'friendly and professional'}. Include a clear hook in the first line and a single call-to-action at the end. Return ONLY the caption text, no explanation.`
        break
      case 'hashtags':
        userPrompt = `Generate 15 relevant hashtags for content about "${topic || prompt}". Mix popular (1M+ posts) and niche hashtags. Return ONLY hashtags separated by spaces, each starting with #. No explanation.`
        break
      case 'ideas':
        userPrompt = `Generate 7 content ideas for a brand focused on "${topic || prompt}". Format as a numbered list, each idea one line, max 12 words. No preamble.`
        break
      case 'rewrite':
        userPrompt = `Rewrite this caption to be more engaging and ${tone || 'compelling'}, keeping the same meaning. Return ONLY the new caption:\n\n${prompt || ''}`
        break
      case 'schedule-tip':
        userPrompt = `Give 3 specific best-time-to-post tips for ${platform || 'social media'} targeting a global audience. Format as 3 short bullets, max 25 words each. No preamble.`
        break
      case 'reply':
        userPrompt = `Write a short, warm, on-brand reply to this social media message. Keep it 1-2 sentences. Return ONLY the reply text:\n\n"${message || ''}"`
        break
      default:
        userPrompt = prompt || ''
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

    return NextResponse.json({ ok: true, text: text.trim() })
  } catch (e: any) {
    console.error('ai/generate error', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'AI generation failed', text: '' },
      { status: 500 },
    )
  }
}
