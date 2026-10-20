"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  X,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { RequestCard } from "@/components/coach/request-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { CollaborationRequest } from "@/lib/types/coach";
import { cn } from "@/lib/utils";

/* ------------------------------ types & config ------------------------------ */

type Filter = "all" | "pending" | "accepted" | "rejected";

type RequestWithName = CollaborationRequest & { clientName?: string };

const FILTER_LABEL: Record<Filter, string> = {
  all: "همه",
  pending: "در انتظار",
  accepted: "پذیرفته‌شده",
  rejected: "ردشده",
};

const filters: { key: Filter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "همه", icon: Inbox },
  { key: "pending", label: "در انتظار", icon: Clock },
  { key: "accepted", label: "پذیرفته‌شده", icon: CheckCircle2 },
  { key: "rejected", label: "ردشده", icon: XCircle },
];

/* ------------------------------ page ------------------------------ */

export default function CoachRequestsPage() {
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [allRequests, setAllRequests] = useState<RequestWithName[]>([]);

  /* ---- fetch once ---- */
  const loadRequests = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setAllRequests([]);
        return;
      }

      const list = db.collaborationRequests
        .filter((r) => r.coachId === coach.id)
        .map((r) => {
          const client = db.users.find((u) => u.id === r.userId);
          return { ...r, clientName: client?.name };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setAllRequests(list);
    } catch (err) {
      console.error(err);
      setError("خطا در بارگذاری درخواست‌ها");
      toast.error("خطا در بارگذاری درخواست‌ها");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* ---- derived ---- */
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: allRequests.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const r of allRequests)
      c[r.status as Filter] = (c[r.status as Filter] ?? 0) + 1;
    return c;
  }, [allRequests]);

  const requests = useMemo(
    () =>
      filter === "all"
        ? allRequests
        : allRequests.filter((r) => r.status === filter),
    [allRequests, filter],
  );

  const pendingCount = counts.pending;
  const hasFilter = filter !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      {/* ============ Header ============ */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-2 sm:items-start sm:justify-between sm:gap-4">
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-2xl">
                درخواست‌های همکاری
              </h1>
              {pendingCount > 0 && (
                <Badge
                  className={cn(
                    "h-5 gap-1 border-0 text-[10px]",
                    "bg-amber-500/15 text-amber-700",
                    "dark:text-amber-300",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {pendingCount.toLocaleString("fa-IR")} در انتظار
                </Badge>
              )}
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {loading
                ? "در حال بارگذاری..."
                : allRequests.length === 0
                  ? "هنوز درخواستی نداری"
                  : `${counts.pending.toLocaleString("fa-IR")} درخواست در انتظار پاسخ`}
            </p>
          </div>

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
        </div>
      </div>

      {/* ============ Needs-action banner ============ */}
      {!loading && !error && pendingCount > 0 && filter !== "pending" && (
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-right transition-colors sm:p-4",
            "hover:border-amber-500/50 hover:bg-amber-500/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <BellRing
              className="size-4 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {pendingCount.toLocaleString("fa-IR")} درخواست در انتظار پاسخ تو
              است
            </p>
            <p className="text-xs text-muted-foreground">
              برای مشاهده و پاسخ، اینجا بزن
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground rotate-180" />
        </button>
      )}

      {/* ============ Filter pills with counts ============ */}
      {!loading && !error && allRequests.length > 0 && (
        <div
          role="tablist"
          aria-label="فیلتر وضعیت درخواست"
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 flex-wrap sm:px-0 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filters.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary font-medium text-primary-foreground"
                    : cn(
                        "border-border bg-card text-muted-foreground",
                        "hover:border-foreground/20 hover:text-foreground",
                        "dark:border-white/10 dark:bg-white/5",
                        "dark:hover:border-white/15 dark:hover:bg-white/10",
                      ),
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight tabular-nums",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground dark:bg-white/10",
                    )}
                  >
                    {count.toLocaleString("fa-IR")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ============ Active-filter banner ============ */}
      {!loading && !error && hasFilter && allRequests.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4",
            "dark:border-primary/25 dark:bg-primary/10",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal
              className="size-4 shrink-0 text-primary"
              aria-hidden
            />
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              نمایش {requests.length.toLocaleString("fa-IR")} از{" "}
              {allRequests.length.toLocaleString("fa-IR")} • وضعیت{" "}
              <span className="font-medium text-foreground">
                {FILTER_LABEL[filter]}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilter("all")}
            className="shrink-0 gap-1.5 rounded-xl"
          >
            <X className="size-3.5" />
            نمایش همه
          </Button>
        </div>
      )}

      {/* ============ Error ============ */}
      {!loading && error && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center"
        >
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadRequests()}
            className="gap-1.5 rounded-xl"
          >
            <RefreshCw className="size-3.5" />
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* ============ Content ============ */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <RequestSkeleton key={i} />
          ))}
        </div>
      ) : error ? null : allRequests.length === 0 ? (
        <CoachEmptyState type="requests" />
      ) : requests.length === 0 ? (
        <FilteredEmptyState filter={filter} onReset={() => setFilter("all")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              clientName={req.clientName}
              onDone={loadRequests}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function FilteredEmptyState({
  filter,
  onReset,
}: {
  filter: Filter;
  onReset: () => void;
}) {
  const message =
    filter === "pending"
      ? {
          title: "درخواست در انتظاری نداری",
          body: "همه درخواست‌ها پاسخ داده شده‌اند.",
        }
      : filter === "accepted"
        ? {
            title: "هنوز درخواستی را نپذیرفته‌ای",
            body: "درخواست‌های پذیرفته‌شده اینجا نمایش داده می‌شوند.",
          }
        : filter === "rejected"
          ? {
              title: "درخواستی را رد نکرده‌ای",
              body: "درخواست‌های ردشده اینجا نمایش داده می‌شوند.",
            }
          : {
              title: "درخواستی در این دسته نیست",
              body: "فیلتر را تغییر بده.",
            };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-4 py-12 text-center sm:py-16">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60">
        <Inbox className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-base font-semibold">{message.title}</h3>
      <p className="mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {message.body}
      </p>
      <Button variant="outline" onClick={onReset} className="rounded-xl">
        نمایش همه درخواست‌ها
      </Button>
    </div>
  );
}

function RequestSkeleton() {
  return (
    <div
      className={cn(
        "flex animate-pulse items-start gap-3 rounded-2xl border border-border bg-card/60 p-4",
        "dark:border-white/10 dark:bg-white/5",
      )}
    >
      <div className="size-12 shrink-0 rounded-2xl bg-muted" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="mt-2 flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-muted" />
          <div className="h-8 w-20 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
