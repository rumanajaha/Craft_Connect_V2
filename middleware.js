import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-fallback-secret-key-32-chars-long-minimum'
)

export async function middleware(request) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { role } = payload
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/api/creator') && role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (pathname.startsWith('/api/brandowner') && role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (pathname.startsWith('/api/customer') && role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-email', payload.email)
    response.headers.set('x-user-role', payload.role)
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export const config = {
  matcher: [
    '/api/creator/:path*',
    '/api/brandowner/:path*',
    '/api/customer/:path*',
  ],
}
