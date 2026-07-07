import { NextResponse } from 'next/server'
import { authenticate } from '@/middleware/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const user = await authenticate(request)

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productType, audience, goal } = await request.json()

    if (!productType || !audience || !goal) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const creators = await prisma.creator.findMany()

    const matches = creators.map((creator) => {
      let compatibility = 85
      const lowerType = productType.toLowerCase()

      creator.niches.forEach((niche) => {
        if (lowerType.includes(niche.toLowerCase())) {
          compatibility += 5
        }
      })

      if (compatibility > 99) {
        compatibility = 99
      }

      return {
        id: creator.id,
        name: creator.name,
        avatar: creator.avatar,
        niches: creator.niches,
        followers: creator.followers >= 1000 ? `${Math.round(creator.followers / 1000)}K` : `${creator.followers}`,
        engagementRate: `${creator.engagementRate}%`,
        compatibility,
      }
    })

    return NextResponse.json({ matches })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
