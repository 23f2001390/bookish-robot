import { NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { sendExpiryReminders } from '@/backend/services/owner/stats.service'

export async function POST() {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error

  const { data, error, status } = await sendExpiryReminders()
  if (error) return NextResponse.json({ error }, { status: status || 500 })

  return NextResponse.json(data)
}
