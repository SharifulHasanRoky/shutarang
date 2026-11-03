import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateApiKey } from '@/app/api/api-keys/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * MCP-over-HTTP endpoint for Shutarang.
 *
 * Send a JSON-RPC 2.0 POST request:
 *
 *   POST /api/mcp
 *   Authorization: Bearer sk_shutar_xxx
 *   Content-Type: application/json
 *
 *   { "jsonrpc":"2.0", "id":1, "method":"tools/list" }
 *   { "jsonrpc":"2.0", "id":2, "method":"tools/call",
 *     "params": { "name":"list_accounts", "arguments": { "profileId":"..." } } }
 *
 * Supported methods:
 *   - initialize
 *   - tools/list
 *   - tools/call
 *
 * Supported tools:
 *   - list_profiles         → list all profiles the key has access to
 *   - list_accounts          → list accounts (args: profileId?, platform?)
 *   - get_analytics          → latest metrics summary (args: profileId?)
 *   - list_posts             → recent scheduled posts (args: profileId?, status?)
 *   - create_post            → create a draft/scheduled post (args: profileId, caption, platforms[], scheduledAt?, status?)
 *   - generate_caption       → AI caption (args: topic, tone?, platform?)
 *   - generate_hashtags      → AI hashtags (args: topic)
 *   - generate_reply         → AI reply for a message (args: message)
 */

type RpcRequest = {
  jsonrpc: '2.0'
  id?: number | string | null
  method: string
  params?: any
}

function rpcResult(id: any, result: any) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}
function rpcError(id: any, code: number, message: string, data?: any) {
  return NextResponse.json(
    { jsonrpc: '2.0', id, error: { code, message, data } },
    { status: code === -32600 || code === -32601 || code === -32602 ? 400 : 500 },
  )
}

const TOOLS = [
  {
    name: 'list_profiles',
    description: 'List all Shutarang profiles the API key has access to. Each profile is a workspace that holds multiple social accounts (e.g. 2 Instagram accounts, 3 YouTube channels).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_accounts',
    description: 'List connected social accounts. Each profile can hold multiple accounts per platform. Returns handle, follower count, label, and profile URL.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string', description: 'Profile ID. If omitted, uses the key\'s bound profile or the default profile.' },
        platform: { type: 'string', description: 'Optional filter: instagram, tiktok, youtube, threads, twitter, twitch, gbp, bluesky, facebook, pinterest, linkedin' },
      },
    },
  },
  {
    name: 'get_analytics',
    description: 'Get the latest analytics summary (followers, reach, engagement, etc.) for a profile. Also returns the last 30 days of per-platform snapshots.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string' },
        days: { type: 'number', default: 30 },
      },
    },
  },
  {
    name: 'list_posts',
    description: 'List recent scheduled/published posts for a profile.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'scheduled', 'published'] },
      },
    },
  },
  {
    name: 'create_post',
    description: 'Create a new post in Shutarang. The post will be cross-posted to all specified platforms when published. Requires "write" scope.',
    inputSchema: {
      type: 'object',
      required: ['caption', 'platforms'],
      properties: {
        profileId: { type: 'string', description: 'Profile ID. Required if the API key is not bound to a profile.' },
        caption: { type: 'string', description: 'Post caption (used across all selected platforms).' },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['instagram','tiktok','youtube','threads','twitter','twitch','gbp','bluesky','facebook','pinterest','linkedin'] },
          description: 'Platforms to publish to.',
        },
        scheduledAt: { type: 'string', description: 'ISO datetime for scheduled posts.' },
        status: { type: 'string', enum: ['draft', 'scheduled', 'published'], default: 'draft' },
      },
    },
  },
  {
    name: 'generate_caption',
    description: 'Generate an engaging social media caption using Gemini AI. Requires "ai" scope.',
    inputSchema: {
      type: 'object',
      required: ['topic'],
      properties: {
        topic: { type: 'string', description: 'Subject of the post.' },
        tone: { type: 'string', description: 'Tone, e.g. friendly, witty, professional.' },
        platform: { type: 'string' },
      },
    },
  },
  {
    name: 'generate_hashtags',
    description: 'Generate 15 relevant hashtags for a topic. Requires "ai" scope.',
    inputSchema: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
    },
  },
  {
    name: 'generate_reply',
    description: 'Generate a warm short reply to an inbox message. Requires "ai" scope.',
    inputSchema: {
      type: 'object',
      required: ['message'],
      properties: { message: { type: 'string' } },
    },
  },
]

