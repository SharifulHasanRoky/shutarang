import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })
  }
  const accounts = await db.socialAccount.findMany({
    where: { profileId },
    orderBy: { connectedAt: 'asc' },
  })
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { profileId, platform, handle, displayName, url, label } = body
  if (!profileId || !platform || !handle) {
    return NextResponse.json({ ok: false, error: 'profileId, platform and handle are required' }, { status: 400 })
  }
  const existing = await db.socialAccount.findFirst({ where: { profileId, platform, handle } })
  if (existing) {
    return NextResponse.json({ ok: false, error: 'already connected' }, { status: 400 })
  }
  const account = await db.socialAccount.create({
    data: {
      profileId,
      platform,
      handle,
      displayName: displayName || handle,
      url: url || `https://${platform}.com/${handle}`,
      label: label || null,
    },
  })
  return NextResponse.json({ ok: true, account })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  await db.socialAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
