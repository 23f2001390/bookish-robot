import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerForMember } from '@/backend/services/member.service'

/**
 * GET /api/member/trainer
 * Returns the trainer assigned to the authenticated member.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const result = await getTrainerForMember(auth.user.id)

  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Note: result.data might be null if no trainer is assigned
  return NextResponse.json(result.data)
}