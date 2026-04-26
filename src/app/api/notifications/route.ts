import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getNotifications, markAsRead } from '@/backend/services/notification.service'

/**
 * Controller for grabbing a user's alerts/messages.
 * We use the 'authenticate' middleware to ensure that users can only 
 * see notifications meant for their specific userId.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate() 
  if (auth.error) return auth.error

  const { data, error, status } = await getNotifications(auth.user.id)
  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}

/**
 * Handles toggling the 'read' status of notifications.
 * Supports both single-notification updates (via 'id') and 
 * mass updates (via 'readAll' flag).
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate() // Identity verification.
  if (auth.error) return auth.error

  try {
    const { id, readAll } = await req.json()
    const result = await markAsRead(auth.user.id, id, readAll)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}


