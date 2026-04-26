"use client";

import { useEffect, useState } from "react";
import { Search, Eye, UserCircle } from "lucide-react";
import { TopBar } from "@/components/shared/top-bar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MemberRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  planExpiry: string;
  planStatus: string;
  attendanceCount: number;
  sessionsRemaining: number;
  age: number;
  gender: string;
  healthNotes?: string | null;
  trainerId?: string | null;
  trainer?: {
    id: string;
    name: string;
    specialization: string;
  } | null;
};

type TrainerRecord = {
  id: string;
  name: string;
  specialization: string;
};

type ActionDialogState =
  | { type: "upgrade" | "extend" | "reassign"; memberId: string }
  | null;

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [membersData, setMembersData] = useState<MemberRecord[]>([]);
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null);
  const [newPlan, setNewPlan] = useState("");
  const [newTrainerId, setNewTrainerId] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [extendReason, setExtendReason] = useState("");

  async function fetchMembers() {
    try {
      const res = await fetch("/api/owner/members", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembersData(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      try {
        await fetchMembers();
        const trainersRes = await fetch("/api/owner/trainers", { credentials: "include" });
        const trainerData = await trainersRes.json();
        setTrainers(Array.isArray(trainerData) ? trainerData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user?.id]);

  const handleUpdate = async (data: Record<string, unknown>, targetMemberId?: string) => {
    const memberId = targetMemberId || actionDialog?.memberId;
    if (!memberId) {
      alert("Member ID is missing.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/owner/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId, ...data }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Update failed");
        return;
      }

      await fetchMembers();
      setActionDialog(null);
    } catch (err) {
      console.error(err);
      alert("An error occurred during update.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtend = async () => {
    const memberId = actionDialog?.memberId;
    if (!memberId) return;

    const currentMember = membersData.find((entry) => entry.id === memberId);
    if (!currentMember) return;

    const currentExpiry = new Date(currentMember.planExpiry);
    const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + Number.parseInt(extendDays, 10));

    await handleUpdate(
      {
        planExpiry: newExpiry.toISOString(),
        planStatus: "ACTIVE",
        note: extendReason.trim() || undefined,
      },
      memberId
    );
  };

  const openUpgradeDialog = (memberId: string, plan: string) => {
    setNewPlan(plan);
    setActionDialog({ type: "upgrade", memberId });
  };

  const openExtendDialog = (memberId: string) => {
    setExtendDays("30");
    setExtendReason("");
    setActionDialog({ type: "extend", memberId });
  };

  const openReassignDialog = (memberId: string, trainerId?: string | null) => {
    setNewTrainerId(trainerId || "");
    setActionDialog({ type: "reassign", memberId });
  };

  const filteredMembers = membersData.filter((entry) => {
    const query = search.toLowerCase();
    const matchesSearch =
      entry.name.toLowerCase().includes(query) || entry.email.toLowerCase().includes(query);
    const matchesPlan = planFilter === "all" || entry.plan.toLowerCase() === planFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" || entry.planStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "active":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "EXPIRING":
      case "expiring":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "EXPIRED":
      case "expired":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "";
    }
  };

  const member = selectedMember ? membersData.find((entry) => entry.id === selectedMember) : null;
  const memberTrainer = member?.trainer || null;
  const actionMember = actionDialog
    ? membersData.find((entry) => entry.id === actionDialog.memberId) || null
    : null;
  const actionMemberTrainer = actionMember?.trainer || null;

  if (loading) {
    return (
      <div>
        <TopBar title="Members" />
        <div className="p-4 lg:p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Members" />
      <div className="space-y-6 p-4 lg:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={planFilter} onValueChange={(value) => setPlanFilter(value ?? "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic (Monthly)</SelectItem>
                    <SelectItem value="pro">Pro (Monthly)</SelectItem>
                    <SelectItem value="elite">Elite (Monthly)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedMember === entry.id && "bg-muted/50"
                        )}
                        onClick={() => setSelectedMember(entry.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {entry.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{entry.name}</p>
                              <p className="text-xs text-muted-foreground">{entry.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("capitalize text-[10px] font-bold tracking-tight", 
                            entry.plan === 'BASIC' ? "border-blue-200 text-blue-600 bg-blue-50/50" : 
                            entry.plan === 'PRO' ? "border-purple-200 text-purple-600 bg-purple-50/50" : 
                            "border-amber-200 text-amber-600 bg-amber-50/50"
                          )}>
                            {entry.plan === 'BASIC' ? 'BASIC' : entry.plan === 'PRO' ? 'PRO' : 'ELITE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("capitalize text-xs", statusColor(entry.planStatus))}
                          >
                            {entry.planStatus.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.planExpiry}</TableCell>
                        <TableCell className="text-sm">{entry.attendanceCount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(entry.id);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            {member ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{member.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Age / Gender</p>
                      <p className="font-medium">
                        {member.age} / {member.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <Badge variant="outline" className={cn("capitalize font-bold text-[10px]",
                        member.plan === 'BASIC' ? "border-blue-200 text-blue-600 bg-blue-50/50" : 
                        member.plan === 'PRO' ? "border-purple-200 text-purple-600 bg-purple-50/50" : 
                        "border-amber-200 text-amber-600 bg-amber-50/50"
                      )}>
                        {member.plan === 'BASIC' ? 'BASIC' : member.plan === 'PRO' ? 'PRO' : 'ELITE'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry</p>
                      <p className="font-medium">{member.planExpiry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sessions Left</p>
                      <p className="font-medium">{member.sessionsRemaining}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="font-medium">{member.attendanceCount} days</p>
                    </div>
                  </div>

                  {member.healthNotes && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Health Notes</p>
                      <p className="rounded bg-muted/50 p-2 text-sm">{member.healthNotes}</p>
                    </div>
                  )}

                  {memberTrainer && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Assigned Trainer</p>
                      <div className="flex items-center gap-2 rounded bg-muted/50 p-2">
                        <UserCircle size={16} className="text-primary" />
                        <span className="text-sm font-medium">{memberTrainer.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {memberTrainer.specialization}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openUpgradeDialog(member.id, member.plan)}>
                      Upgrade/Downgrade Plan
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openExtendDialog(member.id)}>
                      Extend Plan
                    </Button>
                    {member.plan !== 'BASIC' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionDialog({ type: "reassign", memberId: member.id })}
                      >
                        Reassign Trainer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserCircle size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Select a member to view details</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && !submitting && setActionDialog(null)}>
        <DialogContent>
          {actionDialog?.type === "upgrade" && actionMember && (
            <>
              <DialogHeader>
                <DialogTitle>Change Plan - {actionMember.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Current Plan</Label>
                  <p className="mt-1 text-sm font-bold capitalize">
                    {actionMember.plan === 'BASIC' ? 'Basic' : actionMember.plan === 'PRO' ? 'Pro' : 'Elite'}
                  </p>
                </div>
                <div>
                  <Label>New Plan</Label>
                  <Select 
                    value={newPlan} 
                    onValueChange={(value) => {
                      const planValue = value ?? "";
                      setNewPlan(planValue);
                      
                      // Auto-update sessions based on plan choice
                      const sessions = planValue === "BASIC" ? 0 : planValue === "PRO" ? 1 : 4;
                      const updatedMembers = membersData.map(m => 
                        m.id === actionMember.id ? { ...m, sessionsRemaining: sessions } : m
                      );
                      setMembersData(updatedMembers);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic (Monthly) - ₹1,499 (0 Sessions)</SelectItem>
                      <SelectItem value="PRO">Pro (Monthly) - ₹2,999 (1 Session)</SelectItem>
                      <SelectItem value="ELITE">Elite (Monthly) - ₹4,999 (4 Sessions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <Label className="font-bold">Trainer Sessions Balance</Label>
                  <Input 
                    type="number" 
                    className="mt-2 h-11 border-2 border-primary/20"
                    value={actionMember.sessionsRemaining} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const updatedMembers = membersData.map(m => 
                        m.id === actionMember.id ? { ...m, sessionsRemaining: val } : m
                      );
                      setMembersData(updatedMembers);
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Note: Automatically sets to 0 (Basic), 1 (Pro), or 4 (Elite) per month.
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={submitting || !newPlan}
                  onClick={() => handleUpdate({ 
                    plan: newPlan, 
                    sessionsRemaining: actionMember.sessionsRemaining 
                  }, actionMember.id)}
                >
                  {submitting ? "Updating..." : "Update Plan"}
                </Button>
              </div>
            </>
          )}

          {actionDialog?.type === "extend" && actionMember && (
            <>
              <DialogHeader>
                <DialogTitle>Extend Plan - {actionMember.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Current Expiry</Label>
                  <p className="mt-1 text-sm">{actionMember.planExpiry}</p>
                </div>
                <div>
                  <Label>Extend By</Label>
                  <Select value={extendDays} onValueChange={(value) => setExtendDays(value ?? "30")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Optional note..."
                    className="mt-1"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={submitting} onClick={handleExtend}>
                  {submitting ? "Extending..." : "Extend"}
                </Button>
              </div>
            </>
          )}

          {actionDialog?.type === "reassign" && actionMember && (
            <>
              <DialogHeader>
                <DialogTitle>Reassign Trainer - {actionMember.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Current Trainer</Label>
                  <p className="mt-1 text-sm">{actionMemberTrainer?.name || "None"}</p>
                </div>
                <div>
                  <Label>New Trainer</Label>
                  <Select value={newTrainerId} onValueChange={(value) => setNewTrainerId(value ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.name} - {trainer.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={submitting || !newTrainerId}
                  onClick={() => handleUpdate({ trainerId: newTrainerId }, actionMember.id)}
                >
                  {submitting ? "Reassigning..." : "Reassign"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
