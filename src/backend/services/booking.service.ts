import { prisma } from '../shared/prisma'

/**
 * Fetches bookings for a member. 
 * Can be filtered by status (CONFIRMED, CANCELLED) or 
 * restricted to upcoming sessions only.
 */
export async function getBookings(memberId: string, upcoming: boolean = false, status?: string) {
  try {
    const where: any = { memberId }
    if (status) {
      where.status = status as any
    }
    if (upcoming) {
      // Show only sessions from the current time onwards
      where.date = { gte: new Date() }
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        trainerId: true,
        date: true,
        time: true,
        status: true,
        trainer: {
          select: { user: { select: { name: true } } }
        },
      }
    })

    const result = bookings.map((b: any) => ({
      id: b.id,
      trainerId: b.trainerId,
      trainerName: b.trainer.user?.name,
      date: b.date,
      time: b.time,
      status: b.status
    }))

    return { data: result }
  } catch (error) {
    return { error: 'Failed to fetch bookings', status: 500 }
  }
}

/**
 * Handles the creation of a new personal training session.
 * Now books directly (CONFIRMED status) and automatically 
 * deducts a session credit from the member's account.
 */
export async function createBooking(memberId: string, trainerId: string, date: string, time: string) {
  if (!trainerId || !date || !time) {
    return { error: 'Missing required fields', status: 400 }
  }

  // Ensure the member exists and has enough session credits
  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) {
    return { error: 'Member not found', status: 404 }
  }
  
  if (member.sessionsRemaining <= 0) {
    return { error: 'No trainer sessions remaining on your plan', status: 403 }
  }

  const bookingDate = new Date(date + 'T00:00:00.000Z')

  // Check if someone else already snagged this slot
  const existing = await prisma.booking.findFirst({
    where: {
      trainerId,
      date: bookingDate,
      time,
      NOT: { status: 'CANCELLED' }
    },
    select: { id: true }
  })

  if (existing) {
    return { error: 'Slot already booked', status: 409 }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the record with CONFIRMED status immediately
      const booking = await tx.booking.create({
        data: {
          memberId,
          trainerId,
          date: bookingDate,
          time,
          status: 'CONFIRMED'
        },
        select: {
          id: true,
          trainerId: true,
          date: true,
          time: true,
          status: true,
          trainer: { include: { user: { select: { name: true } } } },
          member: { include: { user: { select: { name: true } } } }
        },
      })

      // Alert the trainer about the new booking
      await tx.notification.create({
        data: {
          userId: trainerId,
          title: "New Session Booking",
          message: `${booking.member.user?.name || 'A member'} has booked a session on ${date} at ${time}.`,
        }
      })

      // Subtract from the PT balance as the session is now locked in
      await tx.member.update({
        where: { id: memberId },
        data: { sessionsRemaining: { decrement: 1 } }
      })

      return booking
    })

    return {
      data: {
        id: result.id,
        trainerId: result.trainerId,
        trainerName: result.trainer.user?.name,
        date: result.date,
        time: result.time,
        status: result.status
      },
      status: 201
    }
  } catch (error) {
    console.error('[CreateBooking] Transaction failed:', error)
    return { error: 'Failed to create booking', status: 500 }
  }
}

