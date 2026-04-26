export type Role = "owner" | "trainer" | "member";
export type PlanType = "BASIC" | "PRO" | "ELITE";
export type FitnessGoal = "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "ENDURANCE" | "FLEXIBILITY";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type DietaryPreference = "VEG" | "NON_VEG" | "VEGAN" | "EGGETARIAN" | "PESCATARIAN";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  plan: PlanType;
  planExpiry: string;
  planStatus: "active" | "expiring" | "expired";
  trainerId: string;
  healthNotes: string;
  attendanceCount: number;
  sessionsRemaining: number;
  age: number;
  gender: "male" | "female" | "other";
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  specialization: string;
  rating: number;
  reviewCount: number;
  memberCount: number;
  availability: "available" | "busy" | "off";
  schedule: WeeklySchedule;
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  memberId?: string;
  memberName?: string;
  type: "session" | "break" | "available";
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  method: "qr" | "manual";
}

export interface Invoice {
  id: string;
  memberId: string;
  memberName: string;
  plan: PlanType;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
}

export interface WorkoutPlan {
  id: string;
  memberId: string;
  trainerId: string;
  day: string;
  exercises: Exercise[];
  notes: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface SessionLog {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  date: string;
  duration: number;
  exercises: string[];
  notes: string;
  completed: boolean;
}

export interface Review {
  id: string;
  trainerId: string;
  trainerName: string;
  rating: number;
  feedback: string;
  date: string;
}

export interface Booking {
  id: string;
  memberId: string;
  trainerId: string;
  trainerName: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
}

export interface NutritionProfile {
  age: number;
  weight: number;
  height: number;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  restrictions: string[];
  completed: boolean;
}

export interface MealPlan {
  id: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completed: boolean;
}

export interface KPIData {
  totalMembers: number;
  activePlans: number;
  revenue: number;
  expiringSoon: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  members: number;
}
