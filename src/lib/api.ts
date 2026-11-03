// Shared client-side API helpers — every fetch auto-injects the active profile.
'use client'

import { useApp } from '@/lib/store'

export async function fetchProfiles() {
  const r = await fetch('/api/profiles')
  const d = await r.json()
  return d.profiles ?? []
}

/** Returns the active profileId, or undefined if none yet. */
export function useActiveProfileId(): string | null {
  return useApp((s) => s.activeProfileId)
}

function withProfile(url: string, profileId: string | null) {
  if (!profileId) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}profileId=${profileId}`
}

export async function fetchAccounts(profileId: string | null) {
  if (!profileId) return []
  const r = await fetch(withProfile('/api/social-accounts', profileId))
  const d = await r.json()
  return d.accounts ?? []
}

export async function fetchPosts(profileId: string | null) {
  if (!profileId) return []
  const r = await fetch(withProfile('/api/posts', profileId))
  const d = await r.json()
  return d.posts ?? []
}

export async function fetchAnalytics(profileId: string | null, days = 30) {
  if (!profileId) return []
  const r = await fetch(withProfile(`/api/analytics?days=${days}`, profileId))
  const d = await r.json()
  return d.snapshots ?? []
}

export async function fetchInbox(profileId: string | null) {
  if (!profileId) return []
  const r = await fetch(withProfile('/api/inbox', profileId))
  const d = await r.json()
  return d.messages ?? []
}

export async function fetchSmartLinks(profileId: string | null) {
  if (!profileId) return []
  const r = await fetch(withProfile('/api/smartlinks', profileId))
  const d = await r.json()
  return d.links ?? []
}
