import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ManagePlanDialog } from "./manage-plan-dialog";

interface PlanProgressCardProps {
  member: any;
  planProgress: number;
}

export function PlanProgressCard({ member, planProgress }: PlanProgressCardProps) {
  const baseSessions = member.plan === 'BASIC' ? 0 : member.plan === 'PRO' ? 1 : 4;
  
  // Custom sessions (add-ons or gifts) mean remaining could exceed standard plan limit. 
  // We use max to prevent negative usage or '0/0' logic bugs.
  const totalSessions = Math.max(baseSessions, member.sessionsRemaining);
  const sessionsUsed = Math.max(0, totalSessions - member.sessionsRemaining);
  const sessionProgress = totalSessions > 0 ? (sessionsUsed / totalSessions) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Plan Progress</CardTitle>
        <ManagePlanDialog />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Sessions Used</span>
            <span className="font-medium">{sessionsUsed}/{totalSessions}</span>
          </div>
          <Progress value={sessionProgress} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Plan Duration</span>
            <span className="font-medium">{planProgress}%</span>
          </div>
          <Progress value={planProgress} />
        </div>
      </CardContent>
    </Card>
  );
}
