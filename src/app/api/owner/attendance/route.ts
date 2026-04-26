import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getAttendanceRecords, markManualAttendance } from '@/backend/services/owner.service'

/**
 * GET /api/owner/attendance
 * Returns all attendance records for the owner dashboard.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  const result = await getAttendanceRecords()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}

/**
 * POST /api/owner/attendance
 * Manually marks attendance for a member ID.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  try {
    const { memberId } = await req.json()
    const result = await markManualAttendance(memberId)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}