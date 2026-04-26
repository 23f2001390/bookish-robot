"use client";

import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role?.toUpperCase() !== "OWNER") {
      // Small delay to avoid kicking out during transient session refreshes
      const t = setTimeout(() => {
        router.push("/login");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, `${user?.id}-${user?.role}`, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="owner" />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
