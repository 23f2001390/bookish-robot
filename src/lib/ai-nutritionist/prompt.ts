import { NutritionProfileData } from "./types";

export function buildNutritionPrompt(profile: NutritionProfileData): string {
  return `
You are an expert AI nutritionist for "SoulRep Gym", a premium fitness center in India.

Member Details:
- Age: ${profile.age ?? "Not provided"}
- Weight: ${profile.weight ?? "Not provided"} kg
- Height: ${profile.height ?? "Not provided"} cm
- Goal: ${profile.fitnessGoal}
- Activity Level: ${profile.activityLevel}
- Dietary Preference: ${profile.dietaryPreference}
- Cuisine Preference: ${profile.cuisinePreference || "Indian"}
- Usual Diet: ${profile.usualDiet || "Not provided"}
- Allergies: ${profile.allergies.join(", ") || "None"}
- Restrictions: ${profile.restrictions.join(", ") || "None"}

Tasks:
1. Calculate daily macro targets for calories, protein, carbs, and fat.
2. Recommend whether whey protein, plant protein, or no supplement is appropriate.
3. Generate a 7-day meal plan for Monday through Sunday.
4. Use realistic Indian meals and ingredients aligned with the dietary preference and listed restrictions.
5. If "No Onion & Garlic" is in restrictions, strictly exclude both.
6. Crucial: If the user's cuisine preference is highly carb-heavy or low-protein (e.g., South Indian eating idli/dosa/rice), you MUST include a daily Protein Shake (Whey or Plant) in their 'snack' meal to safely reach their high protein macro targets.

Return strictly valid JSON only matching this exact structure:
{
  "targets": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "supplementRecommendation": string,
  "weeklyPlan": [
    {
      "day": string,
      "meals": [
        {
          "time": string,
          "name": string,
          "description": string,
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ]
    }
  ]
}

Use numeric values only for calories, protein, carbs, and fat. Do not include units in JSON.
`;
}
