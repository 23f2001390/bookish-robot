"use client";

import { useMemberDashboard } from "@/hooks/useMemberDashboard";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shared/top-bar";
import { KPIGrid } from "@/components/dashboard/member/kpi-grid";
import { PlanProgressCard } from "@/components/dashboard/member/plan-progress-card";
import { AssignedTrainerCard } from "@/components/dashboard/member/assigned-trainer-card";
import { RecentAttendanceCard } from "@/components/dashboard/member/recent-attendance-card";
import { MyInvoicesCard } from "@/components/dashboard/member/my-invoices-card";
import { OnboardingPlanSelection } from "@/components/dashboard/member/onboarding-plan-selection";

export default function MemberDashboard() {
  const router = useRouter();
  const {
    profile,
    attendance,
    invoices,
    trainer,
    loadingData,
    error
  } = useMemberDashboard();

  if (loadingData || !profile) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <h1 className="text-2xl font-bold">Member dashboard unavailable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              className="inline-flex items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-semibold"
              onClick={() => router.push("/login")}
            >
              Return to login
            </button>
          </div>
        </div>
      );
    }
    return <div className="p-4">Loading...</div>;
  }

  const member = profile.member;

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Member profile missing</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but the member profile is incomplete.
          </p>
          <button
            className="inline-flex items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-semibold"
            onClick={() => router.push("/login")}
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  // Compute days until plan expiry relative to now
  const now = new Date();
  const expiryDate = new Date(member.planExpiry);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate plan total days for progress
  const planTotalDays = member.plan === "BASIC" ? 30 : member.plan === "PRO" ? 90 : 365;
  const planProgress = Math.max(0, Math.min(100, Math.round(((planTotalDays - daysUntilExpiry) / planTotalDays) * 100)));

  const formattedExpiry = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(expiryDate);

  const recentAttendance = attendance.slice(0, 5);

  if (member.planStatus === 'EXPIRED') {
    return <OnboardingPlanSelection />;
  }

  return (
    <div>
      <TopBar title="My Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Hey, {member?.name?.split(" ")[0] || "Friend"} 💪
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress and stay consistent.</p>
        </div>

        <div className="space-y-6">
          <KPIGrid 
            member={member} 
            daysUntilExpiry={daysUntilExpiry} 
            formattedExpiry={formattedExpiry} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlanProgressCard member={member} planProgress={planProgress} />
            <AssignedTrainerCard trainer={trainer} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAttendanceCard recentAttendance={recentAttendance} />
            <MyInvoicesCard invoices={invoices} />
          </div>
        </div>
      </div>
    </div>
  );
}
