import { PrismaClient } from '@prisma/client'

// Ensure the PrismaClient is a singleton in the Next.js dev server.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// For remote/serverless DBs (Neon, Supabase, etc.), cap the connection pool
// to prevent exhaustion from concurrent Next.js API route calls.
function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL || ''
  if (!url || url.includes('connection_limit')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}connection_limit=5&pool_timeout=30`
}

export const prisma: PrismaClient = global.prisma || new PrismaClient({
  datasources: { db: { url: buildDatabaseUrl() } },
  log: ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
