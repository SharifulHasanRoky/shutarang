import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required' }, { status: 400 })
  }
  const messages = await db.inboxMessage.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ messages })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, reply } = body
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  const msg = await db.inboxMessage.update({
    where: { id },
    data: { reply, isReplied: !!reply, isRead: true, repliedAt: new Date() },
  })
  return NextResponse.json({ ok: true, message: msg })
}
