import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { deleteWorkoutPlan } from '@/backend/services/trainer.service'

/**
 * DELETE /api/trainer/members/[memberId]/workout-plans/[planId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  const { planId } = await params
  try {
    const { data, error, status } = await deleteWorkoutPlan(auth.user.id, planId)
    if (error) {
      return NextResponse.json({ error }, { status })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
