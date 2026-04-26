import { prisma } from '../shared/prisma'
import { hashPassword } from '@/lib/auth'

/**
 * Updates core user profile information (Name, Phone, Password).
 * This logic is used by the "Edit Profile" dialog across all roles.
 * Optionally updates role-specific details like Age or Gender if the user is a member.
 */
export async function updateGenericProfile(userId: string, data: { 
  name?: string, 
  phone?: string, 
  password?: string,
  age?: number,
  gender?: string
}) {
  try {
    // First, verify the user's current role so we know which sub-tables to update.
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true }
    })
    
    if (!user) {
      return { error: 'User not found', status: 404 }
    }

    // Only hash the password if the user actually typed a new one.
    let hashedPassword = undefined
    if (data.password) {
      hashedPassword = await hashPassword(data.password)
    }

    // We use a transaction here because profile updates often span multiple tables 
    // (User and Member). If one fails, we want to roll back everything to stay consistent.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the base User table (common for everyone)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
        }
      })

      // 2. Update the Member-specific table if the user is a gym member.
      if (user.role === 'MEMBER') {
        const memberData: any = {}
        if (data.age !== undefined) memberData.age = data.age
        if (data.gender) memberData.gender = data.gender

        if (Object.keys(memberData).length > 0) {
          await tx.member.update({
            where: { id: userId },
            data: memberData
          })
        }
      }

      // Note: Trainer specialization isn't currently editable via the basic profile dialong,
      // but we could easily add a step 3 here for Trainers in the future.

      return updatedUser
    })

    return { data: { success: true } }
  } catch (err) {
    console.error('[UpdateGenericProfile] Error:', err)
    return { error: 'Internal server error', status: 500 }
  }
}

