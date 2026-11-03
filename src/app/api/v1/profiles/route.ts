import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'

// GET /api/v1/profiles — list all profiles (or scoped to one if key is bound)
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('read')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires read' }, { status: 403 })
  }
  const profiles = await db.profile.findMany({
    where: auth.profileId ? { id: auth.profileId } : undefined,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      isDefault: true,
      createdAt: true,
    },
  })
  const counts = await Promise.all(
    profiles.map(async (p) => ({
      id: p.id,
      accounts: await db.socialAccount.count({ where: { profileId: p.id } }),
      posts: await db.scheduledPost.count({ where: { profileId: p.id } }),
    })),
  )
  return NextResponse.json({
    ok: true,
    profiles: profiles.map((p) => ({
      ...p,
      accounts: counts.find((c) => c.id === p.id)?.accounts ?? 0,
      posts: counts.find((c) => c.id === p.id)?.posts ?? 0,
    })),
  })
}
