import { prisma } from '../shared/prisma'

/**
 * Grabs reviews for a trainer.
 * If no trainerId is provided, it tries to find the member's assigned trainer first.
 * This is the primary view for the member's "Trainer Reviews" section.
 */
export async function getReviews(memberId: string, queryTrainerId: string | null) {
  let trainerId = queryTrainerId

  if (!trainerId) {
    // If the member hasn't picked a trainer in the UI, check who they are currently assigned to.
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true }
    })
    trainerId = member?.trainerId || null
  }

  if (!trainerId) {
    return []
  }

  const reviews = await prisma.review.findMany({
    where: { trainerId },
    orderBy: { date: 'desc' },
    // Include the member's name so we can show "Review by John Doe"
    include: { member: { select: { user: { select: { name: true } } } } }
  })

  return reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    feedback: r.feedback,
    date: r.date,
    trainerId: r.trainerId,
    memberId: r.memberId,
    memberName: r.member?.user?.name
  }))
}

/**
 * Submits or updates a review for a trainer.
 * Also recalculates the trainer's overall rating on the fly to keep 
 * the leaderboard/profiles accurate.
 */
export async function submitReview(memberId: string, trainerId: string, rating: number, feedback: string) {
  const targetTrainer = await prisma.trainer.findUnique({ where: { id: trainerId } })
  if (!targetTrainer) {
    throw new Error('Trainer not found')
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: { select: { name: true } } }
  })
  if (!member) {
    throw new Error('Member profile not found')
  }

  // We only allow one review per member-trainer pair to prevent rating manipulation.
  const existingReview = await prisma.review.findFirst({
    where: { memberId, trainerId }
  })

  let finalReview

  if (existingReview) {
    // Updating an existing review.
    finalReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        feedback: feedback || '',
        date: new Date()
      },
      include: { member: { include: { user: { select: { name: true } } } } }
    })

    // Reprocess the average rating for the trainer.
    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { trainerId }
    })

    await prisma.trainer.update({
      where: { id: trainerId },
      data: { rating: agg._avg.rating || 0 }
    })
  } else {
    // Creating a brand new review.
    finalReview = await prisma.review.create({
      data: {
        memberId,
        trainerId,
        rating,
        feedback: feedback || '',
        date: new Date()
      },
      include: { member: { include: { user: { select: { name: true } } } } }
    })

    // Quick incremental update for the trainer's rating to avoid full aggregate scan every time.
    const newCount = targetTrainer.reviewCount + 1
    const newRating = ((targetTrainer.rating * targetTrainer.reviewCount) + rating) / newCount
    await prisma.trainer.update({
      where: { id: trainerId },
      data: { rating: newRating, reviewCount: newCount }
    })
  }

  // Let the trainer know someone left them feedback!
  await prisma.notification.create({
    data: {
      userId: trainerId,
      title: existingReview ? "Review Updated" : "New Review Received",
      message: `${member.user.name || 'Anonymous user'} ${existingReview ? 'updated their' : 'left a'} ${rating}-star review.`,
    }
  })

  return finalReview
}

