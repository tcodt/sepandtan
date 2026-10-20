"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  X,
  Users,
  Activity,
  AlertCircle,
  RefreshCw,
  ArrowDownAZ,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import {
  getClientRelationsForCoach,
  getClientProgressSummary,
} from "@/lib/api/coach-plans";
import { ClientCard } from "@/components/coach/client-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { ClientRelation } from "@/lib/types/client-relation";
import { cn } from "@/lib/utils";

/* ------------------------------ types & config ------------------------------ */

type ClientItem = {
  relation: ClientRelation;
  clientName: string;
  clientAvatar?: string;
  progress: {
    lastWeight: number | null;
    sessionsLast7Days: number;
    planStatus: string | null;
    currentPlanTitle?: string;
  };
};

type StatusFilter = "all" | "active" | "paused" | "ended";
type SortKey = "recent" | "name";

const STATUS_LABEL: Record<Exclude<StatusFilter, "all">, string> = {
  active: "فعال",
  paused: "متوقف",
  ended: "پایان‌یافته",
};

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "paused", label: "متوقف" },
  { key: "ended", label: "پایان‌یافته" },
];

const SORT_LABEL: Record<SortKey, string> = {
  recent: "جدیدترین",
  name: "نام (الفبا)",
};

/* ------------------------------ helpers ------------------------------ */

function relationStatus(r: ClientRelation): Exclude<StatusFilter, "all"> {
  const s = (r as unknown as { status?: string }).status;
  if (s === "active" || s === "paused" || s === "ended") return s;
  return (r as unknown as { endedAt?: string | null }).endedAt
    ? "ended"
    : "active";
}

/* ------------------------------ page ------------------------------ */

