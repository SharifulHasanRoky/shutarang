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

interface AppState {
  view: ViewId
  setView: (v: ViewId) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  composerOpen: boolean
  composerPrefill: string
  openComposer: (prefill?: string) => void
  closeComposer: () => void
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
}))
