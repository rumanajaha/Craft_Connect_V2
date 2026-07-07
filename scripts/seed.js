const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  await prisma.pitch.deleteMany()
  await prisma.request.deleteMany()
  await prisma.product.deleteMany()
  await prisma.creator.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  const brandUser = await prisma.user.create({
    data: {
      email: 'ochre@example.com',
      password: passwordHash,
      name: 'Ochre Clay Studio',
      role: 'BRANDOWNER',
      brand: {
        create: {
          name: 'Ochre Clay Studio',
          logo: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80',
          category: 'Ceramics',
          location: 'Kyoto & Portland',
          rating: 4.9,
          reviewsCount: 42,
          trustScore: 98,
          website: 'https://ochreclay.example.com',
          about: 'Raw stoneware, tactile glazes, and wood-fired ceramics designed for the slow dinner table. Every piece is shaped by hand and cured for weeks in custom wood-fired kilns, creating unique organic variations.',
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        }
      }
    },
    include: {
      brand: true
    }
  })

  const creatorUser1 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      password: passwordHash,
      name: 'Sarah Indigo',
      role: 'CREATOR',
      creator: {
        create: {
          name: 'Sarah Indigo',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          niches: ['Home Decor', 'Slow Living'],
          followers: 45000,
          engagementRate: 4.8,
          bio: 'Lifestyle content creator and slow-living advocate. I share stories about handmade goods, intentional living, and the artisans behind the craft.',
          tags: ['slow living', 'home decor', 'ceramics', 'handmade', 'minimalist'],
          instagram: 'sarahindigo',
          tiktok: 'sarah.indigo',
          youtube: 'SarahIndigoChannel'
        }
      }
    },
    include: {
      creator: true
    }
  })

  const creatorUser2 = await prisma.user.create({
    data: {
      email: 'liam@example.com',
      password: passwordHash,
      name: 'Liam Woodcraft',
      role: 'CREATOR',
      creator: {
        create: {
          name: 'Liam Woodcraft',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
          niches: ['Woodworking', 'Design'],
          followers: 112000,
          engagementRate: 5.2
        }
      }
    },
    include: {
      creator: true
    }
  })

  const creatorUser3 = await prisma.user.create({
    data: {
      email: 'elena@example.com',
      password: passwordHash,
      name: 'Elena Rostova',
      role: 'CREATOR',
      creator: {
        create: {
          name: 'Elena Rostova',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          niches: ['Lifestyle', 'Aesthetic'],
          followers: 89000,
          engagementRate: 3.9
        }
      }
    },
    include: {
      creator: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        brandId: brandUser.brand.id,
        name: 'Organic Speckled Clay Vase',
        price: 120,
        image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=80',
        inStock: true
      },
      {
        brandId: brandUser.brand.id,
        name: 'Minimalist Stoneware Soup Bowl',
        price: 45,
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=80',
        inStock: true
      },
      {
        brandId: brandUser.brand.id,
        name: 'Wood-Fired Ceramic Mug',
        price: 38,
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=80',
        inStock: false
      }
    ]
  })

  await prisma.request.create({
    data: {
      brandId: brandUser.brand.id,
      type: 'Custom Product',
      subject: 'Custom Tall Ceramic Pitcher',
      message: 'Hello! I am looking to commission a customized 1.5L tall ceramic water pitcher matching the Ochre Speckled style for my dinner table. Do you think we could do this with a slightly thinner handle? Thanks!',
      budget: '$150 - $200',
      deadline: 'August 20, 2026',
      status: 'pending'
    }
  })

  await prisma.pitch.createMany({
    data: [
      {
        brandId: brandUser.brand.id,
        creatorId: creatorUser1.creator.id,
        compensation: 'gifting',
        snippet: "I'd love to showcase your speckled mugs in my upcoming 'Slow Sunday' reel series.",
        status: 'pending'
      },
      {
        brandId: brandUser.brand.id,
        creatorId: creatorUser2.creator.id,
        compensation: 'paid',
        snippet: 'Looking for unique ceramic props for a coffee table build video sponsor segment.',
        status: 'pending'
      }
    ]
  })
}

main()
  .catch((e) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
