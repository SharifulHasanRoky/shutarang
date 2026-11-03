import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const links = await db.smartLink.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    links: links.map((l) => ({ ...l, links: JSON.parse(l.links) })),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, slug, bio, theme, links, avatarUrl } = body
  if (!title || !slug) return NextResponse.json({ ok: false, error: 'title and slug required' }, { status: 400 })
  const existing = await db.smartLink.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ ok: false, error: 'slug taken' }, { status: 400 })
  const link = await db.smartLink.create({
    data: {
      title,
      slug,
      bio: bio ?? '',
      theme: theme ?? 'violet',
      links: JSON.stringify(links ?? []),
      avatarUrl: avatarUrl ?? null,
    },
  })
  return NextResponse.json({ ok: true, link })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, title, slug, bio, theme, links, avatarUrl } = body
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  const link = await db.smartLink.update({
    where: { id },
    data: {
      title, slug, bio, theme, avatarUrl,
      links: links ? JSON.stringify(links) : undefined,
    },
  })
  return NextResponse.json({ ok: true, link })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  await db.smartLink.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
