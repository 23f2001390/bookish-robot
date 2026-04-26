import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentAttendanceCardProps {
  recentAttendance: any[];
}

export function RecentAttendanceCard({ recentAttendance }: RecentAttendanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {recentAttendance.length > 0 ? (
          <div className="space-y-2">
            {recentAttendance.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{a.date}</p>
                  <p className="text-xs text-muted-foreground">{a.checkIn} CHECK-IN</p>
                </div>
                <Badge variant="outline" className="text-xs">{a.method.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
