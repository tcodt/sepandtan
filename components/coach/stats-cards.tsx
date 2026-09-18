"use client";

import { Inbox, Users, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Stats = {
  pendingRequests: number;
  activeClients: number;
  draftPlans: number;
  publishedPlans: number;
};

type Props = {
  stats: Stats;
  loading?: boolean;
};

export function StatsCards({ stats, loading }: Props) {
  const items = [
    {
      label: "درخواست‌های جدید",
      value: stats.pendingRequests,
      icon: Inbox,
      color: "text-amber-400",
    },
    {
      label: "هنرجویان فعال",
      value: stats.activeClients,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "برنامه‌های Draft",
      value: stats.draftPlans,
      icon: FileText,
      color: "text-blue-400",
    },
    {
      label: "برنامه‌های منتشرشده",
      value: stats.publishedPlans,
      icon: FileText,
      color: "text-emerald-400",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card
          key={item.label}
          className="bg-white/5 border-white/10 backdrop-blur-md"
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-2xl font-bold">{item.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
