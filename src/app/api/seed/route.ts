import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/seed — seeds demo data so the dashboard looks alive
export async function GET() {
  try {
    const count = await db.socialAccount.count()
    if (count > 0) {
      return NextResponse.json({ ok: true, message: 'already seeded', count })
    }

    const accounts = [
      { platform: 'instagram', handle: 'yourbrand', displayName: 'Your Brand', followers: 28450, following: 432, posts: 482, verified: true },
      { platform: 'tiktok', handle: 'yourbrand', displayName: 'Your Brand', followers: 52100, following: 89, posts: 156, verified: true },
      { platform: 'youtube', handle: 'yourbrand', displayName: 'Your Brand', followers: 18700, following: 12, posts: 234, verified: false },
      { platform: 'twitter', handle: 'yourbrand', displayName: 'Your Brand', followers: 9320, following: 1240, posts: 3891, verified: false },
      { platform: 'facebook', handle: 'yourbrand', displayName: 'Your Brand', followers: 15600, following: 0, posts: 421, verified: true },
      { platform: 'linkedin', handle: 'your-brand', displayName: 'Your Brand', followers: 7800, following: 0, posts: 89, verified: false },
      { platform: 'pinterest', handle: 'yourbrand', displayName: 'Your Brand', followers: 4250, following: 320, posts: 612, verified: false },
      { platform: 'threads', handle: 'yourbrand', displayName: 'Your Brand', followers: 3120, following: 87, posts: 56, verified: false },
    ]

    for (const a of accounts) {
      await db.socialAccount.create({
        data: {
          ...a,
          url: a.platform === 'tiktok'
            ? `https://tiktok.com/@${a.handle}`
            : a.platform === 'youtube'
              ? `https://youtube.com/@${a.handle}`
              : a.platform === 'linkedin'
                ? `https://linkedin.com/in/${a.handle}`
                : a.platform === 'threads'
                  ? `https://threads.net/@${a.handle}`
                  : `https://${a.platform}.com/${a.handle}`,
          avatarUrl: null,
        },
      })
    }

    const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin', 'pinterest', 'threads']
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      for (const p of platforms) {
        const base = accounts.find((a) => a.platform === p)?.followers ?? 5000
        const followers = Math.max(100, base - Math.floor(i * (base * 0.002)) + Math.floor(Math.random() * 200))
        const reach = Math.floor(followers * (0.4 + Math.random() * 0.6))
        const impressions = Math.floor(reach * (1.2 + Math.random() * 0.8))
        const likes = Math.floor(impressions * (0.02 + Math.random() * 0.05))
        const comments = Math.floor(likes * (0.05 + Math.random() * 0.15))
        const shares = Math.floor(likes * (0.03 + Math.random() * 0.1))
        const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.04))
        const engagementRate = ((likes + comments + shares) / Math.max(1, impressions)) * 100
        await db.analyticsSnapshot.create({
          data: {
            platform: p,
            date: dateStr,
            followers,
            followersGrowth: Math.floor(Math.random() * 200 - 50),
            reach,
            impressions,
            engagementRate: Number(engagementRate.toFixed(2)),
            likes,
            comments,
            shares,
            clicks,
          },
        })
      }
    }

    const samplePosts = [
      { caption: 'Big announcement coming tomorrow! Get ready for something exciting. #launchweek', platforms: ['instagram', 'facebook', 'twitter', 'threads'], status: 'published', createdAt: new Date(Date.now() - 86400000 * 3) },
      { caption: 'Behind the scenes of our latest product photoshoot. Drop a question for the team!', platforms: ['instagram', 'tiktok', 'youtube'], status: 'published', createdAt: new Date(Date.now() - 86400000 * 2) },
      { caption: 'How we grew our community by 312% in 6 months — full breakdown in the comments.', platforms: ['linkedin', 'twitter'], status: 'published', createdAt: new Date(Date.now() - 86400000) },
      { caption: 'New blog post is live: The 2026 Social Media Playbook. Link in bio.', platforms: ['facebook', 'linkedin', 'twitter'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000 * 6) },
      { caption: 'Friday vibes — share your weekend plans with us!', platforms: ['instagram', 'threads', 'twitter'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000 * 24) },
      { caption: 'Pinterest inspiration board update — autumn collection dropping soon.', platforms: ['pinterest'], status: 'draft' },
    ]
    for (const p of samplePosts) {
      await db.scheduledPost.create({
        data: {
          caption: p.caption,
          platforms: JSON.stringify(p.platforms),
          mediaUrls: '[]',
          hashtags: JSON.stringify(['#launchweek', '#yourbrand']),
          status: p.status,
          scheduledAt: p.scheduledAt ?? null,
          publishedAt: p.status === 'published' ? p.createdAt : null,
          createdAt: p.createdAt,
        },
      })
    }

    const messages = [
      { platform: 'instagram', senderName: 'Maya Chen', senderHandle: '@mayacreates', message: 'Love this content! Could you share which camera you use?', type: 'comment', postCaption: 'Behind the scenes of our latest product photoshoot' },
      { platform: 'twitter', senderName: 'Dev Patel', senderHandle: '@devbuilds', message: 'Just signed up after seeing your post — this is amazing work', type: 'mention', postCaption: 'How we grew our community by 312% in 6 months' },
      { platform: 'facebook', senderName: 'Sofia Ramos', senderHandle: 'Sofia Ramos', message: 'Do you ship internationally?', type: 'dm' },
      { platform: 'linkedin', senderName: 'Arjun Kapoor', senderHandle: 'arjun-kapoor', message: 'Would love to discuss a partnership. Sent you a connection request.', type: 'dm' },
      { platform: 'tiktok', senderName: 'Luna Park', senderHandle: '@lunapark', message: 'This is fireeee', type: 'comment', postCaption: 'Behind the scenes of our latest product photoshoot' },
      { platform: 'youtube', senderName: 'Ken Tanaka', senderHandle: '@kentanaka', message: 'Tutorial on this workflow would be amazing please', type: 'comment', postCaption: 'Behind the scenes of our latest product photoshoot' },
      { platform: 'instagram', senderName: 'Aisha Bello', senderHandle: '@aishabello', message: 'Where can I buy the featured product?', type: 'dm' },
      { platform: 'threads', senderName: 'Marcus Lee', senderHandle: '@marcuslee', message: 'Following the journey — keep posting!', type: 'comment' },
    ]
    for (const m of messages) {
      await db.inboxMessage.create({
        data: {
          platform: m.platform,
          senderName: m.senderName,
          senderHandle: m.senderHandle,
          senderAvatar: null,
          message: m.message,
          type: m.type,
          postCaption: m.postCaption ?? null,
        },
      })
    }

    await db.smartLink.create({
      data: {
        title: 'Your Brand',
        slug: 'yourbrand',
        bio: 'Building the future of social media — one post at a time',
        theme: 'violet',
        links: JSON.stringify([
          { label: 'Latest Blog Post', url: 'https://yourbrand.com/blog', icon: 'globe' },
          { label: 'Shop Our Products', url: 'https://yourbrand.com/shop', icon: 'shopping' },
          { label: 'Newsletter', url: 'https://yourbrand.com/newsletter', icon: 'mail' },
          { label: 'Contact Us', url: 'mailto:hello@yourbrand.com', icon: 'mail' },
        ]),
        visits: 4280,
        clicks: 1820,
      },
    })

    return NextResponse.json({ ok: true, message: 'seeded', accounts: accounts.length })
  } catch (e: any) {
    console.error('seed error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
