import { getGeminiClient, getGeminiErrorMessage, MODEL_NAME } from "./client";
import { extractJson, normalizePlan } from "./normalize";
import { buildNutritionPrompt } from "./prompt";
import { GeneratedWeeklyDietPlan, NutritionProfileData } from "./types";

export type {
  GeneratedNutritionDayPlan,
  GeneratedNutritionMeal,
  GeneratedNutritionTargets,
  GeneratedWeeklyDietPlan,
  NutritionProfileData,
} from "./types";

export async function generateWeeklyDietPlan(profile: NutritionProfileData): Promise<GeneratedWeeklyDietPlan> {
  const genai = getGeminiClient();
  const prompt = buildNutritionPrompt(profile);

  try {
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini returned an empty nutrition plan response.");
    }

    return normalizePlan(JSON.parse(extractJson(text)));
  } catch (error) {
    console.error("AI Nutritionist Error:", error);
    throw new Error(getGeminiErrorMessage(error));
  }
}
