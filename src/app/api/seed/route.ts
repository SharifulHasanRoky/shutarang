import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/seed — seeds demo data with multiple profiles, each holding
// multiple accounts per platform (e.g. 2 Instagram accounts under one profile).
export async function GET() {
  try {
    const count = await db.profile.count()
    if (count > 0) {
      return NextResponse.json({ ok: true, message: 'already seeded', count })
    }

    // ---- 3 profiles: main brand, agency client, personal ----
    const profiles = await Promise.all([
      db.profile.create({ data: {
        name: 'Your Brand',
        description: 'Main company profile — all brand social channels',
        color: 'emerald',
        isDefault: true,
      }}),
      db.profile.create({ data: {
        name: 'Client: Bloom Cosmetics',
        description: 'Agency client — managing their social presence',
        color: 'rose',
      }}),
      db.profile.create({ data: {
        name: 'Personal',
        description: 'My personal creator accounts',
        color: 'violet',
      }}),
    ])

    const [brandProfile, clientProfile, personalProfile] = profiles

    // ---- Multiple accounts PER platform under the brand profile ----
    // Demonstrates: 2 Instagram accounts, 2 YouTube channels, etc.
    const accountsToCreate = [
      // === Brand profile ===
      { profileId: brandProfile.id, platform: 'instagram', handle: 'yourbrand', displayName: 'Your Brand', followers: 28450, following: 432, posts: 482, verified: true, label: 'Main' },
      { profileId: brandProfile.id, platform: 'instagram', handle: 'yourbrand.es', displayName: 'Your Brand ES', followers: 8120, following: 89, posts: 156, verified: false, label: 'Spanish market' },
      { profileId: brandProfile.id, platform: 'tiktok', handle: 'yourbrand', displayName: 'Your Brand', followers: 52100, following: 89, posts: 156, verified: true, label: 'Main' },
      { profileId: brandProfile.id, platform: 'youtube', handle: 'yourbrand', displayName: 'Your Brand', followers: 18700, following: 12, posts: 234, verified: false, label: 'Main channel' },
      { profileId: brandProfile.id, platform: 'youtube', handle: 'yourbrand shorts', displayName: 'Your Brand Shorts', followers: 9430, following: 0, posts: 412, verified: false, label: 'Shorts channel' },
      { profileId: brandProfile.id, platform: 'twitter', handle: 'yourbrand', displayName: 'Your Brand', followers: 9320, following: 1240, posts: 3891, verified: false, label: 'Main' },
      { profileId: brandProfile.id, platform: 'facebook', handle: 'yourbrand', displayName: 'Your Brand', followers: 15600, following: 0, posts: 421, verified: true, label: 'Main page' },
      { profileId: brandProfile.id, platform: 'linkedin', handle: 'your-brand', displayName: 'Your Brand', followers: 7800, following: 0, posts: 89, verified: false, label: 'Company page' },
      { profileId: brandProfile.id, platform: 'pinterest', handle: 'yourbrand', displayName: 'Your Brand', followers: 4250, following: 320, posts: 612, verified: false, label: 'Main' },
      { profileId: brandProfile.id, platform: 'threads', handle: 'yourbrand', displayName: 'Your Brand', followers: 3120, following: 87, posts: 56, verified: false, label: 'Main' },

      // === Client profile (Bloom Cosmetics) ===
      { profileId: clientProfile.id, platform: 'instagram', handle: 'bloomcosmetics', displayName: 'Bloom Cosmetics', followers: 64200, following: 234, posts: 892, verified: true, label: 'Main' },
      { profileId: clientProfile.id, platform: 'instagram', handle: 'bloomcosmetics.eu', displayName: 'Bloom EU', followers: 18900, following: 102, posts: 234, verified: false, label: 'EU market' },
      { profileId: clientProfile.id, platform: 'instagram', handle: 'bloom.skincare', displayName: 'Bloom Skincare', followers: 12300, following: 56, posts: 178, verified: false, label: 'Skincare sub-brand' },
      { profileId: clientProfile.id, platform: 'tiktok', handle: 'bloomcosmetics', displayName: 'Bloom Cosmetics', followers: 134000, following: 23, posts: 412, verified: true, label: 'Main' },
      { profileId: clientProfile.id, platform: 'youtube', handle: 'bloomcosmetics', displayName: 'Bloom Cosmetics', followers: 22400, following: 8, posts: 156, verified: false, label: 'Tutorials' },
      { profileId: clientProfile.id, platform: 'facebook', handle: 'bloomcosmetics', displayName: 'Bloom Cosmetics', followers: 41200, following: 0, posts: 612, verified: true, label: 'Main page' },
      { profileId: clientProfile.id, platform: 'pinterest', handle: 'bloomcosmetics', displayName: 'Bloom Cosmetics', followers: 18900, following: 410, posts: 2340, verified: false, label: 'Inspiration' },

      // === Personal profile ===
      { profileId: personalProfile.id, platform: 'instagram', handle: 'jane.creator', displayName: 'Jane Creator', followers: 12400, following: 892, posts: 312, verified: false, label: 'Personal' },
      { profileId: personalProfile.id, platform: 'youtube', handle: 'jane.creator', displayName: 'Jane Creator', followers: 8900, following: 23, posts: 178, verified: false, label: 'Vlogs' },
      { profileId: personalProfile.id, platform: 'twitter', handle: 'janecreator', displayName: 'Jane', followers: 3200, following: 412, posts: 2340, verified: false, label: 'Personal' },
      { profileId: personalProfile.id, platform: 'tiktok', handle: 'jane.creator', displayName: 'Jane Creator', followers: 21800, following: 12, posts: 89, verified: false, label: 'Personal' },
      { profileId: personalProfile.id, platform: 'linkedin', handle: 'jane-creator', displayName: 'Jane Creator', followers: 2100, following: 412, posts: 34, verified: false, label: 'Professional' },
    ]

    for (const a of accountsToCreate) {
      await db.socialAccount.create({
        data: {
          ...a,
          url: a.platform === 'tiktok'
            ? `https://tiktok.com/@${a.handle.replace(/\s+/g, '')}`
            : a.platform === 'youtube'
              ? `https://youtube.com/@${a.handle.replace(/\s+/g, '')}`
              : a.platform === 'linkedin'
                ? `https://linkedin.com/in/${a.handle.replace(/\s+/g, '')}`
                : a.platform === 'threads'
                  ? `https://threads.net/@${a.handle.replace(/\s+/g, '')}`
                  : `https://${a.platform}.com/${a.handle.replace(/\s+/g, '')}`,
          avatarUrl: null,
        },
      })
    }

    // ---- Analytics for brand profile (last 30 days) ----
    const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin', 'pinterest', 'threads']
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      for (const p of platforms) {
        const acct = accountsToCreate.find((x) => x.platform === p && x.profileId === brandProfile.id)
        if (!acct) continue
        const base = acct.followers
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
            profileId: brandProfile.id,
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

    // ---- Sample scheduled posts (brand profile) ----
    const brandPosts = [
      { caption: 'Big announcement coming tomorrow! Get ready for something exciting. #launchweek', platforms: ['instagram', 'facebook', 'twitter', 'threads'], status: 'published', createdAt: new Date(Date.now() - 86400000 * 3) },
      { caption: 'Behind the scenes of our latest product photoshoot. Drop a question for the team!', platforms: ['instagram', 'tiktok', 'youtube'], status: 'published', createdAt: new Date(Date.now() - 86400000 * 2) },
      { caption: 'How we grew our community by 312% in 6 months — full breakdown in the comments.', platforms: ['linkedin', 'twitter'], status: 'published', createdAt: new Date(Date.now() - 86400000) },
      { caption: 'New blog post is live: The 2026 Social Media Playbook. Link in bio.', platforms: ['facebook', 'linkedin', 'twitter'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000 * 6) },
      { caption: 'Friday vibes — share your weekend plans with us!', platforms: ['instagram', 'threads', 'twitter'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000 * 24) },
      { caption: 'Pinterest inspiration board update — autumn collection dropping soon.', platforms: ['pinterest'], status: 'draft' },
    ]
    for (const p of brandPosts) {
      await db.scheduledPost.create({
        data: {
          profileId: brandProfile.id,
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

    // ---- Sample posts for client profile ----
    const clientPosts = [
      { caption: 'New Glow Serum just dropped! Formulated with niacinamide + hyaluronic acid. DM "GLOW" for early access. #bloomcosmetics #skincare', platforms: ['instagram', 'tiktok', 'facebook'], status: 'published', createdAt: new Date(Date.now() - 86400000 * 2) },
      { caption: '5-minute everyday makeup routine using only Bloom products. Save this reel for later!', platforms: ['instagram', 'tiktok', 'youtube'], status: 'published', createdAt: new Date(Date.now() - 86400000) },
      { caption: 'Customer review: "I have been using the Bloom serum for 3 weeks and my skin has never looked better!"', platforms: ['facebook', 'pinterest'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000 * 12) },
    ]
    for (const p of clientPosts) {
      await db.scheduledPost.create({
        data: {
          profileId: clientProfile.id,
          caption: p.caption,
          platforms: JSON.stringify(p.platforms),
          mediaUrls: '[]',
          hashtags: JSON.stringify(['#bloomcosmetics', '#skincare']),
          status: p.status,
          scheduledAt: p.scheduledAt ?? null,
          publishedAt: p.status === 'published' ? p.createdAt : null,
          createdAt: p.createdAt,
        },
      })
    }

    // ---- Inbox messages (brand profile) ----
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
          profileId: brandProfile.id,
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

    // ---- SmartLinks ----
    await db.smartLink.create({
      data: {
        profileId: brandProfile.id,
        title: 'Your Brand',
        slug: 'yourbrand',
        bio: 'Building the future of social media — one post at a time',
        theme: 'violet',
        links: JSON.stringify([
          { label: 'Latest Blog Post', url: 'https://yourbrand.com/blog', icon: 'globe' },
          { label: 'Shop Our Products', url: 'https://yourbrand.com/shop', icon: 'shopping' },
          { label: 'Newsletter', url: 'https://yourbrand.com/newsletter', icon: 'mail' },
        ]),
        visits: 4280,
        clicks: 1820,
      },
    })
    await db.smartLink.create({
      data: {
        profileId: clientProfile.id,
        title: 'Bloom Cosmetics',
        slug: 'bloom',
        bio: 'Clean beauty for every skin. Cruelty-free. Vegan. Made with love.',
        theme: 'rose',
        links: JSON.stringify([
          { label: 'Shop All Products', url: 'https://bloomcosmetics.com/shop', icon: 'shopping' },
          { label: 'Skincare Quiz', url: 'https://bloomcosmetics.com/quiz', icon: 'globe' },
          { label: 'Become a Bloom Ambassador', url: 'https://bloomcosmetics.com/ambassador', icon: 'mail' },
        ]),
        visits: 12400,
        clicks: 5680,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'seeded',
      profiles: profiles.length,
      accounts: accountsToCreate.length,
    })
  } catch (e: any) {
    console.error('seed error', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
