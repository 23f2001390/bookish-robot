import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerMemberWorkoutPlans, createWorkoutPlan } from '@/backend/services/trainer.service'

/**
 * GET /api/trainer/members/[memberId]/workout-plans
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  const { memberId } = await params
  try {
    const { data, error, status } = await getTrainerMemberWorkoutPlans(auth.user.id, memberId)
    if (error) {
      return NextResponse.json({ error }, { status })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/trainer/members/[memberId]/workout-plans
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  const { memberId } = await params
  try {
    const body = await req.json()
    const { data, error, status } = await createWorkoutPlan(auth.user.id, memberId, body)
    if (error) {
      return NextResponse.json({ error }, { status })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
