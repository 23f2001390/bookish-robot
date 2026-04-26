import { prisma } from '../shared/prisma'
import { generateWeeklyDietPlan } from '@/lib/ai-nutritionist'

// We set a 60-second limit to prevent long-running AI requests from hanging the server.
const GEMINI_TIMEOUT_MS = 60000

/**
 * Fetches the current diet profile and the last 7 days of meal plans.
 * Used for displaying the member's nutrition dashboard.
 */
export async function getNutritionProfile(memberId: string) {
  const profile = await prisma.nutritionProfile.findUnique({
    where: { memberId },
  })

  const mealPlans = await prisma.mealPlan.findMany({
    where: { memberId },
    orderBy: { date: 'desc' },
    // Show the full current week only
    take: 7,
    include: { meals: true }
  })

  return { profile, mealPlans }
}

/**
 * The core logic for generating a personalized diet plan using Google Gemini.
 * Updates the user's data and creates a 7-day meal plan based on AI suggestions.
 */
export async function generateAndSaveDietPlan(memberId: string, data: any) {
  // First, we update the user's profile with their new stats (age, weight, height, etc.)
  // or create it if this is their first time onboarding.
  const profile = await prisma.nutritionProfile.upsert({
    where: { memberId },
    update: {
      age: data.age,
      weight: data.weight,
      height: data.height,
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      dietaryPreference: data.dietaryPreference,
      cuisinePreference: data.cuisinePreference,
      usualDiet: data.usualDiet,
      allergies: data.allergies,
      restrictions: data.restrictions,
      completed: true
    },
    create: {
      memberId,
      age: data.age,
      weight: data.weight,
      height: data.height,
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      dietaryPreference: data.dietaryPreference,
      cuisinePreference: data.cuisinePreference,
      usualDiet: data.usualDiet,
      allergies: data.allergies,
      restrictions: data.restrictions,
      completed: true
    }
  })

  // We call our Gemini integration to generate the full week's worth of meals.
  // Using Promise.race ensures we don't wait forever if the API is slow.
  console.log('[nutrition-api] Initiating AI diet plan generation...')
  const aiResponse: any = await Promise.race([
    generateWeeklyDietPlan(profile),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI generation timed out after ${GEMINI_TIMEOUT_MS / 1000}s.`)), GEMINI_TIMEOUT_MS)
    }),
  ])

  // Store the macro targets calculated by the AI back into the profile
  await prisma.nutritionProfile.update({
    where: { id: profile.id },
    data: {
      targetCalories: aiResponse.targets.calories,
      targetProtein: aiResponse.targets.protein,
      targetCarbs: aiResponse.targets.carbs,
      targetFat: aiResponse.targets.fat,
    }
  })

  // Clean out any old/outdated plans before saving the new 7-day cycle.
  const today = new Date()
  await prisma.mealPlan.deleteMany({
    where: { memberId }
  })

  // Group and save the AI-generated meals into our database structure.
  for (let i = 0; i < aiResponse.weeklyPlan.length; i++) {
    const dayData = aiResponse.weeklyPlan[i]
    const planDate = new Date(today)
    planDate.setDate(today.getDate() + i)
    
    // The AI returns a list of meals; we categorize them (Breakfast, Lunch, etc.) 
    // by scanning keywords in the suggested meal time or name.
    const meals = dayData.meals.map((meal: any) => {
      let type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" = "SNACK";
      const mealName = (meal.time || "").toUpperCase();
      if (mealName.includes("BREAKFAST")) type = "BREAKFAST";
      else if (mealName.includes("LUNCH")) type = "LUNCH";
      else if (mealName.includes("DINNER")) type = "DINNER";

      return {
        type,
        name: meal.name || meal.description.substring(0, 50),
        description: meal.description,
        calories: Math.round(meal.calories || 0),
        protein: Math.round(meal.protein || 0),
        carbs: Math.round(meal.carbs || 0),
        fat: Math.round(meal.fat || 0),
        completed: false
      }
    })

    await prisma.mealPlan.create({
      data: {
        memberId,
        date: planDate,
        totalCalories: meals.reduce((sum: number, m: any) => sum + m.calories, 0),
        totalProtein: meals.reduce((sum: number, m: any) => sum + m.protein, 0),
        totalCarbs: meals.reduce((sum: number, m: any) => sum + m.carbs, 0),
        totalFat: meals.reduce((sum: number, m: any) => sum + m.fat, 0),
        meals: {
          create: meals
        }
      }
    })
  }

  console.log('[nutrition-api] Plan generation successful')
  return {
    success: true,
    message: "Your personalized AI plan has been generated!",
    supplement: aiResponse.supplementRecommendation
  }
}

