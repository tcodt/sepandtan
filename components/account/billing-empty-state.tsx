"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-4 py-12 text-center sm:py-16">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60">
        <Receipt className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-base font-semibold">هنوز پرداختی نداری</h3>
      <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
        بعد از خرید اشتراک یا دسترسی به برنامه، تراکنش‌ها اینجا نمایش داده
        می‌شوند.
      </p>
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/plans">مشاهده برنامه‌ها</Link>
      </Button>
    </div>
  );
}
