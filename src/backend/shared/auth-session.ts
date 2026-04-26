import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

/**
 * Helper to retrieve the current authenticated session on the server.
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions)
  return session
}
