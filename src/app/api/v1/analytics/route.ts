import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'

// GET /api/v1/analytics?profileId=<id>&platform=<id>&days=30
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('read')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires read' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  let profileId = searchParams.get('profileId')
  const platform = searchParams.get('platform')
  const days = Number(searchParams.get('days') ?? 30)
  if (auth.profileId) profileId = auth.profileId
  if (!profileId) return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })

  const where: any = { profileId }
  if (platform && platform !== 'all') where.platform = platform
  const snapshots = await db.analyticsSnapshot.findMany({
    where,
    orderBy: { date: 'asc' },
    take: days * 12,
  })
  // Summary
  const latestDate = snapshots.at(-1)?.date
  const latest = snapshots.filter((s) => s.date === latestDate)
  const summary = {
    followers: latest.reduce((s, x) => s + x.followers, 0),
    reach: latest.reduce((s, x) => s + x.reach, 0),
    impressions: latest.reduce((s, x) => s + x.impressions, 0),
    likes: latest.reduce((s, x) => s + x.likes, 0),
    comments: latest.reduce((s, x) => s + x.comments, 0),
    shares: latest.reduce((s, x) => s + x.shares, 0),
    clicks: latest.reduce((s, x) => s + x.clicks, 0),
    engagementRate: latest.length
      ? Number((latest.reduce((s, x) => s + x.engagementRate, 0) / latest.length).toFixed(2))
      : 0,
  }
  return NextResponse.json({ ok: true, summary, snapshots })
}
