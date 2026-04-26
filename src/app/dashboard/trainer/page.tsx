"use client";

import { TopBar } from "@/components/shared/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/kpi-card";
import { CalendarCheck, Users, Clock, CheckCircle2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (authLoading || !user) return;
    try {
      setError(null);
      
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // Parallelize fetches to drastically improve re-load performance
      const [profileRes, sessionsRes, membersRes] = await Promise.all([
        fetch('/api/trainer/profile', { credentials: 'include' }),
        fetch(`/api/trainer/sessions?date=${dateStr}`, { credentials: 'include' }),
        fetch('/api/trainer/members', { credentials: 'include' })
      ]);

      if (!profileRes.ok || !sessionsRes.ok || !membersRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const [profileData, sessionsData, membersData] = await Promise.all([
        profileRes.json(),
        sessionsRes.json(),
        membersRes.json()
      ]);

      setProfile(profileData);
      setSessions(sessionsData);
      setMembers(membersData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Compute KPIs
  const todaySessions = sessions;
  const assignedMembers = members;
  const completedCount = todaySessions.filter(s => s.completed).length;
  const avgDuration = Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / (todaySessions.length || 1));

  if (loading) {
    return (
      <div>
        <TopBar title="Trainer Dashboard" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <TopBar title="Trainer Dashboard" />
        <div className="p-4 lg:p-6 text-center text-destructive">{error}</div>
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Trainer Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Welcome back, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your schedule for today.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Today's Sessions" value={todaySessions.length} icon={<CalendarCheck size={20} />} />
          <KPICard title="Assigned Members" value={assignedMembers.length} icon={<Users size={20} />} />
          <KPICard title="Completed Today" value={completedCount} icon={<CheckCircle2 size={20} />} />
          <KPICard title="Avg Duration" value={`${avgDuration} min`} icon={<Clock size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Training Schedule</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">Today</Badge>
                {sessions.some(s => new Date(s.date) > new Date()) && (
                  <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">Upcoming</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length > 0 ? sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      session.completed ? 'bg-muted/30 border-border' : 'bg-card border-primary/20',
                      'border-2 border-foreground rounded-none'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {session.memberName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.memberName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            {new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {session.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.completed ? 'default' : 'secondary'} className={cn(
                        "text-[10px]",
                        session.completed
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : "bg-blue-500/10 text-blue-600 border-blue-200"
                      )}>
                        {session.completed ? 'Finished' : 'Booked'}
                      </Badge>
                    </div>
                    {session.workout ? (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider">Today&apos;s Focus: {session.workout.day}</p>
                        <div className="flex flex-wrap gap-1">
                          {session.workout.exercises.map((ex: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[10px]">
                              <Dumbbell size={10} className="text-primary" />
                              <span className="font-medium">{ex.name}</span>
                              <span className="text-muted-foreground opacity-70">({ex.sets}x{ex.reps})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic mt-2">No workout plan assigned for {new Date(session.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                    )}

                     <div className="mt-3 flex justify-end gap-2">
                       {!session.completed ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px]"
                            onClick={async () => {
                              // Optimistic update for sessions gallery
                              setSessions(prev => prev.map(s => 
                                s.id === session.id ? { ...s, completed: true } : s
                              ));
                              
                              // Optimistic update for member session count in the sidebar
                              setMembers(prev => prev.map(m => 
                                m.id === session.memberId ? { ...m, sessionsRemaining: Math.max(0, m.sessionsRemaining - 1) } : m
                              ));
                              
                              try {
                                const res = await fetch(`/api/trainer/bookings/${session.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'COMPLETE' })
                                });
                                if (!res.ok) {
                                  // Revert count and fetch latest data if API fails
                                  loadDashboardData();
                                }
                              } catch (err) { 
                                console.error('Failed to complete session', err);
                                loadDashboardData();
                              }
                            }}
                          >
                            Mark Finished
                          </Button>
                        ) : null}
                     </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No sessions found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {m.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.plan} plan · {m.sessionsRemaining} sessions left</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize',
                        m.planStatus === 'active' && 'bg-green-500/10 text-green-600',
                        m.planStatus === 'expiring' && 'bg-yellow-500/10 text-yellow-600',
                        m.planStatus === 'expired' && 'bg-red-500/10 text-red-600'
                      )}
                    >
                      {m.planStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
