import { NextResponse } from 'next/server'
import { prisma } from '@/backend/shared/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, phone, newPassword } = await req.json()

    if (!email || !phone || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the user by both email AND phone as a simple verification
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        phone: phone
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'No account found matching those details' }, { status: 404 })
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
