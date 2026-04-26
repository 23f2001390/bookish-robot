import { PrismaClient } from '@prisma/client'

// Ensure the PrismaClient is a singleton in the Next.js dev server. Without
// this guard the client would be re‑instantiated on every reload, causing
// exhaustion of database connections. See the Prisma documentation.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma: PrismaClient = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}