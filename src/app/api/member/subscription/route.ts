import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'
import { PlanType } from '@prisma/client'

export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const { planId, amount } = await req.json()
    const planKey = (planId as string).toUpperCase()
    
    const planMap: Record<string, any> = {
      'BASIC': { days: 30, sessions: 0, amount: 1499 },
      'PRO': { days: 30, sessions: 1, amount: 2999 },
      'ELITE': { days: 30, sessions: 4, amount: 4999 }
    }

    let actualPlan = planKey as PlanType
    let planData = planMap[planKey]
    if (!planData) {
      actualPlan = 'BASIC' as PlanType
      planData = planMap['BASIC']
    }

    const { days, sessions } = planData

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: auth.user.id } })
      if (!member) throw new Error('Member not found')

      const updatedMember = await tx.member.update({
        where: { id: auth.user.id },
        data: {
          plan: actualPlan,
          planStatus: 'ACTIVE',
          planExpiry: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          sessionsRemaining: sessions
        }
      })

      const invoice = await tx.invoice.create({
        data: {
          memberId: auth.user.id,
          plan: actualPlan,
          amount: amount || planData.amount,
          date: new Date(),
          status: 'PAID'
        }
      })

      return { member: updatedMember, invoice }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    console.error('Subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
