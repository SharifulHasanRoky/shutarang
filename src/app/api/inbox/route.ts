import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const messages = await db.inboxMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
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
