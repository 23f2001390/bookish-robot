import bcrypt from 'bcryptjs'

/**
 * Hash a plaintext password using bcrypt. Bcrypt incorporates a salt and an
 * adaptive cost factor, making it resistant to rainbow table and brute‑force
 * attacks【171571983526134†L146-L151】. The default salt rounds (10) provide a good
 * balance between security and performance.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a candidate password against a stored bcrypt hash. Returns true if
 * they match.
 */
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed)
}

// We previously exposed helper functions for creating and verifying JWTs here.
// Since the application now uses NextAuth for authentication, JWT creation and
// verification are handled internally by NextAuth. The only remaining functions
// exported from this module are `hashPassword` and `verifyPassword` for use
// during sign‑up and credential validation. JWT helpers have been removed.