import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

/**
 * Handle POST /api/auth/signup
 *
 * This endpoint registers a new member account. Only member signups are
 * supported via this route. Trainers and owners are added by admins via
 * database seed or internal tools. On success, a JWT token is returned
 * alongside the newly created user information.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if a user with this email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Hash the password
    const hashed = await hashPassword(password)

    // Create the user and associated member record in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashed,
          role: 'MEMBER',
          name: `${firstName} ${lastName}`,
          phone,
          Member: {
              create: {
                joinDate: new Date(),
                plan: 'BASIC',
                planExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
                planStatus: 'EXPIRED',
                attendanceCount: 0,
                sessionsRemaining: 0,
                age: 18,
                gender: 'OTHER',
              }
            }
        },
        include: {
          Member: true
        }
      })

      // Notify the Gym Owner of the new signup
      const owner = await tx.user.findFirst({ where: { role: 'OWNER' } })
      if (owner) {
        await tx.notification.create({
          data: {
            userId: owner.id,
            title: "New Member Signup",
            message: `${newUser.name} has just signed up and needs to complete plan selection and payment.`,
          }
        })
      }

      return newUser
    })

    // Return the newly created user (and member) details. The client can
    // subsequently sign in the user via NextAuth's signIn("credentials") call.
    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role
      },
      member: result.Member
    }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
