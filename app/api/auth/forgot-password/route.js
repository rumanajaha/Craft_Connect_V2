import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
export async function POST(request) {
    try {
        const { email } = await request.json()
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        })
        // If user does not exist, return a successful response to prevent email enumeration,
        // but do not send any email.
        if (!user) {
            return NextResponse.json(
                { message: 'If a matching account exists, a password reset link has been sent to your email.' },
                { status: 200 }
            )
        }
        // Generate a secure reset token
        const token = crypto.randomBytes(32).toString('hex')
        const tokenExpiry = new Date(Date.now() + 3600000) // 1 hour validity
        // Save token and expiry to User record
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: tokenExpiry,
            },
        })
        // Construct the reset link dynamically
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const resetLink = `${protocol}://${host}/reset-password?token=${token}`
        // Send the email
        await sendPasswordResetEmail(user.email, resetLink)
        return NextResponse.json(
            { message: 'If a matching account exists, a password reset link has been sent to your email.' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}