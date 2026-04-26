import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getAttendanceRecords, markAttendance } from '@/backend/services/member.service'

/**
 * POST /api/member/attendance
 * Marks attendance for the authenticated member.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const { code } = await req.json()
  const { data, error, status } = await markAttendance(auth.user.id, code)

  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}

/**
 * GET /api/member/attendance
 * Returns attendance records for the authenticated member.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  const { data, error, status } = await getAttendanceRecords(auth.user.id, limit)

  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}