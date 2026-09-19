"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { getCoachPlans, deleteCoachPlan } from "@/lib/api/coach-plans";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { Plan, PlanStatus } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

type Filter =
  | "all"
  | "draft"
  | "published"
  | "assigned"
  | "active"
  | "archived";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "draft", label: "پیش‌نویس" },
  { key: "published", label: "منتشرشده" },
  { key: "active", label: "فعال" },
  { key: "archived", label: "آرشیو" },
];

const statusConfig: Record<
  PlanStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: { label: "پیش‌نویس", color: "text-blue-400", icon: Clock },
  published: {
    label: "منتشرشده",
    color: "text-emerald-400",
    icon: CheckCircle2,
  },
  assigned: { label: "اختصاص‌یافته", color: "text-amber-400", icon: FileText },
  active: { label: "فعال", color: "text-primary", icon: CheckCircle2 },
  archived: { label: "آرشیو", color: "text-muted-foreground", icon: FileText },
};

export default function CoachPlansPage() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setPlans([]);
        return;
      }

      const allPlans = await getCoachPlans(coach.id);
      const filtered =
        filter === "all"
          ? allPlans
          : allPlans.filter((p) => p.status === filter);

      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setPlans(filtered);
    } catch (err) {
      console.error(err);
      toast.error("بارگذاری برنامه‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deleteCoachPlan(planId);
      toast.success("برنامه حذف شد");
      await loadPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">برنامه‌های من</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت پیش‌نویس‌ها و برنامه‌های منتشرشده
          </p>
        </div>

        <Button asChild className="gap-2">
          <Link href="/coach/plans/new">
            <Plus className="w-4 h-4" />
            ساخت برنامه جدید
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-white/5 text-muted-foreground hover:bg-white/10",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <CoachEmptyState type="plans" />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const status = statusConfig[plan.status] ?? statusConfig.draft;
            const StatusIcon = status.icon;
            const canEdit = plan.status === "draft";
            const canDelete =
              plan.status === "draft" || plan.status === "published";

            return (
              <Card
                key={plan.id}
                className="bg-white/5 border-white/10 backdrop-blur-md"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{plan.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {plan.description || "بدون توضیحات"}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${status.color}`}
                          />
                          <span className={status.color}>{status.label}</span>
                        </span>

                        {plan.durationWeeks && (
                          <span>{plan.durationWeeks} هفته</span>
                        )}

                        {typeof plan.priceToman === "number" && (
                          <span className="text-primary">
                            {plan.priceToman.toLocaleString("fa-IR")} تومان
                          </span>
                        )}

                        <span>
                          {new Date(plan.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canEdit && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                      >
                        <Link href={`/coach/plans/${plan.id}/edit`}>
                          <Pencil className="w-3.5 h-3.5" />
                          ویرایش
                        </Link>
                      </Button>
                    )}

                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            disabled={deletingId === plan.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف برنامه؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              «{plan.title}» حذف می‌شود. این عمل قابل بازگشت
                              نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(plan.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
