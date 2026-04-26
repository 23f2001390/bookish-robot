import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainers } from '@/backend/services/trainer.service'

/**
 * GET /api/member/trainers
 * Returns a list of trainers that members can book with.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const { data, error, status } = await getTrainers()

  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}