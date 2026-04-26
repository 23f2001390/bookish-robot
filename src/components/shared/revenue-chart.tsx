"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { RevenueData } from "@/lib/types";

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="month" stroke="var(--foreground)" fontSize={14} fontWeight={700} />
            <YAxis stroke="var(--foreground)" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "3px solid var(--foreground)", borderRadius: "0", color: "var(--foreground)", fontWeight: 700 }} />
            <Bar dataKey="revenue" fill="var(--chart-5)" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
