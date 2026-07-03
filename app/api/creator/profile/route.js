import { NextResponse } from 'next/server'

export async function GET(request) {
  const id = request.headers.get('x-user-id')
  const email = request.headers.get('x-user-email')
  const role = request.headers.get('x-user-role')

  return NextResponse.json({
    message: 'Welcome Creator',
    user: { id, email, role }
  })
}
