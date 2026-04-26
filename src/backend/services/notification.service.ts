import { prisma } from '../shared/prisma'

/**
 * Grabs the most recent 20 notifications for a user.
 * We limit this to 20 to keep the dashboard snappy and avoid 
 * loading months of old history unless requested.
 */
export async function getNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return { data: notifications }
  } catch (error) {
    return { error: 'Failed to fetch notifications', status: 500 }
  }
}

/**
 * Creates an in-app alert for a specific user.
 * Usually triggered by system events like new bookings, plan expirations,
 * or feedback from trainers.
 */
export async function createNotification(userId: string, title: string, message: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        read: false,
      }
    })
    return { data: notification }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { error: 'Failed to create notification', status: 500 }
  }
}

/**
 * Handles clearing notification badges.
 * Can either mark a single notification as read or bulk-clear everything.
 */
export async function markAsRead(userId: string, notificationId?: string, readAll: boolean = false) {
  try {
    if (readAll) {
      // Clear all unread markers for the user at once
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      })
    } else if (notificationId) {
      // Clear a specific notification (e.g. when the user clicks on it)
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { read: true }
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Error updating notification:', error)
    return { error: 'Failed to update notification', status: 500 }
  }
}

