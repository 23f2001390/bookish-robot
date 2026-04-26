import { prisma } from '../../shared/prisma'

/**
 * Fetches all sessions for a specific trainer on a specific date.
 * Also checks if those sessions have already been logged as "completed".
 * This is the main data source for the trainer's "My Schedule" view.
 */
export async function getTrainerSessions(trainerId: string, date: string) {
  try {
    // We normalize the date range to cover the entire 24-hour cycle of the requested day.
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // We need the day name (e.g. "Monday") to pull the correct workout plan for that member.
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[startOfDay.getDay()]

    const [bookings, sessionLogs] = await Promise.all([
      // Fetch all non-cancelled bookings for this trainer today.
      prisma.booking.findMany({
        where: {
          trainerId,
          date: { gte: startOfDay, lte: endOfDay },
          NOT: { status: 'CANCELLED' }
        },
        select: {
          id: true,
          memberId: true,
          status: true,
          time: true,
          date: true,
          member: {
            select: {
              user: { select: { name: true } },
              WorkoutPlan: {
                where: { day: dayName },
                select: {
                  day: true,
                  exercises: { select: { name: true, sets: true, reps: true } }
                }
              }
            }
          }
        },
      }),
      // Fetch historical logs to determine if the session is already "done".
      prisma.sessionLog.findMany({
        where: {
          trainerId,
          date: { gte: startOfDay, lte: endOfDay },
          completed: true,
        },
        select: {
          memberId: true,
          date: true,
          time: true,
        }
      })
    ])

    // Create a set of "completed" keys to quickly cross-reference with bookings.
    const completedSessions = new Set(
      sessionLogs.map(log => `${log.memberId}:${log.date.toISOString()}:${log.time || ''}`)
    )
    
    const result = bookings.map(b => {
      const workoutPlan = b.member.WorkoutPlan[0] || null
      return {
        id: b.id,
        memberId: b.memberId,
        memberName: b.member?.user?.name || 'Unknown Member',
        duration: 60, // Fixed 1-hour sessions for now.
        completed: completedSessions.has(`${b.memberId}:${b.date.toISOString()}:${b.time}`),
        bookingStatus: b.status,
        time: b.time,
        date: b.date,
        workout: workoutPlan ? {
          day: workoutPlan.day,
          exercises: workoutPlan.exercises.map(e => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps
          }))
        } : null,
        notes: ''
      }
    })
    
    return { data: result }
  } catch (error: any) {
    console.error('Error in getTrainerSessions:', error)
    return { error: `Failed to fetch: ${error.message || 'Unknown error'}`, status: 500 }
  }
}

/**
 * Marks a scheduled session as complete.
 * This clones the day's workout plan into a "Session Log" so the member has a 
 * permanent record of what they did, even if the trainer changes the plan later.
 */
export async function completeBooking(trainerId: string, bookingId: string, notes?: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: {
            WorkoutPlan: {
              where: {
                day: {
                  // We pull the plan based on the current system weekday.
                  equals: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                }
              },
              include: { exercises: true }
            }
          }
        }
      }
    })

    if (!booking || booking.trainerId !== trainerId) {
      return { error: 'Booking not found', status: 404 }
    }

    // Using a transaction ensures that the log is created AND the booking status is updated 
    // simultaneously. If the database crashes mid-way, we won't have a orphaned log or booking.
    return await prisma.$transaction(async (tx) => {
      const workoutPlan = booking.member.WorkoutPlan[0]
      // Flatten the exercises into a simple readable format for the log history.
      const exercisesStr = workoutPlan?.exercises.map(e => `${e.name} (${e.sets}x${e.reps})`) || []

      await tx.sessionLog.create({
        data: {
          memberId: booking.memberId,
          trainerId,
          date: booking.date,
          time: booking.time,
          duration: 60,
          exercises: exercisesStr,
          completed: true,
          notes: notes || ''
        }
      })

      // Finalize the update by marking the booking as confirmed AND decrementing 
      // the member's session count. This keeps the member's plan in sync.
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'CONFIRMED',
          member: {
            update: {
              sessionsRemaining: { decrement: 1 }
            }
          }
        },
      })

      return { data: updated }
    })
  } catch (error) {
    console.error('Error in completeBooking:', error)
    return { error: 'Internal server error', status: 500 }
  }
}

