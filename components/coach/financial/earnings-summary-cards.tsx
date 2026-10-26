"use client";

import { Banknote, ShoppingBag, Wallet, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachEarningsSummary } from "@/lib/types/access";
import { cn } from "@/lib/utils";

const WITHDRAWAL_LABEL: Record<
  CoachEarningsSummary["withdrawalStatus"],
  string
> = {
  available: "قابل برداشت",
  pending: "در حال پردازش",
  paid: "پرداخت‌شده",
  blocked: "مسدود",
};

type Props = {
  summary: CoachEarningsSummary;
};

type Item = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
};

export function EarningsSummaryCards({ summary }: Props) {
  const items: Item[] = [
    {
      label: "درآمد ماه جاری",
      value: `${summary.currentMonthRevenue.toLocaleString("fa-IR")} ت`,
      hint: "کمیسیون این ماه",
      icon: Banknote,
      accent: "text-primary",
    },
    {
      label: "فروش ماه جاری",
      value: summary.currentMonthSalesCount.toLocaleString("fa-IR"),
      hint: "تعداد تراکنش موفق",
      icon: ShoppingBag,
      accent: "text-amber-400",
    },
    {
      label: "قابل برداشت",
      value: `${summary.availableForWithdrawal.toLocaleString("fa-IR")} ت`,
      hint: WITHDRAWAL_LABEL[summary.withdrawalStatus],
      icon: Wallet,
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card
          key={item.label}
          className="bg-white/5 border-white/10 backdrop-blur-md"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center",
                  item.accent,
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold tabular-nums tracking-tight mt-0.5">
                {item.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {item.hint}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
