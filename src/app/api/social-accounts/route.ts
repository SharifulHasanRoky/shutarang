import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const accounts = await db.socialAccount.findMany({ orderBy: { connectedAt: 'asc' } })
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, handle, displayName, url } = body
  if (!platform || !handle) {
    return NextResponse.json({ ok: false, error: 'platform and handle are required' }, { status: 400 })
  }
  const existing = await db.socialAccount.findFirst({ where: { platform, handle } })
  if (existing) {
    return NextResponse.json({ ok: false, error: 'already connected' }, { status: 400 })
  }
  const account = await db.socialAccount.create({
    data: {
      platform,
      handle,
      displayName: displayName || handle,
      url: url || `https://${platform}.com/${handle}`,
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
