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

/**
 * Status config — every color has a light + dark variant.
 * Light uses `-600` for text + `/10` bg; dark uses `-400` + `/15`.
 */
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

/** Hidden/transparent scrollbar for the filter bar (mobile). */
const SMOOTH_SCROLL = cn(
  "overflow-x-auto overscroll-x-contain scroll-smooth",
  "[-webkit-overflow-scrolling:touch]",
  "[scrollbar-width:none]",
  "[&::-webkit-scrollbar]:hidden",
  "[&::-webkit-scrollbar]:h-0",
  "[&::-webkit-scrollbar-thumb]:bg-transparent",
  "[&::-webkit-scrollbar-track]:bg-transparent",
);

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
      toast.error("خطا در بارگذاری برنامه‌ها");
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
      const message = err instanceof Error ? err.message : "خطا در حذف برنامه";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            برنامه‌های من
          </h1>
          <p className="text-sm text-muted-foreground">
            ساخت، انتشار و مدیریت برنامه‌های تمرینی
          </p>
        </div>
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="shrink-0"
        >
          <Button
            asChild
            className={cn(
              "gap-2 h-10 font-semibold w-full sm:w-auto",
              // LIGHT: warm shadow under orange CTA
              "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
              // DARK: glow on hover
              "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
            )}
          >
            <Link href="/coach/plans/new">
              <Plus className="w-4 h-4" />
              برنامه جدید
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* ============ Filter pills ============ */}
      <div className={cn("flex gap-2 pb-1 -mx-1 px-1", SMOOTH_SCROLL)}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <motion.button
              key={f.key}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => setFilter(f.key)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? cn(
                      "bg-primary text-primary-foreground font-medium border-primary",
                      // LIGHT: warm shadow
                      "shadow-sm shadow-primary/20",
                      "dark:shadow-none",
                    )
                  : cn(
                      // LIGHT: card pill on muted background — visible but quiet
                      "bg-card text-muted-foreground border-border",
                      "hover:bg-card hover:text-foreground hover:border-foreground/20",
                      // DARK
                      "dark:bg-white/5 dark:border-white/10 dark:text-muted-foreground",
                      "dark:hover:bg-white/10 dark:hover:border-white/15",
                    ),
              )}
            >
              {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* ============ Content ============ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-36 rounded-2xl border animate-pulse",
                // LIGHT: visible skeleton on muted bg
                "bg-card/60 border-border",
                // DARK
                "dark:bg-white/5 dark:border-white/10",
              )}
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <CoachEmptyState type="plans" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
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

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: 12,
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
                      "rounded-2xl overflow-hidden transition-shadow",
                      // LIGHT: real card + soft elevation (reads as white on muted bg)
                      "bg-card border-border shadow-sm shadow-foreground/4",
                      "hover:shadow-md hover:shadow-foreground/6",
                      // DARK: glass
                      "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
                      "dark:backdrop-blur-md",
                      "dark:hover:border-white/20",
                    )}
                  >
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      {/* ---- Top: icon + title + status ---- */}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                            // LIGHT: stronger orange presence
                            "bg-primary/10 ring-1 ring-primary/15",
                            // DARK
                            "dark:bg-primary/10 dark:ring-primary/10",
                          )}
                        >
                          <FileText className="w-5 h-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-snug text-foreground">
                              {plan.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-5 shrink-0 gap-1 border",
                                status.className,
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* ---- Meta chips ---- */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {duration && (
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5",
                                  // LIGHT: muted chip on card
                                  "bg-muted text-muted-foreground",
                                  // DARK
                                  "dark:bg-white/5 dark:text-muted-foreground",
                                )}
                              >
                                {duration}
                              </span>
                            )}
                            {plan.level && (
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5",
                                  "bg-muted text-muted-foreground",
                                  "dark:bg-white/5 dark:text-muted-foreground",
                                )}
                              >
                                {LEVEL_FA[plan.level] ?? plan.level}
                              </span>
                            )}
                            {price && (
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5 font-medium",
                                  // LIGHT: readable emerald
                                  "bg-emerald-500/10 text-emerald-700",
                                  // DARK
                                  "dark:bg-emerald-500/10 dark:text-emerald-400",
                                )}
                              >
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
                      <div className="flex flex-wrap gap-2">
                        {canEdit && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className={cn(
                              "gap-1.5 h-9",
                              // LIGHT: visible outline
                              "bg-card border-border hover:bg-accent hover:border-foreground/20",
                              // DARK
                              "dark:bg-transparent dark:border-white/15",
                              "dark:hover:bg-white/5 dark:hover:border-white/25",
                            )}
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
                                variant="outline"
                                className={cn(
                                  "gap-1.5 h-9",
                                  // LIGHT: destructive on hover, quiet by default
                                  "bg-card border-border text-destructive",
                                  "hover:bg-destructive/10 hover:border-destructive/30",
                                  // DARK
                                  "dark:bg-transparent dark:border-white/15 dark:text-destructive",
                                  "dark:hover:bg-destructive/15 dark:hover:border-destructive/30",
                                )}
                                disabled={deletingId === plan.id}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                حذف
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent
                              className={cn(
                                "rounded-2xl max-w-sm",
                                // LIGHT
                                "bg-card border-border shadow-xl shadow-foreground/8",
                                // DARK
                                "dark:bg-background/95 dark:border-white/10 dark:backdrop-blur-xl",
                                "dark:shadow-2xl dark:shadow-black/40",
                              )}
                            >
                              <AlertDialogHeader className="text-right space-y-2">
                                <AlertDialogTitle className="text-right">
                                  حذف برنامه؟
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-right leading-relaxed">
                                  «{plan.title}» حذف می‌شود. این عمل قابل بازگشت
                                  نیست.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row-reverse gap-2">
                                <AlertDialogCancel
                                  className={cn(
                                    "border-border bg-card hover:bg-muted/70",
                                    "dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5",
                                  )}
                                >
                                  انصراف
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(plan.id)}
                                  className={cn(
                                    "bg-destructive text-destructive-foreground",
                                    // LIGHT: warm shadow
                                    "shadow-sm shadow-destructive/20 hover:shadow-md hover:shadow-destructive/25",
                                    "hover:bg-destructive/90",
                                    // DARK
                                    "dark:shadow-none",
                                  )}
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
