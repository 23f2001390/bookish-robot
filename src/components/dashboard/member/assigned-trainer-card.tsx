import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignedTrainerCardProps {
  trainer: any;
}

export function AssignedTrainerCard({ trainer }: AssignedTrainerCardProps) {
  if (!trainer) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Trainer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "p-4 rounded-lg border",
          "border-2 border-foreground rounded-none"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {trainer.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{trainer.name}</p>
              <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={s <= Math.round(trainer.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{trainer.rating}</span>
              </div>
            </div>
            <Badge variant="outline" className={cn("capitalize text-xs",
              trainer.availability === "available" && "bg-green-500/10 text-green-600"
            )}>
              {trainer.availability}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
