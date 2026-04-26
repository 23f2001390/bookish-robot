import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerProfile } from '@/backend/services/trainer.service'
import { updateGenericProfile } from '@/backend/services/user.service'

/**
 * GET /api/trainer/profile
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  try {
    const { data, error, status } = await getTrainerProfile(auth.user.id)
    if (error) return NextResponse.json({ error }, { status })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/trainer/profile
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error
  try {
    const body = await req.json()
    const { data, error, status } = await updateGenericProfile(auth.user.id, body)
    if (error) return NextResponse.json({ error }, { status })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}