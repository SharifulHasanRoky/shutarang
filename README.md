# Shutarang — Free Social Media Manager

A 100% free, unlimited social media management tool inspired by [Metricool](https://metricool.com) — but with **no plans, no trials, no credit card, ever**.

Plan, schedule, analyze, and grow your social media across **11 platforms** from a single dashboard. Powered by Gemini AI for content generation. Includes a public REST API and an MCP server so external AI tools (Claude Desktop, Cursor, Windsurf) can drive it.

## Highlights

- ✅ **Multiple profiles** (workspaces) — each holding **unlimited accounts per platform**
- ✅ **11 platforms supported** — Instagram, TikTok, YouTube, Threads, X, Twitch, Google Business, Bluesky, Facebook, Pinterest, LinkedIn
- ✅ **REST API v1** with API key auth — integrate any external app or script
- ✅ **MCP server** (HTTP + stdio) — connect Claude Desktop, Cursor, Windsurf directly
- ✅ **Gemini AI** — captions, hashtags, ideas, replies — free & unlimited
- ✅ **Cross-post composer** — write once, publish to many platforms
- ✅ **Analytics, Inbox, SmartLinks, Reports** — all built-in

## Why "Free Forever"?

Most social media management tools charge per brand, per post, per platform. Shutarang doesn't:

- ✅ Connect **unlimited** accounts per platform
- ✅ Create **unlimited** profiles
- ✅ Schedule **unlimited** posts
- ✅ Use AI **unlimited** times
- ✅ Generate **unlimited** API keys
- ✅ All MCP tools, free forever

No plans, no trials, no credit card, no watermark.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Gemini API key (via `z-ai-web-dev-sdk` — see their docs)

### Installation

```bash
git clone https://github.com/SharifulHasanRoky/shutarang.git
cd shutarang
bun install   # or: npm install

cp .env.example .env
bun run db:push        # creates SQLite database
# Optional: seed demo data with 3 profiles + 22 accounts across 11 platforms
curl http://localhost:3000/api/seed

bun run dev             # starts dev server at http://localhost:3000
```

Visit `http://localhost:3000`. The sidebar lets you switch between profiles, and under each profile you can connect multiple accounts per platform.

## Project Structure

```
shutarang/
├── prisma/
│   └── schema.prisma                  # 6 models: Profile, SocialAccount, ScheduledPost,
│                                      #             AnalyticsSnapshot, SmartLink, InboxMessage, ApiKey
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Single-route shell with sidebar + view router
│   │   ├── api/
│   │   │   ├── profiles/              # Profile CRUD
│   │   │   ├── social-accounts/        # Account CRUD (filtered by profileId)
│   │   │   ├── posts/                  # Post CRUD
│   │   │   ├── analytics/              # Analytics snapshots
│   │   │   ├── inbox/                  # Inbox messages
│   │   │   ├── smartlinks/             # SmartLink CRUD
│   │   │   ├── api-keys/               # API key management + auth helper
│   │   │   ├── ai/generate/            # Internal Gemini endpoint
│   │   │   ├── v1/                     # 🔓 Public REST API v1 (Bearer auth)
│   │   │   │   ├── profiles/
│   │   │   │   ├── accounts/
│   │   │   │   ├── posts/
│   │   │   │   ├── analytics/
│   │   │   │   └── ai/
│   │   │   └── mcp/                    # 🔌 HTTP MCP endpoint (JSON-RPC 2.0)
│   │   └── ...
│   ├── components/
│   │   ├── views/                     # 10 main views (Dashboard, Planner, Analytics, Inbox,
│   │   │                             #   SmartLinks, AI Studio, Connections, Reports,
│   │   │                             #   Profiles, API & Integrations)
│   │   └── shell/                     # Sidebar (with profile switcher) + Composer
│   └── lib/
│       ├── platforms.ts               # 11 platform definitions
│       ├── store.ts                   # Zustand store (incl. active profile)
│       ├── api.ts                     # Client fetch helpers (auto-inject profileId)
│       └── db.ts                      # Prisma client
├── mini-services/
│   └── mcp-server/                    # Standalone stdio MCP server (Claude Desktop)
│       ├── index.js
│       └── package.json
└── .env.example
```

## 🔓 Public REST API (v1)

Generate an API key from the dashboard → **API & MCP** view. Then:

```bash
# List profiles
curl http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer sk_shutar_xxx"

# List accounts (filterable by platform)
curl "http://localhost:3000/api/v1/accounts?profileId=<id>&platform=instagram" \
  -H "Authorization: Bearer sk_shutar_xxx"

# Create a post (cross-posts to multiple platforms)
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer sk_shutar_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "<id>",
    "caption": "Hello from the API!",
    "platforms": ["instagram", "tiktok", "twitter"],
    "status": "published"
  }'

# AI caption generation (Gemini-powered)
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Authorization: Bearer sk_shutar_xxx" \
  -H "Content-Type: application/json" \
  -d '{"task":"caption","topic":"launching a new product","tone":"exciting"}'

# Get analytics summary
curl "http://localhost:3000/api/v1/analytics?profileId=<id>&days=30" \
  -H "Authorization: Bearer sk_shutar_xxx"
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/v1/profiles` | List profiles the key can access |
| GET  | `/api/v1/accounts?profileId=&platform=` | List connected accounts |
| GET  | `/api/v1/posts?profileId=&status=` | List posts |
| POST | `/api/v1/posts` | Create a draft/scheduled/published post |
| GET  | `/api/v1/analytics?profileId=&days=30` | Analytics summary + snapshots |
| POST | `/api/v1/ai/generate` | Generate captions, hashtags, ideas, replies |

All endpoints require `Authorization: Bearer sk_shutar_...`. Keys can be scoped to a single profile or have access to all profiles.

## 🔌 MCP Server

The Model Context Protocol lets AI tools (Claude Desktop, Cursor, Windsurf) call Shutarang's tools directly. Shutarang ships with **8 MCP tools**.

### Option A: HTTP MCP (for remote AI tools)

Endpoint: `POST /api/mcp`
Auth: `Authorization: Bearer sk_shutar_xxx`
Protocol: JSON-RPC 2.0 over HTTP

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer sk_shutar_xxx" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Option B: Stdio MCP Server (for Claude Desktop, Cursor, Windsurf)

A standalone Node script lives at `mini-services/mcp-server/index.js`. It proxies to the HTTP MCP endpoint.

**Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "shutarang": {
      "command": "node",
      "args": ["/absolute/path/to/shutarang/mini-services/mcp-server/index.js"],
      "env": {
        "SHUTARANG_API_KEY": "sk_shutar_xxx",
        "SHUTARANG_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Restart Claude Desktop and the Shutarang tools will be available.

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_profiles` | List all profiles the key can access |
| `list_accounts` | List connected accounts (filterable by platform) |
| `get_analytics` | Latest metrics summary + 30-day trend |
| `list_posts` | Recent posts (filterable by status) |
| `create_post` | Create a draft/scheduled/published cross-post |
| `generate_caption` | AI caption (Gemini) |
| `generate_hashtags` | AI hashtag suggestions |
| `generate_reply` | AI reply for an inbox message |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM + SQLite
- **Charts**: Recharts
- **State**: Zustand (client) + TanStack Query (server)
- **Icons**: Lucide React + custom inline SVGs for platform brand glyphs
- **AI**: z-ai-web-dev-sdk (Gemini-powered)
- **MCP**: Custom JSON-RPC 2.0 implementation (HTTP + stdio)

## License

MIT — use it, fork it, ship it.

## Acknowledgments

- Inspired by [Metricool](https://metricool.com) — built as a free alternative.
- Powered by [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) for Gemini AI.
- UI components from [shadcn/ui](https://ui.shadcn.com).
- MCP protocol: [modelcontextprotocol.io](https://modelcontextprotocol.io)
