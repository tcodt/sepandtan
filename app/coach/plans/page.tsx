"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

/* ------------------------------ types & config ------------------------------ */

type Filter = "all" | PlanStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "draft", label: "پیش‌نویس" },
  { key: "published", label: "منتشرشده" },
  { key: "assigned", label: "اختصاص‌یافته" },
  { key: "active", label: "فعال" },
  { key: "archived", label: "آرشیو" },
];

const statusConfig: Record<
  PlanStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: {
    label: "پیش‌نویس",
    className: cn(
      "bg-sky-500/10 border-sky-500/25 text-sky-700",
      "dark:bg-sky-500/15 dark:border-sky-500/25 dark:text-sky-300",
    ),
    icon: Clock,
  },
  published: {
    label: "منتشرشده",
    className: cn(
      "bg-emerald-500/10 border-emerald-500/25 text-emerald-700",
      "dark:bg-emerald-500/15 dark:border-emerald-500/25 dark:text-emerald-300",
    ),
    icon: CheckCircle2,
  },
  assigned: {
    label: "اختصاص‌یافته",
    className: cn(
      "bg-amber-500/10 border-amber-500/25 text-amber-700",
      "dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-300",
    ),
    icon: FileText,
  },
  active: {
    label: "فعال",
    className: cn(
      "bg-primary/10 border-primary/25 text-primary",
      "dark:bg-primary/15 dark:border-primary/25 dark:text-primary",
    ),
    icon: CheckCircle2,
  },
  archived: {
    label: "آرشیو",
    className: cn(
      "bg-muted border-border text-muted-foreground",
      "dark:bg-white/5 dark:border-white/10 dark:text-muted-foreground",
    ),
    icon: FileText,
  },
};

const LEVEL_FA: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

function formatPrice(price?: number | null) {
  if (price == null || price <= 0) return null;
  return `${price.toLocaleString("fa-IR")} تومان`;
}

const SMOOTH_SCROLL = cn(
  "overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory",
  "[-webkit-overflow-scrolling:touch]",
  "[scrollbar-width:none]",
  "[&::-webkit-scrollbar]:hidden",
);

/* ------------------------------ page ------------------------------ */

