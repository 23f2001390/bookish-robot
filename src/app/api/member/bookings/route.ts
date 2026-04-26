import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getBookings, createBooking } from '@/backend/services/member.service'

/**
 * GET /api/member/bookings
 * Returns all bookings for the authenticated member.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming') === 'true'
  const statusParam = searchParams.get('status') || undefined
  const trainerId = searchParams.get('trainerId') || undefined

  const { data, error, status } = await getBookings(auth.user.id, upcoming, statusParam, trainerId)

  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}

/**
 * POST /api/member/bookings
 * Allows a member to create a new booking with a trainer.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const { trainerId, date, time } = await req.json()
    const result = await createBooking(auth.user.id, trainerId, date, time)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data, { status: result.status })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}