'use client'

import { useEffect } from 'react'
import { useApp } from '@/lib/store'
import { fetchProfiles } from '@/lib/api'

/** Loads profiles once on mount, and re-fetches when the active view changes
 *  to "profiles" so newly-created profiles show up in the switcher. */
export function useProfiles() {
  const { profiles, setProfiles, view } = useApp()
  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(() => {})
  }, [setProfiles, view])
  return profiles
}
