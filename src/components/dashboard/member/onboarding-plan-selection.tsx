'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function OnboardingPlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const headingFont = "'Bebas Neue', sans-serif";

  const plans = [
    { id: 'BASIC', name: 'BASIC', duration: '/month', price: '1,499', apiAmount: 1499, highlight: false, features: ['Gym floor access', 'Locker room', 'Free WiFi', 'Basic fitness assessment'] },
    { id: 'PRO', name: 'PRO', duration: '/month', price: '2,999', apiAmount: 2999, highlight: true, features: ['Everything in Basic', 'All group classes', '1 PT session/month', 'Nutrition guidance', 'InBody scan'] },
    { id: 'ELITE', name: 'ELITE', duration: '/month', price: '4,999', apiAmount: 4999, highlight: false, features: ['Everything in Pro', '4 PT sessions/month', 'Custom meal plans', 'Priority booking', 'Guest passes'] },
  ];

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
        window.location.reload(); // Refresh to update dashboard
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Zap size={32} className="text-primary" />
            <span className="text-3xl font-bold" style={{ fontFamily: headingFont }}>SoulRep</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider" style={{ fontFamily: headingFont }}>SELECT YOUR PLAN</h1>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Choose a membership plan to activate your account and start your fitness journey today.
          </p>
        </div>

        {success ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300 bg-card rounded-xl border p-12">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: headingFont }}>Plan Activated Successfully!</h3>  
            <p className="text-muted-foreground text-center">
              Your invoice has been generated. Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "relative flex flex-col p-8 border-2 transition-all duration-300 cursor-pointer group hover:-translate-y-2 hover:shadow-[6px_6px_0_0_var(--foreground)] bg-card",
                      isSelected
                        ? "border-foreground bg-primary/5 shadow-[6px_6px_0_0_var(--foreground)] scale-105 z-10"
                        : "border-muted-foreground/30 hover:border-foreground",
                      plan.highlight && isSelected
                        ? "bg-foreground text-background shadow-[6px_6px_0_0_var(--foreground)]"
                        : "",
                      plan.highlight && !isSelected
                        ? "border-foreground bg-foreground text-background hover:shadow-[6px_6px_0_0_var(--background)]"
                        : ""
                    )}
                  >
                    {plan.highlight && (
                      <Badge className="absolute -top-3 right-4 bg-background text-foreground border-foreground text-[10px] uppercase font-black hover:bg-background/90 px-3 py-1">
                        POPULAR
                      </Badge>
                    )}
                    <h4 className="text-4xl mt-2 tracking-wider" style={{ fontFamily: headingFont }}>{plan.name}</h4>
                    <div className="mt-4 mb-4">
                      <span className="text-6xl font-black" style={{ fontFamily: headingFont }}>&#8377;{plan.price}</span>
                      <span className={cn("text-sm ml-1 font-bold", plan.highlight ? "text-background/70" : "text-muted-foreground")}>{plan.duration}</span>      
                    </div>

                    <ul className="text-md space-y-4 mb-8 mt-8 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", 
  plan.highlight ? "bg-background/80" : "bg-foreground")} />
                          <span className={cn("font-medium", plan.highlight ? "text-background/90" : "text-foreground/80")}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={cn(
                      "text-center py-4 rounded-none text-base font-black uppercase tracking-wider transition-colors border-2",
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
                )
              })}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                className="w-full max-w-md text-xl uppercase font-black tracking-widest h-16 rounded-none shadow-[4px_4px_0_0_var(--primary)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all"
                onClick={handleUpgrade}
                disabled={loading || !selectedPlan}
              >
                {loading ? 'Processing Payment...' : 'Activate & Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}