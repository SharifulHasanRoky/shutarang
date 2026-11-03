#!/usr/bin/env node
/**
 * Shutarang MCP Server (stdio transport)
 * ========================================
 *
 * Standalone Model Context Protocol server for Claude Desktop, Cursor,
 * Windsurf, or any MCP client that supports stdio transport.
 *
 * INSTALL
 * -------
 *   1. Build:
 *        cd mini-services/mcp-server
 *        bun install
 *        chmod +x index.js
 *
 *   2. Add to your MCP client config (Claude Desktop):
 *
 *      macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 *      Windows: %APPDATA%\\Claude\\claude_desktop_config.json
 *
 *      {
 *        "mcpServers": {
 *          "shutarang": {
 *            "command": "node",
 *            "args": ["/absolute/path/to/mini-services/mcp-server/index.js"],
 *            "env": {
 *              "SHUTARANG_API_KEY": "sk_shutar_xxxxxxxxxx",
 *              "SHUTARANG_BASE_URL": "http://localhost:3000"
 *            }
 *          }
 *        }
 *      }
 *
 *   3. Restart Claude Desktop. Tools will appear prefixed with "shutarang__".
 *
 * The stdio server proxies all calls to the Shutarang HTTP MCP endpoint
 * (/api/mcp). This keeps business logic in one place and works whether
 * Shutarang runs locally or in production.
 */

const SHUTARANG_BASE_URL = process.env.SHUTARANG_BASE_URL || 'http://localhost:3000'
const SHUTARANG_API_KEY = process.env.SHUTARANG_API_KEY

if (!SHUTARANG_API_KEY) {
  process.stderr.write('[shutarang-mcp] SHUTARANG_API_KEY env var is required.\n')
  process.stderr.write('Get one from the Shutarang dashboard → API & Integrations.\n')
  process.exit(1)
}

const TOOLS = [
  {
    name: 'list_profiles',
    description: 'List all Shutarang profiles the API key has access to. Each profile is a workspace that holds multiple social accounts (e.g. 2 Instagram accounts, 3 YouTube channels).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_accounts',
    description: 'List connected social accounts. Each profile can hold multiple accounts per platform.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string' },
        platform: { type: 'string', enum: ['instagram','tiktok','youtube','threads','twitter','twitch','gbp','bluesky','facebook','pinterest','linkedin'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_analytics',
    description: 'Get latest analytics summary (followers, reach, engagement, etc.) for a profile.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string' },
        days: { type: 'number', default: 30 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_posts',
    description: 'List recent scheduled/published posts for a profile.',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: { type: 'string' },
        status: { type: 'string', enum: ['draft','scheduled','published'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'create_post',
    description: 'Create a new post in Shutarang. Cross-posts to all specified platforms when published.',
    inputSchema: {
      type: 'object',
      required: ['caption','platforms'],
      properties: {
        profileId: { type: 'string' },
        caption: { type: 'string' },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['instagram','tiktok','youtube','threads','twitter','twitch','gbp','bluesky','facebook','pinterest','linkedin'] },
        },
        scheduledAt: { type: 'string' },
        status: { type: 'string', enum: ['draft','scheduled','published'], default: 'draft' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'generate_caption',
    description: 'Generate an engaging social media caption using Gemini AI.',
    inputSchema: {
      type: 'object',
      required: ['topic'],
      properties: {
        topic: { type: 'string' },
        tone: { type: 'string' },
        platform: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'generate_hashtags',
    description: 'Generate 15 relevant hashtags for a topic.',
    inputSchema: {
      type: 'object',
      required: ['topic'],
      properties: { topic: { type: 'string' } },
      additionalProperties: false,
    },
  },
  {
    name: 'generate_reply',
    description: 'Generate a warm short reply to an inbox message.',
    inputSchema: {
      type: 'object',
      required: ['message'],
      properties: { message: { type: 'string' } },
      additionalProperties: false,
    },
  },
]

async function callShutarang(method, params) {
  const body = { jsonrpc: '2.0', id: 1, method, params: params ?? {} }
  const res = await fetch(`${SHUTARANG_BASE_URL}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SHUTARANG_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json.error) throw new Error(`[shutarang] ${json.error.message}`)
  return json.result
}

async function readStdin() {
  return new Promise((resolve) => {
    let buf = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { buf += chunk })
    process.stdin.on('end', () => resolve(buf))
  })
}

async function handleMessage(line) {
  let msg
  try { msg = JSON.parse(line) } catch { return null }
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0', id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'shutarang', version: '1.0.0' },
      },
    }
  }
  if (msg.method === 'notifications/initialized') {
    return null // no response to notifications
  }
  if (msg.method === 'tools/list') {
    return { jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } }
  }
  if (msg.method === 'tools/call') {
    try {
      const result = await callShutarang('tools/call', msg.params)
      return { jsonrpc: '2.0', id: msg.id, result }
    } catch (e) {
      return {
        jsonrpc: '2.0', id: msg.id,
        error: { code: -32603, message: String(e.message || e) },
      }
    }
  }
  if (msg.method === 'ping') {
    return { jsonrpc: '2.0', id: msg.id, result: {} }
  }
  return {
    jsonrpc: '2.0', id: msg.id,
    error: { code: -32601, message: `Method not found: ${msg.method}` },
  }
}

async function main() {
  process.stderr.write(`[shutarang-mcp] stdio server starting\n`)
  process.stderr.write(`[shutarang-mcp] Base URL: ${SHUTARANG_BASE_URL}\n`)
  process.stderr.write(`[shutarang-mcp] API key: ${SHUTARANG_API_KEY.slice(0, 14)}...\n`)
  process.stderr.write(`[shutarang-mcp] Tools: ${TOOLS.map(t => t.name).join(', ')}\n`)

  process.stdin.setEncoding('utf8')
  let buf = ''
  process.stdin.on('data', async (chunk) => {
    buf += chunk
    let idx
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 1)
      if (!line) continue
      const resp = await handleMessage(line)
      if (resp) process.stdout.write(JSON.stringify(resp) + '\n')
    }
  })
  process.stdin.on('end', () => process.exit(0))
}

main().catch((e) => {
  process.stderr.write(`[shutarang-mcp] fatal: ${e?.stack || e}\n`)
  process.exit(1)
})
