import { NextResponse } from 'next/server'
import { authenticate } from '@/middleware/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await authenticate(request)

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brand = await prisma.brand.findUnique({
      where: { userId: user.id },
      include: {
        products: true,
        requests: true,
        pitches: {
          include: {
            creator: true,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const creators = await prisma.creator.findMany()

    const activeProducts = brand.products.filter((p) => p.inStock).length
    const pendingRequests = brand.requests.filter((r) => r.status === 'pending').length
    const aiMatches = creators.length

    const formattedPitches = brand.pitches.map((pitch) => ({
      id: pitch.id,
      creatorId: pitch.creatorId,
      creatorName: pitch.creator.name,
      creatorAvatar: pitch.creator.avatar,
      compensation: pitch.compensation,
      snippet: pitch.snippet,
      date: pitch.createdAt.toISOString().split('T')[0],
      status: pitch.status,
    }))

    return NextResponse.json({
      activeProducts,
      pendingRequests,
      aiMatches,
      pitches: formattedPitches,
      creators: creators.map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        niches: c.niches,
        followers: c.followers >= 1000 ? `${Math.round(c.followers / 1000)}K` : `${c.followers}`,
        engagementRate: `${c.engagementRate}%`,
        compatibility: 90,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