export default function CoachClientsPage() {
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  /* ---- fetch ---- */
  const loadClients = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setClients([]);
        return;
      }

      const relations = await getClientRelationsForCoach(coach.id);

      const items: ClientItem[] = await Promise.all(
        relations.map(async (relation) => {
          const client = db.users.find((u) => u.id === relation.clientId);
          const progress = await getClientProgressSummary(
            relation.clientId,
            coach.id,
          );

          return {
            relation,
            clientName: client?.name ?? "کاربر",
            clientAvatar: client?.avatarUrl,
            progress,
          };
        }),
      );

      setClients(items);
    } catch (err) {
      console.error(err);
      setError("خطا در بارگذاری هنرجویان");
      toast.error("خطا در بارگذاری هنرجویان");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  /* ---- derived: filter + sort ---- */
  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = clients.filter((c) => {
      if (
        statusFilter !== "all" &&
        relationStatus(c.relation) !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      return c.clientName.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sortKey === "name") {
        return a.clientName.localeCompare(b.clientName, "fa");
      }
      return (
        new Date(b.relation.startedAt).getTime() -
        new Date(a.relation.startedAt).getTime()
      );
    });

    return list;
  }, [clients, query, statusFilter, sortKey]);

  /* ---- derived: stats ---- */
  const stats = useMemo(() => {
    const total = clients.length;
    const activeThisWeek = clients.filter(
      (c) => c.progress.sessionsLast7Days > 0,
    ).length;
    const needsAttention = clients.filter(
      (c) =>
        !c.progress.planStatus ||
        c.progress.planStatus === "draft" ||
        c.progress.sessionsLast7Days === 0,
    ).length;
    return { total, activeThisWeek, needsAttention };
  }, [clients]);

  /* ---- filter state summary ---- */
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery !== "";
  const hasStatus = statusFilter !== "all";
  const filtersActive = hasQuery || hasStatus;

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      {/* ============ Header ============ */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-2 sm:items-start sm:justify-between sm:gap-4">
          {/* Back button — mobile only */}
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
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-2xl">
              هنرجویان من
            </h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {loading
                ? "در حال بارگذاری..."
                : clients.length === 0
                  ? "هنرجوی فعالی نداری"
                  : `${clients.length.toLocaleString("fa-IR")} هنرجوی فعال`}
            </p>
          </div>

          {/* Desktop back */}
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

      {/* ============ Stats strip (responsive) ============ */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 sm:gap-3">
          <StatCard
            icon={Users}
            label="کل هنرجو"
            value={stats.total}
            tone="default"
          />
          <StatCard
            icon={Activity}
            label="فعال این هفته"
            value={stats.activeThisWeek}
            tone="success"
          />
          <StatCard
            icon={AlertCircle}
            label="نیاز به پیگیری"
            value={stats.needsAttention}
            tone={stats.needsAttention > 0 ? "warning" : "default"}
          />
        </div>
      )}

      {/* ============ Toolbar (sticky on desktop) ============ */}
      {!loading && !error && clients.length > 0 && (
        <div className="space-y-3 lg:sticky lg:top-4 lg:z-10 lg:rounded-2xl lg:border lg:border-border lg:bg-card/95 lg:p-4 lg:backdrop-blur-md dark:lg:border-white/10 dark:lg:bg-card/80">
          {/* Search + sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جست‌وجوی هنرجو با نام..."
                aria-label="جست‌وجوی هنرجو با نام"
                className={cn(
                  "h-10 rounded-xl border-border bg-card pe-9 ps-9",
                  "dark:border-white/10 dark:bg-white/5",
                )}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="پاک کردن جست‌وجو"
                  className={cn(
                    "absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md",
                    "text-muted-foreground hover:bg-accent hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setSortKey((k) => (k === "recent" ? "name" : "recent"))
              }
              aria-label={`مرتب‌سازی: ${SORT_LABEL[sortKey]}`}
              title={`مرتب‌سازی: ${SORT_LABEL[sortKey]}`}
              className="size-10 shrink-0 rounded-xl"
            >
              {sortKey === "recent" ? (
                <Clock className="size-4" />
              ) : (
                <ArrowDownAZ className="size-4" />
              )}
            </Button>
          </div>

          {/* Status pills */}
          <div
            role="tablist"
            aria-label="فیلتر وضعیت هنرجو"
            className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {statusFilters.map((f) => {
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
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
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ Active filters banner ============ */}
      {!loading && !error && filtersActive && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4",
            "dark:border-primary/25 dark:bg-primary/10",
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <SlidersHorizontal className="size-4 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {filtersActive
                  ? `نمایش ${visibleClients.length.toLocaleString(
                      "fa-IR",
                    )} از ${clients.length.toLocaleString("fa-IR")} هنرجو`
                  : ""}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                فیلترهای فعال:{" "}
                {hasQuery && (
                  <>
                    نام شامل{" "}
                    <span className="font-medium text-foreground">
                      «{trimmedQuery}»
                    </span>
                  </>
                )}
                {hasQuery && hasStatus && " • "}
                {hasStatus && (
                  <>
                    وضعیت{" "}
                    <span className="font-medium text-foreground">
                      {
                        STATUS_LABEL[
                          statusFilter as Exclude<StatusFilter, "all">
                        ]
                      }
                    </span>
                  </>
                )}
              </p>

              {/* Filter chips — tap to remove one */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hasQuery && (
                  <FilterChip
                    label={`نام: «${trimmedQuery}»`}
                    onRemove={() => setQuery("")}
                  />
                )}
                {hasStatus && (
                  <FilterChip
                    label={`وضعیت: ${
                      STATUS_LABEL[statusFilter as Exclude<StatusFilter, "all">]
                    }`}
                    onRemove={() => setStatusFilter("all")}
                  />
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="shrink-0 gap-1.5 self-start rounded-xl sm:self-center"
          >
            <X className="size-3.5" />
            پاک کردن همه
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
            onClick={() => loadClients()}
            className="gap-1.5 rounded-xl"
          >
            <RefreshCw className="size-3.5" />
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* ============ Content ============ */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ClientSkeleton key={i} />
          ))}
        </div>
      ) : error ? null : clients.length === 0 ? (
        <CoachEmptyState type="clients" />
      ) : visibleClients.length === 0 ? (
        <NoResultsState
          query={trimmedQuery}
          status={
            hasStatus
              ? STATUS_LABEL[statusFilter as Exclude<StatusFilter, "all">]
              : null
          }
          onReset={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleClients.map((item) => (
            <ClientCard
              key={item.relation.id}
              clientId={item.relation.clientId}
              clientName={item.clientName}
              clientAvatar={item.clientAvatar}
              startedAt={item.relation.startedAt}
              progress={item.progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary";

  const bgClass =
    tone === "success"
      ? "bg-emerald-500/10"
      : tone === "warning"
        ? "bg-amber-500/10"
        : "bg-primary/10";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4",
        "dark:border-white/10 dark:bg-white/5",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          bgClass,
        )}
      >
        <Icon className={cn("size-5", toneClass)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums leading-tight">
          {value.toLocaleString("fa-IR")}
        </p>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 ps-2.5 pe-1 py-0.5 text-xs text-primary",
        "dark:border-primary/30 dark:bg-primary/15",
      )}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`حذف فیلتر ${label}`}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full",
          "hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
      >
        <X className="size-2.5" />
      </button>
    </span>
  );
}

function NoResultsState({
  query,
  status,
  onReset,
}: {
  query: string;
  status: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-4 py-12 text-center sm:py-16">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60">
        <Search className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-base font-semibold">هنرجویی پیدا نشد</h3>
      <p className="mb-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
        هیچ هنرجویی با این فیلترها مطابقت نداشت.
      </p>
      <p className="mb-5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {query && (
          <>
            نام شامل{" "}
            <span className="font-medium text-foreground">«{query}»</span>
          </>
        )}
        {query && status && " • "}
        {status && (
          <>
            وضعیت <span className="font-medium text-foreground">{status}</span>
          </>
        )}
      </p>
      <Button variant="outline" onClick={onReset} className="rounded-xl">
        نمایش همه هنرجوها
      </Button>
    </div>
  );
}

function ClientSkeleton() {
  return (
    <div
      className={cn(
        "flex animate-pulse items-start gap-3 rounded-2xl border border-border bg-card/60 p-4",
        "dark:border-white/10 dark:bg-white/5",
      )}
    >
      <div className="size-12 shrink-0 rounded-2xl bg-muted" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="mt-2 flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-24 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
