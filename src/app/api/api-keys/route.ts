import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const PREFIX = 'sk_shutar_'

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const rand = crypto.randomBytes(24).toString('hex')
  const raw = `${PREFIX}${rand}`
  // prefix stores first 14 chars (incl. prefix namespace) so users can recognise it
  const displayPrefix = raw.slice(0, 14)
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, prefix: displayPrefix, hash }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get('profileId')
  const keys = await db.apiKey.findMany({
    where: profileId ? { profileId } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      profileId: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
  })
  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, profileId, scopes } = body
  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
  }
  const { raw, prefix, hash } = generateApiKey()
  const key = await db.apiKey.create({
    data: {
      name: name.trim(),
      prefix,
      keyHash: hash,
      profileId: profileId || null,
      scopes: scopes ?? 'read,write,ai',
    },
  })
  // Return the raw key ONCE — never retrievable again
  return NextResponse.json({ ok: true, key: { id: key.id, name: key.name, raw, prefix, scopes: key.scopes } })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })
  return NextResponse.json({ ok: true })
}

// Helper for v1 API auth — exported for reuse
export async function authenticateApiKey(req: NextRequest): Promise<{
  ok: boolean
  profileId?: string | null
  scopes?: string[]
  apiKeyId?: string
  error?: string
}> {
  const auth = req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer\s+(sk_shutar_[a-f0-9]+)$/i)
  if (!match) return { ok: false, error: 'missing or malformed Bearer token' }
  const rawKey = match[1]
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const key = await db.apiKey.findUnique({ where: { keyHash: hash } })
  if (!key || key.revokedAt) return { ok: false, error: 'invalid or revoked API key' }
  // update lastUsedAt (fire-and-forget)
  db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  return {
    ok: true,
    profileId: key.profileId,  // null = all profiles
    scopes: key.scopes.split(',').map((s) => s.trim()),
    apiKeyId: key.id,
  }
}
