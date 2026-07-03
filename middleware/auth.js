import { verifyToken } from '../utils/auth'
import prisma from '../lib/prisma'

export async function authenticate(request) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1]
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded) return null

  return prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })
}
