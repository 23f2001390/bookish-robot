"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Download, CreditCard, Plus, FileText, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { PLAN_CONFIGS } from "@/lib/plans";
import { PlanType } from "@prisma/client";

const plans = [
  { 
    name: "Basic", 
    type: PlanType.BASIC,
    price: 1499,
    period: "/30 days", 
    features: ["Gym Floor Access", "Locker Room", "Free WiFi", "Basic Fitness Assessment"],
    color: "bg-blue-500/10",
    textColor: "text-blue-600",
    accentColor: "border-blue-500/20"
  },
  { 
    name: "Pro", 
    type: PlanType.PRO,
    price: 2999,
    period: "/30 days", 
    features: ["Everything in Basic", "All Group Classes", "1 PT Session/Month", "Basic Nutrition Guide", "InBody Scan"],
    color: "bg-orange-500/10",
    textColor: "text-orange-600",
    accentColor: "border-orange-500/20"
  },
  { 
    name: "Elite", 
    type: PlanType.ELITE,
    price: 4999,
    period: "/30 days", 
    features: ["Everything in Pro", "4 PT Sessions/Month", "AI Nutritionist", "Priority Booking", "Guest Passes"],
    color: "bg-purple-500/10",
    textColor: "text-purple-600",
    accentColor: "border-purple-500/20"
  },
];

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  
  // Create Invoice State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Plan State
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanPrice, setEditPlanPrice] = useState("");
  const [editPlanFeatures, setEditPlanFeatures] = useState("");

  const fetchData = async () => {
    try {
      const [invoicesRes, membersRes] = await Promise.all([
        fetch('/api/owner/invoices', { credentials: 'include' }),
        fetch('/api/owner/members', { credentials: 'include' })
      ]);
      const invoicesJson = await invoicesRes.json();
      const membersJson = await membersRes.json();
      
      const invoicesArray = Array.isArray(invoicesJson) ? invoicesJson : [];
      const membersArray = Array.isArray(membersJson) ? membersJson : [];
      
      setInvoicesData(invoicesArray);
      setMembers(membersArray);
      
      const distribution: { [key: string]: number } = {};
      membersArray.forEach((m: any) => {
        const planKey = m.plan as PlanType;
        const tierName = PLAN_CONFIGS[planKey]?.name || m.plan;
        // Normalize to title case for the chart
        const formattedName = tierName.charAt(0).toUpperCase() + tierName.slice(1).toLowerCase();
        distribution[formattedName] = (distribution[formattedName] || 0) + 1;
      });
      const distArray = Object.keys(distribution).map(name => ({ 
        name, 
        value: distribution[name] 
      }));
      setPlanDistribution(distArray);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchData();
  }, [authLoading, user?.id]);

  const handleCreateInvoice = async () => {
    if (!selectedMemberId || !selectedPlan || !amount) {
      alert("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const member = members.find(m => m.id === selectedMemberId);
      const planObj = plans.find(p => p.name === selectedPlan);
      const mappedPlanType = (planObj ? planObj.type : selectedPlan.toUpperCase()) as PlanType;

      const res = await fetch("/api/owner/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          memberName: member?.name || "Unknown",
          plan: mappedPlanType,
          amount: parseFloat(amount),
          status: "PAID",
          date: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsDialogOpen(false);
        setSelectedMemberId("");
        setSelectedPlan("");
        setAmount("");
        fetchData();
        alert("Invoice created successfully!");
      } else {
        alert("Error: " + (data.error || "Failed to create invoice"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [localPlans, setLocalPlans] = useState(plans);

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditPlanPrice(plan.price.toString());
    setEditPlanFeatures(plan.features.join(", "));
    setIsEditPlanOpen(true);
  };

  const handleUpdatePlan = () => {
    const updated = localPlans.map(p => {
      if (p.name === editingPlan.name) {
        return {
          ...p,
          name: editPlanName,
          price: parseInt(editPlanPrice),
          features: editPlanFeatures.split(",").map(f => f.trim()).filter(f => f !== "")
        };
      }
      return p;
    });
    setLocalPlans(updated);
    setIsEditPlanOpen(false);
    // Note: Since plans are currently hardcoded in the UI, this updates the local state for this session.
    // In a real app, this would call an API to update a 'Plan' model in the database.
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Subscriptions & Invoices" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }

  const filteredInvoices = invoicesData.filter(i => statusFilter === "all" || i.status.toLowerCase() === statusFilter);

  const statusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'paid': return 'bg-green-500/10 text-green-600';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'overdue': return 'bg-red-500/10 text-red-600';
      default: return '';
    }
  };

  const COLORS = ['#000000', '#3b82f6', '#ef4444'];

  return (
    <div>
      <TopBar title="Subscriptions & Invoices" />
      <div className="p-4 lg:p-6 space-y-6">
        <Tabs defaultValue="invoices">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="invoices">Invoices History</TabsTrigger>
              <TabsTrigger value="plans">Manage Plans</TabsTrigger>
              <TabsTrigger value="analytics">Revenue Insights</TabsTrigger>
            </TabsList>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <button className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-primary bg-primary text-primary-foreground h-10 px-4 font-black uppercase tracking-widest gap-2 hover:bg-primary/90 transition-all outline-none" />
                }
              >
                <Plus size={16} /> Generate Invoice
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-4 border-foreground rounded-none">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    NEW BILLING INVOICE
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Member</Label>
                    <Select value={selectedMemberId} onValueChange={v => setSelectedMemberId(v ?? "")}>
                      <SelectTrigger className="h-12 border-2 border-muted focus:border-primary font-bold">
                        <SelectValue placeholder="Search member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id} className="font-bold uppercase text-xs">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Plan</Label>
                      <Select value={selectedPlan} onValueChange={(v) => {
                        const val = v ?? "";
                        setSelectedPlan(val);
                        const p = plans.find(p => p.name.toLowerCase() === val.toLowerCase() || p.type === val);
                        if (p) setAmount(p.price.toString());
                      }}>
                        <SelectTrigger className="h-12 border-2 border-muted focus:border-primary font-bold">
                          <SelectValue placeholder="Plan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {localPlans.map(p => (
                            <SelectItem key={p.name} value={p.name} className="font-bold uppercase text-xs">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-12 border-2 border-muted focus:border-primary font-black"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 border-2 border-dashed border-muted rounded-none">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight italic">
                      * Generating this invoice will automatically send an In-App notification to the member.
                    </p>
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="uppercase font-black border-2">Cancel</Button>
                  <Button onClick={handleCreateInvoice} disabled={isSubmitting} className="uppercase font-black gap-2">
                    {isSubmitting ? <Send size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    CREATE & NOTIFY
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="border-2 border-foreground rounded-none">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText size={14} /> FILTER BY STATUS
                  </h3>
                  <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
                    <SelectTrigger className="w-48 h-10 font-bold border-2">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ALL INVOICES</SelectItem>
                      <SelectItem value="paid">PAID ONLY</SelectItem>
                      <SelectItem value="pending">PENDING ONLY</SelectItem>
                      <SelectItem value="overdue">OVERDUE ONLY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border border-muted rounded-none overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-black text-[10px] uppercase">ID</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Member</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Plan</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Amount</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Date</TableHead>
                        <TableHead className="font-black text-[10px] uppercase">Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map(inv => (
                        <TableRow key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-[10px] font-bold">#{inv.id.slice(-6).toUpperCase()}</TableCell>
                          <TableCell className="text-sm font-black tracking-tight">{inv.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-black uppercase">
                              {inv.plan === 'BASIC' ? 'Basic' : inv.plan === 'PRO' ? 'Pro' : 'Elite'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-black">₹{inv.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{inv.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('capitalize text-[10px] font-black tracking-tighter px-2 h-5 rounded-none border-2', statusColor(inv.status))}>{inv.status.toLowerCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {inv.status === 'PENDING' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600 transition-colors"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/owner/invoices/${inv.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'PAID' })
                                      });
                                      if (res.ok) fetchData();
                                      else alert("Failed to update status");
                                    } catch (err) {
                                      alert("Error updating status");
                                    }
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => window.open(`/api/member/invoices/${inv.id}`, '_blank')}
                              >
                                <Download size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {localPlans.map((p, i) => (
                <Card key={i} className={cn(
                  'relative transition-all duration-300 rounded-none border-2 border-foreground group hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)]',
                  i === 2 && 'border-4'
                )}>
                  <CardHeader className="border-b-2 border-foreground bg-muted/20">
                    <CardTitle className="text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{p.name}</CardTitle>
                    <div className="mt-2 text-primary">
                      <span className="text-3xl font-black">₹{p.price.toLocaleString()}</span>
                      <span className="text-xs font-bold uppercase tracking-widest ml-1">{p.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                          <div className="h-4 w-4 bg-primary flex items-center justify-center text-primary-foreground">
                            <CheckCircle2 size={10} />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" onClick={() => openEditPlan(p)} className="w-full mt-8 rounded-none border-2 font-black uppercase tracking-widest h-11">Edit Plan</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
              <DialogContent className="sm:max-w-md border-4 border-foreground rounded-none">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    EDIT PLAN CONFIGURATION
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Name</Label>
                    <Input 
                      value={editPlanName} 
                      onChange={(e) => setEditPlanName(e.target.value)}
                      className="h-12 border-2 border-muted focus:border-primary font-black uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
                    <Input 
                      type="number"
                      value={editPlanPrice} 
                      onChange={(e) => setEditPlanPrice(e.target.value)}
                      className="h-12 border-2 border-muted focus:border-primary font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Features (comma separated)</Label>
                    <textarea 
                      value={editPlanFeatures}
                      onChange={(e) => setEditPlanFeatures(e.target.value)}
                      className="w-full min-h-[100px] p-3 border-2 border-muted focus:border-primary font-bold text-xs uppercase"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button variant="outline" onClick={() => setIsEditPlanOpen(false)} className="uppercase font-black border-2">Cancel</Button>
                  <Button onClick={handleUpdatePlan} className="uppercase font-black">SAVE CHANGES</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-2 border-foreground rounded-none">
                <CardHeader>
                  <CardTitle className="text-base uppercase font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Revenue by Plan Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                      >
                        {planDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0', border: '2px solid black', fontWeight: 'bold' }} />
                      <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="bg-primary text-primary-foreground rounded-none border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,0.1)]">
                <CardHeader>
                  <CardTitle className="text-base font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Billing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Outstanding</p>
                    <p className="text-4xl font-black">₹{invoicesData.filter(i => i.status === 'PENDING').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 border-t border-primary-foreground/20 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Collected This Month</p>
                    <p className="text-2xl font-black">₹{invoicesData.filter(i => i.status === 'PAID').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                  </div>
                  <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-none font-black uppercase tracking-widest h-12 mt-4">Generate Report</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
