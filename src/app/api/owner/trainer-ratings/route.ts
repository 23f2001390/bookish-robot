import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerRatings } from '@/backend/services/owner.service'

/**
 * GET /api/owner/trainer-ratings
 * Returns all trainers with their average ratings.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const result = await getTrainerRatings()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}