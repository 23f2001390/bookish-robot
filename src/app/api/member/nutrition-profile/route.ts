import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/nutrition-profile
 *
 * Returns the nutrition profile for the authenticated member. The profile
 * includes age, weight, height, fitness goal, activity level,
 * dietary preference, allergies, restrictions and whether the setup
 * is completed. Only members can access this endpoint.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const profile = await prisma.nutritionProfile.findUnique({
      where: { memberId: id }
    })
    if (!profile) {
      return NextResponse.json({ error: 'Nutrition profile not found' }, { status: 404 })
    }
    return NextResponse.json({
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      fitnessGoal: profile.fitnessGoal,
      activityLevel: profile.activityLevel,
      dietaryPreference: profile.dietaryPreference,
      allergies: profile.allergies,
      restrictions: profile.restrictions,
      completed: profile.completed
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}