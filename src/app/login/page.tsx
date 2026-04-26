"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft } from "lucide-react";

// Pull in auth hooks to perform login
import { useAuth } from "@/lib/auth-context";
import { signIn as signInProvider } from "next-auth/react";

function LoginContent() {
  const headingFont = "'Bebas Neue', sans-serif";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  // Listen to URL search params for NextAuth error redirections
  useEffect(() => {
    const err = searchParams?.get("error");
    if (err === "OAuthAccountNotLinked") {
      setError("To confirm your identity, sign in with the same account you used originally (e.g., using your Email and Password).");
    } else if (err === "Callback") {
      setError("Authentication service error. Please try again.");
    } else if (err) {
      setError("An error occurred during sign in.");
    }
  }, [searchParams]);
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password); // no role hint anymore
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signInProvider('google', { callbackUrl: '/dashboard/member' });
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <Zap size={28} className="text-primary" />
          <span className="text-2xl font-bold" style={{ fontFamily: headingFont }}>SoulRep</span>
        </Link>
        <h1 className="text-3xl font-bold" style={{ fontFamily: headingFont }}>WELCOME BACK</h1>
        <p className="text-sm text-muted-foreground mt-1">Log in to your account</p>
      </div>

      <Card className="border-2 border-foreground">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 border-2 border-red-500 bg-red-50 text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-muted-foreground hover:text-foreground transition-all uppercase font-bold tracking-widest hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full uppercase font-black text-base" disabled={isLoading}>
              {isLoading ? "LOGGING IN..." : "LOG IN"}
            </Button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-muted" />
            <span className="mx-2 text-muted-foreground text-xs uppercase">or</span>
            <hr className="flex-grow border-muted" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full uppercase font-black text-base"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            CONTINUE WITH GOOGLE
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            New here?{" "}
            <Link href="/signup" className="text-foreground font-semibold hover:underline">
              Sign up as a member
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to home
      </Link>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
