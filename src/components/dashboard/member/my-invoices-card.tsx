import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyInvoicesCardProps {
  invoices: any[];
}

export function MyInvoicesCard({ invoices }: MyInvoicesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                <div>
                  <p className="text-sm font-bold uppercase tracking-tight">{inv.plan} PLAN</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    {new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">₹{inv.amount}</p>
                    <Badge variant="outline" className={cn("text-[8px] h-4 font-black px-1", 
                      inv.status === 'PAID' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    )}>
                      {inv.status}
                    </Badge>
                  </div>
                  <a 
                    href={`/api/member/invoices/${inv.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No invoices generated yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
