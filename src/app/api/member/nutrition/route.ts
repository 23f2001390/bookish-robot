import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getNutritionProfile, generateAndSaveDietPlan } from '@/backend/services/nutrition.service'

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNullableFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// GET: Fetch current nutrition profile and plans
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const data = await getNutritionProfile(auth.user.id)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update profile and trigger AI generation
export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const rawData = await req.json()
    const data = {
      age: parseNullableInt(rawData.age),
      weight: parseNullableFloat(rawData.weight),
      height: parseNullableFloat(rawData.height),
      fitnessGoal: rawData.fitnessGoal,
      activityLevel: rawData.activityLevel,
      dietaryPreference: rawData.dietaryPreference,
      cuisinePreference: rawData.cuisinePreference,
      usualDiet: rawData.usualDiet,
      allergies: parseStringArray(rawData.allergies),
      restrictions: parseStringArray(rawData.restrictions),
    }
    
    const result = await generateAndSaveDietPlan(auth.user.id, data)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error("Nutrition POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI plan" }, { status: 500 })
  }
}

