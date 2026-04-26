import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getRevenueData } from '@/backend/services/owner.service'

/**
 * GET /api/owner/revenue
 * Returns monthly revenue and member counts based on invoices.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const result = await getRevenueData()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}