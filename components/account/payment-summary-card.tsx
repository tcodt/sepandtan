"use client";

import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  totalPaid: number;
  paymentCount: number;
};

export function PaymentSummaryCard({ totalPaid, paymentCount }: Props) {
  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-sm dark:bg-card/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="size-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">مجموع پرداخت‌شده</p>
            <p className="text-xl font-bold tracking-tight text-foreground">
              {totalPaid.toLocaleString("fa-IR")}
              <span className="ms-1 text-sm font-medium text-muted-foreground">
                تومان
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {paymentCount.toLocaleString("fa-IR")} تراکنش موفق
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
