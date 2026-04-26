import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  try {
    const { notes } = await req.json()
    const params = await props.params
    const sessionId = params.id
    
    console.log('UPDATING SESSION:', sessionId, 'WITH NOTES:', notes);

    const updated = await prisma.sessionLog.update({
      where: { 
        id: sessionId,
      },
      data: { notes }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating session notes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
