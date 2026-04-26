"use client";

import { useEffect, useState } from "react";
import { ActivityLevel, DietaryPreference, FitnessGoal } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Scale, Sparkles, Utensils } from "lucide-react";

type NutritionFormData = {
  age: string;
  weight: string;
  height: string;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  cuisinePreference: string;
  usualDiet: string;
  allergies: string[];
  restrictions: string[];
};

const fitnessGoalOptions: Array<{ value: FitnessGoal; label: string }> = [
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "FAT_LOSS", label: "Fat Loss / Shred" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "FLEXIBILITY", label: "Flexibility" },
];

const activityLevelOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: "SEDENTARY", label: "Sedentary" },
  { value: "LIGHT", label: "Lightly Active" },
  { value: "MODERATE", label: "Moderately Active" },
  { value: "ACTIVE", label: "Active" },
  { value: "VERY_ACTIVE", label: "Very Active" },
];

const dietaryPreferenceOptions: Array<{ value: DietaryPreference; label: string }> = [
  { value: "VEG", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "EGGETARIAN", label: "Eggetarian" },
  { value: "PESCATARIAN", label: "Pescatarian" },
];

const initialFormData: NutritionFormData = {
  age: "",
  weight: "",
  height: "",
  fitnessGoal: "MUSCLE_GAIN",
  activityLevel: "MODERATE",
  dietaryPreference: "VEG",
  cuisinePreference: "South Indian",
  usualDiet: "",
  allergies: [],
  restrictions: [],
};

const NUTRITION_REQUEST_TIMEOUT_MS = 45000;

export default function NutritionCoach() {
  const [profile, setProfile] = useState<any>(null);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<NutritionFormData>(initialFormData);

  useEffect(() => {
    void fetchNutrition();
  }, []);

  async function fetchNutrition() {
    try {
      setError(null);
      const res = await fetch("/api/member/nutrition", { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load nutrition data");
      }

      if (data?.profile) {
        setProfile(data.profile);
        setFormData((current) => ({
          ...current,
          age: data.profile.age?.toString() || "",
          weight: data.profile.weight?.toString() || "",
          height: data.profile.height?.toString() || "",
          fitnessGoal: data.profile.fitnessGoal ?? current.fitnessGoal,
          activityLevel: data.profile.activityLevel ?? current.activityLevel,
          dietaryPreference: data.profile.dietaryPreference ?? current.dietaryPreference,
          cuisinePreference: data.profile.cuisinePreference || current.cuisinePreference,
          usualDiet: data.profile.usualDiet || "",
          allergies: Array.isArray(data.profile.allergies) ? data.profile.allergies : [],
          restrictions: Array.isArray(data.profile.restrictions) ? data.profile.restrictions : [],
        }));
      }

      setMealPlans(Array.isArray(data?.mealPlans) ? data.mealPlans : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), NUTRITION_REQUEST_TIMEOUT_MS);
      const res = await fetch("/api/member/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate nutrition plan");
      }

      setSuccess(true);
      await fetchNutrition();
    } catch (err) {
      console.error(err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Nutrition request timed out. Try again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate nutrition plan");
      }
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {profile?.completed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Protein Target</p>
                  <h3 className="text-2xl font-bold">{profile.targetProtein ?? 0}g</h3>
                </div>
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                  <Scale size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Calories</p>
                  <h3 className="text-2xl font-bold">{profile.targetCalories ?? 0} kcal</h3>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Utensils size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Carbs</p>
                  <h3 className="text-2xl font-bold">{profile.targetCarbs ?? 0}g</h3>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Utensils size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fat</p>
                  <h3 className="text-2xl font-bold">{profile.targetFat ?? 0}g</h3>
                </div>
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Utensils size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              AI Diet Settings
            </CardTitle>
            <CardDescription>Customize your nutrition plan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(event) => setFormData({ ...formData, age: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(event) => setFormData({ ...formData, weight: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={formData.height}
                  onChange={(event) => setFormData({ ...formData, height: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fitness Goal</Label>
                <Select
                  value={formData.fitnessGoal}
                  onValueChange={(value) => setFormData({ ...formData, fitnessGoal: value as FitnessGoal })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fitnessGoalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => setFormData({ ...formData, activityLevel: value as ActivityLevel })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activityLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary Preference</Label>
                <Select
                  value={formData.dietaryPreference}
                  onValueChange={(value) => setFormData({ ...formData, dietaryPreference: value as DietaryPreference })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dietaryPreferenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cuisine Preference</Label>
                <Select
                  value={formData.cuisinePreference || "South Indian"}
                  onValueChange={(value) => setFormData({ ...formData, cuisinePreference: value || formData.cuisinePreference })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="South Indian">South Indian</SelectItem>
                    <SelectItem value="North Indian">North Indian</SelectItem>
                    <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="Continental">Continental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>What is your usual diet?</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 text-sm rounded-md border bg-background"
                  placeholder="e.g. 2 chapatis with dal for lunch, 1 glass of milk at night..."
                  value={formData.usualDiet}
                  onChange={(event) => setFormData({ ...formData, usualDiet: event.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Generating Plan...
                  </span>
                ) : (
                  "Update Plan"
                )}
              </Button>

              {success && <p className="text-xs text-muted-foreground">Nutrition plan updated.</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Diet Plan</CardTitle>
            <CardDescription>Your AI-generated meals based on your profile and activity level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!mealPlans.length ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <Utensils className="mx-auto text-muted-foreground mb-4" size={40} />
                <p className="text-muted-foreground">No plan generated yet. Save your settings to begin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...mealPlans].reverse().map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-xl bg-card/50">
                    <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                      <h4 className="font-bold">
                        {new Date(plan.date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-primary/5">{plan.totalProtein}g Protein</Badge>
                        <Badge variant="outline" className="bg-primary/5">{plan.totalCalories} kcal</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-1">
                      {plan.meals.map((meal: any) => (
                        <div key={meal.id} className="flex gap-3 items-start border-l-2 border-primary/20 pl-3">
                          <div>
                            <p className="font-bold text-xs uppercase text-muted-foreground">
                              {String(meal.type || "meal").replace(/_/g, " ")}
                            </p>
                            <p className="font-medium text-sm">{meal.name || meal.description}</p>
                            {meal.description && <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>}
                            <p className="text-[10px] bg-secondary px-2 py-0.5 rounded inline-block mt-1">
                              P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g · {meal.calories} kcal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
