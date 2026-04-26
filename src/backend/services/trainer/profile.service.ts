import { prisma } from '../../shared/prisma'
import { hash } from 'bcryptjs'

/**
 * Lists all trainers in the system.
 * Joins user details, reviews, and member assignments to show a 
 * comprehensive summary on the trainers list page.
 */
export async function getTrainers() {
  try {
    const trainers = await prisma.trainer.findMany({
      include: { 
        user: true,
        // Pull reviews to calculate the average rating on the fly.
        Review: { select: { rating: true } },
        // Pull members to show the workload of the trainer.
        Members: { select: { id: true } }
      }
    })
    
    const result = trainers.map(t => {
      const reviewCount = t.Review.length
      const avgRating = reviewCount > 0 
        ? t.Review.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0
        
      return {
        id: t.id,
        name: t.user?.name || 'Unknown',
        email: t.user?.email || 'N/A',
        phone: t.user?.phone || 'N/A',
        specialization: t.specialization,
        rating: avgRating,
        reviewCount: reviewCount,
        memberCount: t.Members?.length || 0,
        availability: t.availability,
        // Fallback to a full empty week if no schedule is set yet.
        schedule: t.schedule || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
      }
    })

    return { data: result }
  } catch (error) {
    console.error('Error in getTrainers:', error)
    return { error: 'Failed to fetch trainers', status: 500 }
  }
}

/**
 * Retrieves the full profile of a single trainer.
 * This includes their active members, client reviews, and an 
 * expanded weekly schedule that overlays active bookings over their availability.
 */
export async function getTrainerProfile(trainerId: string) {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { 
        user: { select: { name: true, email: true, phone: true } },
        Review: { 
          include: { 
            member: { include: { user: { select: { name: true } } } } 
          } 
        },
        Members: { 
          include: { 
            user: { select: { name: true } } 
          } 
        },
        // We only pull upcoming or current-day bookings to show on the schedule.
        Booking: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today onwards
            }
          },
          include: {
            member: { include: { user: { select: { name: true } } } }
          }
        }
      }
    })
    
    if (!trainer) {
      return { error: 'Trainer not found', status: 404 }
    }
    
    const reviewCount = trainer.Review.length
    const avgRating = reviewCount > 0 
      ? trainer.Review.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0

    // To show a unified schedule, we start with the trainer's custom availability 
    // and then inject actual booked sessions into it.
    const baseSchedule: any = (trainer.schedule as any) || {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    // First, clear out any 'session' tags from previous renders if we were reusing the object.
    Object.keys(baseSchedule).forEach(day => {
      baseSchedule[day] = baseSchedule[day].filter((slot: any) => slot.type === 'available' || slot.type === 'break')
    })

    // Now, overlay the bookings. This tells the trainer *who* is coming in at what time.
    trainer.Booking.forEach(booking => {
      const dayName = days[new Date(booking.date).getDay()]
      if (baseSchedule[dayName]) {
        const start = booking.time
        let hour = parseInt(start.split(':')[0])
        let end = `${(hour + 1).toString().padStart(2, '0')}:${start.split(':')[1]}`
        
        baseSchedule[dayName].push({
          start,
          end,
          type: 'session',
          memberId: booking.memberId,
          memberName: booking.member.user.name
        })
      }
    })

    // Sort by time so the schedule is readable (Morning to Evening).
    Object.keys(baseSchedule).forEach(day => {
      baseSchedule[day].sort((a: any, b: any) => a.start.localeCompare(b.start))
    })

    const result = {
      id: trainer.id,
      name: trainer.user?.name || 'Unknown',
      email: trainer.user?.email || 'N/A',
      phone: trainer.user?.phone || 'N/A',
      specialization: trainer.specialization,
      rating: avgRating,
      reviewCount: reviewCount,
      memberCount: trainer.Members.length,
      availability: trainer.availability,
      schedule: baseSchedule,
      members: trainer.Members.map(m => ({
        id: m.id,
        name: m.user.name,
        plan: m.plan,
        status: m.planStatus,
        joinDate: m.joinDate.toISOString().split('T')[0]
      })),
      reviews: trainer.Review.map(r => ({
        id: r.id,
        name: r.member?.user?.name || 'Gym Member',
        rating: r.rating,
        comment: r.feedback,
        date: r.date.toISOString().split('T')[0]
      }))
    }
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerProfile:', error)
    return { error: 'Failed to fetch trainer profile', status: 500 }
  }
}

/**
 * On-boards a new trainer.
 * This is a multi-step process: we first create a core User account with the role 'TRAINER',
 * then set up their specialized Trainer record with a default standard schedule.
 */
export async function createTrainer(data: { name: string, email: string, specialization: string, password?: string, phone?: string }) {
  try {
    // Check for collisions to avoid duplicate emails.
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existingUser) {
      return { error: 'User with this email already exists', status: 400 }
    }

    // Default password for new trainers if one isn't specified.
    const passwordToHash = data.password || 'trainer123'
    const hashedPassword = await hash(passwordToHash, 12)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base login account.
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'TRAINER',
          phone: data.phone
        }
      })

      // 2. Initialize the trainer's professional profile with a generous default schedule 
      // (6 AM to 10 PM on weekdays).
      const trainer = await tx.trainer.create({
        data: {
          id: user.id,
          specialization: data.specialization,
          availability: 'AVAILABLE',
          schedule: {
            Monday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Tuesday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Wednesday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Thursday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Friday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Saturday: [{ start: '08:00', end: '20:00', type: 'available' }],
            Sunday: [{ start: '08:00', end: '14:00', type: 'available' }]
          }
        }
      })

      return { user, trainer }
    })

    return { data: result.trainer }
  } catch (error) {
    console.error('Error in createTrainer:', error)
    return { error: 'Failed to create trainer', status: 500 }
  }
}

