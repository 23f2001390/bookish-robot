import { prisma } from '../../shared/prisma'

/**
 * Fetches bookings for a member.
 * Supports filtering by trainer or by upcoming dates.
 * This is used for both the "My Bookings" list and checking trainer availability.
 */
export async function getBookings(memberId: string, upcoming: boolean = false, status?: string, trainerId?: string) {
  try {
    const where: any = {}
    if (trainerId) {
      // Searching for a specific trainer's schedule. 
      // We exclude CANCELLED slots as those are technically "available" now.
      where.trainerId = trainerId
      where.NOT = { status: 'CANCELLED' }
    } else {
      // General search for the member's own history.
      where.memberId = memberId
    }

    if (status) where.status = status as any
    // Only show sessions from this moment forward.
    if (upcoming) where.date = { gte: new Date() }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true, trainerId: true, date: true, time: true, status: true,
        trainer: { select: { user: { select: { name: true } } } },
      }
    })

    return { data: bookings.map(b => ({
      id: b.id, trainerId: b.trainerId, trainerName: b.trainer.user?.name,
      date: b.date, time: b.time, status: b.status
    }))}
  } catch (error) {
    console.error('[GetBookings] Error:', error)
    return { error: 'Failed to fetch bookings', status: 500 }
  }
}

/**
 * Handles the logic for booking a personal training session.
 * Now sets status to CONFIRMED directly as part of our direct booking flow.
 */
export async function createBooking(memberId: string, trainerId: string, date: string, time: string) {
  if (!trainerId || !date || !time) return { error: 'Missing required fields', status: 400 }

  // Fetch member with user name beforehand to keep the transaction lean
  const member = await prisma.member.findUnique({ 
    where: { id: memberId },
    include: { user: { select: { name: true } } } 
  })
  if (!member) return { error: 'Member not found', status: 404 }

  // Fetch trainer with user name too
  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    include: { user: { select: { name: true } } }
  })
  if (!trainer) return { error: 'Trainer not found', status: 404 }

  // Check if the user has PT sessions left in their current plan.
  if (member.sessionsRemaining <= 0) return { error: 'No trainer sessions remaining on your plan', status: 403 }

  const bookingDate = new Date(date + 'T00:00:00.000Z')

  // Prevent double-booking the same trainer slot at the same time.
  const existingSlot = await prisma.booking.findFirst({
    where: { trainerId, date: bookingDate, time, NOT: { status: 'CANCELLED' } },
    select: { id: true }
  })
  if (existingSlot) return { error: 'Slot already booked by another member', status: 409 }

  // Restrict members to a maximum of one session per day to avoid overbooking.
  const alreadyBookedToday = await prisma.booking.findFirst({
    where: { memberId, date: bookingDate, NOT: { status: 'CANCELLED' } },
    select: { id: true }
  })
  if (alreadyBookedToday) return { error: 'You already have a session booked for this day', status: 400 }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the confirmed booking record.
      const booking = await tx.booking.create({
        data: { memberId, trainerId, date: bookingDate, time, status: 'CONFIRMED' },
        select: { id: true, trainerId: true, date: true, time: true, status: true }
      })

      // 2. Alert the trainer so they can prepare for the session.
      await tx.notification.create({
        data: { userId: trainerId, title: "New Session Booking",
        message: `${member.user?.name || 'A member'} has booked a session on ${date} at ${time}.` }
      })

      // 3. Deduct one PT session from the user's balance.
      await tx.member.update({ where: { id: memberId }, data: { sessionsRemaining: { decrement: 1 } } })
      
      return booking
    }, {
      timeout: 10000 // Increased timeout as extra safety
    })

    return { 
      data: { id: result.id, trainerId: result.trainerId, trainerName: trainer.user?.name, 
      date: result.date, time: result.time, status: result.status }, 
      status: 201 
    }
  } catch (error) {
    console.error('[CreateBooking] Transaction failed:', error)
    return { error: 'Failed to create booking', status: 500 }
  }
}

/**
 * Cancels an existing booking and refunds the PT session credit to the member.
 * Only the booking owner can cancel their own booking.
 */
export async function cancelBooking(memberId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, memberId: true, status: true } })
  if (!booking) return { error: 'Booking not found', status: 404 }
  if (booking.memberId !== memberId) return { error: 'Unauthorized', status: 403 }
  if (booking.status === 'CANCELLED') return { error: 'Booking already cancelled', status: 400 }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
    // Refund the session credit back to the member
    await tx.member.update({ where: { id: memberId }, data: { sessionsRemaining: { increment: 1 } } })
  }, { timeout: 10000 })

  return { success: true }
}
