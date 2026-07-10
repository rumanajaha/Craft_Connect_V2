import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/utils/auth'
export async function POST(request) {
    try {
        const { token, password, confirmPassword } = await request.json()
        if (!token) {
            return NextResponse.json(
                { error: 'Reset token is required' },
                { status: 400 }
            )
        }
        if (!password || !confirmPassword) {
            return NextResponse.json(
                { error: 'All password fields are required' },
                { status: 400 }
            )
        }
        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Passwords do not match' },
                { status: 400 }
            )
        }
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            )
        }
        // Find user with matching token that hasn't expired yet
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date(),
                },
            },
        })
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired password reset token' },
                { status: 400 }
            )
        }
        // Hash the new password
        const hashedPassword = await hashPassword(password)
        // Update password and clear the reset token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        })
        return NextResponse.json(
            { message: 'Password has been reset successfully.' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
