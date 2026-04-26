import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/workout-plans
 *
 * Returns all workout plans assigned to the authenticated member. Each
 * workout plan includes its exercises. Records are ordered by day for
 * deterministic results.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const plans = await prisma.workoutPlan.findMany({
      where: { memberId: id },
      orderBy: { day: 'asc' },
      include: { exercises: true, trainer: { select: { user: { select: { name: true } } } } }
    })
    const result = plans.map(p => ({
      id: p.id,
      day: p.day,
      trainerId: p.trainerId,
      trainerName: p.trainer.user?.name,
      notes: p.notes,
      exercises: p.exercises
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}