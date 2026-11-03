import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  const platform = searchParams.get('platform')
  const days = Number(searchParams.get('days') ?? 30)
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })
  }

  const where: any = { profileId }
  if (platform && platform !== 'all') where.platform = platform

  const snapshots = await db.analyticsSnapshot.findMany({
    where,
    orderBy: { date: 'asc' },
    take: days * 12,
  })
  return NextResponse.json({ snapshots })
}
