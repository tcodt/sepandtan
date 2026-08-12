"use client";

import { Activity, CheckCircle2, Scale, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ==================== MOCK ====================
const activities = [
  {
    id: 1,
    icon: CheckCircle2,
    text: "تمرین بالاتنه را کامل کردی",
    time: "۲ ساعت پیش",
  },
  {
    id: 2,
    icon: Scale,
    text: "وزن جدید ثبت شد: ۷۲.۴ کیلو",
    time: "دیروز",
  },
  {
    id: 3,
    icon: MessageSquare,
    text: "با مربی AI درباره تغذیه صحبت کردی",
    time: "۲ روز پیش",
  },
  {
    id: 4,
    icon: Activity,
    text: "برنامه هفته جدید فعال شد",
    time: "۳ روز پیش",
  },
];
// ==============================================

export function RecentActivity() {
  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
