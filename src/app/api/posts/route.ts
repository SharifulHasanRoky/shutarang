import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })
  }
  const posts = await db.scheduledPost.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      platforms: JSON.parse(p.platforms),
      mediaUrls: JSON.parse(p.mediaUrls),
      hashtags: JSON.parse(p.hashtags),
    })),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { profileId, caption, platforms, scheduledAt, hashtags, mediaUrls, status } = body
  if (!profileId || !caption || !platforms?.length) {
    return NextResponse.json({ ok: false, error: 'profileId, caption and platforms required' }, { status: 400 })
  }
  const post = await db.scheduledPost.create({
    data: {
      profileId,
      caption,
      platforms: JSON.stringify(platforms),
      mediaUrls: JSON.stringify(mediaUrls ?? []),
      hashtags: JSON.stringify(hashtags ?? []),
      status: status ?? (scheduledAt ? 'scheduled' : 'draft'),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: status === 'published' ? new Date() : null,
    },
  })
  return NextResponse.json({ ok: true, post })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ ok: false, error: 'id and status required' }, { status: 400 })
  const post = await db.scheduledPost.update({
    where: { id },
    data: { status, publishedAt: status === 'published' ? new Date() : undefined },
  })
  return NextResponse.json({ ok: true, post })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  await db.scheduledPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
