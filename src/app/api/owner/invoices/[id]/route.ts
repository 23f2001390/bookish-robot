import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  const { id } = await params

  try {
    const { status } = await req.json()
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status }
    })

    // If marked PAID, also activate the member logic
    if (status === 'PAID') {
      const plan = updated.plan;
      const sessions = plan === 'BASIC' ? 0 : plan === 'PRO' ? 1 : 4;
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // All plans are basic now

      await prisma.member.update({
        where: { id: updated.memberId },
        data: {
          plan: plan,
          planStatus: 'ACTIVE',
          planExpiry: expiryDate,
          sessionsRemaining: {
            increment: sessions
          }
        }
      });
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
