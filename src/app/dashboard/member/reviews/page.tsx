"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trainer, setTrainer] = useState<any | null>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch user's assigned trainer and all trainers concurrently
        const [trainerRes, allTrainersRes] = await Promise.all([
          fetch("/api/member/trainer"),
          fetch("/api/member/trainers")
        ]);
        
        const trainerData = await trainerRes.json().catch(() => null);
        const allTrainersData = await allTrainersRes.json().catch(() => []);
        
        if (Array.isArray(allTrainersData)) {
          setTrainers(allTrainersData);
        }

        if (trainerRes.ok && trainerData && trainerData.id) {
          setTrainer(trainerData);
          setSelectedTrainer(trainerData.id);
          
          // Fetch reviews for this trainer
          setReviewsLoading(true);
          const reviewsRes = await fetch(`/api/member/reviews?trainerId=${trainerData.id}`);
          if (reviewsRes.ok) {
            const reviewsList = await reviewsRes.json();
            setReviewsData(reviewsList);
          }
        } else {
          setTrainer(null);
          setSelectedTrainer("");
          setReviewsData([]); // Clear reviews if no trainer is assigned or found
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user?.id]);

  // Handle trainer change in dropdown
  const handleTrainerChange = async (trainerId: string | null) => {
    if (!trainerId) return;
    setSelectedTrainer(trainerId);
    const chosen = trainers.find(t => t.id === trainerId);
    if (chosen) setTrainer(chosen);
    else setTrainer(null); // If selected trainer is not in the list (e.g., "Select a trainer")

    try {
      setReviewsLoading(true);
      setReviewsData([]); // Clear previous reviews
      if (trainerId) { // Only fetch if a valid trainer is selected
        const res = await fetch(`/api/member/reviews?trainerId=${trainerId}`);
        if (res.ok) {
          const data = await res.json();
          setReviewsData(data);
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load reviews for selected trainer');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong fetching reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating || !selectedTrainer || isSubmitting || authLoading || !user) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const res = await fetch('/api/member/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId: selectedTrainer, rating, feedback })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }
      
      const newReview = await res.json();
      
      setReviewsData(prev => {
        const exists = prev.find(r => r.id === newReview.id);
        const reviewWithMemberName = { ...newReview, memberName: user.name || 'Anonymous' };
        
        if (exists) {
          return prev.map(r => r.id === newReview.id ? reviewWithMemberName : r);
        }
        return [reviewWithMemberName, ...prev];
      });
      
      setShowSuccess(true);
      setRating(0);
      setFeedback("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Review submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Member Reviews" />
        <div className="p-4 lg:p-6 text-center mt-20">
          <div className="animate-spin w-8 h-8 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-bold uppercase tracking-widest text-sm">Loading Trainer Info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <TopBar title="Member Reviews" />
      
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-8">
        {error && (
          <div className="bg-destructive/10 border-2 border-destructive p-4 text-destructive text-sm font-bold uppercase flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Submit Review Card */}
          <Card className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <CardHeader className="bg-foreground text-background rounded-none">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Leave Feedback
              </CardTitle>
              <p className="text-[10px] uppercase font-bold text-background/70">Your Review Helps Us Grow</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Trainer Selection */}
              <div className="space-y-2">
                <Label className="uppercase font-black text-xs tracking-widest">Selected Trainer</Label>
                <Select value={selectedTrainer} onValueChange={handleTrainerChange}>
                  <SelectTrigger className="w-full border-2 border-foreground rounded-none bg-muted/30 font-bold uppercase h-12 focus:ring-0">
                    <SelectValue placeholder="Select a trainer to review" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-foreground rounded-none uppercase font-bold">
                    {trainers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                        {t.name} ({t.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {trainer && (
                  <div className="mt-4 p-4 border-2 border-foreground bg-muted/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <p className="font-bold text-lg uppercase leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{trainer.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">{trainer.specialization}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{trainer.rating ? trainer.rating.toFixed(1) : '0.0'}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{trainer.reviewCount || 0} REVIEWS</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="space-y-4 pt-2">
                <Label className="uppercase font-black text-xs tracking-widest block text-center">Rate Your Experience</Label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-1 focus:outline-none focus:scale-110 transition-transform disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Star
                        size={36}
                        className={cn(
                          "transition-all duration-200",
                          s <= (hoverRating || rating)
                            ? "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    Level: <span className={cn(
                      rating >= 4 ? "text-green-600" : rating >= 3 ? "text-yellow-600" : "text-destructive"
                    )}>
                      {rating === 1 && "Basic"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Solid"}
                      {rating === 4 && "Great"}
                      {rating === 5 && "Elite"}
                    </span>
                  </p>
                )}
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-2">
                <Label className="uppercase font-black text-xs tracking-widest">Detailed Feedback</Label>
                <Textarea
                  placeholder="Tell us what you loved or where we can improve..."
                  className="rounded-none border-2 border-foreground min-h-[120px] focus-visible:ring-0 focus-visible:border-foreground"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>

              <Button
                className="w-full h-14 rounded-none border-4 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black text-xl uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                disabled={!selectedTrainer || rating === 0}
                onClick={handleSubmit}
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                <MessageSquare className="mr-3 w-6 h-6" />
                Submit Review
              </Button>
            </CardContent>
          </Card>

          {/* Past Reviews Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Community Feedback
            </h2>
            
            <div className="space-y-4">
              {reviewsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-28 bg-muted animate-pulse border-2 border-foreground/10" />
                ))
              ) : reviewsData.length > 0 ? (
                reviewsData.map((rev) => (
                  <Card key={rev.id} className="border-2 border-foreground rounded-none shadow-none bg-background hover:bg-muted/5 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <p className="font-bold text-sm uppercase tracking-tight">{rev.memberName || 'Anonymous'}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={cn(
                                  star <= rev.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {format(new Date(rev.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      
                      {rev.feedback && (
                        <p className="text-sm text-foreground/80 leading-relaxed italic border-l-4 border-foreground/20 pl-4 bg-muted/20 py-2">
                          "{rev.feedback}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 border-4 border-dashed border-foreground/10 bg-muted/5 flex flex-col items-center">
                  <AlertCircle size={40} className="text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-black uppercase tracking-tighter text-muted-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>No reviews found</p>
                  <p className="text-xs text-muted-foreground/60 uppercase font-bold mt-1">Be the first to rate your coach!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[425px] border-4 border-foreground rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-green-500 border-2 border-foreground flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <DialogTitle className="text-4xl font-black text-center uppercase tracking-tighter leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Review Published!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Mission Accomplished.</p>
            <p className="text-xs text-muted-foreground">Your feedback has been delivered to the trainer's dashboard.</p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-14 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-foreground/90 font-black text-xl uppercase tracking-tighter transition-all"
              onClick={() => setShowSuccess(false)}
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Continue Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
