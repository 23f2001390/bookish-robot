import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/trainers/[trainerId]/members
 *
 * Returns all members assigned to the specified trainer. Only accessible
 * by the owner. Each member includes id, name, email, plan, planStatus and
 * sessionsRemaining.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ trainerId: string }> }) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { trainerId } = await params
  try {
    const members = await prisma.member.findMany({
      where: { trainerId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { joinDate: 'desc' }
    })
    const data = members.map(m => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      plan: m.plan,
      planStatus: m.planStatus,
      sessionsRemaining: m.sessionsRemaining
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}