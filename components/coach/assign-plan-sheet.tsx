"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getCoachPlans, activateCoachPlanForUser } from "@/lib/api/coach-plans";
import { db } from "@/lib/api/db";
import { toast } from "sonner";
import type { Plan } from "@/lib/types/plan";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

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
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      try {
        const coach = db.coaches.find((c) => c.userId === coachUserId);
        if (!coach) return;

        const all = await getCoachPlans(coach.id, "published");
        setPlans(all);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, coachUserId]);

  const handleAssignAndActivate = async () => {
    if (!selectedId) return;
    setSubmitting(true);

    try {
      await activateCoachPlanForUser(selectedId, clientId);
      toast.success("برنامه با موفقیت فعال شد");
      onSuccess?.();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "خطا در اختصاص برنامه");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "bg-muted border-white/10 p-4 md:p-8",
          // Mobile: bottom sheet look
          "h-[70vh] rounded-t-3xl",
          // Desktop: right-side panel look
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
      >
        <SheetHeader>
          <SheetTitle>اختصاص برنامه به هنرجو</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              هیچ برنامه منتشرشده‌ای ندارید.
              <br />
              اول یک برنامه بسازید و منتشر کنید.
            </div>
          ) : (
            <div className="space-y-2 max-h-[40vh] md:max-h-[60vh] overflow-y-auto">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedId(plan.id)}
                  className={cn(
                    "w-full text-right px-4 py-3 rounded-xl border transition-colors",
                    selectedId === plan.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8",
                  )}
                >
                  <p className="font-medium text-sm">{plan.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.durationWeeks
                      ? `${plan.durationWeeks} هفته`
                      : `${plan.durationDays} روز`}
                    {plan.level ? ` • ${plan.level}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!selectedId || submitting}
            onClick={handleAssignAndActivate}
          >
            {submitting ? "در حال فعال‌سازی..." : "فعال‌سازی برنامه"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
