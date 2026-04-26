import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? ''

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const email = credentials.email.toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null
        const isValid = await compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email!, role: user.role }
      },
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  // We omit NextAuth's PrismaAdapter to manually handle account linking and
  // user creation for OAuth. This bypasses the strict `OAuthAccountNotLinked`
  // error, allowing us to safely link Google accounts to existing emails because
  // Google verifies emails.
  session: { strategy: 'jwt' },
  pages: { 
    signIn: '/login',
    newUser: '/dashboard/member'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user?.email) {
        const email = user.email.toLowerCase();
        
        let dbUser = await prisma.user.findUnique({ where: { email } });
        
        if (!dbUser) {
          // completely new user via Google
          dbUser = await prisma.user.create({
            data: {
              email: email,
              name: user.name,
              image: user.image,
              role: 'MEMBER',
              emailVerified: new Date(),
            }
          });
        }
        
        // Ensure their Google account is linked manually
        try {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              id_token: account.id_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
            },
            update: {
              access_token: account.access_token,
              id_token: account.id_token,
              expires_at: account.expires_at,
            }
          });
        } catch (e) {
          // Ignore unique constraint errors or long token errors
          console.error("Account upsert failed", e);
        }

        // Ensure a Member record exists for this user if they are a MEMBER
        if (dbUser.role === 'MEMBER') {
          const member = await prisma.member.findUnique({ where: { id: dbUser.id } });
          if (!member) {
            await prisma.member.create({
              data: {
                id: dbUser.id,
                joinDate: new Date(),
                plan: 'BASIC',
                planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                planStatus: 'ACTIVE',
                attendanceCount: 0,
                sessionsRemaining: 0,
                age: 18,
                gender: 'OTHER',
              },
            });
          }
        }
        
        // Mutate the user object so the jwt callback gets the real db user properties
        user.id = dbUser.id;
        (user as any).role = dbUser.role;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      
      // If we don't have role on the token yet, fetch it securely
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({ 
          where: { id: token.sub }, 
          select: { role: true, email: true } 
        });
        if (dbUser) {
          token.role = dbUser.role;
        } else if (token.email) {
          // fallback by email
          const fallbackUser = await prisma.user.findUnique({ where: { email: token.email }});
          if (fallbackUser) {
             token.sub = fallbackUser.id;
             token.role = fallbackUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
}
