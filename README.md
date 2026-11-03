# Shutarang — Free Social Media Manager

A 100% free, unlimited social media management tool inspired by [Metricool](https://metricool.com) — but with **no plans, no trials, no credit card, ever**.

Plan, schedule, analyze, and grow your social media across **11 platforms** from a single dashboard. Powered by Gemini AI for content generation.

## Supported Platforms

Instagram · TikTok · YouTube · Threads · X (Twitter) · Twitch · Google Business Profile · Bluesky · Facebook · Pinterest · LinkedIn

## Features

| View | What it does |
|------|--------------|
| **Dashboard** | KPI cards, audience growth chart, per-platform breakdown, recent & upcoming posts |
| **Planner** | Calendar view + List view, drag-style month grid, cross-post composer |
| **Analytics** | Reach & engagement trends, audience distribution pie chart, per-platform table |
| **Inbox** | Unified messages, comments, DMs across all platforms — with AI reply suggestions |
| **SmartLinks** | Link-in-bio builder with live preview, 5 themes, unlimited links per page |
| **AI Studio** | Gemini-powered caption writer, hashtag finder, content ideas, rewriter, best-time tips |
| **Connections** | Connect unlimited accounts per platform — just paste your profile URL |
| **Reports** | Auto-generated performance reports with CSV export and print support |

## Cross-post Composer

Write once, publish everywhere. The composer lets you:

- Select multiple platforms visually (Instagram, TikTok, X, Facebook, etc.)
- See character-limit warnings (e.g., X's 280-char limit)
- Generate captions and hashtags with AI
- Schedule for later, save as draft, or publish now

## AI Integration (Gemini)

The `/api/ai/generate` endpoint powers all AI features using the `z-ai-web-dev-sdk`:

- Caption generation (with tone + platform hints)
- Hashtag suggestions
- Content ideas
- Caption rewriting
- Best-time-to-post tips
- Inbox reply drafting

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM + SQLite
- **Charts**: Recharts
- **State**: Zustand (client) + TanStack Query (server)
- **Icons**: Lucide React + custom inline SVGs for platform brand glyphs
- **AI**: z-ai-web-dev-sdk (Gemini-powered)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Gemini API key (via z-ai-web-dev-sdk — set up `.z-ai-config` per the SDK docs)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/shutarang.git
cd shutarang

# Install dependencies
bun install
# or
npm install

# Set up environment
cp .env.example .env

# Push database schema
bun run db:push
# or
npx prisma db push

# Seed demo data (optional — gives you sample accounts, posts, analytics)
curl http://localhost:3000/api/seed

# Start dev server
bun run dev
# or
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
shutarang/
├── prisma/
│   └── schema.prisma          # 5 data models (SocialAccount, ScheduledPost, AnalyticsSnapshot, SmartLink, InboxMessage)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Single-route shell with sidebar + view router
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Custom emerald + violet theme
│   │   └── api/
│   │       ├── seed/           # Demo data seeder
│   │       ├── social-accounts/  # CRUD for connected accounts
│   │       ├── posts/          # CRUD for scheduled posts
│   │       ├── analytics/      # Analytics snapshots
│   │       ├── inbox/          # Inbox messages
│   │       ├── smartlinks/     # Link-in-bio pages
│   │       └── ai/generate/   # Gemini-powered AI endpoint
│   ├── components/
│   │   ├── views/              # 8 main view components
│   │   ├── shell/              # Sidebar + Composer
│   │   ├── platform-icon.tsx   # Inline SVG brand icons
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       ├── platforms.ts        # 11 platform definitions
│       ├── store.ts            # Zustand store
│       ├── db.ts               # Prisma client
│       └── utils.ts
├── .env.example
├── .gitignore
└── package.json
```

## Why "Free Forever"?

Most social media management tools charge per brand, per post, per platform. Shutarang doesn't:

- ✅ Connect **unlimited** accounts per platform
- ✅ Schedule **unlimited** posts
- ✅ Use AI **unlimited** times
- ✅ Create **unlimited** SmartLinks
- ✅ Generate **unlimited** reports

No plans, no trials, no credit card, no watermark.

## License

MIT — use it, fork it, ship it.

## Acknowledgments

- Inspired by [Metricool](https://metricool.com) — built as a free alternative.
- Powered by [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) for Gemini AI.
- UI components from [shadcn/ui](https://ui.shadcn.com).