async function callTool(name: string, args: any, auth: any) {
  // scope checks
  const needsWrite = ['create_post'].includes(name)
  const needsAi = ['generate_caption', 'generate_hashtags', 'generate_reply'].includes(name)
  if (needsWrite && !auth.scopes.includes('write')) {
    return { error: 'insufficient scope: requires write' }
  }
  if (needsAi && !auth.scopes.includes('ai')) {
    return { error: 'insufficient scope: requires ai' }
  }
  let profileId = args?.profileId
  if (auth.profileId) profileId = auth.profileId

  switch (name) {
    case 'list_profiles': {
      const profiles = await db.profile.findMany({
        where: auth.profileId ? { id: auth.profileId } : undefined,
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, description: true, color: true, isDefault: true },
      })
      const enriched = await Promise.all(
        profiles.map(async (p) => ({
          ...p,
          accounts: await db.socialAccount.count({ where: { profileId: p.id } }),
          posts: await db.scheduledPost.count({ where: { profileId: p.id } }),
        })),
      )
      return { profiles: enriched }
    }
    case 'list_accounts': {
      if (!profileId) return { error: 'profileId required (pass it or bind the key to a profile)' }
      const where: any = { profileId }
      if (args?.platform && args.platform !== 'all') where.platform = args.platform
      const accounts = await db.socialAccount.findMany({
        where,
        orderBy: { connectedAt: 'asc' },
        select: { id: true, platform: true, handle: true, displayName: true, url: true, followers: true, label: true, verified: true },
      })
      return { accounts }
    }
    case 'get_analytics': {
      if (!profileId) return { error: 'profileId required' }
      const days = Number(args?.days ?? 30)
      const snapshots = await db.analyticsSnapshot.findMany({
        where: { profileId },
        orderBy: { date: 'asc' },
        take: days * 12,
      })
      const latestDate = snapshots.at(-1)?.date
      const latest = snapshots.filter((s) => s.date === latestDate)
      const summary = {
        followers: latest.reduce((s, x) => s + x.followers, 0),
        reach: latest.reduce((s, x) => s + x.reach, 0),
        impressions: latest.reduce((s, x) => s + x.impressions, 0),
        likes: latest.reduce((s, x) => s + x.likes, 0),
        comments: latest.reduce((s, x) => s + x.comments, 0),
        shares: latest.reduce((s, x) => s + x.shares, 0),
        clicks: latest.reduce((s, x) => s + x.clicks, 0),
        engagementRate: latest.length
          ? Number((latest.reduce((s, x) => s + x.engagementRate, 0) / latest.length).toFixed(2))
          : 0,
      }
      return { summary, daysCovered: days, dataPoints: snapshots.length }
    }
    case 'list_posts': {
      if (!profileId) return { error: 'profileId required' }
      const where: any = { profileId }
      if (args?.status) where.status = args.status
      const posts = await db.scheduledPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return {
        posts: posts.map((p) => ({
          ...p,
          platforms: JSON.parse(p.platforms),
          hashtags: JSON.parse(p.hashtags),
        })),
      }
    }
    case 'create_post': {
      if (!profileId) return { error: 'profileId required' }
      if (!args?.caption || !args?.platforms?.length) return { error: 'caption and platforms required' }
      const post = await db.scheduledPost.create({
        data: {
          profileId,
          caption: args.caption,
          platforms: JSON.stringify(args.platforms),
          mediaUrls: '[]',
          hashtags: JSON.stringify(args.hashtags ?? []),
          status: args.status ?? (args.scheduledAt ? 'scheduled' : 'draft'),
          scheduledAt: args.scheduledAt ? new Date(args.scheduledAt) : null,
          publishedAt: args.status === 'published' ? new Date() : null,
        },
      })
      return { post: { ...post, platforms: JSON.parse(post.platforms) } }
    }
    case 'generate_caption':
    case 'generate_hashtags':
    case 'generate_reply': {
      const zai = await (await import('z-ai-web-dev-sdk')).default.create()
      let userPrompt = ''
      if (name === 'generate_caption') {
        userPrompt = `Write a single engaging social media caption about "${args.topic}" for ${args.platform || 'any platform'}. Tone: ${args.tone || 'friendly'}. Include a hook and one CTA. Return ONLY the caption.`
      } else if (name === 'generate_hashtags') {
        userPrompt = `Generate 15 relevant hashtags for content about "${args.topic}". Return ONLY hashtags separated by spaces, each starting with #.`
      } else {
        userPrompt = `Write a short, warm reply to this message. 1-2 sentences. Return ONLY the reply text:\n\n"${args.message}"`
      }
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert social media strategist. Return clean, ready-to-post text only. No markdown code blocks.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
      })
      const text = completion?.choices?.[0]?.message?.content ?? ''
      return { text: text.trim() }
    }
    default:
      return { error: `unknown tool: ${name}` }
    }
}

