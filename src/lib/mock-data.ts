import type {
  Member, Trainer, AttendanceRecord, Invoice, WorkoutPlan,
  SessionLog, Review, Booking, NutritionProfile, MealPlan,
  KPIData, RevenueData
} from "./types";

export const trainers: Trainer[] = [];
export const members: Member[] = [];
export const attendance: AttendanceRecord[] = [];
export const invoices: Invoice[] = [];
export const workoutPlans: WorkoutPlan[] = [];
export const sessionLogs: SessionLog[] = [];
export const reviews: Review[] = [];
export const bookings: Booking[] = [];

export const nutritionProfile: NutritionProfile = {
  age: 0,
  weight: 0,
  height: 0,
  fitnessGoal: "MAINTENANCE",
  activityLevel: "SEDENTARY",
  dietaryPreference: "VEG",
  allergies: [],
  restrictions: [],
  completed: false,
};

export const mealPlan: MealPlan = {
  id: "",
  date: "",
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  meals: [],
};

export const kpiData: KPIData = {
  totalMembers: 0,
  activePlans: 0,
  revenue: 0,
  expiringSoon: 0,
};

export const revenueData: RevenueData[] = [];
export const trainerRatings: any[] = [];
export const monthlyAttendance: any[] = [];
export const planDistribution: any[] = [];

export function getMemberById(id: string): Member | undefined {
  return undefined;
}

export function getTrainerById(id: string): Trainer | undefined {
  return undefined;
}

export function getTrainerForMember(memberId: string): Trainer | undefined {
  return undefined;
}

export function getWorkoutsForMember(memberId: string): WorkoutPlan[] {
  return [];
}

export function getSessionsForTrainer(trainerId: string): SessionLog[] {
  return [];
}

export function getReviewsForTrainer(trainerId: string): Review[] {
  return [];
}

export function getMembersForTrainer(trainerId: string): Member[] {
  return [];
}

export function getAttendanceForMember(memberId: string): AttendanceRecord[] {
  return [];
}

export function getBookingsForMember(memberId: string): Booking[] {
  return [];
}

export const availableTimeSlots = [];
