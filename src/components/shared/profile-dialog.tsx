"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { User, Phone, Lock, Hash, VenusAndMars, Save, CheckCircle2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    age: 18,
    gender: "OTHER"
  });

  useEffect(() => {
    if (!open || !user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const role = user.role?.toLowerCase() || "member";
        const res = await fetch(`/api/${role}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFormData({
            name: data.user?.name || data.name || "",
            phone: data.user?.phone || data.phone || "",
            password: "",
            age: data.member?.age || data.age || 18,
            gender: data.member?.gender || data.gender || "OTHER"
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError(null);

    const role = user?.role?.toLowerCase() || "member";
    const payload: any = {
      name: formData.name,
      phone: formData.phone,
      age: formData.age,
      gender: formData.gender
    };
    if (formData.password) payload.password = formData.password;

    try {
      const res = await fetch(`/api/${role}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        setFormData(prev => ({ ...prev, password: "" }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Update failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 border-4 border-sidebar-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <DialogHeader className="p-6 bg-muted border-b-2 border-muted-foreground/10">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Account Settings
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Update your personal profile and security information.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Data...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 font-bold border-2 focus-visible:ring-0 focus-visible:border-primary" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 00000 00000"
                    className="pl-10 font-bold border-2 focus-visible:ring-0 focus-visible:border-primary" 
                  />
                </div>
              </div>
            </div>

            {user?.role === "MEMBER" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Age</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="pl-10 font-bold border-2 focus-visible:ring-0 focus-visible:border-primary" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</Label>
                  <div className="relative">
                    <VenusAndMars className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                    <Select 
                      value={(formData.gender || "OTHER") as string} 
                      onValueChange={(v) => { if (v) setFormData({ ...formData, gender: v }) }}
                    >
                      <SelectTrigger className="pl-10 font-bold border-2 focus:ring-0 focus:border-primary overflow-hidden">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="border-4 border-muted">
                        <SelectItem value="MALE" className="font-bold uppercase text-xs">Male</SelectItem>
                        <SelectItem value="FEMALE" className="font-bold uppercase text-xs">Female</SelectItem>
                        <SelectItem value="OTHER" className="font-bold uppercase text-xs">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}


            <div className="pt-4 flex flex-col gap-3">
              {success && (
                <div className="bg-primary/10 border-2 border-primary p-3 flex items-center gap-2 text-primary rounded">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Changes deployed successfully!</span>
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 border-2 border-destructive p-3 flex items-center gap-2 text-destructive rounded font-bold text-xs uppercase px-4 py-2">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-primary text-primary-foreground font-black uppercase h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 text-xs"
              >
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                {isSaving ? "Synchronizing..." : "Commit Profile Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