export async function POST(req: NextRequest) {
  let rpc: RpcRequest
  try {
    rpc = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error: invalid JSON')
  }

  // For initialize + tools/list we still require auth (MCP servers usually do auth
  // at transport level, not method level — we enforce it for everything).
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return rpcError(rpc.id, -32001, auth.error || 'unauthorized')

  switch (rpc.method) {
    case 'initialize':
      return rpcResult(rpc.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'shutarang',
          version: '1.0.0',
          description: 'Shutarang — free social media manager MCP server. Manage profiles, accounts, posts, analytics, and AI content generation.',
        },
      })
    case 'notifications/initialized':
      // No-op ack
      return rpcResult(rpc.id, {})
    case 'tools/list':
      return rpcResult(rpc.id, { tools: TOOLS })
    case 'tools/call': {
      const { name, arguments: args } = rpc.params ?? {}
      if (!name) return rpcError(rpc.id, -32602, 'Missing tool name')
      const tool = TOOLS.find((t) => t.name === name)
      if (!tool) return rpcError(rpc.id, -32601, `Unknown tool: ${name}`)
      try {
        const result = await callTool(name, args ?? {}, auth)
        if (result.error) {
          return rpcResult(rpc.id, { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true })
        }
        return rpcResult(rpc.id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        })
      } catch (e: any) {
        return rpcError(rpc.id, -32603, `Internal error: ${e?.message ?? e}`)
      }
    }
    case 'ping':
      return rpcResult(rpc.id, {})
    default:
      return rpcError(rpc.id, -32601, `Method not found: ${rpc.method}`)
  }
}

// GET returns MCP server info / docs in plain text (helpful for discovery)
export async function GET() {
  return NextResponse.json({
    name: 'shutarang-mcp',
    version: '1.0.0',
    description: 'Shutarang MCP server over HTTP. Send JSON-RPC 2.0 POST requests with Authorization: Bearer <api_key>.',
    protocolVersion: '2024-11-05',
    transport: 'http',
    endpoint: '/api/mcp',
    auth: 'Bearer sk_shutar_...',
    methods: ['initialize', 'tools/list', 'tools/call', 'ping'],
    tools: TOOLS.map((t) => t.name),
    docs: 'See /api-integrations view in the Shutarang dashboard for full setup instructions.',
  })
}
