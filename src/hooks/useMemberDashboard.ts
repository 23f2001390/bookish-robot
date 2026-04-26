import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export function useMemberDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trainer, setTrainer] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;
    
    try {
      const [pRes, aRes, bRes, tRes, iRes] = await Promise.all([
        fetch("/api/member/profile", { credentials: 'include' }),
        fetch("/api/member/attendance", { credentials: 'include' }),
        fetch("/api/member/bookings?upcoming=true", { credentials: 'include' }),
        fetch("/api/member/trainer", { credentials: 'include' }),
        fetch("/api/member/invoices", { credentials: 'include' }),
      ]);

      if (pRes.status === 401) {
        router.push("/login");
        return;
      }

      if (pRes.status === 404) {
        setLoadingData(false);
        setError("Member profile not found. Your account might have been reset.");
        return;
      }

      if (!pRes.ok) {
        const profErr = await pRes.json().catch(() => null);
        throw new Error(profErr?.error || "Unable to load member profile");
      }

      const prof = await pRes.json();
      const att = aRes.ok ? await aRes.json() : [];
      const bkg = bRes.ok ? await bRes.json() : [];
      const inv = iRes.ok ? await iRes.json() : [];
      
      let trn: any = null;
      if (tRes.status === 200) {
        trn = await tRes.json();
      }

      setProfile(prof);
      setAttendance(att);
      setBookings(bkg);
      setInvoices(inv);
      setTrainer(trn);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoadingData(false);
    }
  }, [authLoading, user?.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    profile,
    attendance,
    bookings,
    invoices,
    trainer,
    loadingData,
    error,
    refreshData: fetchData
  };
}
