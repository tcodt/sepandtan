"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
  Inbox,
  Clock,
  CheckCircle2,
  Archive,
  Flame,
  ArrowUp,
  Minus,
  CircleAlert,
  Hash,
  ShoppingBag,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useAdminTickets,
  useTicketStats,
} from "@/features/admin/tickets/hooks/use-admin-tickets";
import type {
  TicketPriority,
  TicketStatus,
} from "@/features/admin/tickets/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  WAITING: "در حال بررسی",
  RESOLVED: "حل‌شده",
  CLOSED: "بسته",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  WAITING: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  RESOLVED:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  CLOSED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
};

// const STATUS_DOT: Record<string, string> = {
//   PENDING: "bg-amber-500",
//   WAITING: "bg-sky-500",
//   RESOLVED: "bg-emerald-500",
//   CLOSED: "bg-zinc-400",
// };

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  WAITING: MessageSquare,
  RESOLVED: CheckCircle2,
  CLOSED: Archive,
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "کم",
  MEDIUM: "متوسط",
  HIGH: "زیاد",
  URGENT: "فوری",
  CRITICAL: "بحرانی",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
  MEDIUM: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  HIGH: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25",
  URGENT: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  CRITICAL:
    "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40",
};

const PRIORITY_ICON: Record<string, typeof Flame> = {
  LOW: Minus,
  MEDIUM: Minus,
  HIGH: ArrowUp,
  URGENT: Flame,
  CRITICAL: CircleAlert,
};

const FILTERS: { id: TicketStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "همه" },
  { id: "PENDING", label: "در انتظار" },
  { id: "WAITING", label: "در حال بررسی" },
  { id: "RESOLVED", label: "حل‌شده" },
  { id: "CLOSED", label: "بسته" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "—";
  }
}

function normalizeStatus(s: string | undefined | null): string {
  return (s ?? "PENDING").toUpperCase();
}

