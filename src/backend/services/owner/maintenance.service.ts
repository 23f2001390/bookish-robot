import { prisma } from '../../shared/prisma'

/**
 * The "Daily Janitor" for the gym. 
 * This service automatically handles the lifecycle of memberships by 
 * expiring old ones and warning those nearing their end.
 */
export async function runMembershipMaintenance() {
  try {
    const now = new Date()
    const in3days = new Date()
    in3days.setDate(now.getDate() + 3)

    // 1. First, we sweep the database to see whose time has run out.
    // If their expiry is in the past, they are officially EXPIRED.
    const expiredUpdate = await prisma.member.updateMany({
      where: {
        planExpiry: { lt: now },
        planStatus: { not: 'EXPIRED' } // Only update if we haven't already.
      },
      data: { planStatus: 'EXPIRED' }
    })

    // 2. Next, we flag people who have less than 3 days left as "EXPIRING".
    // This helps the UI show a warning/red badge before they are cut off.
    const expiringSoonUpdate = await prisma.member.updateMany({
      where: {
        planExpiry: { gte: now, lte: in3days },
        planStatus: 'ACTIVE'
      },
      data: { planStatus: 'EXPIRING' }
    })

    // 3. Now we send push-style notifications to those who just entered the "Expiring" zone.
    // We check for notifications sent in the last 24h to avoid spamming the user 
    // every time the dashboard is loaded.
    const expiringMembers = await prisma.member.findMany({
      where: {
        planStatus: 'EXPIRING',
        planExpiry: { gte: now, lte: in3days }
      },
      include: { user: { select: { name: true } } }
    })

    const notificationsCreated = []
    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)

    for (const member of expiringMembers) {
      // Deduplication check: did we already yell at them today?
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: member.id,
          title: 'Plan Expiring Soon',
          createdAt: { gte: yesterday }
        }
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: member.id,
            title: 'Plan Expiring Soon',
            message: `Hello ${member.user.name?.split(' ')[0] || 'Member'}, your plan expires on ${member.planExpiry.toLocaleDateString()}. Renew soon to continue!`,
            read: false
          }
        })
        notificationsCreated.push(member.id)
      }
    }

    // 4. Finally, send a "Final Notice" notification for those who just expired.
    const expiredMembers = await prisma.member.findMany({
      where: { planStatus: 'EXPIRED' },
      include: { user: { select: { name: true } } }
    })

    for (const member of expiredMembers) {
        const existingExpiredNotif = await prisma.notification.findFirst({
            where: {
                userId: member.id,
                title: 'Plan Expired',
                createdAt: { gte: yesterday }
            }
        })

        if (!existingExpiredNotif) {
            await prisma.notification.create({
                data: {
                    userId: member.id,
                    title: 'Plan Expired',
                    message: `Your membership plan has expired. Please contact the owner for renewal.`,
                    read: false
                }
            })
        }
    }

    return { 
      success: true, 
      expiredUpdated: expiredUpdate.count, 
      expiringUpdated: expiringSoonUpdate.count,
      notificationsSent: notificationsCreated.length
    }
  } catch (error) {
    console.error('Error in membership maintenance:', error)
    return { error: 'Maintenance failed', status: 500 }
  }
}

