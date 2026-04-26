import { PlanType } from "@prisma/client";

export interface PlanConfig {
  name: string;
  price: number;
  sessionsPerMonth: number;
  durationDays: number;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.BASIC]: {
    name: "Basic",
    price: 1499,
    sessionsPerMonth: 0,
    durationDays: 30,
  },
  [PlanType.PRO]: {
    name: "Pro",
    price: 2999,
    sessionsPerMonth: 1,
    durationDays: 30,
  },
  [PlanType.ELITE]: {
    name: "Elite",
    price: 4999,
    sessionsPerMonth: 4,
    durationDays: 30,
  },
};

export function getPlanInfo(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function getPlanExpiryDate(plan: PlanType, startDate = new Date()): Date {
  return new Date(startDate.getTime() + PLAN_CONFIGS[plan].durationDays * 24 * 60 * 60 * 1000);
}