function normalizePriority(p: string | undefined | null): string {
  return (p ?? "MEDIUM").toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Debounce hook                                                              */
/* -------------------------------------------------------------------------- */

function useDebounced(
  input: string,
  current: string,
  commit: (v: string) => void,
  delay: number,
) {
  const lastRef = useRef(input);
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === current) return;
    if (lastRef.current === input) return;
    lastRef.current = input;
    const t = setTimeout(() => {
      commit(trimmed);
    }, delay);
    return () => clearTimeout(t);
  }, [input, current, commit, delay]);
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = normalizeStatus(status);
  const label = STATUS_LABEL[key] ?? key;
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.CLOSED;
  const dot = STATUS_ICON[key] ?? "bg-zinc-400";
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[10px] font-medium", style)}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", dot)}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  const key = normalizePriority(priority);
  const label = PRIORITY_LABEL[key] ?? key;
  const style = PRIORITY_STYLES[key] ?? PRIORITY_STYLES.MEDIUM;
  const Icon = PRIORITY_ICON[key] ?? Minus;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] font-medium", style)}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function UnreadIndicator({ unread }: { unread: boolean }) {
  if (!unread) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-primary"
      aria-label="کاربر پیام جدید نخوانده است"
    >
      <Mail className="h-3 w-3" aria-hidden="true" />
      پیام جدید
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  tone: "default" | "amber" | "sky" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "sky"
        ? "text-sky-600 dark:text-sky-400"
        : tone === "emerald"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-start transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", toneClass)}
          aria-hidden="true"
        />
      </span>
      <span className={cn("text-lg font-bold tabular-nums", toneClass)}>
        {value.toLocaleString("fa-IR")}
      </span>
    </button>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری تیکت‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasFilters
              ? "تیکتی با این فیلترها یافت نشد"
              : "هنوز تیکتی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید."
              : "به‌محض ایجاد اولین تیکت توسط کاربران، اینجا نمایش داده می‌شود."}
          </p>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle
            className="h-6 w-6 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            دریافت تیکت‌ها ناموفق بود
          </p>
          <p className="mx-auto max-w-md wrap-break-word text-xs text-muted-foreground">
            {message}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          )}
          تلاش دوباره
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminTicketsPage() {
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<TicketPriority | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const filters = useMemo(
    () => ({
      status,
      priority,
      search: search || undefined,
      page,
      limit: pageSize,
      order: "desc" as const,
    }),
    [status, priority, search, page, pageSize],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminTickets(filters);
  const { data: stats, isLoading: statsLoading } = useTicketStats();

  const items = data?.data ?? [];
  const total = data?.pagination.total ?? items.length;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasFilters = status !== "ALL" || priority !== "ALL" || !!search;

  /* --------------------------- Debounced search --------------------------- */

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* ------------------------------ Page clamp ------------------------------ */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ------------------------------ Handlers ------------------------------ */

  const clearFilters = useCallback(() => {
    setStatus("ALL");
    setPriority("ALL");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, []);

  /* ------------------------------- Render ------------------------------- */

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              تیکت‌ها
            </h1>
            <p className="text-xs text-muted-foreground">پشتیبانی کاربران</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 self-start sm:self-auto"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            aria-hidden="true"
          />
          بروزرسانی
        </Button>
      </header>

      {/* ------------------------------ Stats ------------------------------ */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="group"
          aria-label="آمار تیکت‌ها"
        >
          <StatCard
            label="کل"
            value={stats.total ?? 0}
            icon={Inbox}
            tone="default"
            active={status === "ALL"}
            onClick={() => {
              setStatus("ALL");
              setPage(1);
            }}
          />
          <StatCard
            label="در انتظار"
            value={stats.pending ?? 0}
            icon={Clock}
            tone="amber"
            active={status === "PENDING"}
            onClick={() => {
              setStatus("PENDING");
              setPage(1);
            }}
          />
          <StatCard
            label="در حال بررسی"
            value={stats.waiting ?? 0}
            icon={MessageSquare}
            tone="sky"
            active={status === "WAITING"}
            onClick={() => {
              setStatus("WAITING");
              setPage(1);
            }}
          />
          <StatCard
            label="حل‌شده"
            value={stats.resolved ?? 0}
            icon={CheckCircle2}
            tone="emerald"
            active={status === "RESOLVED"}
            onClick={() => {
              setStatus("RESOLVED");
              setPage(1);
            }}
          />
        </div>
      ) : null}

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی تیکت
            </label>
            <Input
              id={searchId}
              placeholder="جستجوی عنوان یا کد پیگیری…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchInput) {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }
              }}
              className="h-10 ps-10 pe-10"
              aria-describedby={resultCountId}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute inset-e-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {isFetching && !isLoading && (
              <Loader2 className="pointer-events-none absolute inset-e-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v as TicketPriority | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-40"
              aria-label="فیلتر اولویت"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="ALL">همه اولویت‌ها</SelectItem>
              <SelectItem value="LOW">کم</SelectItem>
              <SelectItem value="MEDIUM">متوسط</SelectItem>
              <SelectItem value="HIGH">زیاد</SelectItem>
              <SelectItem value="URGENT">فوری</SelectItem>
              <SelectItem value="CRITICAL">بحرانی</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 self-start text-muted-foreground sm:self-auto"
              onClick={clearFilters}
            >
              <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              پاک کردن
            </Button>
          )}
        </div>

        <div
          className="-mx-1 flex flex-wrap items-center gap-2 px-1"
          role="group"
          aria-label="فیلتر وضعیت"
        >
          {FILTERS.map((f) => {
            const active = status === f.id;
            return (
              <Button
                key={f.id}
                size="sm"
                variant={active ? "default" : "outline"}
                className="h-8 text-xs"
                aria-pressed={active}
                onClick={() => {
                  setStatus(f.id);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            );
          })}
        </div>

        <p
          id={resultCountId}
          className="text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "در حال بارگذاری…"
            : isError
              ? "—"
              : `${total.toLocaleString("fa-IR")} تیکت${
                  hasFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست تیکت‌ها" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const unread = !item.isUserRead;
              return (
                <Link
                  key={item.id}
                  href={`/admin/tickets/${item.id}`}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`تیکت ${item.title} — وضعیت ${STATUS_LABEL[normalizeStatus(item.status)] ?? item.status}${unread ? " — پیام جدید" : ""}`}
                >
                  <Card
                    className={cn(
                      "border-border/60 transition-colors",
                      "hover:border-border hover:bg-muted/30",
                    )}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className="truncate text-sm font-semibold text-foreground"
                            title={item.title}
                          >
                            {item.title}
                          </p>
                          <StatusBadge status={item.status} />
                          <PriorityBadge priority={item.priority} />
                          <UnreadIndicator unread={unread} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-foreground">
                              {item.userName || "کاربر"}
                            </span>
                          </span>
                          {item.trackingCode && (
                            <span
                              className="inline-flex items-center gap-1"
                              dir="ltr"
                            >
                              <Hash className="h-3 w-3" aria-hidden="true" />
                              <span className="font-mono tabular-nums">
                                {item.trackingCode}
                              </span>
                            </span>
                          )}
                          {item.orderNumber && (
                            <span className="inline-flex items-center gap-1">
                              <ShoppingBag
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              سفارش{" "}
                              <span className="font-mono tabular-nums">
                                {item.orderNumber}
                              </span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronLeft
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------------- Pagination ----------------------------- */}
      {items.length > 0 && !isError && (
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 flex items-center justify-between gap-3 sm:order-1 sm:justify-start">
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString("fa-IR")} مورد
              {isFetching && (
                <span className="ms-1 inline-flex items-center gap-1">
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                  در حال به‌روزرسانی…
                </span>
              )}
            </p>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="tickets-page-size"
                className="text-xs text-muted-foreground"
              >
                هر صفحه:
              </label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger
                  id="tickets-page-size"
                  className="h-8 w-18 text-xs"
                  aria-label="تعداد ردیف در هر صفحه"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n.toLocaleString("fa-IR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="order-1 flex items-center justify-center gap-2 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 flex-1 gap-1 sm:flex-none"
              aria-label="صفحه قبلی"
            >
              <ChevronRight className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <ChevronLeft
                className="hidden h-4 w-4 sm:inline"
                aria-hidden="true"
              />
              قبلی
            </Button>
            <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
              {page.toLocaleString("fa-IR")} /{" "}
              {totalPages.toLocaleString("fa-IR")}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 flex-1 gap-1 sm:flex-none"
              aria-label="صفحه بعدی"
            >
              بعدی
              <ChevronLeft className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <ChevronRight
                className="hidden h-4 w-4 sm:inline"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
