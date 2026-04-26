import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/meal-plan
 *
 * Returns the latest meal plan for the authenticated member. The meal
 * plan includes the date, total calories, total protein, carbs and
 * fat, and a list of meals. Each meal includes the type,
 * name, calories, protein, carbs, fat and whether it has been
 * completed (default false). Only members can access this endpoint.
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
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { memberId: id },
      orderBy: { date: 'desc' },
      include: { meals: true }
    })
    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }
    // Map meals to include completed flag default false (client can toggle)
    const meals = mealPlan.meals.map(m => ({
      id: m.id,
      type: m.type,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      completed: false
    }))
    return NextResponse.json({
      id: mealPlan.id,
      date: mealPlan.date,
      totalCalories: mealPlan.totalCalories,
      totalProtein: mealPlan.totalProtein,
      totalCarbs: mealPlan.totalCarbs,
      totalFat: mealPlan.totalFat,
      meals
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}