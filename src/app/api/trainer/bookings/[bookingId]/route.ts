import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { completeBooking } from '@/backend/services/trainer.service'

/**
 * PATCH /api/trainer/bookings/[bookingId]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  const { bookingId } = await params
  const { action, notes } = await req.json()

  try {
    if (action !== 'COMPLETE') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    const result = await completeBooking(auth.user.id, bookingId, notes)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