export default function CoachPlansPage() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ---- fetch once, filter client-side ---- */
  const loadPlans = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setAllPlans([]);
        return;
      }
      const list = await getCoachPlans(coach.id);
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAllPlans(list);
    } catch (err) {
      console.error(err);
      toast.error("خطا در بارگذاری برنامه‌ها");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /* ---- derived ---- */
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: allPlans.length,
      draft: 0,
      published: 0,
      assigned: 0,
      active: 0,
      archived: 0,
    };
    for (const p of allPlans) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [allPlans]);

  const plans = useMemo(
    () =>
      filter === "all" ? allPlans : allPlans.filter((p) => p.status === filter),
    [allPlans, filter],
  );

  /* ---- delete ---- */
  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deleteCoachPlan(planId);
      toast.success("برنامه حذف شد");
      await loadPlans();
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در حذف برنامه";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ============ Header ============ */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-2 sm:items-start sm:justify-between sm:gap-4">
          {/* Back button — mobile only in the sticky row */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-xl sm:hidden"
          >
            <Link href="/coach" aria-label="بازگشت به داشبورد">
              <ArrowRight className="size-5" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">
              برنامه‌های من
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              ساخت، انتشار و مدیریت برنامه‌های تمرینی
            </p>
          </div>

          {/* Desktop back + new plan */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="hidden h-10 gap-2 rounded-xl sm:inline-flex"
            >
              <Link href="/coach">
                <ArrowRight className="size-4" />
                داشبورد
              </Link>
            </Button>

            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Button
                asChild
                className={cn(
                  "h-10 gap-2 font-semibold",
                  "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                  "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
                )}
              >
                <Link href="/coach/plans/new">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">برنامه جدید</span>
                  <span className="sm:hidden">جدید</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ============ Filter pills ============ */}
      <div className="space-y-2">
        <div
          role="tablist"
          aria-label="فیلتر برنامه‌ها"
          className={cn(
            "-mx-4 flex gap-2 px-4 pb-1 sm:mx-0 flex-wrap sm:px-0",
            SMOOTH_SCROLL,
          )}
        >
          {filters.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <motion.button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? "true" : undefined}
                onClick={() => setFilter(f.key)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={cn(
                  "flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? cn(
                        "border-primary bg-primary font-medium text-primary-foreground",
                        "shadow-sm shadow-primary/20 dark:shadow-none",
                      )
                    : cn(
                        "border-border bg-card text-muted-foreground",
                        "hover:border-foreground/20 hover:text-foreground",
                        "dark:border-white/10 dark:bg-white/5",
                        "dark:hover:border-white/15 dark:hover:bg-white/10",
                      ),
                )}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground dark:bg-white/10",
                    )}
                  >
                    {count.toLocaleString("fa-IR")}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Result count + reset (only when filtered) */}
        {!loading && filter !== "all" && (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {plans.length.toLocaleString("fa-IR")} برنامه در این دسته
            </span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                "hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <X className="size-3" />
              نمایش همه
            </button>
          </div>
        )}
      </div>

      {/* ============ Content ============ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-36 animate-pulse rounded-2xl border",
                "border-border bg-card/60",
                "dark:border-white/10 dark:bg-white/5",
              )}
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <CoachEmptyState type="plans" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {plans.map((plan, index) => {
              const status = statusConfig[plan.status] ?? statusConfig.draft;
              const StatusIcon = status.icon;
              const canEdit =
                plan.status === "draft" || plan.status === "published";
              const canDelete =
                plan.status === "draft" || plan.status === "published";
              const price = formatPrice(plan.priceToman);
              const duration = plan.durationWeeks
                ? `${plan.durationWeeks.toLocaleString("fa-IR")} هفته`
                : plan.durationDays
                  ? `${plan.durationDays.toLocaleString("fa-IR")} روز`
                  : null;
              const isDeleting = deletingId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.97,
                    transition: { duration: 0.18 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    delay: Math.min(index * 0.03, 0.18),
                  }}
                >
                  <Card
                    className={cn(
                      "overflow-hidden rounded-2xl transition-shadow",
                      "border-border bg-card shadow-sm shadow-foreground/4",
                      "hover:shadow-md hover:shadow-foreground/6",
                      "dark:border-white/10 dark:bg-white/5 dark:shadow-none",
                      "dark:backdrop-blur-md dark:hover:border-white/20",
                      isDeleting && "opacity-60",
                    )}
                  >
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      {/* ---- Top: icon + title + status ---- */}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-xl",
                            "bg-primary/10 ring-1 ring-primary/15",
                            "dark:ring-primary/10",
                          )}
                        >
                          <FileText className="size-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                            <p className="min-w-0 font-semibold leading-snug text-foreground">
                              {plan.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5 shrink-0 gap-1 self-start border text-[10px]",
                                status.className,
                              )}
                            >
                              <StatusIcon className="size-3" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* ---- Meta chips ---- */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {duration && (
                              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground dark:bg-white/5">
                                {duration}
                              </span>
                            )}
                            {plan.level && (
                              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground dark:bg-white/5">
                                {LEVEL_FA[plan.level] ?? plan.level}
                              </span>
                            )}
                            {price && (
                              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                                {price}
                              </span>
                            )}
                            <span className="text-border">•</span>
                            <span className="text-muted-foreground">
                              {new Date(plan.createdAt).toLocaleDateString(
                                "fa-IR",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ---- Actions ---- */}
                      {(canEdit || canDelete) && (
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          {canEdit && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className={cn(
                                "h-9 gap-1.5",
                                "border-border bg-card hover:border-foreground/20 hover:bg-accent",
                                "dark:border-white/15 dark:bg-transparent",
                                "dark:hover:border-white/25 dark:hover:bg-white/5",
                              )}
                            >
                              <Link href={`/coach/plans/${plan.id}/edit`}>
                                <Pencil className="size-3.5" />
                                ویرایش
                              </Link>
                            </Button>
                          )}

                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isDeleting}
                                  className={cn(
                                    "h-9 gap-1.5",
                                    "border-border bg-card text-destructive",
                                    "hover:border-destructive/30 hover:bg-destructive/10",
                                    "dark:border-white/15 dark:bg-transparent dark:text-destructive",
                                    "dark:hover:border-destructive/30 dark:hover:bg-destructive/15",
                                  )}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-3.5" />
                                  )}
                                  حذف
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent
                                className={cn(
                                  "max-w-sm rounded-2xl",
                                  "border-border bg-card shadow-xl shadow-foreground/8",
                                  "dark:border-white/10 dark:bg-background/95",
                                  "dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-xl",
                                )}
                              >
                                <AlertDialogHeader className="space-y-2 text-right">
                                  <AlertDialogTitle className="text-right">
                                    حذف برنامه؟
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-right leading-relaxed">
                                    «{plan.title}» حذف می‌شود. این عمل قابل
                                    بازگشت نیست.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row-reverse gap-2">
                                  <AlertDialogCancel
                                    disabled={isDeleting}
                                    className={cn(
                                      "border-border bg-card hover:bg-muted/70",
                                      "dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5",
                                    )}
                                  >
                                    انصراف
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDelete(plan.id);
                                    }}
                                    disabled={isDeleting}
                                    className={cn(
                                      "gap-1.5 bg-destructive text-destructive-foreground",
                                      "shadow-sm shadow-destructive/20 hover:bg-destructive/90",
                                      "hover:shadow-md hover:shadow-destructive/25",
                                      "dark:shadow-none",
                                    )}
                                  >
                                    {isDeleting && (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    )}
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
