"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
// import { trainers, availableTimeSlots, bookings } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, addDays, parseISO } from "date-fns";
import { Star, CalendarCheck, CheckCircle2, Clock, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function BookingPage() {
  // Use user and authLoading from auth context; NextAuth handles cookies automatically
  const { user, loading: authLoading } = useAuth();
  const [trainersData, setTrainersData] = useState<any[]>([]);
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [booked, setBooked] = useState(false);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const selectedDate = date ? format(date, "yyyy-MM-dd") : "";

  // Check if the member already has an active booking for the selected date
  const existingBookingForDate = bookingsData.find((b: any) => {
    const bookingDateStr = typeof b.date === 'string' ? b.date.slice(0, 10) : new Date(b.date).toISOString().slice(0, 10);
    return bookingDateStr === selectedDate && b.status?.toLowerCase() !== 'cancelled';
  });

  // Fetch trainers and bookings
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (authLoading || !user) return;
      try {
        // Only show full loading state if we have no data yet
        if (trainersData.length === 0) {
          setLoading(true);
        }
        setError(null);
        const [trainersRes, bookingsRes] = await Promise.all([
          fetch('/api/member/trainers', { credentials: 'include' }),
          fetch('/api/member/bookings', { credentials: 'include' })
        ]);
        
        if (!isMounted) return;

        if (!trainersRes.ok) {
          const err = await trainersRes.json();
          throw new Error(err.error || 'Failed to load trainers');
        }
        if (!bookingsRes.ok) {
          const err = await bookingsRes.json();
          throw new Error(err.error || 'Failed to load bookings');
        }
        
        const trainersList = await trainersRes.json();
        const bookingsList = await bookingsRes.json();
        
        setTrainersData(trainersList);
        setBookingsData(bookingsList);
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [authLoading, user?.id]);

  // Fetch all busy slots for the selected trainer
  useEffect(() => {
    async function fetchBusySlots() {
      if (!selectedTrainer) {
        setBusySlots([]);
        return;
      }
      try {
        const res = await fetch(`/api/member/bookings?trainerId=${selectedTrainer}&upcoming=true`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBusySlots(data);
        }
      } catch (err) {
        console.error('Failed to fetch busy slots', err);
      }
    }
    fetchBusySlots();
  }, [selectedTrainer]);


  // Compute available slots when trainer/date changes
  useEffect(() => {
    function computeSlots() {
      const trainer = trainersData.find(t => t.id === selectedTrainer);
      if (!trainer || !date) {
        setAvailableSlots([]);
        return;
      }
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dayName = days[date.getDay()];
      const schedule = trainer.schedule as any;
      
      // Fallback for empty schedules (Standard Gym Hours: 09:00 - 18:00)
      const defaultSlots = [{ start: '09:00', end: '18:00', type: 'available' }];
      const daySlots = schedule && schedule[dayName] && schedule[dayName].length > 0 
        ? schedule[dayName] 
        : defaultSlots;
      
      const allPossibleTimeSlots: string[] = [];
      
      // Expand ranges like {start: "06:00", end: "22:00", type: "available"} into hourly slots
      daySlots.forEach((slot: any) => {
        if (slot.type === 'available') {
          let current = parseInt(slot.start.split(':')[0]);
          const end = parseInt(slot.end.split(':')[0]);
          while (current < end) {
            allPossibleTimeSlots.push(`${current.toString().padStart(2, '0')}:00`);
            current++;
          }
        } else if (slot.start) {
          // If it's a fixed slot (legacy format)
          allPossibleTimeSlots.push(slot.start);
        }
      });

      const formatted = allPossibleTimeSlots.map(t => {
        const [h, m] = t.split(':');
        const d = new Date();
        d.setHours(parseInt(h));
        d.setMinutes(parseInt(m));
        const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return d.toLocaleTimeString(undefined, options).replace(/ /g, '');
      });
      
      // Filter out duplicates and sort
      const uniqueSorted = Array.from(new Set(formatted)).sort((a, b) => {
        const timeToMinutes = (t: string) => {
          const hours = parseInt(t.match(/\d+/)![0]);
          const isPM = t.includes('PM');
          const finalHours = (isPM && hours !== 12) ? hours + 12 : (!isPM && hours === 12) ? 0 : hours;
          return finalHours * 60;
        };
        return timeToMinutes(a) - timeToMinutes(b);
      });

      setAvailableSlots(uniqueSorted);
    }
    if (selectedTrainer && date) {
      computeSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedTrainer, date, trainersData]);

  const trainer = trainersData.find(t => t.id === selectedTrainer);

  // Determine if a given time slot is already booked for the selected trainer/date
  const isSlotBooked = (time: string) => {
    // Check both user's local bookings and the trainer's busy slots
    const allRelevantBookings = [...(busySlots || [])];
    
    return allRelevantBookings.some((b: any) => {
      // Extract date portion in YYYY-MM-DD regardless of Date or string input
      let bookingDateStr: string;
      if (typeof b.date === 'string') {
        // When backend returns ISO string or date string, slice the first 10 chars
        bookingDateStr = b.date.slice(0, 10);
      } else {
        // For Date objects, convert to ISO string
        bookingDateStr = new Date(b.date).toISOString().slice(0, 10);
      }
      return bookingDateStr === selectedDate && b.time === time;
    });
  };

  const handleBook = async () => {
    if (!selectedTrainer || !selectedDate || !selectedTime || authLoading || !user) return;
    try {
      setError(null);
      const res = await fetch('/api/member/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ trainerId: selectedTrainer, date: selectedDate, time: selectedTime })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setBooked(true);
      setBookingsData(prev => [...prev, data]);
      setBusySlots(prev => [...prev, data]);
      
      setTimeout(() => {
        setShowConfirm(false);
        setBooked(false);
        setSelectedTime('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Booking failed');
      setShowConfirm(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/member/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to cancel booking');
        return;
      }
      // Update local state so UI reflects immediately
      setBookingsData(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
      setBusySlots(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: any) {
      setError('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <TopBar title="Book a Session" />
      <div className="p-4 lg:p-6 space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : error ? (
          <div className="text-center text-destructive flex items-center gap-2 justify-center"><AlertCircle size={16} /> {error}</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Schedule a Training Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select Trainer */}
              <div className="space-y-2">
                <Label>Select Trainer</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trainersData.filter((t: any) => t.availability !== 'off').map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrainer(t.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        selectedTrainer === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                        "rounded-none border-2",
                        selectedTrainer === t.id && "border-foreground bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {t.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.specialization}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-muted-foreground font-medium">{t.rating ? t.rating.toFixed(1) : '0.0'}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({t.reviewCount || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Date */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger render={<Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-2 rounded-none h-11",
                        !date && "text-muted-foreground"
                      )}
                    />}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date() || date < addDays(new Date(), -1)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Select Time */}
              {selectedTrainer && (
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {availableSlots.map((time: string) => {
                        const slotBooked = isSlotBooked(time);
                        return (
                          <button
                            key={time}
                            disabled={slotBooked}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "p-3 rounded-lg border text-center text-sm transition-all",
                              slotBooked && "opacity-40 cursor-not-allowed line-through",
                              !slotBooked && selectedTime === time && "border-foreground bg-secondary font-medium",
                              !slotBooked && selectedTime !== time && "hover:bg-muted/50",
                              "rounded-none border-2"
                            )}
                          >
                            <Clock size={14} className="mx-auto mb-1" />
                            {time}
                            {slotBooked && <p className="text-[10px] text-destructive">Booked</p>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed text-center text-sm text-muted-foreground">
                      No availability found for this date.
                    </div>
                  )}
                </div>
              )}

              {/* Book Button */}
              {existingBookingForDate && !booked && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>You already have a session booked on this date ({existingBookingForDate.time} with {existingBookingForDate.trainerName}). Cancel it first to rebook.</span>
                </div>
              )}
              <Button
                size="lg"
                className={cn("w-full", "uppercase font-black")}
                disabled={!selectedTrainer || !selectedTime || !selectedDate || !!existingBookingForDate}
                onClick={() => setShowConfirm(true)}
              >
                <CalendarCheck size={18} className="mr-2" />
                BOOK NOW
              </Button>
            </CardContent>
          </Card>

          {/* Existing Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookingsData.length > 0 ? bookingsData.map((b: any) => {
                  // Normalize date display
                  const dateStr = typeof b.date === 'string'
                    ? b.date.slice(0, 10)
                    : new Date(b.date).toISOString().slice(0, 10);
                  return (
                    <div key={b.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{b.trainerName}</p>
                        <Badge variant="outline" className={cn("text-xs capitalize",
                          b.status.toLowerCase() === 'confirmed' && 'bg-green-500/10 text-green-600',
                          b.status.toLowerCase() === 'pending' && 'bg-yellow-500/10 text-yellow-600',
                          b.status.toLowerCase() === 'cancelled' && 'bg-red-500/10 text-red-600'
                        )}>
                          {b.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{dateStr} at {b.time}</p>
                      {b.status.toLowerCase() !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2 w-full"
                          disabled={cancellingId === b.id}
                          onClick={() => handleCancel(b.id)}
                        >
                          {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                        </Button>
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog 
          open={showConfirm} 
          onOpenChange={(open) => {
            setShowConfirm(open);
            if (!open) {
              setBooked(false);
              // Small delay to prevent UI flickering if we want to clear inputs
              // but only if it's after a successful booking
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{booked ? "Booking Confirmed!" : "Confirm Your Booking"}</DialogTitle>
            </DialogHeader>
            {booked ? (
              <div className="flex flex-col items-center py-6">
                <CheckCircle2 size={48} className="text-green-500 mb-4" />
                <p className="text-sm text-muted-foreground">Your session has been booked successfully.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Trainer</p>
                    <p className="font-medium">{trainer?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Specialization</p>
                    <p className="font-medium">{trainer?.specialization}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleBook}>Confirm</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
