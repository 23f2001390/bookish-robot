import { prisma } from '../../shared/prisma'

/**
 * Grabs all feedback left by members for this specific trainer.
 * We order them from newest to oldest so the trainer can always see 
 * their most relevant/recent feedback first.
 */
export async function getTrainerReviews(trainerId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { trainerId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        rating: true,
        feedback: true,
        date: true,
      }
    })
    return { data: reviews }
  } catch (error) {
    console.error('Error in getTrainerReviews:', error)
    return { error: 'Failed to fetch trainer reviews', status: 500 }
  }
}

