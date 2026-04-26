import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainerSessions } from '@/backend/services/trainer.service'

/**
 * GET /api/trainer/sessions
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error
  
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const result = await getTrainerSessions(auth.user.id, dateParam)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}