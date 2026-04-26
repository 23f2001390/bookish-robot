import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getExpiringMembers } from '@/backend/services/owner.service'

/**
 * GET /api/owner/expiring-members
 * Fetch members whose plans are expiring within the next 7 days.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const result = await getExpiringMembers()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}