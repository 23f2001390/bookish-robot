"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
// import { mealPlan, nutritionProfile } from "@/lib/mock-data";
import type { NutritionProfile, FitnessGoal, ActivityLevel, DietaryPreference, Meal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Apple, Flame, Beef, Wheat, Droplets,
  ChefHat, RefreshCw, Settings, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Authentication context
import { useAuth } from "@/lib/auth-context";

const fitnessGoals: { value: FitnessGoal; label: string }[] = [
  { value: "FAT_LOSS", label: "Fat Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "FLEXIBILITY", label: "Flexibility" },
];

const activityLevels: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "SEDENTARY", label: "Sedentary", desc: "Little to no exercise" },
  { value: "LIGHT", label: "Lightly Active", desc: "Exercise 1-3 days/week" },
  { value: "MODERATE", label: "Moderately Active", desc: "Exercise 3-5 days/week" },
  { value: "ACTIVE", label: "Active", desc: "Exercise 6-7 days/week" },
  { value: "VERY_ACTIVE", label: "Very Active", desc: "Intense exercise daily" },
];

const dietaryPreferences: { value: DietaryPreference; label: string }[] = [
  { value: "VEG", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "EGGETARIAN", label: "Eggetarian" },
  { value: "PESCATARIAN", label: "Pescatarian" },
];

const commonAllergies = ["Dairy (Milk/Dahi/Paneer)", "Gluten (Wheat/Atta)", "Mustard (Sarson)", "Nuts (Cashew/Badam)", "Soy", "Sesame (Til)", "Eggs", "Mushrooms"];
const commonRestrictions = ["No Onion & Garlic", "Pure Veg", "No Egg", "No Meat (Veg Only)", "Fasting (Vrat)", "No Alcohol", "No Sugar", "Low Sodium"];
const NUTRITION_REQUEST_TIMEOUT_MS = 45000;

