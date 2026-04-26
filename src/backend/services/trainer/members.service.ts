import { prisma } from '../../shared/prisma'

/**
 * Grabs all members that this trainer is responsible for.
 * Includes both officially assigned members AND members who have 
 * upcoming sessions booked with this trainer.
 */
export async function getTrainerMembers(trainerId: string) {
  try {
    const members = await prisma.member.findMany({
      // We check for two things: 1. Is this their primary trainer? 
      // 2. Do they have an active (Pending/Confirmed) session booking?
      where: { 
        OR: [ 
          { trainerId }, 
          { Booking: { some: { trainerId, status: { in: ['PENDING', 'CONFIRMED'] } } } } 
        ] 
      },
      include: { user: { select: { name: true, email: true } } }
    })
    
    const result = members.map(m => ({
      id: m.id,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || 'N/A',
      plan: m.plan,
      planStatus: m.planStatus,
      sessionsRemaining: m.sessionsRemaining
    }))
    
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerMembers:', error)
    return { error: 'Failed to fetch trainer members', status: 500 }
  }
}

