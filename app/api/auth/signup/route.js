import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/utils/auth'

export async function POST(request) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedRole = role.toUpperCase()
    if (!['CREATOR', 'BRANDOWNER', 'CUSTOMER'].includes(normalizedRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: normalizedRole,
      },
    })

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
