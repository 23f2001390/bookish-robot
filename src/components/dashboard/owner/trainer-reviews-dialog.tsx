import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MessageSquare, Loader2 } from "lucide-react";

interface TrainerReviewsDialogProps {
  trainer: any | null;
  onClose: () => void;
  reviews: any[];
  isLoading: boolean;
}

export function TrainerReviewsDialog({ trainer, onClose, reviews, isLoading }: TrainerReviewsDialogProps) {
  return (
    <Dialog open={!!trainer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-4 border-foreground rounded-none shadow-[10px_10px_0_0_rgba(0,0,0,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {trainer?.name}'s Reviews
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                Fetching trainer feedback...
              </p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 border-2 border-foreground bg-muted/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground opacity-30"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">{r.date}</span>
                  </div>
                  <p className="text-sm font-bold tracking-tight italic text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
                    "{r.feedback}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto text-muted-foreground opacity-20 mb-2" size={48} />
              <p className="text-sm font-black uppercase text-muted-foreground italic">No member reviews found.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
