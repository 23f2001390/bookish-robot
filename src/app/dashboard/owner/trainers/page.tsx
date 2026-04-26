"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Users, Clock, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrainersPage() {
  // Pull the user and loading state from auth. We no longer use a token for auth
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainersData, setTrainersData] = useState<any[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [trainerMembers, setTrainerMembers] = useState<any[]>([]);
  const [trainerReviews, setTrainerReviews] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    password: ''
  });

  async function fetchTrainers() {
    // Wait until auth context is loaded and a user exists
    if (authLoading || !user) return;
    try {
      const res = await fetch('/api/owner/trainers', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to load trainers');
      }
      const data = await res.json();
      setTrainersData(data);
      if (data.length > 0 && !selectedTrainerId) {
        setSelectedTrainerId(data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrainers();
  }, [authLoading, user?.id]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/owner/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newTrainer.firstName} ${newTrainer.lastName}`,
          email: newTrainer.email,
          phone: newTrainer.phone,
          specialization: newTrainer.specialization,
          password: newTrainer.password
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add trainer');
      }

      await fetchTrainers();
      setIsDialogOpen(false);
      setNewTrainer({ firstName: '', lastName: '', email: '', phone: '', specialization: '', password: '' });
      alert('Trainer added successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Fetch members and reviews when selected trainer changes
  // Fetch members and reviews when selected trainer changes
  useEffect(() => {
    async function fetchDetails() {
      if (authLoading || !user || !selectedTrainerId) return;
      try {
        const [membersRes, reviewsRes] = await Promise.all([
          fetch(`/api/owner/trainers/${selectedTrainerId}/members`, { credentials: 'include' }),
          fetch(`/api/owner/trainers/${selectedTrainerId}/reviews`, { credentials: 'include' })
        ]);
        const membersData = await membersRes.json();
        const reviewsData = await reviewsRes.json();
        setTrainerMembers(membersData);
        setTrainerReviews(reviewsData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDetails();
  }, [authLoading, user?.id, selectedTrainerId]);

  const availabilityColor = (a: string) => {
    switch (a) {
      case 'AVAILABLE':
      case 'available': return 'bg-green-500/10 text-green-600';
      case 'BUSY':
      case 'busy': return 'bg-yellow-500/10 text-yellow-600';
      case 'OFF':
      case 'off': return 'bg-red-500/10 text-red-600';
      default: return '';
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div>
        <TopBar title="Trainers" />
        <div className="p-4 lg:p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const selectedTrainer = selectedTrainerId ? trainersData.find(t => t.id === selectedTrainerId) : null;

  return (
    <div>
      <TopBar title="Trainers" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trainer List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">All Trainers</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger render={
                  <Button size="sm" className="gap-1">
                    <Plus size={14} /> Add Trainer
                  </Button>
                } / >
                <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Add New Trainer</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateTrainer}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="trainerFirst">First Name</Label>
                        <Input 
                          id="trainerFirst" 
                          placeholder="First name" 
                          required
                          value={newTrainer.firstName}
                          onChange={e => setNewTrainer({...newTrainer, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trainerLast">Last Name</Label>
                        <Input 
                          id="trainerLast" 
                          placeholder="Last name" 
                          required
                          value={newTrainer.lastName}
                          onChange={e => setNewTrainer({...newTrainer, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainerEmail">Email</Label>
                      <Input 
                        id="trainerEmail" 
                        type="email" 
                        placeholder="trainer@soulrep.in" 
                        required
                        value={newTrainer.email}
                        onChange={e => setNewTrainer({...newTrainer, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainerPhone">Mobile Number (Optional)</Label>
                      <Input 
                        id="trainerPhone" 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        value={newTrainer.phone}
                        onChange={e => setNewTrainer({...newTrainer, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainerSpec">Specialization</Label>
                      <Input 
                        id="trainerSpec" 
                        placeholder="e.g. Strength & Conditioning" 
                        required
                        value={newTrainer.specialization}
                        onChange={e => setNewTrainer({...newTrainer, specialization: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainerPass">Password</Label>
                      <Input 
                        id="trainerPass" 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        value={newTrainer.password}
                        onChange={e => setNewTrainer({...newTrainer, password: e.target.value})}
                      />
                    </div>
                    <div className="pt-4 border-t-2 border-dashed border-black">
                      <Button type="submit" disabled={isAdding} className="w-full uppercase font-black text-lg py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        {isAdding ? "Generating..." : "Add Trainer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-1 p-4">
                  {trainersData.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrainerId(t.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        selectedTrainerId === t.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {t.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.specialization}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-xs capitalize", availabilityColor(t.availability))}>
                          {t.availability}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-13 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users size={12} />{t.memberCount}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" />{t.rating}</span>
                        <span className="flex items-center gap-1">{t.reviewCount} reviews</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Trainer Detail */}
          <Card className="lg:col-span-2">
            {selectedTrainer ? (
              <Tabs defaultValue="schedule">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {selectedTrainer.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <CardTitle>{selectedTrainer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedTrainer.specialization}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} className={s <= Math.round(selectedTrainer.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">({selectedTrainer.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("capitalize", availabilityColor(selectedTrainer.availability))}>
                      {selectedTrainer.availability}
                    </Badge>
                  </div>
                  <TabsList className="mt-4">
                    <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="members">Members ({trainerMembers.length})</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews ({trainerReviews.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="schedule" className="mt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Day</TableHead>
                            <TableHead>Slots</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {days.map(day => (
                            <TableRow key={day}>
                              <TableCell className="font-medium text-sm">{day}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                  {(selectedTrainer.schedule && selectedTrainer.schedule[day] ? selectedTrainer.schedule[day] : []).map((slot: any, i: number) => (
                                    <Badge
                                      key={i}
                                      variant={slot.type === "session" ? "default" : slot.type === "available" ? "outline" : "secondary"}
                                      className="text-xs"
                                    >
                                      {slot.start}-{slot.end}
                                      {slot.memberName && ` · ${slot.memberName}`}
                                      {slot.type === "break" && " · Break"}
                                      {slot.type === "available" && " · Open"}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="members" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Sessions Left</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trainerMembers.map(m => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{m.name}</p>
                                <p className="text-xs text-muted-foreground">{m.email}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="capitalize text-xs">{m.plan}</Badge></TableCell>
                            <TableCell className="text-sm">{m.sessionsRemaining}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize text-xs",
                                  m.planStatus.toLowerCase() === 'active' && 'bg-green-500/10 text-green-600',
                                  m.planStatus.toLowerCase() === 'expiring' && 'bg-yellow-500/10 text-yellow-600',
                                  m.planStatus.toLowerCase() === 'expired' && 'bg-red-500/10 text-red-600'
                                )}
                              >
                                {m.planStatus.toLowerCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="space-y-4">
                      {trainerReviews.map(r => (
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
                          <p className="text-xs text-muted-foreground mt-2 italic">Anonymous review</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Users size={48} className="mb-4 opacity-30" />
                <p className="text-sm">Select a trainer to view details</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
