"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/shared/top-bar";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Search, CalendarCheck, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // QR Code State
  const [qrValue, setQrValue] = useState("soulrep-checkin-static-qr");

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !user) return;
      try {
        const [attendanceRes, membersRes] = await Promise.all([
          fetch('/api/owner/attendance'),
          fetch('/api/owner/members'),
        ]);
        const attendanceData = await attendanceRes.json();
        const membersData = await membersRes.json();
        setAttendanceRecords(attendanceData);
        setAllMembers(membersData);
        if (attendanceData.length > 0) {
          setDateFilter(attendanceData[0].date);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user?.id]);

  if (authLoading || loading) {
    return (
      <div>
        <TopBar title="Attendance Reports" />
        <div className="p-4 lg:p-6 text-center">Loading...</div>
      </div>
    );
  }

  const dailyRecords = attendanceRecords.filter(a => {
    const matchesDate = dateFilter ? a.date === dateFilter : true;
    const matchesMember = memberFilter === 'all' || a.memberId === memberFilter;
    const matchesSearch = a.memberName.toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesMember && matchesSearch;
  });

  const monthlySummary = (() => {
    const result: { week: string; present: number; absent: number }[] = [];
    const refDate = dateFilter ? new Date(dateFilter) : new Date();
    const month = refDate.getMonth();
    const year = refDate.getFullYear();
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const start = (weekNum - 1) * 7 + 1;
      const end = start + 6;
      const presentCount = attendanceRecords.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() >= start && d.getDate() <= end;
      }).length;
      result.push({ week: `Week ${weekNum}`, present: presentCount, absent: 0 });
    }
    return result;
  })();

  const memberBreakdown = allMembers.map(m => ({
    name: m.name.split(' ')[0],
    count: attendanceRecords.filter(a => a.memberId === m.id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div>
      <TopBar title="Attendance Reports" />
      <div className="p-4 lg:p-6 space-y-6">
        <Tabs defaultValue="qr_terminal">
          <TabsList className="mb-4">
            <TabsTrigger value="qr_terminal" className="flex items-center gap-2">
              <QrCode size={14} /> Scan Terminal
            </TabsTrigger>
            <TabsTrigger value="daily">Daily Logs</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Member Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="qr_terminal">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-4 border-primary">
                <CardHeader className="text-center bg-primary text-primary-foreground">
                  <CardTitle className="text-xl font-black uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    CHECK-IN TERMINAL
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-10 space-y-6">
                  <div className="p-6 bg-white rounded-xl shadow-inner border-2 border-muted">
                    {qrValue && (
                      <QRCodeSVG 
                        id="checkin-qr-code"
                        value={qrValue} 
                        size={220} 
                        level="H" 
                        includeMargin={true}
                      />
                    )}
                  </div>
                  
                  <div className="text-center space-y-4">
                    <p className="font-black text-sm uppercase tracking-tighter">Scan to Record Attendance</p>
                    <Button 
                      variant="outline" 
                      className="font-bold uppercase tracking-tighter w-full border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                      onClick={() => {
                        const svg = document.getElementById("checkin-qr-code");
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new window.Image();
                          img.onload = () => {
                            canvas.width = svg.clientWidth;
                            canvas.height = svg.clientHeight;
                            if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = "soulrep-attendance-qr.png";
                              downloadLink.href = pngFile;
                              downloadLink.click();
                            }
                          };
                          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                        }
                      }}
                    >
                      Download QR Code
                    </Button>
                  </div>

                  <div className="w-full pt-6 border-t border-muted flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Smartphone size={24} />
                      <span className="text-[10px] font-bold uppercase mt-1">Open App</span>
                    </div>
                    <RefreshCw size={12} className="text-muted" />
                    <div className="flex flex-col items-center text-muted-foreground">
                      <QrCode size={24} />
                      <span className="text-[10px] font-bold uppercase mt-1">Scan QR</span>
                    </div>
                    <RefreshCw size={12} className="text-muted" />
                    <div className="flex flex-col items-center text-green-600">
                      <RefreshCw size={24} className="animate-bounce" />
                      <span className="text-[10px] font-bold uppercase mt-1">Done</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">LIVE CHECK-INS (TODAY)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dailyRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-bold flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                              {a.memberName.split(' ').map((n:any) => n[0]).join('')}
                            </div>
                            {a.memberName}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{a.checkIn}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-600 text-[10px] font-black tracking-tighter uppercase px-2 py-0">Verified</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {dailyRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                            Waiting for check-ins...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            {/* ... keeping existing daily log filters and table ... */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 children:h-10">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search member..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 font-bold text-xs uppercase" />
                  </div>
                  <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full sm:w-44 h-10 font-bold text-xs" />
                  <Select value={memberFilter} onValueChange={v => setMemberFilter(v ?? 'all')}>
                    <SelectTrigger className="w-full sm:w-44 h-10 font-bold text-xs uppercase">
                      <SelectValue placeholder="All Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      {allMembers.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-black uppercase tracking-tighter text-xs">Member</TableHead>
                    <TableHead className="font-black uppercase tracking-tighter text-xs">Date</TableHead>
                    <TableHead className="font-black uppercase tracking-tighter text-xs text-right">Check In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecords.length > 0 ? dailyRecords.map(a => (
                    <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-sm tracking-tight">{a.memberName}</TableCell>
                      <TableCell className="text-xs font-medium">{a.date}</TableCell>
                      <TableCell className="text-xs font-bold text-primary text-right">{a.checkIn}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-12 text-xs font-bold uppercase tracking-widest">
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle className="text-base uppercase font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Monthly Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlySummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" fontSize={10} fontWeight="bold" />
                    <YAxis fontSize={10} fontWeight="bold" />
                    <Tooltip contentStyle={{ borderRadius: '0', border: '2px solid black', fontWeight: 'bold' }} />
                    <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Bar dataKey="present" fill="#3b82f6" name="PRESENT" radius={0} />
                    <Bar dataKey="absent" fill="#ef4444" name="ABSENT" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="text-base uppercase font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Member-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={memberBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={10} fontWeight="bold" />
                    <YAxis type="category" dataKey="name" fontSize={10} fontWeight="bold" width={80} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '0', border: '2px solid black', fontWeight: 'bold' }} />
                    <Bar dataKey="count" fill="black" name="TOTAL VISITS" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
