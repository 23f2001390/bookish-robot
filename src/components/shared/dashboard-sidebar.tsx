"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Dumbbell, CalendarCheck, CreditCard,
  ClipboardList, QrCode, Star, Apple, UserCircle, Menu, Wrench
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/lib/sidebar-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  const base = "/dashboard";
  const normalizedRole = role.toLowerCase();
  
  switch (normalizedRole) {
    case "owner":
      return [
        { label: "Dashboard", href: `${base}/owner`, icon: <LayoutDashboard size={20} /> },
        { label: "Members", href: `${base}/owner/members`, icon: <Users size={20} /> },
        { label: "Trainers", href: `${base}/owner/trainers`, icon: <Dumbbell size={20} /> },
        { label: "Attendance", href: `${base}/owner/attendance`, icon: <CalendarCheck size={20} /> },
        { label: "Subscriptions", href: `${base}/owner/subscriptions`, icon: <CreditCard size={20} /> },
        { label: "Equipment", href: `${base}/owner/equipment`, icon: <Wrench size={20} /> },
      ];
    case "trainer":
      return [
        { label: "Dashboard", href: `${base}/trainer`, icon: <LayoutDashboard size={20} /> },
        { label: "Workouts", href: `${base}/trainer/workouts`, icon: <ClipboardList size={20} /> },
      ];
    case "member":
      return [
        { label: "Dashboard", href: `${base}/member`, icon: <LayoutDashboard size={20} /> },
        { label: "Book Session", href: `${base}/member/booking`, icon: <CalendarCheck size={20} /> },
        { label: "Attendance", href: `${base}/member/attendance`, icon: <QrCode size={20} /> },
        { label: "Reviews", href: `${base}/member/reviews`, icon: <Star size={20} /> },
        { label: "Nutrition Coach", href: `${base}/member/nutrition`, icon: <Apple size={20} /> },
      ];
    default:
      return [];
  }
}

function SidebarContent({ role, pathname, onNavigate }: { role: string; pathname: string; onNavigate?: () => void }) {
  const navItems = getNavItems(role);

  const roleTitles: Record<string, string> = {
    owner: "Gym Owner",
    trainer: "Trainer",
    member: "Member",
    OWNER: "Gym Owner",
    TRAINER: "Trainer",
    MEMBER: "Member",
  };

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r-4 border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" onClick={onNavigate}>
          <h1 className="text-lg text-sidebar-primary font-black tracking-[0.2em] uppercase text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SoulRep</h1>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <UserCircle size={16} className="text-sidebar-foreground" />
          <span className="text-sm text-sidebar-foreground">{roleTitles[role]}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-black uppercase"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent uppercase font-bold"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full text-xs px-3 py-2 rounded bg-secondary text-secondary-foreground hover:bg-accent transition-colors uppercase font-bold"
        >
          Log Out
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden border-none" : "w-64"
      )}>
        <SidebarContent role={role} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors" />
          }
        >
          <Menu size={24} />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
