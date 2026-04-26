import {
  GeneratedNutritionMeal,
  GeneratedNutritionTargets,
  GeneratedWeeklyDietPlan,
} from "./types";

const fallbackDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Gemini returned an invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed <= 0) {
    throw new Error(`Gemini returned an invalid ${label}.`);
  }

  return parsed;
}

function optionalNonNegativeNumber(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function roundNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function fillMetric(values: Array<number | null>, targetTotal: number, weights: number[]): number[] {
  const safeTargetTotal = Math.max(0, targetTotal);
  const knownTotal = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const missingIndexes = values
    .map((value, index) => (value === null ? index : -1))
    .filter((index) => index >= 0);

  if (missingIndexes.length === 0) {
    return values.map((value) => roundNonNegative(value ?? 0));
  }

  const remaining = Math.max(0, safeTargetTotal - knownTotal);
  const missingWeightTotal = missingIndexes.reduce<number>(
    (sum, index) => sum + (weights[index] > 0 ? weights[index] : 1),
    0,
  );

  return values.map((value, index) => {
    if (value !== null) {
      return roundNonNegative(value);
    }

    const weight = weights[index] > 0 ? weights[index] : 1;
    const share = missingWeightTotal > 0 ? weight / missingWeightTotal : 1 / missingIndexes.length;
    return roundNonNegative(remaining * share);
  });
}

export function extractJson(text: string): string {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");

  if (start === -1) {
    throw new Error("Gemini did not return valid JSON.");
  }

  // Walk forward counting braces to find the end of the first complete object
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return trimmed.slice(start, i + 1); }
  }

  throw new Error("Gemini did not return valid JSON.");
}

function normalizeTargets(rawTargets: unknown): GeneratedNutritionTargets {
  const targets = asRecord(rawTargets, "targets");

  return {
    calories: roundNonNegative(requirePositiveNumber(targets.calories, "target calories")),
    protein: roundNonNegative(requirePositiveNumber(targets.protein, "target protein")),
    carbs: roundNonNegative(requirePositiveNumber(targets.carbs, "target carbs")),
    fat: roundNonNegative(requirePositiveNumber(targets.fat, "target fat")),
  };
}

function normalizeMeals(rawMeals: unknown, targets: GeneratedNutritionTargets): GeneratedNutritionMeal[] {
  if (!Array.isArray(rawMeals) || rawMeals.length === 0) {
    throw new Error("Gemini returned a day without meals.");
  }

  const meals = rawMeals.map((entry, index) => {
    const meal = asRecord(entry, `meal ${index + 1}`);
    const time = typeof meal.time === "string" && meal.time.trim() ? meal.time.trim() : `Meal ${index + 1}`;
    const description =
      typeof meal.description === "string" && meal.description.trim()
        ? meal.description.trim()
        : typeof meal.name === "string" && meal.name.trim()
          ? meal.name.trim()
          : `${time} meal`;
    const name =
      typeof meal.name === "string" && meal.name.trim()
        ? meal.name.trim()
        : description.split(/[.!?]/)[0]?.trim().slice(0, 60) || time;

    return {
      time,
      name,
      description,
      calories: optionalNonNegativeNumber(meal.calories),
      protein: optionalNonNegativeNumber(meal.protein),
      carbs: optionalNonNegativeNumber(meal.carbs),
      fat: optionalNonNegativeNumber(meal.fat),
    };
  });

  const normalizedCalories = fillMetric(
    meals.map((meal) => meal.calories),
    targets.calories,
    meals.map((meal) => meal.calories ?? 1),
  );
  const calorieWeights = normalizedCalories.map((calories) => (calories > 0 ? calories : 1));

  const normalizedProtein = fillMetric(
    meals.map((meal) => meal.protein),
    targets.protein,
    calorieWeights,
  );
  const normalizedCarbs = fillMetric(
    meals.map((meal) => meal.carbs),
    targets.carbs,
    calorieWeights,
  );
  const normalizedFat = fillMetric(
    meals.map((meal) => meal.fat),
    targets.fat,
    calorieWeights,
  );

  return meals.map((meal, index) => ({
    time: meal.time,
    name: meal.name,
    description: meal.description,
    calories: normalizedCalories[index],
    protein: normalizedProtein[index],
    carbs: normalizedCarbs[index],
    fat: normalizedFat[index],
  }));
}

export function normalizePlan(raw: unknown): GeneratedWeeklyDietPlan {
  const plan = asRecord(raw, "nutrition plan");
  const targets = normalizeTargets(plan.targets);
  const weeklyPlan = Array.isArray(plan.weeklyPlan) ? plan.weeklyPlan : null;

  if (!weeklyPlan || weeklyPlan.length === 0) {
    throw new Error("Gemini returned an empty weekly plan.");
  }

  return {
    targets,
    supplementRecommendation:
      typeof plan.supplementRecommendation === "string" && plan.supplementRecommendation.trim()
        ? plan.supplementRecommendation.trim()
        : "Use protein powder only if you cannot consistently hit your protein target through meals.",
    weeklyPlan: weeklyPlan.map((entry, index) => {
      const dayPlan = asRecord(entry, `weekly plan day ${index + 1}`);

      return {
        day:
          typeof dayPlan.day === "string" && dayPlan.day.trim()
            ? dayPlan.day.trim()
            : fallbackDays[index] || `Day ${index + 1}`,
        meals: normalizeMeals(dayPlan.meals, targets),
      };
    }),
  };
}
