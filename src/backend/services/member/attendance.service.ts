import { prisma } from '../../shared/prisma'

/**
 * Standardizes time formatting for attendance logs.
 * Forces IST (Asia/Kolkata) to keep time consistent for the local gym, 
 * regardless of where the server is hosted.
 */
function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null
  return value.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Retrieves the last N attendance records for a member to show in their history list.
 */
export async function getAttendanceRecords(memberId: string, limit?: number) {
  try {
    const records = await prisma.attendanceRecord.findMany({ where: { memberId }, orderBy: { date: 'desc' }, take: limit })
    return { data: records.map(record => ({ 
      ...record, date: record.date.toISOString().split('T')[0], 
      checkIn: formatAttendanceTime(record.checkIn), checkOut: formatAttendanceTime(record.checkOut) 
    }))}
  } catch (error) {
    return { error: 'Failed to fetch attendance records', status: 500 }
  }
}

/**
 * Marks a new check-in for the member.
 * Checks for a valid static QR code and ensures the user hasn't already checked in today.
 */
export async function markAttendance(memberId: string, code: string) {
  if (!code) return { error: 'QR Code is required', status: 400 }
  
  // We use a static key for basic security. Validates that the user is scanning 
  // our physical QR posted at the gym.
  if (code !== 'soulrep-checkin-static-qr') return { error: 'Invalid QR Code', status: 400 }

  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return { error: 'Member profile not found', status: 404 }

    // Block the entry if the plan has expired.
    if (new Date() > new Date(member.planExpiry)) return { error: 'Membership plan has expired', status: 403 }

    const todayStr = new Date().toISOString().split('T')[0]
    const today = new Date(todayStr + 'T00:00:00.000Z')

    // Prevent duplicate entries for the same day.
    const existing = await prisma.attendanceRecord.findFirst({ where: { memberId, date: today } })
    if (existing) return { error: 'Already checked in today', status: 400 }

    const now = new Date()
    const record = await prisma.$transaction(async (tx) => {
      // 1. Create the detailed record
      const newRecord = await tx.attendanceRecord.create({ data: { memberId, date: today, checkIn: now, method: 'QR' } })
      
      // 2. Increment the total counter on the Member record for fast display in stats.
      await tx.member.update({ where: { id: memberId }, data: { attendanceCount: { increment: 1 } } })
      
      return newRecord
    })

    return { 
      data: { ...record, date: record.date.toISOString().split('T')[0], 
      checkIn: formatAttendanceTime(record.checkIn), checkOut: formatAttendanceTime(record.checkOut) }, 
      status: 201 
    }
  } catch (err) {
    console.error('[MarkAttendance] Error:', err)
    return { error: 'Failed to record attendance', status: 500 }
  }
}

