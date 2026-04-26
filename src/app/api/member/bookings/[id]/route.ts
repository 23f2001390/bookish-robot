import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { cancelBooking } from '@/backend/services/member.service'

/**
 * DELETE /api/member/bookings/[id]
 * Cancels a booking. Only the member who owns the booking can cancel it.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const { id } = await params
  const result = await cancelBooking(auth.user.id, id)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ success: true })
}
