import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getEquipment, createEquipment, updateEquipment } from '@/backend/services/owner.service'

/**
 * GET /api/owner/equipment
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  const result = await getEquipment()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}

/**
 * POST /api/owner/equipment
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  try {
    const data = await req.json()
    const result = await createEquipment(data)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * PATCH /api/owner/equipment
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  try {
    const { id, ...data } = await req.json()
    const result = await updateEquipment(id, data)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
