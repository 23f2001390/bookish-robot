import { Prisma } from '@prisma/client'
import { prisma } from '../../shared/prisma'

/**
 * Grabs the full list of gym members for the owner's management table.
 * Joins user and trainer details to provide a snapshot of membership status, 
 * trainer assignments, and remaining sessions.
 */
export async function getMembers() {
  try {
    const members = await prisma.member.findMany({
      include: { user: true, trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { joinDate: 'desc' }
    })
    
    // We map the database records into a flattened JSON structure that 
    // the frontend data-table expects.
    return { data: members.map(m => ({
      id: m.id, 
      name: m.user?.name || 'Unknown', 
      email: m.user?.email || 'N/A', 
      phone: m.user?.phone || 'N/A',
      joinDate: m.joinDate, 
      plan: m.plan, 
      planExpiry: m.planExpiry ? m.planExpiry.toISOString().split('T')[0] : 'N/A',
      planStatus: m.planStatus, 
      attendanceCount: m.attendanceCount, 
      sessionsRemaining: m.sessionsRemaining,
      age: m.age, 
      gender: m.gender, 
      healthNotes: m.healthNotes, 
      trainerId: m.trainerId,
      trainer: m.trainer ? { 
        id: m.trainer.id, 
        name: m.trainer.user?.name || 'Unknown', 
        specialization: m.trainer.specialization 
      } : null
    }))}
  } catch (error) {
    console.error('Error fetching members:', error)
    return { error: 'Failed to fetch members', status: 500 }
  }
}

/**
 * Updates any field on the member's profile (Role-specific).
 * This is used when the owner manually reassigns a trainer or overrides plan info.
 */
export async function updateMember(memberId: string, updateData: Prisma.MemberUpdateInput) {
  try {
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      include: {
        trainer: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })
    return { data: updated }
  } catch (error) {
    console.error('Error updating member:', { memberId, updateData, error })
    return { error: 'Failed to update member', status: 500 }
  }
}

/**
 * Permanently removes a member from the system.
 * We delete the role-specific Member record first, then the base User account.
 */
export async function deleteMember(memberId: string) {
  try {
    // Note: We don't use cascade delete for safety, so we manually clean up both tables.
    await prisma.member.delete({ where: { id: memberId } })
    await prisma.user.delete({ where: { id: memberId } })
    return { data: { success: true } }
  } catch (error) {
    console.error('Error deleting member:', error)
    return { error: 'Failed to delete member', status: 500 }
  }
}
