import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'
import { updateGenericProfile } from '@/backend/services/user.service'

/**
 * GET /api/owner/profile
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true, email: true, phone: true }
    })
    
    if (!user) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/owner/profile
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  try {
    const body = await req.json()
    const { data, error, status } = await updateGenericProfile(auth.user.id, body)
    if (error) return NextResponse.json({ error }, { status })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
