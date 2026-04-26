"use client";

import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role?.toUpperCase() !== "TRAINER") {
        router.push("/login");
      }
    }
  }, [loading, `${user?.id}-${user?.role}`, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="trainer" />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
