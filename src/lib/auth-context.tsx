"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

/**
 * A simplified user type that mirrors the fields exposed on the NextAuth session.
 * Additional properties such as role are included via the NextAuth callbacks.
 */
export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  /**
   * Perform login using NextAuth. When login succeeds, the router will
   * navigate to the appropriate dashboard based on the user role returned from the session.
   */
  login: (email: string, password: string) => Promise<void>;
  /**
   * Register a new member via the custom signup API. After creating the user
   * it automatically signs the user in via NextAuth.
   */
  signup: (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string
  ) => Promise<void>;
  /**
   * Sign the user out and return to the login page.
   */
  logout: () => void;
}

// Create a context with sensible defaults. Values will be provided by the
// AuthProvider below.
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

/**
 * AuthProvider wraps the application and exposes authentication state and
 * helper methods. It derives the current user from NextAuth's session and
 * wraps NextAuth's signIn/signOut functions with navigation logic.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = React.useMemo(() => {
    return session?.user
      ? {
          id: (session.user as any).id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          role: (session.user as any).role ?? null,
        }
      : null;
  }, [session]);


  // Login using NextAuth credentials provider. Returns void or throws on error.
  const login = React.useCallback(async (email: string, password: string) => {
    // Explicitly let NextAuth handle the redirect based on session, or we can fetch the user's role 
    // after signIn and redirect manually. Here we tell next-auth to not redirect, then we wait for signIn response.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      throw new Error(result.error === "CredentialsSignin" ? "Invalid email or password." : (result.error || "Login failed"));
    }

    // Now fetch the session so we can redirect globally
    const res = await fetch('/api/auth/session');
    const newSession = await res.json();
    const currentRole = newSession?.user?.role || "MEMBER";
    
    const path = currentRole ? `/dashboard/${currentRole.toLowerCase()}` : "/dashboard/member";
    router.push(path);
  }, [router]);

  // Signup via our custom API, then sign the user in via NextAuth
  const signup = React.useCallback(async (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string
  ) => {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Signup failed");
    }
    // After creating the user, sign them in
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard/member");
  }, [router]);

  // Sign the user out via NextAuth and navigate to login
  const logout = React.useCallback(() => {
    signOut({ redirect: false });
    router.push("/login");
  }, [router]);


  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume authentication context. Throws if used outside
 * of an AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
