import { create } from 'zustand'

export type ViewId =
  | 'dashboard'
  | 'planner'
  | 'analytics'
  | 'inbox'
  | 'smartlinks'
  | 'ai-studio'
  | 'connections'
  | 'reports'
  | 'profiles'
  | 'api-integrations'

export interface Profile {
  id: string
  name: string
  description: string | null
  color: string
  avatarUrl: string | null
  isDefault: boolean
}

interface AppState {
  view: ViewId
  setView: (v: ViewId) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  composerOpen: boolean
  composerPrefill: string
  openComposer: (prefill?: string) => void
  closeComposer: () => void
  // Active profile (workspace). All data fetches are scoped to this.
  activeProfileId: string | null
  profiles: Profile[]
  setProfiles: (p: Profile[]) => void
  setActiveProfile: (id: string) => void
}

export const useApp = create<AppState>((set) => ({
  view: 'dashboard',
  setView: (v) => set({ view: v }),
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  composerOpen: false,
  composerPrefill: '',
  openComposer: (prefill = '') => set({ composerOpen: true, composerPrefill: prefill }),
  closeComposer: () => set({ composerOpen: false, composerPrefill: '' }),
  activeProfileId: null,
  profiles: [],
  setProfiles: (p) => {
    // Pick a default: previously-active, then isDefault, then first.
    set((s) => {
      if (s.activeProfileId && p.find((x) => x.id === s.activeProfileId)) return { profiles: p }
      const def = p.find((x) => x.isDefault) ?? p[0] ?? null
      return { profiles: p, activeProfileId: def?.id ?? null }
    })
  },
  setActiveProfile: (id) => set({ activeProfileId: id }),
}))

export const PROFILE_COLORS: Record<string, { name: string; from: string; to: string; ring: string }> = {
  emerald: { name: 'Emerald', from: 'from-emerald-500', to: 'to-teal-500', ring: 'ring-emerald-500' },
  violet: { name: 'Violet', from: 'from-violet-500', to: 'to-purple-500', ring: 'ring-violet-500' },
  sunset: { name: 'Sunset', from: 'from-orange-500', to: 'to-rose-500', ring: 'ring-orange-500' },
  ocean: { name: 'Ocean', from: 'from-cyan-500', to: 'to-blue-500', ring: 'ring-cyan-500' },
  rose: { name: 'Rose', from: 'from-rose-500', to: 'to-pink-500', ring: 'ring-rose-500' },
  mono: { name: 'Mono', from: 'from-slate-700', to: 'to-slate-900', ring: 'ring-slate-700' },
}

export function profileColor(c: string) {
  return PROFILE_COLORS[c] ?? PROFILE_COLORS.emerald
}
