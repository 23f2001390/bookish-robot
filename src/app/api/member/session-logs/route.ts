import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/session-logs
 *
 * Returns training session logs for the authenticated member. Supports an
 * optional `date` query parameter (YYYY-MM-DD) to filter logs for a
 * specific day.
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
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const where: any = { memberId: id }
    if (dateParam) {
      const date = new Date(dateParam)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      where.date = {
        gte: date,
        lt: nextDate
      }
    }
    const logs = await prisma.sessionLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { trainer: { select: { user: { select: { name: true } } } } }
    })
    const result = logs.map(l => ({
      id: l.id,
      date: l.date,
      duration: l.duration,
      exercises: l.exercises,
      notes: l.notes,
      completed: l.completed,
      trainerId: l.trainerId,
      trainerName: l.trainer.user?.name
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}