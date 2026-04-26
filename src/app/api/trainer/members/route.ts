import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerMembers } from '@/backend/services/trainer.service'

/**
 * GET /api/trainer/members
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error
  
  const result = await getTrainerMembers(auth.user.id)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}