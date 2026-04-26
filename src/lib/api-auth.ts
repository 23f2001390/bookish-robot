import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'

/**
 * This helper has been updated to use NextAuth sessions instead of JWTs. It
 * fetches the current session via `getAuthSession` and returns the user id
 * and role. If no session is present, it returns a 401 response.
 */
export async function requireAuth(req: NextRequest): Promise<{ id: string; role: string } | NextResponse> {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  return { id, role }
}