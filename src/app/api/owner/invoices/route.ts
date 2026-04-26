import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getInvoices, createInvoice } from '@/backend/services/owner.service'

/**
 * POST /api/owner/invoices
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  try {
    const body = await req.json()
    const { memberId, plan, amount, status, date } = body

    if (!memberId || !plan) {
      return NextResponse.json({ error: 'Member ID and Plan are required' }, { status: 400 })
    }

    const result = await createInvoice({
      memberId,
      plan,
      amount: amount ? Number(amount) : undefined,
      status: status || 'PENDING',
      date: date ? new Date(date) : new Date()
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[POST /api/owner/invoices] Error:', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * GET /api/owner/invoices
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  const result = await getInvoices()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}