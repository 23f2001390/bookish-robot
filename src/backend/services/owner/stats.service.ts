import { prisma } from '../../shared/prisma'
import { runMembershipMaintenance } from './maintenance.service'

/**
 * Grabs the high-level Key Performance Indicators for the gym dashboard.
 * Before calculating, it triggers a maintenance check to ensure 
 * plan statuses (Active/Expired) are up to date.
 */
export async function getKPIs() {
  try {
    // 1. Refresh plan statuses based on today's date.
    await runMembershipMaintenance()

    const totalMembers = await prisma.member.count()
    const activePlans = await prisma.member.count({ where: { planStatus: 'ACTIVE' } })
    
    // 2. Sum up all revenue from PAID invoices only.
    const revenueAgg = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    })
    const revenue = revenueAgg._sum.amount ?? 0
    
    // 3. Count members whose plans lapse in the next 7 days.
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    const expiringSoon = await prisma.member.count({
      where: { planExpiry: { lte: in7days } }
    })
    return { data: { totalMembers, activePlans, revenue, expiringSoon } }
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return { error: 'Failed to fetch KPIs', status: 500 }
  }
}

/**
 * Builds a 6-month historical revenue trend for the dashboard chart.
 */
export async function getRevenueData() {
  try {
    const now = new Date()
    const months: any[] = []
    
    // Loop backwards from the current month to gather half a year of data.
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(dt)
      const end = new Date(dt)
      end.setMonth(dt.getMonth() + 1)
      
      const invoices = await prisma.invoice.findMany({
        where: { status: 'PAID', date: { gte: start, lt: end } },
        select: { amount: true, memberId: true }
      })
      
      const revenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
      const uniqueMembers = new Set(invoices.map(inv => inv.memberId))
      
      months.push({ 
        month: dt.toLocaleString('default', { month: 'short' }), 
        revenue, 
        members: uniqueMembers.size 
      })
    }
    return { data: months }
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return { error: 'Failed to fetch revenue data', status: 500 }
  }
}

/**
 * Compiles a leaderboard of trainers based on member reviews.
 */
export async function getTrainerRatings() {
  try {
    const trainers = await prisma.trainer.findMany({
      include: {
        user: { select: { name: true } },
        Review: { select: { rating: true } }
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
        rating: avgRating,
        reviewCount: reviewCount
      }
    }).sort((a, b) => b.rating - a.rating) // Best rated first.

    return { data: result }
  } catch (error) {
    console.error('Error fetching trainer ratings:', error)
    return { error: 'Failed to fetch trainer ratings', status: 500 }
  }
}

/**
 * Lists members whose memberships are approaching the expiration date.
 */
export async function getExpiringMembers() {
  try {
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    
    const expiring = await prisma.member.findMany({
      where: { planExpiry: { lte: in7days } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { planExpiry: 'asc' }
    })
    
    return { data: expiring.map(m => ({ 
      id: m.id, 
      name: m.user?.name || 'Unknown', 
      email: m.user?.email || 'N/A', 
      plan: m.plan, 
      expiry: m.planExpiry, 
      planStatus: m.planStatus 
    })) }
  } catch (error) {
    console.error('Error fetching expiring members:', error)
    return { error: 'Failed to fetch expiring members', status: 500 }
  }
}

/**
 * Blasts notifications to all members expiring in the next 7 days.
 * This is meant to be called manually or by a cron job.
 */
export async function sendExpiryReminders() {
  try {
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    
    const expiring = await prisma.member.findMany({
      where: {
        planExpiry: { lte: in7days, gte: now },
        planStatus: { not: 'EXPIRED' }
      },
      include: { user: { select: { name: true } } }
    })

    if (expiring.length === 0) {
      return { data: { count: 0 } }
    }

    const notifications = expiring.map(m => ({
      userId: m.id,
      title: "Plan Expiring Soon",
      message: `Hey ${m.user.name?.split(' ')[0] || 'Member'}, your membership plan is expiring on ${m.planExpiry.toLocaleDateString()}. Please contact the owner for renewal soon to avoid interruption.`,
      read: false
    }))

    // Batch insert helps performance if there are many expiring members.
    await prisma.notification.createMany({
      data: notifications
    })

    return { data: { count: notifications.length } }
  } catch (error) {
    console.error('Error sending expiry reminders:', error)
    return { error: 'Failed to send reminders', status: 500 }
  }
}

