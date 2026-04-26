import { ActivityLevel, DietaryPreference, FitnessGoal } from "@prisma/client";

export interface NutritionProfileData {
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  cuisinePreference?: string | null;
  usualDiet?: string | null;
  allergies: string[];
  restrictions: string[];
}

export interface GeneratedNutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GeneratedNutritionMeal {
  time: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GeneratedNutritionDayPlan {
  day: string;
  meals: GeneratedNutritionMeal[];
}

export interface GeneratedWeeklyDietPlan {
  targets: GeneratedNutritionTargets;
  supplementRecommendation: string;
  weeklyPlan: GeneratedNutritionDayPlan[];
}
