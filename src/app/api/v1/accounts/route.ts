import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'

// GET /api/v1/accounts?profileId=<id>&platform=<id>
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })
  if (!auth.scopes?.includes('read')) {
    return NextResponse.json({ ok: false, error: 'insufficient scope: requires read' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  let profileId = searchParams.get('profileId')
  const platform = searchParams.get('platform')

  // If key is scoped to a specific profile, force it
  if (auth.profileId) profileId = auth.profileId
  if (!profileId) {
    return NextResponse.json({ ok: false, error: 'profileId required (pass ?profileId=...)' }, { status: 400 })
  }

  const where: any = { profileId }
  if (platform && platform !== 'all') where.platform = platform

  const accounts = await db.socialAccount.findMany({
    where,
    orderBy: { connectedAt: 'asc' },
    select: {
      id: true,
      platform: true,
      handle: true,
      displayName: true,
      url: true,
      followers: true,
      following: true,
      posts: true,
      verified: true,
      label: true,
      connectedAt: true,
    },
  })
  return NextResponse.json({ ok: true, accounts })
}
