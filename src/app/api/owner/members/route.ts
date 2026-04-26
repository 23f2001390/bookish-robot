import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getMembers, updateMember, deleteMember } from '@/backend/services/owner.service'
import { prisma } from '@/backend/shared/prisma'

/**
 * GET /api/owner/members
 * Returns a list of all members with detailed status and assigned trainer info.
 */
export async function GET() {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const result = await getMembers()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}

/**
 * PATCH /api/owner/members
 * Allows the owner to update member details like plan, trainer, or status.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const body = (await req.json()) as Record<string, unknown>
  const { memberId, plan, trainerId, planStatus, sessionsRemaining, planExpiry } = body ?? {}

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
  }

  const updateData: any = {}
  
  // If plan is being updated, also update status, expiry and sessions
  if (plan) {
    updateData.plan = plan as any
    updateData.planStatus = 'ACTIVE'
    const now = new Date()
    if (plan === 'BASIC' || plan === 'PRO' || plan === 'ELITE') {
      updateData.planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      updateData.sessionsRemaining = 30
    }
  }

  // Allow individual overrides if provided
  if (trainerId !== undefined) updateData.trainerId = trainerId || null
  if (planStatus) updateData.planStatus = planStatus

  if (sessionsRemaining !== undefined) {
    const parsedSessions = Number(sessionsRemaining)
    if (!Number.isFinite(parsedSessions) || parsedSessions < 0) {
      return NextResponse.json({ error: 'Sessions remaining must be a non-negative number' }, { status: 400 })
    }
    updateData.sessionsRemaining = Math.trunc(parsedSessions)
  }

  if (planExpiry) {
    const parsedExpiry = new Date(planExpiry as string)
    if (Number.isNaN(parsedExpiry.getTime())) {
      return NextResponse.json({ error: 'Plan expiry is invalid' }, { status: 400 })
    }
    updateData.planExpiry = parsedExpiry
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid member updates were provided' }, { status: 400 })
  }

  const result = await updateMember(memberId as string, updateData)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // Notify member if trainer was reassigned via in-app notification
  if (trainerId && result.data && result.data.trainer) {
    await prisma.notification.create({
      data: {
        userId: result.data.id,
        title: "Trainer Reassigned",
        message: `Your trainer has been reassigned to ${result.data.trainer.user.name} (${result.data.trainer.specialization}).`,
      }
    })
  }

  return NextResponse.json(result.data)
}

/**
 * DELETE /api/owner/members
 * Allows the owner to remove a member.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
  }

  const result = await deleteMember(memberId)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.data)
}
