"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft, Mail, Phone, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const headingFont = "'Bebas Neue', sans-serif";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to reset password. Please check your details.");
      }
    } catch {
      setStatus("error");
      setMessage("A network error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to login
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Zap size={32} className="text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-black italic tracking-tighter" style={{ fontFamily: headingFont }}>RESET PASSWORD</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-2">Verify your account details</p>
        </div>

        <Card className="border-4 border-muted shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="bg-muted/30 border-b-4 border-muted">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Lock size={16} /> Identity Check
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {status === "success" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="h-12 w-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 scale-125 animate-bounce">
                  <Lock size={20} />
                </div>
                <p className="font-black uppercase text-green-600 tracking-tight">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 font-bold border-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Registered Phone"
                        className="pl-10 font-bold border-2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        className="pl-10 font-bold border-2"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border-2 border-destructive text-destructive rounded text-xs font-bold uppercase">
                    <AlertCircle size={14} />
                    {message}
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-black text-white hover:bg-zinc-800 font-black uppercase tracking-widest border-4 border-transparent active:scale-[0.98] transition-all"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "VERIFYING..." : "RESET PASSWORD"}
                  </Button>
                </div>


              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
