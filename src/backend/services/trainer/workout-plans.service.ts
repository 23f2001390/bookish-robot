import { prisma } from '../../shared/prisma'

/**
 * Fetches all workout routines created for a specific member by this trainer.
 * Includes a security check to ensure this trainer actually has an active 
 * relationship with the member before showing their data.
 */
export async function getTrainerMemberWorkoutPlans(trainerId: string, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { 
      id: memberId,
      // Security: Only allow retrieval if they are the primary trainer 
      // or if there's an active booking.
      OR: [
        { trainerId },
        { Booking: { some: { trainerId, status: { in: ['PENDING', 'CONFIRMED'] } } } }
      ]
    }
  })
  
  if (!member) {
    return { error: 'Member not found', status: 404 }
  }

  const plans = await prisma.workoutPlan.findMany({
    where: { memberId },
    include: { exercises: true }
  })

  const result = plans.map(p => ({
    id: p.id,
    day: p.day,
    notes: p.notes,
    exercises: p.exercises.map(e => ({
      id: e.id,
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      rest: e.rest
    }))
  }))

  return { data: result }
}

/**
 * Creates a new training routine for a member.
 * This uses a nested Prisma 'create' to insert both the plan details 
 * and the individual exercises in a single atomic database hit.
 */
export async function createWorkoutPlan(trainerId: string, memberId: string, data: { day: string, notes?: string, exercises: any[] }) {
  try {
    const member = await prisma.member.findFirst({
      where: { 
        id: memberId,
        OR: [
          { trainerId },
          { Booking: { some: { trainerId, status: { in: ['PENDING', 'CONFIRMED'] } } } }
        ]
      }
    })
    
    if (!member) {
      return { error: 'Member not found or not authorized', status: 404 }
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId,
        memberId,
        day: data.day,
        notes: data.notes,
        exercises: {
          create: data.exercises.map(ex => ({
            name: ex.name,
            sets: parseInt(ex.sets),
            reps: ex.reps,
            rest: ex.rest,
            notes: ex.notes
          }))
        }
      },
      include: { exercises: true }
    })

    return { data: plan }
  } catch (error) {
    console.error('Error in createWorkoutPlan:', error)
    return { error: 'Failed to create workout plan', status: 500 }
  }
}

/**
 * Removes a workout plan. 
 * Includes a check to make sure the trainer deleting it is the one who created it.
 */
export async function deleteWorkoutPlan(trainerId: string, planId: string) {
  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId }
    })

    if (!plan || plan.trainerId !== trainerId) {
      return { error: 'Plan not found or not authorized', status: 404 }
    }

    await prisma.workoutPlan.delete({
      where: { id: planId }
    })

    return { data: { success: true } }
  } catch (error) {
    console.error('Error in deleteWorkoutPlan:', error)
    return { error: 'Failed to delete workout plan', status: 500 }
  }
}

