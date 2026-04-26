import { NextResponse } from 'next/server'
import { getAuthSession } from '../shared/auth-session'

/**
 * Ensures the user is authenticated and has the correct role.
 * If authorized, it returns the session, otherwise it returns a NextResponse.
 */
export async function authenticate(allowedRoles?: string[]) {
  const session = await getAuthSession()
  
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const user = session.user as any
  if (allowedRoles && !allowedRoles.some(role => role.toUpperCase() === user.role?.toUpperCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session, user }
}

