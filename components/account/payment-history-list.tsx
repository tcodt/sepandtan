"use client";

import { Receipt } from "lucide-react";
import type { Payment } from "@/lib/types/access";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<Payment["type"], string> = {
  plan_access: "دسترسی برنامه",
  subscription: "اشتراک",
  renewal: "تمدید",
};

const STATUS_LABEL: Record<Payment["status"], string> = {
  paid: "پرداخت‌شده",
  pending: "در انتظار",
  failed: "ناموفق",
  refunded: "بازگشت وجه",
};

type Props = {
  payments: Payment[];
};

export function PaymentHistoryList({ payments }: Props) {
  if (payments.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="px-0.5 text-sm font-semibold text-foreground">
        تاریخچه پرداخت‌ها
      </h3>

      <ul className="space-y-2">
        {payments.map((payment) => {
          const isPaid = payment.status === "paid";
          const date = new Date(
            payment.paidAt ?? payment.createdAt,
          ).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <li
              key={payment.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border border-border bg-card/80 p-3.5",
                "backdrop-blur-sm transition-colors hover:bg-card dark:bg-card/60",
              )}
            >
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                <Receipt className="size-4 text-muted-foreground" aria-hidden />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium leading-snug text-foreground">
                    {payment.description}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      isPaid
                        ? "bg-primary/15 text-primary"
                        : payment.status === "failed"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[payment.status]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{TYPE_LABEL[payment.type]}</span>
                  <span className="opacity-40">·</span>
                  <span>{date}</span>
                  {payment.durationDays != null && (
                    <>
                      <span className="opacity-40">·</span>
                      <span>{payment.durationDays} روز</span>
                    </>
                  )}
                </div>

                <p className="pt-0.5 text-sm font-semibold text-foreground">
                  {payment.amount.toLocaleString("fa-IR")} تومان
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
