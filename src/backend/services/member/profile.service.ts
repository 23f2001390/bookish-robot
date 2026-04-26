import { prisma } from '../../shared/prisma'

export async function getMemberProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Member: true }
  })

  if (!user) {
    return { error: 'User not found', status: 404 }
  }

  // Self-healing: Create missing Member profile if role is MEMBER
  if (user.role === 'MEMBER' && !user.Member) {
    console.log(`[Healing] Creating missing member profile for user: ${user.id}`)
    const newMember = await prisma.member.create({
      data: {
        id: user.id, joinDate: new Date(), plan: 'BASIC',
        planExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        planStatus: 'EXPIRED', attendanceCount: 0, sessionsRemaining: 0, age: 18, gender: 'OTHER'
      }
    })
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
        member: newMember
      }
    }
  }

  if (user.role !== 'MEMBER') {
    return { error: 'User is not a member', status: 403 }
  }

  return { data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }, member: user.Member } }
}

export async function updateMemberProfile(userId: string, data: any) {
  const { name, phone, password, age, gender } = data
  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (password !== undefined) {
    const { hashPassword } = await import('@/lib/auth')
    updateData.password = await hashPassword(password)
  }

  const memberUpdateData: any = {}
  if (age !== undefined) memberUpdateData.age = age
  if (gender !== undefined) memberUpdateData.gender = gender

  try {
    const result = await prisma.user.update({
      where: { id: userId },
      data: { ...updateData, Member: { update: { ...memberUpdateData } } },
      include: { Member: true }
    })
    return { data: { user: { id: result.id, email: result.email, name: result.name, role: result.role, phone: result.phone }, member: result.Member } }
  } catch (error) {
    console.error('[UpdateProfile] Error:', error)
    return { error: 'Failed to update profile', status: 500 }
  }
}

export async function getTrainerForMember(userId: string) {
  const member = await prisma.member.findUnique({ where: { id: userId }, select: { trainerId: true } })
  if (!member) return { error: 'Member profile not found', status: 404 }
  if (!member.trainerId) return { data: null, message: 'No trainer assigned' }
  const trainer = await prisma.trainer.findUnique({ where: { id: member.trainerId }, include: { user: true } })
  if (!trainer) return { error: 'Trainer not found', status: 404 }
  return { data: { 
    id: trainer.id, name: trainer.user?.name, specialization: trainer.specialization, 
    availability: trainer.availability, schedule: trainer.schedule 
  }}
}

export async function assignTrainer(userId: string, trainerId: string) {
  try {
    await prisma.member.update({ where: { id: userId }, data: { trainerId } })
    return { data: { success: true } }
  } catch (error) {
    return { error: 'Failed to assign trainer', status: 500 }
  }
}
