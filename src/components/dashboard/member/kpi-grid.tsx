import { KPICard } from "@/components/shared/kpi-card";
import { CreditCard, CalendarCheck, Clock, Dumbbell } from "lucide-react";

interface KPIGridProps {
  member: any;
  daysUntilExpiry: number;
  formattedExpiry: string;
}

export function KPIGrid({ member, daysUntilExpiry, formattedExpiry }: KPIGridProps) {
  const baseSessions = member.plan === 'BASIC' ? 0 : member.plan === 'PRO' ? 1 : 4;
  const showDenominator = baseSessions >= member.sessionsRemaining && baseSessions > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Current Plan"
        value={member.plan === 'BASIC' ? 'Basic' : member.plan === 'PRO' ? 'Pro' : 'Elite'}
        icon={<CreditCard size={20} />}
        subtitle={`Expires ${formattedExpiry}`}
      />
      <KPICard
        title="Days Until Expiry"
        value={Math.max(0, daysUntilExpiry)}
        icon={<Clock size={20} />}
        subtitle={daysUntilExpiry < 7 ? "Renew soon!" : "You're good"}
      />
      <KPICard
        title="Sessions Remaining"
        value={member.sessionsRemaining}
        icon={<Dumbbell size={20} />}
        subtitle={`out of ${baseSessions} this month`}
      />
      <KPICard
        title="Attendance"
        value={member.attendanceCount}
        icon={<CalendarCheck size={20} />}
        subtitle="Total check-ins"
      />
    </div>
  );
}
