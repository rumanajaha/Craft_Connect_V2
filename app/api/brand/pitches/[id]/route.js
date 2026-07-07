import { NextResponse } from 'next/server'
import { authenticate } from '@/middleware/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  try {
    const user = await authenticate(request)

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const brand = await prisma.brand.findUnique({
      where: { userId: user.id },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const pitch = await prisma.pitch.findUnique({
      where: { id },
    })

    if (!pitch || pitch.brandId !== brand.id) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 })
    }

    const updatedPitch = await prisma.pitch.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      message: 'Pitch updated successfully',
      pitch: updatedPitch,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
