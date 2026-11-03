import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'

// GET /api/v1/posts?profileId=<id>&status=<draft|scheduled|published>
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('read')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires read' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  let profileId = searchParams.get('profileId')
  const status = searchParams.get('status')
  if (auth.profileId) profileId = auth.profileId
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })
  }
  const where: any = { profileId }
  if (status) where.status = status
  const posts = await db.scheduledPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({
    ok: true,
    posts: posts.map((p) => ({
      ...p,
      platforms: JSON.parse(p.platforms),
      hashtags: JSON.parse(p.hashtags),
    })),
  })
}

// POST /api/v1/posts — create a post (schedule / publish / draft)
// Body: { profileId, caption, platforms: ["instagram","tiktok",...], scheduledAt?, status? }
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('write')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires write' }, { status: 403 })
  }
  const body = await req.json()
  let profileId = body.profileId
  if (auth.profileId) profileId = auth.profileId
  if (!profileId || !body.caption || !body.platforms?.length) {
    return NextResponse.json({ ok: false, error: 'profileId, caption, platforms required' }, { status: 400 })
  }
  const post = await db.scheduledPost.create({
    data: {
      profileId,
      caption: body.caption,
      platforms: JSON.stringify(body.platforms),
      mediaUrls: JSON.stringify(body.mediaUrls ?? []),
      hashtags: JSON.stringify(body.hashtags ?? []),
      status: body.status ?? (body.scheduledAt ? 'scheduled' : 'draft'),
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      publishedAt: body.status === 'published' ? new Date() : null,
    },
  })
  return NextResponse.json({ ok: true, post: { ...post, platforms: JSON.parse(post.platforms) } })
}
