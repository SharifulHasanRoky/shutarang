import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const profiles = await db.profile.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ profiles })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, color, avatarUrl } = body
  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
  }
  const profile = await db.profile.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || 'emerald',
      avatarUrl: avatarUrl || null,
      isDefault: false,
    },
  })
  return NextResponse.json({ ok: true, profile })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, name, description, color, avatarUrl } = body
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  const profile = await db.profile.update({
    where: { id },
    data: {
      name, description, color, avatarUrl,
    },
  })
  return NextResponse.json({ ok: true, profile })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  // Don't allow deleting the default profile if it's the only one
  const profile = await db.profile.findUnique({ where: { id } })
  if (profile?.isDefault) {
    const total = await db.profile.count()
    if (total <= 1) {
      return NextResponse.json({ ok: false, error: 'cannot delete the last profile' }, { status: 400 })
    }
    // Promote another profile to default
    const other = await db.profile.findFirst({ where: { id: { not: id } } })
    if (other) {
      await db.profile.update({ where: { id: other.id }, data: { isDefault: true } })
    }
  }

  await db.profile.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
