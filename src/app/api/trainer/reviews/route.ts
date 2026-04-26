import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerReviews } from '@/backend/services/trainer.service'

/**
 * GET /api/trainer/reviews
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error
  
  const result = await getTrainerReviews(auth.user.id)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}