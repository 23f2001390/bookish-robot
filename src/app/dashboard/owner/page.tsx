"use client";

import { TopBar } from "@/components/shared/top-bar";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { KPICard } from "@/components/shared/kpi-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, DollarSign, AlertTriangle, Star, MessageSquare, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [kpi, setKpi] = useState<any | null>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [trainerRatings, setTrainerRatings] = useState<any[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reminding, setReminding] = useState(false);

  const fetchReviews = async (trainerId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/owner/trainers/${trainerId}/reviews`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setReminding(true);
      const res = await fetch("/api/owner/send-reminders", { method: "POST" });
      if (res.ok) {
        alert("Reminders sent successfully!");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to send reminders");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setReminding(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchOwnerData = async () => {
      try {
        const [kpiRes, revRes, ratingsRes, expRes] = await Promise.all([
          fetch("/api/owner/kpi"),
          fetch("/api/owner/revenue"),
          fetch("/api/owner/trainer-ratings"),
          fetch("/api/owner/expiring-members"),
        ]);
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpi(kpiData);
        }
        if (revRes.ok) {
          const revData = await revRes.json();
          setRevenue(revData);
        }
        if (ratingsRes.ok) {
          const ratingData = await ratingsRes.json();
          setTrainerRatings(ratingData);
        }
        if (expRes.ok) {
          const expData = await expRes.json();
          setExpiringMembers(expData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchOwnerData();
  }, [authLoading, user?.id]);

  if (authLoading || loadingData || !kpi) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Members"
            value={kpi.totalMembers}
            icon={<Users size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Active Plans"
            value={kpi.activePlans}
            icon={<CreditCard size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Revenue"
            value={kpi.revenue < 10000 ? `₹${kpi.revenue.toLocaleString()}` : `₹${(kpi.revenue / 1000).toFixed(1)}K`}
            icon={<DollarSign size={20} />}
            trend={{ value: 0, positive: true }}
          />
          <KPICard
            title="Expiring Soon"
            value={kpi.expiringSoon}
            icon={<AlertTriangle size={20} />}
            subtitle="Due or Overdue"
          />
        </div>

        {/* Charts and Ratings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenue} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Trainer Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trainerRatings.length > 0 ? (
                <div className="space-y-4">
                  {trainerRatings.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= Math.round(t.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                            />
                          ))}
                          <span className="text-[10px] font-black ml-1 uppercase">{t.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">
                          {t.reviewCount} Reviews
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[10px] h-7 px-2 font-black uppercase border-2 border-foreground hover:bg-foreground hover:text-background transition-colors rounded-none"
                          onClick={() => {
                            setSelectedTrainer(t);
                            fetchReviews(t.id);
                          }}
                        >
                          View Reviews
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8 font-medium italic">No trainer ratings yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Expiry Alerts
            </CardTitle>
            {expiringMembers.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-bold uppercase border-2 border-primary hover:bg-primary hover:text-white transition-all transform active:scale-95"
                onClick={handleSendReminders}
                disabled={reminding}
              >
                {reminding ? <Loader2 className="animate-spin mr-2" size={12} /> : null}
                {reminding ? "Sending..." : "Remind All"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {expiringMembers.length > 0 ? (
              <div className="space-y-3">
                {expiringMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.plan} plan</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">{m.planStatus}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(m.expiry).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming expirations.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTrainer} onOpenChange={(open) => !open && setSelectedTrainer(null)}>
        <DialogContent className="max-w-md border-4 border-foreground rounded-none shadow-[8px_8px_0_0_var(--foreground)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">
              {selectedTrainer?.name}'s Reviews
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
                <p className="text-xs font-bold uppercase text-muted-foreground">Fetching feedback...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 border-2 border-foreground bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.date}</span>
                    </div>
                    <p className="text-sm font-medium italic">"{r.feedback}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto text-muted-foreground mb-2" size={32} />
                <p className="text-sm font-bold uppercase text-muted-foreground">No member reviews found.</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
