import { prisma } from '../shared/prisma'

/**
 * Standardizes time formatting for attendance logs.
 * We use 'en-IN' and 'Asia/Kolkata' to ensure consistency across different
 * server environments and to match the gym's local operational hours.
 */
export function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null

  return value.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}

/**
 * Retrieves past attendance records for a specific member.
 * Useful for building the member's activity dashboard or history page.
 */
export async function getAttendanceRecords(memberId: string, limit?: number) {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { memberId },
      orderBy: { date: 'desc' },
      take: limit
    })
    return {
      data: records.map((record) => ({
        ...record,
        // Extracting just the date part for easier display on the frontend
        date: record.date.toISOString().split('T')[0],
        checkIn: formatAttendanceTime(record.checkIn),
        checkOut: formatAttendanceTime(record.checkOut),
      }))
    }
  } catch (error) {
    return { error: 'Failed to fetch attendance records', status: 500 }
  }
}

/**
 * Handles the logic for checking into the gym via QR code.
 * Includes safety checks for membership expiration and duplicate check-ins.
 */
export async function markAttendance(memberId: string, code: string) {
  if (!code) {
    return { error: 'QR Code is required', status: 400 }
  }

  try {
    // Currently using a static QR to prevent spoofing without needing dynamic generation
    if (code !== 'soulrep-checkin-static-qr') {
      return { error: 'Invalid QR Code', status: 400 }
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Verify the member exists before proceeding
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) {
      return { error: 'Member profile not found', status: 404 }
    }

    // Safety check: Don't allow check-ins if the membership has expired
    if (new Date() > new Date(member.planExpiry)) {
      return { error: 'Membership plan has expired', status: 403 }
    }

    // Prevent multiple check-ins on the same day to maintain data integrity
    const existing = await prisma.attendanceRecord.findFirst({
      where: { memberId, date: new Date(todayStr + 'T00:00:00.000Z') }
    })

    if (existing) {
      return { error: 'Already checked in today', status: 400 }
    }

    const now = new Date()
    const today = new Date(todayStr + 'T00:00:00.000Z')

    // Using a transaction to ensure that we create the record AND update the counter together.
    // This prevents desync between the history list and the total count.
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.attendanceRecord.create({
        data: {
          memberId,
          date: today,
          checkIn: now,
          method: 'QR'
        }
      })

      // Increment the total count for quick display on statistics pages
      await tx.member.update({
        where: { id: memberId },
        data: {
          attendanceCount: { increment: 1 }
        }
      })

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
  } catch (err) {
    console.error('[MarkAttendance] Error:', err)
    return { error: 'Failed to record attendance', status: 500 }
  }
}