export default function NutritionPage() {
  // Use user and loading state instead of token
  const { user, loading: authLoading } = useAuth();
  // Profile and meal plan data fetched from API
  const [profile, setProfile] = useState<any>({
    age: 0,
    weight: 0,
    height: 0,
    fitnessGoal: "MUSCLE_GAIN",
    activityLevel: "MODERATE",
    dietaryPreference: "NON_VEG",
    cuisinePreference: "north_indian",
    usualDiet: "",
    allergies: [],
    restrictions: []
  });
  const [allMealPlans, setAllMealPlans] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenating] = useState(false);
  const [editPrefs, setEditPrefs] = useState(false);

  async function loadNutritionData(showPageLoader = true) {
    if (authLoading || !user) {
      if (!authLoading) setLoading(false);
      return;
    }

    try {
      if (showPageLoader) {
        console.log('[NutritionPage] loadNutritionData started');
        setLoading(true);
      }
      setError(null);
      console.log('[NutritionPage] Fetching /api/member/nutrition...');
      const res = await fetch('/api/member/nutrition', { credentials: 'include' });
      console.log('[NutritionPage] Response received:', res.status);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load nutrition data');
      }

      const data = await res.json();
      console.log('[NutritionPage] Data parsed:', !!data);
      const profileData = data.profile;
      const lastPlan = data.mealPlans?.[0];

      if (profileData) {
        setProfile({
          age: profileData.age,
          weight: profileData.weight,
          height: profileData.height,
          fitnessGoal: profileData.fitnessGoal,
          activityLevel: profileData.activityLevel,
          dietaryPreference: profileData.dietaryPreference,
          cuisinePreference: profileData.cuisinePreference || "north_indian",
          usualDiet: profileData.usualDiet || "",
          allergies: Array.isArray(profileData.allergies) ? [...profileData.allergies] : [],
          restrictions: Array.isArray(profileData.restrictions) ? [...profileData.restrictions] : [],
        });
        setShowOnboarding(!profileData.completed);
      }

      if (data.mealPlans && data.mealPlans.length > 0) {
        // Sort ascending so index 0 = today, index 1 = tomorrow
        const sortedPlans = data.mealPlans.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setAllMealPlans(sortedPlans);
        setMeals(sortedPlans[0].meals || []);
        setActiveTabIndex(0);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      if (showPageLoader) {
        setLoading(false);
      }
    }
  }

  // Fetch nutrition profile and meal plan on mount
  useEffect(() => {
    console.log('[NutritionPage] useEffect triggered', { authLoading, userId: user?.id });
    void loadNutritionData();
  }, [authLoading, user?.id]);

  const toggleAllergy = (allergy: string) => {
    const lower = allergy.toLowerCase();
    setProfile((p: any) => {
      const current = p || {};
      const allergies = current.allergies || [];
      const updated = allergies.includes(lower)
        ? allergies.filter((a: any) => a !== lower)
        : [...allergies, lower];
      return { ...current, allergies: updated };
    });
  };

  const toggleRestriction = (r: string) => {
    const lower = r.toLowerCase().replace(/ /g, "_");
    setProfile((p: any) => {
      const current = p || {};
      const restrictions = current.restrictions || [];
      const updated = restrictions.includes(lower)
        ? restrictions.filter((x: any) => x !== lower)
        : [...restrictions, lower];
      return { ...current, restrictions: updated };
    });
  };

  const toggleMealCompleted = (index: number) => {
    const updatedMeals = meals.map((m: any, i: number) => i === index ? { ...m, completed: !m.completed } : m);
    setMeals(updatedMeals);
    
    // Also save it back into the allMealPlans array to persist across tab switches
    setAllMealPlans(prev => {
      const copy = [...prev];
      if (copy[activeTabIndex]) {
        copy[activeTabIndex] = { ...copy[activeTabIndex], meals: updatedMeals };
      }
      return copy;
    });
  };

  const saveProfileAndGenerate = async () => {
    try {
      setSubmitting(true)
      setError(null)
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), NUTRITION_REQUEST_TIMEOUT_MS)
      const res = await fetch('/api/member/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile),
        signal: controller.signal,
      })
      window.clearTimeout(timeoutId)
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Failed to generate plan')

      await loadNutritionData(false)
    } catch (err: any) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Nutrition request timed out. Try again.')
      } else {
        setError(err.message || 'Failed to generate plan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegenerate = async () => {
    setRegenating(true);
    await saveProfileAndGenerate();
    setRegenating(false);
  };

  const activePlanData = allMealPlans[activeTabIndex];

  const completedCalories = meals.filter((m: any) => m.completed).reduce((a: number, m: any) => a + (m.calories || 0), 0);
  const totalCalories = activePlanData?.totalCalories || 0;
  const progressCalories = totalCalories > 0 ? Math.min(100, (completedCalories / totalCalories) * 100) : 0;

  const completedProtein = meals.filter((m: any) => m.completed).reduce((a: number, m: any) => a + (m.protein || 0), 0);
  const totalProtein = activePlanData?.totalProtein || 0;
  const progressProtein = totalProtein > 0 ? Math.min(100, (completedProtein / totalProtein) * 100) : 0;

  const completedCarbs = meals.filter((m: any) => m.completed).reduce((a: number, m: any) => a + (m.carbs || 0), 0);
  const totalCarbs = activePlanData?.totalCarbs || 0;
  const progressCarbs = totalCarbs > 0 ? Math.min(100, (completedCarbs / totalCarbs) * 100) : 0;

  const completedFat = meals.filter((m: any) => m.completed).reduce((a: number, m: any) => a + (m.fat || 0), 0);
  const totalFat = activePlanData?.totalFat || 0;
  const progressFat = totalFat > 0 ? Math.min(100, (completedFat / totalFat) * 100) : 0;

  const mealTypeIcon: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };

  // Show loading or error states
  if (loading) {
    return (
      <div>
        <TopBar title="Nutrition Coach" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <TopBar title="AI Nutritionist" />
        <div className="p-4 lg:p-6 text-center text-destructive">{error}</div>
      </div>
    );
  }

  // Onboarding view
  if (showOnboarding) {
    return (
      <div>
        <TopBar title="AI Nutritionist" />
        <div className="p-4 lg:p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-primary" />
              </div>
              <CardTitle className="text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                LET&apos;S BUILD YOUR MEAL PLAN
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Answer a few questions so we can create a personalized meal plan for you.
              </p>
              <div className="flex items-center gap-2 justify-center mt-4">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      s <= onboardingStep ? "bg-primary w-12" : "bg-muted w-8"
                    )}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
              {onboardingStep === 1 && (
                <div className="space-y-5">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input 
                        type="number" 
                        value={profile?.age || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, age: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input 
                        type="number" 
                        value={profile?.weight || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, weight: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input 
                        type="number" 
                        value={profile?.height || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, height: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fitness Goal</Label>
                    <RadioGroup
                      value={profile?.fitnessGoal ?? undefined}
                      onValueChange={(v: string) => setProfile((p: any) => ({ ...p, fitnessGoal: v as FitnessGoal }))}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      {fitnessGoals.map(g => (
                        <div key={g.value} className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          profile?.fitnessGoal === g.value && "border-primary bg-primary/5",
                          "rounded-none border-2"
                        )}>
                          <RadioGroupItem value={g.value} id={g.value} />
                          <Label htmlFor={g.value} className="cursor-pointer">{g.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <RadioGroup
                      value={profile?.activityLevel ?? undefined}
                      onValueChange={(v: string) => setProfile((p: any) => ({ ...p, activityLevel: v as ActivityLevel }))}
                      className="space-y-2"
                    >
                      {activityLevels.map(l => (
                        <div key={l.value} className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          profile?.activityLevel === l.value && "border-primary bg-primary/5",
                          "rounded-none border-2"
                        )}>
                          <RadioGroupItem value={l.value} id={l.value} />
                          <div>
                            <Label htmlFor={l.value} className="cursor-pointer font-medium">{l.label}</Label>
                            <p className="text-xs text-muted-foreground">{l.desc}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Dietary Preference</Label>
                    <Select
                      value={profile?.dietaryPreference ?? "non_veg"}
                      onValueChange={v => setProfile((p: any) => ({ ...p, dietaryPreference: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {dietaryPreferences.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cuisine Preference</Label>
                    <Select
                      value={profile?.cuisinePreference ?? "north_indian"}
                      onValueChange={v => setProfile((p: any) => ({ ...p, cuisinePreference: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north_indian">North Indian</SelectItem>
                        <SelectItem value="south_indian">South Indian</SelectItem>
                        <SelectItem value="continental">Continental</SelectItem>
                        <SelectItem value="middle_eastern">Middle Eastern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Usual Diet (Describe what you eat in a day)</Label>
                    <textarea 
                      className="w-full p-2 border-2 rounded-none bg-background text-sm"
                      rows={3}
                      placeholder="e.g. Poha/Oats for breakfast, Roti/Sabzi/Rice for lunch..."
                      value={profile?.usualDiet ?? ""}
                      onChange={e => setProfile((p: any) => ({ ...p, usualDiet: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Allergies & Restrictions */}
              {onboardingStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Allergies</h3>
                    <p className="text-sm text-muted-foreground">Select any food allergies you have.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {commonAllergies.map(a => (
                        <div
                          key={a}
                          onClick={() => toggleAllergy(a)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          profile?.allergies?.includes(a.toLowerCase()) && "border-destructive bg-destructive/5",
                            "rounded-none border-2"
                          )}
                        >
                          <Checkbox checked={profile?.allergies?.includes(a.toLowerCase())} />
                          <span className="text-sm">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Food Restrictions</h3>
                    <p className="text-sm text-muted-foreground">Select any dietary restrictions.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {commonRestrictions.filter(r => {
                        const isVeg = profile?.dietaryPreference === "VEG" || profile?.dietaryPreference === "VEGAN";
                        const isEgg = profile?.dietaryPreference === "EGGETARIAN";
                        if (isVeg && (r === "Pure Veg" || r === "No Meat (Veg Only)" || r === "No Egg")) return false;
                        if (isEgg && (r === "Pure Veg" || r === "No Meat (Veg Only)")) return false;
                        return true;
                      }).map(r => (
                        <div
                          key={r}
                          onClick={() => toggleRestriction(r)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          profile?.restrictions?.includes(r.toLowerCase().replace(/ /g, "_")) && "border-primary bg-primary/5",
                            "rounded-none border-2"
                          )}
                        >
                          <Checkbox checked={profile?.restrictions?.includes(r.toLowerCase().replace(/ /g, "_"))} />
                          <span className="text-sm">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Generating */}
              {onboardingStep === 3 && (
                <div className="flex flex-col items-center py-8">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse",
                    "bg-primary/10"
                  )}>
                    <ChefHat size={40} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    COOKING UP YOUR PLAN...
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Our AI is creating a personalized nutrition plan based on your goals, preferences, and workout schedule.
                  </p>
                  <div className="w-full max-w-xs mt-6">
                    <Progress value={75} className="animate-pulse" />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  disabled={onboardingStep === 1}
                  onClick={() => setOnboardingStep(s => s - 1)}
                >
                  <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
                {onboardingStep < 3 ? (
                  <Button onClick={() => setOnboardingStep(s => s + 1)}>
                    Next <ArrowRight size={16} className="ml-1" />
                  </Button>
                ) : (
                  <Button onClick={saveProfileAndGenerate} disabled={submitting}>
                    {submitting ? "Generating..." : "Generate Plan"} <Sparkles size={16} className="ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main meal plan view
  return (
    <div>
      <TopBar title="AI Nutritionist" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              YOUR FUEL PLAN
            </h1>
            <p className="text-sm text-muted-foreground">{activePlanData?.date ? new Date(activePlanData.date).toDateString() : ''} · Aligned with your workout schedule</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw size={14} className={cn("mr-1", regenerating && "animate-spin")} />
              {regenerating ? "Generating..." : "Regenerate"}
            </Button>
            <Dialog open={editPrefs} onOpenChange={setEditPrefs}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Preferences
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Age</Label>
                      <Input 
                        type="number" 
                        value={profile?.age || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, age: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input 
                        type="number" 
                        value={profile?.weight || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, weight: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input 
                        type="number" 
                        value={profile?.height || ""} 
                        onChange={(e: any) => setProfile((p: any) => ({ ...p, height: e.target.value === "" ? 0 : +e.target.value }))} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fitness Goal</Label>
                    <Select value={profile?.fitnessGoal ?? undefined} onValueChange={(v: string) => setProfile((p: any) => ({ ...p, fitnessGoal: v as FitnessGoal }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fitnessGoals.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Diet</Label>
                    <Select value={profile?.dietaryPreference ?? undefined} onValueChange={(v: string) => setProfile((p: any) => ({ ...p, dietaryPreference: v as DietaryPreference }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dietaryPreferences.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => { setEditPrefs(false); handleRegenerate(); }} disabled={submitting || regenerating}>
                    Save & Regenerate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
              Redo Setup
            </Button>
          </div>
        </div>

        {/* Day Tabs */}
        {allMealPlans.length > 1 && (
          <Tabs 
            value={activeTabIndex.toString()} 
            onValueChange={(val) => {
              const idx = parseInt(val);
              setActiveTabIndex(idx);
              setMeals(allMealPlans[idx].meals || []);
            }} 
            className="w-full"
          >
            <TabsList className="w-full flex overflow-x-auto rounded-none border-b-2 border-foreground bg-transparent justify-start">
              {allMealPlans.map((plan, i) => (
                <TabsTrigger 
                  key={i} 
                  value={i.toString()} 
                  className={cn(
                    "rounded-none border-t-2 border-l-2 border-r-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-primary/5 px-6",
                    i === 0 && "font-bold"
                  )}
                >
                  {i === 0 ? "Today" : `Day ${i + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Macro Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Flame size={20} className="mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{totalCalories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
              <div className="mt-2">
                <Progress value={progressCalories} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{completedCalories} consumed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Beef size={20} className="mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold">{totalProtein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
              <div className="mt-2">
                <Progress value={progressProtein} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{completedProtein}g consumed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Wheat size={20} className="mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{totalCarbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <div className="mt-2">
                <Progress value={progressCarbs} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{completedCarbs}g consumed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Droplets size={20} className="mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{totalFat}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
              <div className="mt-2">
                <Progress value={progressFat} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{completedFat}g consumed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meals */}
        <div className="space-y-4">
          {meals.map((meal, i) => (
            <Card
              key={i}
              className={cn(
                "transition-all duration-200",
                meal.completed && "opacity-70",
                "border-2 border-foreground rounded-none"
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleMealCompleted(i)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1",
                      meal.completed ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary",
                      "rounded-none"
                    )}
                  >
                    {meal.completed && <CheckCircle2 size={16} className="text-primary-foreground" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{mealTypeIcon[String(meal.type).toLowerCase()] || "•"}</span>
                        <div>
                          <h3 className={cn("font-semibold", meal.completed && "line-through")}>{meal.name}</h3>
                          <Badge variant="outline" className="text-xs capitalize mt-0.5">{meal.type}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{meal.calories} cal</p>
                        <p className="text-xs text-muted-foreground">
                          P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{meal.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
