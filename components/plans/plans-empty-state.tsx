"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string;
  showCta?: boolean;
};

export function PlansEmptyState({
  title = "هنوز برنامه‌ای نداری",
  description = "با ساخت برنامه از آنبوردینگ یا خرید دسترسی، اینجا برنامه‌هایت را می‌بینی.",
  showCta = true,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <ClipboardList className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
        {description}
      </p>
      {showCta && (
        <Button asChild>
          <Link href="/dashboard">رفتن به داشبورد</Link>
        </Button>
      )}
    </div>
  );
}
