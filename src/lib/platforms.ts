// Social media platform definitions — all platforms Metricool supports

export type PlatformId =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'threads'
  | 'twitter'
  | 'twitch'
  | 'gbp'
  | 'bluesky'
  | 'facebook'
  | 'pinterest'
  | 'linkedin'

export interface PlatformDef {
  id: PlatformId
  name: string
  color: string
  gradient: string
  icon: string // svg path or letter
  charLimit: number
  supportsImage: boolean
  supportsVideo: boolean
  urlBase: string
}

export const PLATFORMS: PlatformDef[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    gradient: 'from-fuchsia-500 via-pink-500 to-amber-400',
    icon: 'IG',
    charLimit: 2200,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://instagram.com/',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    gradient: 'from-slate-900 via-slate-800 to-rose-500',
    icon: 'TT',
    charLimit: 2200,
    supportsImage: false,
    supportsVideo: true,
    urlBase: 'https://tiktok.com/@',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    gradient: 'from-red-600 to-rose-500',
    icon: 'YT',
    charLimit: 5000,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://youtube.com/@',
  },
  {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    gradient: 'from-slate-900 to-slate-700',
    icon: 'TH',
    charLimit: 500,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://threads.net/@',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    gradient: 'from-slate-900 to-black',
    icon: 'X',
    charLimit: 280,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://x.com/',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146FF',
    gradient: 'from-purple-600 to-violet-500',
    icon: 'TW',
    charLimit: 500,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://twitch.tv/',
  },
  {
    id: 'gbp',
    name: 'Google Business',
    color: '#4285F4',
    gradient: 'from-blue-500 to-emerald-500',
    icon: 'GB',
    charLimit: 1500,
    supportsImage: true,
    supportsVideo: false,
    urlBase: 'https://google.com/maps/',
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    color: '#1185FE',
    gradient: 'from-sky-500 to-blue-500',
    icon: 'BS',
    charLimit: 300,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://bsky.app/profile/',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-600 to-indigo-600',
    icon: 'FB',
    charLimit: 63206,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://facebook.com/',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    color: '#BD081C',
    gradient: 'from-rose-600 to-red-700',
    icon: 'PT',
    charLimit: 500,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://pinterest.com/',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'from-sky-700 to-blue-700',
    icon: 'LN',
    charLimit: 3000,
    supportsImage: true,
    supportsVideo: true,
    urlBase: 'https://linkedin.com/in/',
  },
]

export const PLATFORM_MAP: Record<string, PlatformDef> = PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {},
)

export function getPlatform(id: string): PlatformDef | undefined {
  return PLATFORM_MAP[id]
}
