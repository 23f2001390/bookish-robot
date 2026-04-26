import { prisma } from '../../shared/prisma'

/**
 * Standard utility to format raw database timestamps into readable Indian Standard Time.
 */
function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null

  return value.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}

/**
 * Fetches the complete attendance log for all gym members.
 * This is used for the owner's "Attendance Dashboard" to see 
 * who is currently in the gym or who visited recently.
 */
export async function getAttendanceRecords() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: { member: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' }
    })
    return { data: records.map(r => ({
      id: r.id, memberId: r.memberId, memberName: r.member?.user?.name || 'Unknown',
      date: r.date.toISOString().split('T')[0],
      checkIn: formatAttendanceTime(r.checkIn),
      checkOut: formatAttendanceTime(r.checkOut),
      method: r.method
    }))}
  } catch (error) {
    console.error('Error in getAttendanceRecords:', error)
    return { error: 'Failed to fetch attendance records', status: 500 }
  }
}

/**
 * Handles manual check-ins by the owner.
 * Use this when a member forgets their phone or the QR scanner is down.
 */
export async function markManualAttendance(memberId: string) {
  if (!memberId) return { error: 'Member ID is required', status: 400 }
  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return { error: 'Member profile not found', status: 404 }

    const todayStr = new Date().toISOString().split('T')[0]
    const today = new Date(todayStr + 'T00:00:00.000Z')
    const now = new Date()
    
    // Safety check: ensure they aren't double-dipping attendance counts for the day.
    const existing = await prisma.attendanceRecord.findFirst({ where: { memberId, date: today } })
    if (existing) return { error: 'Member already checked in today', status: 400 }

    const record = await prisma.$transaction(async (tx) => {
      // 1. Log the manual entry
      const newRecord = await tx.attendanceRecord.create({ data: { memberId, date: today, checkIn: now, method: 'MANUAL' } })
      // 2. Increment the member's lifetime attendance count.
      await tx.member.update({ where: { id: memberId }, data: { attendanceCount: { increment: 1 } } })
      return newRecord
    })
    
    return {
      data: {
        ...record,
        date: record.date.toISOString().split('T')[0],
        checkIn: formatAttendanceTime(record.checkIn),
        checkOut: formatAttendanceTime(record.checkOut),
      },
      status: 201
    }
  } catch (error) {
    console.error('[MarkManualAttendance] Error:', error)
    return { error: 'Failed to record manual attendance', status: 500 }
  }
}

