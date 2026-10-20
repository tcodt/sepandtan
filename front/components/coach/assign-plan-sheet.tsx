"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCoachPlans, activateCoachPlanForUser } from "@/lib/api/coach-plans";
import { db } from "@/lib/api/db";
import { toast } from "sonner";
import type { Plan } from "@/lib/types/plan";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CheckCircle2, Loader2 } from "lucide-react";

const LEVEL_FA: Record<Plan["level"], string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

function formatPrice(price?: number | null): string {
  if (price == null || price <= 0) return "رایگان / توافقی";
  return `${price.toLocaleString("fa-IR")} تومان`;
}

function formatDuration(plan: Plan): string {
  if (plan.durationWeeks) {
    return `${plan.durationWeeks.toLocaleString("fa-IR")} هفته`;
  }
  if (plan.durationDays) {
    return `${plan.durationDays.toLocaleString("fa-IR")} روز`;
  }
  return "مدت نامشخص";
}

type Props = {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientRelationId: string;
  coachUserId: string;
  onSuccess?: () => void;
};

export function AssignPlanSheet({
  open,
  onClose,
  clientId,
  coachUserId,
  onSuccess,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setConfirmOpen(false);
      setSubmitting(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const coach = db.coaches.find((c) => c.userId === coachUserId);
        if (!coach) {
          setPlans([]);
          return;
        }

        const all = await getCoachPlans(coach.id, "published");
        setPlans(all);
      } catch (err) {
        console.error(err);
        toast.error("خطا در بارگذاری برنامه‌ها");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, coachUserId]);

  const handleConfirmActivate = async () => {
    if (!selectedId) return;
    setSubmitting(true);

    try {
      await activateCoachPlanForUser(selectedId, clientId);

      toast.success("برنامه فعال شد", {
        description: "هنرجو از این لحظه برنامه جدید را در داشبورد می‌بیند.",
      });

      setConfirmOpen(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطا در فعال‌سازی برنامه";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={cn(
            "bg-muted border-white/10 p-4 md:p-8 overflow-y-auto",
            "h-[75vh] rounded-t-3xl",
            "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
          )}
        >
          <SheetHeader className="text-right space-y-1.5">
            <SheetTitle>اختصاص برنامه به هنرجو</SheetTitle>
            <SheetDescription>
              یک برنامه منتشرشده انتخاب کن. بعد از تأیید، برنامه فعلی هنرجو
              آرشیو و این برنامه فعال می‌شود.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  برنامه منتشرشده‌ای نداری
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  اول از بخش برنامه‌ها یک برنامه بساز و منتشر کن،
                  <br />
                  بعد اینجا می‌تونی به هنرجو اختصاص بدی.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] md:max-h-[60vh] overflow-y-auto pr-0.5">
                {plans.map((plan) => {
                  const active = selectedId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedId(plan.id)}
                      className={cn(
                        "w-full text-right px-4 py-3.5 rounded-xl border transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-medium text-sm truncate">
                            {plan.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(plan)}
                            {plan.level
                              ? ` • ${LEVEL_FA[plan.level] ?? plan.level}`
                              : ""}
                          </p>
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              plan.priceToman && plan.priceToman > 0
                                ? "text-emerald-500"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatPrice(plan.priceToman)}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPlan && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  برنامه انتخاب‌شده
                </p>
                <p className="text-sm font-semibold">{selectedPlan.title}</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {formatDuration(selectedPlan)}
                  </Badge>
                  {selectedPlan.level && (
                    <Badge variant="secondary" className="text-[10px]">
                      {LEVEL_FA[selectedPlan.level]}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-500/30 text-emerald-600"
                  >
                    {formatPrice(selectedPlan.priceToman)}
                  </Badge>
                </div>
              </div>
            )}

            <Button
              className="w-full h-11 font-semibold"
              disabled={!selectedId || submitting || loading}
              onClick={() => setConfirmOpen(true)}
            >
              {selectedId ? "ادامه و تأیید فعال‌سازی" : "یک برنامه انتخاب کن"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-right space-y-2">
            <AlertDialogTitle>فعال‌سازی برنامه؟</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-2 text-right">
                <p>
                  برنامه فعلی هنرجو (اگر داشته باشد) آرشیو می‌شود و این برنامه
                  به‌عنوان برنامه فعال ست می‌شود.
                </p>
                {selectedPlan && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2.5 space-y-1 text-foreground">
                    <p className="font-medium text-sm">{selectedPlan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(selectedPlan)}
                      {selectedPlan.level
                        ? ` • ${LEVEL_FA[selectedPlan.level]}`
                        : ""}
                    </p>
                    <p className="text-xs font-semibold text-emerald-600">
                      {formatPrice(selectedPlan.priceToman)}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
            <AlertDialogCancel disabled={submitting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmActivate();
              }}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال فعال‌سازی...
                </>
              ) : (
                "بله، فعال کن"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
