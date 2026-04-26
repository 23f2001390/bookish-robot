"use client";

import { useState, useEffect } from "react";
import { 
  Wrench, AlertTriangle, CheckCircle2, 
  History, Plus, Settings2, Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: string;
  lastMaintenance: string | null;
  maintenanceLogs: MaintenanceLog[];
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/owner/equipment");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEquipment(data);
      } else {
        console.error("Failed to fetch equipment", data);
        setEquipment([]);
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/owner/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchEquipment();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational": return "text-green-500 bg-green-500/10";
      case "under maintenance": return "text-yellow-500 bg-yellow-500/10";
      case "broken": return "text-red-500 bg-red-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational": return <CheckCircle2 size={16} />;
      case "under maintenance": return <Wrench size={16} />;
      case "broken": return <AlertTriangle size={16} />;
      default: return <Settings2 size={16} />;
    }
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEqName, setNewEqName] = useState("");
  const [newEqCategory, setNewEqCategory] = useState("");

  const handleAddEquipment = async () => {
    if (!newEqName || !newEqCategory) return;
    try {
      const res = await fetch("/api/owner/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEqName, category: newEqCategory, status: "Operational" }),
      });
      if (res.ok) {
        setNewEqName("");
        setNewEqCategory("");
        setIsAddOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Resource Tracking
          </h1>
          <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1">
            Machine Maintenance & Inventory logs
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <Button className="font-black h-12 px-6 uppercase tracking-wider bg-primary text-primary-foreground hover:scale-105 transition-transform">
              <Plus className="mr-2" size={20} /> Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-none border-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Add New Equipment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Equipment Name (e.g. Treadmill Pro)"
                value={newEqName}
                onChange={(e) => setNewEqName(e.target.value)}
                className="h-12 border-2 border-muted focus:border-primary font-bold"
              />
              <Input
                placeholder="Category (e.g. Cardio, Free Weights)"
                value={newEqCategory}
                onChange={(e) => setNewEqCategory(e.target.value)}
                className="h-12 border-2 border-muted focus:border-primary font-bold"
              />
              <Button onClick={handleAddEquipment} className="w-full uppercase font-black tracking-widest h-12 mt-4 bg-primary text-primary-foreground">
                Save Equipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted" />)
        ) : (
          equipment.map((item) => (
            <Card key={item.id} className="p-6 border-4 border-muted hover:border-primary/20 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-muted group-hover:bg-primary/10 transition-colors">
                  <Package className="text-muted-foreground group-hover:text-primary transition-colors" size={24} />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  {item.status}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{item.name}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.category}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-muted pb-2">
                  <span>Last Service</span>
                  <span className="text-foreground">{item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString() : 'NEVER'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatus(item.id, "Operational")}
                    className="text-[10px] font-black uppercase border-2 p-0 h-8 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20"
                  >
                    Fix
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatus(item.id, "Under Maintenance")}
                    className="text-[10px] font-black uppercase border-2 p-0 h-8 hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/20"
                  >
                    Maint
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatus(item.id, "Broken")}
                    className="text-[10px] font-black uppercase border-2 p-0 h-8 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                  >
                    Fail
                  </Button>
                </div>
              </div>

              {item.maintenanceLogs.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-dashed border-muted">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <History size={12} /> Recent Repair Log
                  </div>
                  <div className="text-[11px] font-medium italic text-muted-foreground leading-relaxed">
                    "{item.maintenanceLogs[0].description}"
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
