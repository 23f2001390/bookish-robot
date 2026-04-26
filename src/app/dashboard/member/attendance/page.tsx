"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { QrCode, CheckCircle2, Scan, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Html5Qrcode } from "html5-qrcode";

export default function MemberAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/member/attendance", { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchAttendance();
  }, [authLoading, user?.id]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (scanning && !authLoading) {
      // Small delay to ensure the DOM element is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (!element) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          async (decodedText: string) => {
            setScanning(false);
            if (html5QrCode) {
              await html5QrCode.stop().catch(console.error);
            }
            
            try {
              const res = await fetch("/api/member/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: decodedText }),
              });

              if (res.ok) {
                setStatus("success");
                fetchAttendance();
              } else {
                const err = await res.json();
                setStatus("error");
                setErrorMsg(err.error || "Verification failed");
              }
            } catch (err) {
              setStatus("error");
              setErrorMsg("Network error during check-in");
            }
          },
          (errorMessage: string) => {
            // Scanning, no action needed for common errors
          }
        ).catch((err) => {
          console.error("Failed to start scanner:", err);
          setScanning(false);
          setStatus("error");
          setErrorMsg("Could not access camera. Ensure you are on HTTPS or localhost.");
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [scanning, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar title="Attendance" />
        <div className="p-10 text-center font-bold animate-pulse">Wait for SoulRep...</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Attendance" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-base font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Scan to Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              {status === "success" ? (
                <div className="text-center animate-in zoom-in-50 duration-300">
                  <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 mx-auto">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-green-600 mb-2 uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Checked In!</h3>
                  <p className="text-sm font-bold text-muted-foreground uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EXCELLENT WORK.</p>
                  <Button variant="outline" className="mt-8 font-black border-2" onClick={() => setStatus("idle")}>DONE</Button>
                </div>
              ) : status === "error" ? (
                <div className="text-center animate-in shake-1 duration-300">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
                    <XCircle size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-red-600 mb-2 uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SCAN FAILED</h3>
                  <p className="text-sm font-bold text-muted-foreground mb-1 uppercase">{errorMsg}</p>
                  <div className="flex gap-4 mt-8">
                    <Button variant="outline" className="font-black border-2" onClick={() => setStatus("idle")}>BACK</Button>
                    <Button className="font-black" onClick={() => { setStatus("idle"); setScanning(true); }}>RETRY</Button>
                  </div>
                </div>
              ) : scanning ? (
                <div className="w-full flex flex-col items-center">
                  <div id="qr-reader" className="w-full max-w-[400px] min-h-[300px] border-4 border-primary rounded-none mb-6 overflow-hidden bg-black flex items-center justify-center" />
                  <p className="flex items-center gap-2 text-primary font-black animate-pulse text-xs uppercase tracking-widest">
                    <Scan size={14} /> Center QR Code in Frame
                  </p>
                  <Button variant="ghost" className="mt-6 text-xs font-black uppercase text-red-500" onClick={() => setScanning(false)}>CANCEL</Button>
                </div>
              ) : (
                <>
                  <div className="w-48 h-48 border-4 border-dashed border-muted rounded-none flex items-center justify-center mb-8 relative">
                    <QrCode size={80} className="text-muted/30" />
                    <Scan size={32} className="absolute top-4 left-4 text-primary/20" />
                  </div>
                  <div className="text-center mb-8 space-y-2 px-10">
                    <h4 className="font-black text-sm uppercase tracking-tight">READY TO WORK?</h4>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase leading-tight tracking-widest">Check in at the gym reception terminal to track your progress.</p>
                  </div>
                  <Button size="lg" className="h-14 px-10 rounded-none font-black text-base tracking-widest uppercase shadow-xl" onClick={() => setScanning(true)}>
                    <Scan className="mr-3" /> Start Scanner
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <CardTitle className="text-sm font-black uppercase tracking-tight">Recent Sessions</CardTitle>
              <Badge className="bg-primary text-[10px] uppercase font-black">{attendance.length} TOTAL</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {attendance.length > 0 ? attendance.slice(0, 7).map(a => (
                  <div key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/5 border border-primary/20 flex items-center justify-center">
                        <CalendarIcon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{a.date}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{a.checkIn} CHECK-IN</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black tracking-widest flex items-center gap-1 uppercase">
                      {a.method === "qr" ? <QrCode size={10} /> : <AlertCircle size={10} />}
                      {a.method}
                    </Badge>
                  </div>
                )) : (
                  <div className="p-12 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No attendance history yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <rect width="18" height="18" x="3" y="4" rx="1" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="16" x2="16" y1="2" y2="6" />
    </svg>
  );
}
