"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
// import { getMembersForTrainer, getWorkoutsForMember, sessionLogs, reviews, trainers } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, User, Dumbbell, ClipboardList, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trainerProfile, setTrainerProfile] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [noteDialog, setNoteDialog] = useState(false);

  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    day: 'Monday',
    notes: '',
    exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data: trainer profile, members, sessions, reviews
  useEffect(() => {
    async function fetchInitial() {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        setError(null);
        // Fetch trainer profile (optional, but we might use for name)
        const profileRes = await fetch('/api/trainer/profile', { credentials: 'include' });
        if (profileRes.ok) {
          const prof = await profileRes.json();
          setTrainerProfile(prof);
        }
        // Fetch members
        const memRes = await fetch('/api/trainer/members', { credentials: 'include' });
        if (!memRes.ok) {
          const err = await memRes.json();
          throw new Error(err.error || 'Failed to load members');
        }
        const memData = await memRes.json();
        setMembers(memData);
        // Set selected member to first member
        if (memData.length > 0) {
          setSelectedMemberId(memData[0].id);
        }
        // Fetch sessions (all sessions; we will filter per member)
        const sessRes = await fetch('/api/trainer/sessions', { credentials: 'include' });
        if (!sessRes.ok) {
          const err = await sessRes.json();
          throw new Error(err.error || 'Failed to load sessions');
        }
        const sessData = await sessRes.json();
        setSessions(sessData);
        // Fetch reviews
        const revRes = await fetch('/api/trainer/reviews', { credentials: 'include' });
        if (!revRes.ok) {
          const err = await revRes.json();
          throw new Error(err.error || 'Failed to load reviews');
        }
        const revData = await revRes.json();
        setReviewsData(revData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, [authLoading, user?.id]);


  async function fetchWorkouts() {
    if (authLoading || !user || !selectedMemberId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trainer/members/${selectedMemberId}/workout-plans`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load workout plans');
      }
      const data = await res.json();
      setWorkouts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkouts();
  }, [authLoading, user?.id, selectedMemberId]);

  const handleAddPlan = async () => {
    if (!selectedMemberId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/trainer/members/${selectedMemberId}/workout-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error('Failed to create plan');
      await fetchWorkouts();
      setIsAddingPlan(false);
      setNewPlan({
        day: 'Monday',
        notes: '',
        exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }]
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add workout plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this workout plan?')) return;
    try {
      const res = await fetch(`/api/trainer/members/${selectedMemberId}/workout-plans/${planId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete plan');
      await fetchWorkouts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete plan');
    }
  };

  // Derived values
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberSessions = sessions.filter((s: any) => s.memberId === selectedMemberId);
  const trainerReviews = reviewsData;
  const memberWorkouts = workouts;

  if (loading) {
    return (
      <div>
        <TopBar title="Workout Management" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <TopBar title="Workout Management" />
        <div className="p-4 lg:p-6 text-center text-destructive">{error}</div>
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Workout Management" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Member List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-1 p-4">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        selectedMemberId === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {m.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.sessionsRemaining} sessions left</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Workout Detail */}
          <Card className="lg:col-span-3">
            {selectedMember ? (
              <Tabs defaultValue="workouts">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {selectedMember.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <CardTitle>{selectedMember.name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">{selectedMember.plan} plan · Age {selectedMember.age}</p>
                      </div>
                    </div>
                    {selectedMember.healthNotes && (
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                        ⚕ {selectedMember.healthNotes.slice(0, 40)}...
                      </Badge>
                    )}
                  </div>

                  <TabsList className="mt-4">
                    <TabsTrigger value="workouts">Workout Plans</TabsTrigger>
                    <TabsTrigger value="sessions">Session Log</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="workouts" className="mt-0 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-muted-foreground">Manage weekly routines</p>
                      <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
                        <DialogTrigger 
                          render={
                            <Button size="sm" className="gap-2">
                              <Plus size={14} /> Add Plan
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create Workout Plan</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Day of Week</Label>
                                <select 
                                  className="w-full p-2 border rounded-md bg-background"
                                  value={newPlan.day}
                                  onChange={(e) => setNewPlan({...newPlan, day: e.target.value})}
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input 
                                  placeholder="e.g. Focus on form" 
                                  value={newPlan.notes}
                                  onChange={(e) => setNewPlan({...newPlan, notes: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-base font-bold">Exercises</Label>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setNewPlan({
                                    ...newPlan, 
                                    exercises: [...newPlan.exercises, { name: '', sets: '3', reps: '10', rest: '60s' }]
                                  })}
                                >
                                  + Add Exercise
                                </Button>
                              </div>
                              
                              {newPlan.exercises.map((ex, idx) => (
                                <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-muted/30">
                                  {idx > 0 && (
                                    <button 
                                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        const updated = [...newPlan.exercises];
                                        updated.splice(idx, 1);
                                        setNewPlan({...newPlan, exercises: updated});
                                      }}
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Exercise Name</Label>
                                      <Input 
                                        placeholder="e.g. Bench Press" 
                                        value={ex.name}
                                        onChange={(e) => {
                                          const updated = [...newPlan.exercises];
                                          updated[idx].name = e.target.value;
                                          setNewPlan({...newPlan, exercises: updated});
                                        }}
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Sets</Label>
                                        <Input 
                                          type="number"
                                          value={ex.sets}
                                          onChange={(e) => {
                                            const updated = [...newPlan.exercises];
                                            updated[idx].sets = e.target.value;
                                            setNewPlan({...newPlan, exercises: updated});
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Reps</Label>
                                        <Input 
                                          value={ex.reps}
                                          onChange={(e) => {
                                            const updated = [...newPlan.exercises];
                                            updated[idx].reps = e.target.value;
                                            setNewPlan({...newPlan, exercises: updated});
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Rest</Label>
                                        <Input 
                                          value={ex.rest}
                                          onChange={(e) => {
                                            const updated = [...newPlan.exercises];
                                            updated[idx].rest = e.target.value;
                                            setNewPlan({...newPlan, exercises: updated});
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Button 
                              className="w-full" 
                              onClick={handleAddPlan}
                              disabled={submitting || newPlan.exercises.some(e => !e.name)}
                            >
                              {submitting ? 'Creating...' : 'Create Workout Plan'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {memberWorkouts.length > 0 ? memberWorkouts.map((wp: any) => (
                      <div key={wp.id} className={cn(
                        "border rounded-lg p-4",
                        "border-2 border-foreground rounded-none"
                      )}>

                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{wp.day}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{wp.exercises.length} exercises</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeletePlan(wp.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Exercise</TableHead>
                              <TableHead>Sets</TableHead>
                              <TableHead>Reps</TableHead>
                              <TableHead>Rest</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wp.exercises.map((ex: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium text-sm">{ex.name}</TableCell>
                                <TableCell className="text-sm">{ex.sets}</TableCell>
                                <TableCell className="text-sm">{ex.reps}</TableCell>
                                <TableCell className="text-sm">{ex.rest}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {wp.notes && (
                          <p className="text-xs text-muted-foreground mt-3 italic bg-muted/50 p-2 rounded">
                            📝 {wp.notes}
                          </p>
                        )}
                      </div>
                    )) : (
                      <p className="text-center text-muted-foreground py-8">No workout plans yet for this member.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-0">
                    <div className="space-y-3">
                      {memberSessions.length > 0 ? memberSessions.map((session: any) => (
                        <div key={session.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{session.date}</p>
                              <p className="text-xs text-muted-foreground">{session.duration} minutes</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={session.completed ? "default" : "secondary"} className="text-xs">
                                {session.completed ? "Completed" : "In Progress"}
                              </Badge>
                              <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
                                <DialogTrigger>
                                  <Button variant="ghost" size="icon"><MessageSquare size={14} /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Session Notes</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <p className="text-sm">{session.notes}</p>
                                    <Textarea placeholder="Add notes..." defaultValue={session.notes} />
                                    <Button className="w-full" onClick={() => setNoteDialog(false)}>Save Notes</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(session.exercises || []).map((ex: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{ex}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">{session.notes}</p>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-8">No session logs yet.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="space-y-4">
                      {trainerReviews.length > 0 ? trainerReviews.map((r: any) => (
                        <div key={r.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={14} className={s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{r.date}</span>
                          </div>
                          <p className="text-sm">{r.feedback}</p>
                          <p className="text-xs text-muted-foreground mt-2 italic">Anonymous member review</p>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <User size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Select a member to manage workouts</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
