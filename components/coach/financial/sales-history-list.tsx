"use client";

import { Receipt } from "lucide-react";
import type { CoachSale } from "@/lib/types/access";
import { cn } from "@/lib/utils";

type Props = {
  sales: CoachSale[];
};

export function SalesHistoryList({ sales }: Props) {
  if (sales.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground px-0.5">
        تاریخچه فروش‌ها
      </h3>

      <ul className="space-y-2">
        {sales.map((sale) => {
          const date = new Date(
            sale.paidAt ?? sale.createdAt,
          ).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          const isRefunded = sale.status === "refunded";

          return (
            <li
              key={sale.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3.5",
                "flex items-start gap-3",
              )}
            >
              <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="size-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sale.planTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sale.userName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium",
                      isRefunded
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {isRefunded ? "بازگشت وجه" : "موفق"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{date}</span>
                  <span className="opacity-40">·</span>
                  <span>
                    کمیسیون{" "}
                    {(sale.commissionRate * 100).toLocaleString("fa-IR")}٪
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <p className="text-xs text-muted-foreground">
                    مبلغ فروش: {sale.amount.toLocaleString("fa-IR")} ت
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    +{sale.commissionAmount.toLocaleString("fa-IR")} ت
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
