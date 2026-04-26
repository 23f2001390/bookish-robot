'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemberDashboard } from '@/hooks/useMemberDashboard';
import { Badge } from '@/components/ui/badge';

export function ManagePlanDialog() {
  const { profile } = useMemberDashboard();
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const headingFont = "'Bebas Neue', sans-serif";

  const plans = [
    { id: 'BASIC', name: 'BASIC', duration: '/month', price: '1,499', apiAmount: 1499, highlight: false, features: ['Gym floor access', 'Locker room', 'Free WiFi', 'Basic fitness assessment'] },
    { id: 'PRO', name: 'PRO', duration: '/month', price: '2,999', apiAmount: 2999, highlight: true, features: ['Everything in Basic', 'All group classes', '1 PT session/month', 'Nutrition guidance', 'InBody scan'] },
    { id: 'ELITE', name: 'ELITE', duration: '/month', price: '4,999', apiAmount: 4999, highlight: false, features: ['Everything in Pro', '4 PT sessions/month', 'Custom meal plans', 'Priority booking', 'Guest passes'] },
  ];

  const currentPlanId = profile?.member?.plan || 'BASIC';

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const planConfig = plans.find(p => p.id === selectedPlan);
      const res = await fetch('/api/member/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: planConfig?.apiAmount || 1499
        })
      });

      if (!res.ok) throw new Error('Upgrade failed');

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        window.location.reload(); // Refresh to update dashboard and invoice list
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setSuccess(false); }}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <CreditCard size={14} /> Manage Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[850px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ fontFamily: headingFont }}>CHOOSE YOUR PLAN</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold">Plan Upgraded Successfully!</h3>  
            <p className="text-sm text-muted-foreground text-center">
              Your invoice has been generated and your dashboard is updating... 
            </p>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id || (!selectedPlan && currentPlanId === plan.id);
                return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative flex flex-col p-6 border-2 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--foreground)]",
                    isSelected
                      ? "border-foreground bg-primary/5 shadow-[4px_4px_0_0_var(--foreground)]"
                      : "border-muted-foreground/30 hover:border-foreground",
                    plan.highlight && isSelected
                      ? "bg-foreground text-background shadow-[4px_4px_0_0_var(--foreground)]"
                      : "",
                    plan.highlight && !isSelected
                      ? "border-foreground bg-foreground text-background hover:shadow-[4px_4px_0_0_var(--background)]"
                      : ""
                  )}
                >
                  {currentPlanId === plan.id && (
                     <Badge variant="outline" className={cn(
                       "absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full",
                       plan.highlight ? "bg-background text-foreground border-background" : "bg-primary text-primary-foreground border-primary"
                     )}>
                      Current Plan
                    </Badge>
                  )}
                  {plan.highlight && (
                    <Badge className="absolute -top-3 right-2 bg-background text-foreground border-foreground text-[10px] hover:bg-background/90">
                      POPULAR
                    </Badge>
                  )}
                  <h4 className="text-3xl mt-2 tracking-wider" style={{ fontFamily: headingFont }}>{plan.name}</h4>       
                  <div className="mt-2 mb-2">
                    <span className="text-5xl font-black" style={{ fontFamily: headingFont }}>&#8377;{plan.price}</span>
                    <span className={cn("text-xs ml-1 font-bold", plan.highlight ? "text-background/70" : "text-muted-foreground")}>{plan.duration}</span>
                  </div>

                  <ul className="text-sm space-y-3 mb-6 mt-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", plan.highlight ? "bg-background/80" : "bg-foreground")} />
                        <span className={cn("font-medium", plan.highlight ? "text-background/90" : "text-foreground/80")}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={cn(
                    "text-center py-3 rounded-none text-sm font-black uppercase tracking-wider transition-colors border-2",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
                    plan.highlight && !isSelected
                      ? "border-background bg-background text-foreground hover:bg-transparent hover:text-background"
                      : "",
                    plan.highlight && isSelected
                      ? "border-background bg-background text-foreground ring-2 ring-primary ring-offset-2 ring-offset-foreground" 
                      : ""
                  )}>
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </div>
                </div>
              )})}
            </div>

            <Button
              className="w-full text-lg uppercase font-black tracking-widest h-14 mt-4 rounded-none"
              onClick={handleUpgrade}
              disabled={loading || !selectedPlan || selectedPlan === currentPlanId}
            >
              {loading ? 'Processing...' : selectedPlan === currentPlanId ? 'Current Plan Selected' : 'Confirm Upgrade & Generate Invoice'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
