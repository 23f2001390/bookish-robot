import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/trainers/[trainerId]/reviews
 *
 * Returns all reviews for the specified trainer. Only accessible by
 * the owner. The reviews are sorted by date descending.
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
    const reviews = await prisma.review.findMany({
      where: { trainerId },
      orderBy: { date: 'desc' }
    })
    const data = reviews.map(r => ({
      id: r.id,
      trainerId: r.trainerId,
      rating: r.rating,
      feedback: r.feedback,
      date: r.date.toISOString().split('T')[0]
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}