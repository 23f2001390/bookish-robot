"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell, ArrowRight, Zap, Flame, Timer, Heart,
  Trophy, Users, Apple, Clock, MapPin, Phone, Mail
} from "lucide-react";

const offerings = [
  { icon: <Dumbbell size={24} />, title: "Strength Training", desc: "Free weights, machines, and Olympic lifting platforms for every level." },
  { icon: <Flame size={24} />, title: "HIIT & Cardio", desc: "High-intensity interval sessions and a full cardio floor to torch calories." },
  { icon: <Users size={24} />, title: "Group Classes", desc: "From spin to yoga to kickboxing — sweat together, grow together." },
  { icon: <Trophy size={24} />, title: "Personal Training", desc: "One-on-one coaching with certified trainers who push you past your limits." },
  { icon: <Apple size={24} />, title: "Nutrition Coaching", desc: "Custom meal plans and diet guidance aligned with your fitness goals." },
  { icon: <Heart size={24} />, title: "Recovery Zone", desc: "Foam rollers, stretching area, and post-workout recovery tools to keep you going." },
];

const plans = [
  { name: "BASIC", price: "₹1,499", period: "/month", features: ["Gym floor access", "Locker room", "Free WiFi", "Basic fitness assessment"], highlight: false },
  { name: "PRO", price: "₹2,999", period: "/month", features: ["Everything in Basic", "All group classes", "1 PT session/month", "Nutrition guidance", "InBody scan"], highlight: true },
  { name: "ELITE", price: "₹4,999", period: "/month", features: ["Everything in Pro", "4 PT sessions/month", "Custom meal plans", "Priority booking", "Guest passes"], highlight: false },
];

const stats = [
  { value: "5,000+", label: "Sq. Ft. Training Space" },
  { value: "15+", label: "Certified Trainers" },
  { value: "50+", label: "Weekly Classes" },
  { value: "1,200+", label: "Active Members" },
];

const hours = [
  { day: "Monday – Friday", time: "5:00 AM – 11:00 PM" },
  { day: "Saturday", time: "6:00 AM – 10:00 PM" },
  { day: "Sunday", time: "7:00 AM – 8:00 PM" },
];

export function LandingPage() {
  const headingFont = "'Bebas Neue', sans-serif";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap size={24} className="text-primary" />
            <span className="text-xl font-bold" style={{ fontFamily: headingFont }}>SoulRep</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#offerings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">What We Offer</a>
            <a href="#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Membership</a>
            <a href="#hours" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Hours & Location</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button size="sm" variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Join Now</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen bg-background relative flex items-center">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36 text-center">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
            PUNE&apos;S RAWEST GYM
          </Badge>
          <h1
            className="mx-auto max-w-5xl font-bold tracking-tight text-5xl sm:text-7xl lg:text-[7rem] leading-[0.85]"
            style={{ fontFamily: headingFont }}
          >
            YOUR BODY. YOUR TEMPLE. YOUR REP.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg font-medium">
            SoulRep isn&apos;t just a gym — it&apos;s where discipline meets obsession. Show up, put in the reps, and leave a better version of yourself.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="uppercase font-black text-lg px-8">
                JOIN NOW <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="#offerings">
              <Button size="lg" variant="outline" className="uppercase font-black text-lg px-8">
                EXPLORE
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black" style={{ fontFamily: headingFont }}>{s.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section id="offerings" className="py-20 lg:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">What We Offer</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: headingFont }}>
              EVERYTHING UNDER ONE ROOF
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From heavy iron to guided recovery, SoulRep has every tool you need to build the body and mind you want.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((f, i) => (
              <Card key={i} className="transition-all duration-300 border-2 border-foreground hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--foreground)]">
                <CardHeader>
                  <div className="w-12 h-12 flex items-center justify-center mb-2 bg-foreground text-background">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="plans" className="py-20 lg:py-28 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Membership</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: headingFont }}>
              PICK YOUR PLAN
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              No contracts. No hidden fees. Just honest pricing for serious lifters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <Card key={i} className={`h-full transition-all duration-300 group border-2 border-foreground hover:translate-x-2 hover:-translate-y-2 hover:shadow-[6px_6px_0_0_var(--foreground)] ${p.highlight ? "bg-foreground text-background" : ""}`}>
                <CardHeader className="text-center pb-2">
                  {p.highlight && <Badge className="mx-auto mb-3 bg-background text-foreground hover:bg-background/90">MOST POPULAR</Badge>}
                  <CardTitle className="text-2xl tracking-wider" style={{ fontFamily: headingFont }}>{p.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-black" style={{ fontFamily: headingFont }}>{p.price}</span>
                    <span className={`text-sm ${p.highlight ? "text-background/60" : "text-muted-foreground"}`}>{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {p.features.map((feat, j) => (
                      <li key={j} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                        <div className={`w-1.5 h-1.5 ${p.highlight ? "bg-background" : "bg-foreground"}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block mt-6">
                    <Button
                      className={`w-full uppercase font-black ${p.highlight ? "bg-background text-foreground hover:bg-background/90" : ""}`}
                      variant={p.highlight ? "default" : "outline"}
                    >
                      GET STARTED
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section id="hours" className="py-20 lg:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Visit Us</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: headingFont }}>
              HOURS & LOCATION
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Hours */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center bg-foreground text-background">
                  <Clock size={20} />
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: headingFont }}>GYM HOURS</h3>
              </div>
              <div className="space-y-4">
                {hours.map((h, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-sm font-medium">{h.day}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Timer size={14} /> {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Location */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center bg-foreground text-background">
                  <MapPin size={20} />
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: headingFont }}>FIND US</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    SoulRep Fitness, 2nd Floor, Baner Road,<br />Pune, Maharashtra 411045
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">hello@soulrep.in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: headingFont }}>
            STOP THINKING. START LIFTING.
          </h2>
          <p className="text-muted-foreground mb-8">
            Walk in for a free trial session. No commitments, no pressure — just you and the iron.
          </p>
          <Link href="/signup">
            <Button size="lg" className="uppercase font-black text-lg px-10">
              CLAIM FREE TRIAL <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-primary" />
                <span className="font-bold" style={{ fontFamily: headingFont }}>SoulRep</span>
              </div>
              <p className="text-sm text-muted-foreground">Where every rep counts. Pune&apos;s home for serious fitness.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#offerings" className="hover:text-foreground">What We Offer</a></li>
                <li><a href="#plans" className="hover:text-foreground">Membership</a></li>
                <li><a href="#hours" className="hover:text-foreground">Hours</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Portals</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Log In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>+91 98765 43210</li>
                <li>hello@soulrep.in</li>
                <li>Baner Road, Pune</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 SoulRep Fitness. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
