"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinancialEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Wallet className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base mb-1.5">هنوز فروشی ثبت نشده</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
        بعد از فروش برنامه به هنرجویان، کمیسیون و تاریخچه فروش اینجا نمایش داده
        می‌شود.
      </p>
      <Button asChild variant="outline">
        <Link href="/coach/plans">مدیریت برنامه‌ها</Link>
      </Button>
    </div>
  );
}
