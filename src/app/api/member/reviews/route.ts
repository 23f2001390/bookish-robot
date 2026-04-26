import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { getReviews, submitReview } from '@/backend/services/review.service'

/**
 * GET /api/member/reviews
 *
 * Returns reviews for the authenticated member's trainer.
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

  const { searchParams } = new URL(req.url)
  const queryTrainerId = searchParams.get('trainerId')

  try {
    const result = await getReviews(id, queryTrainerId)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/member/reviews
 *
 * Allows a member to submit or update a review for any trainer.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const memberId = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { trainerId, rating, feedback } = body || {}
    if (!trainerId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await submitReview(memberId, trainerId, rating, feedback)
    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    console.error(err)
    if (['Trainer not found', 'Member profile not found'].includes(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
