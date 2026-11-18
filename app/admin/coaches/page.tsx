"use client";

import { useMemo, useState, useCallback, useEffect, useId } from "react";
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  UserRound,
  UserCheck,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAdminCoaches,
  useUpdateCoachByAdmin,
} from "@/features/admin/coaches/hooks/use-admin-coaches";
import type {
  AdminCoachItem,
  CoachRequestStatus,
} from "@/features/admin/coaches/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const SEARCH_DEBOUNCE_MS = 350;

type StatusFilter = CoachRequestStatus | "ALL";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "PENDING", label: "در انتظار" },
  { id: "APPROVED", label: "تأیید شده" },
  { id: "REJECTED", label: "رد شده" },
  { id: "SUSPENDED", label: "معلق" },
  { id: "ALL", label: "همه" },
];

type BadgeConfig = { label: string; className: string; dot: string };

const STATUS_BADGE: Record<string, BadgeConfig> = {
  APPROVED: {
    label: "تأیید شده",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "رد شده",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dot: "bg-rose-500",
  },
  SUSPENDED: {
    label: "معلق",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25",
    dot: "bg-orange-500",
  },
  DELETED: {
    label: "حذف‌شده",
    className:
      "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
    dot: "bg-zinc-400",
  },
  PENDING: {
    label: "در انتظار",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
  },
};

const FALLBACK_BADGE: BadgeConfig = {
  label: "—",
  className: "bg-muted text-muted-foreground border-border",
  dot: "bg-zinc-400",
};

function getStatusBadge(status: string | null | undefined): BadgeConfig {
  const key = (status ?? "PENDING").toUpperCase();
  return STATUS_BADGE[key] ?? FALLBACK_BADGE;
}

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

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function CoachAvatar({ item }: { item: AdminCoachItem }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
      {item.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.avatarUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function CoachCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  hasSearch,
  hasFilter,
  onReset,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
  onReset: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <UserRound
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasSearch
              ? "مربی‌ای با این جستجو یافت نشد"
              : hasFilter
                ? "مربی‌ای با این وضعیت وجود ندارد"
                : "هنوز درخواست مربیگری ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasSearch
              ? "عبارت جستجو را تغییر دهید."
              : hasFilter
                ? "وضعیت دیگری را انتخاب کنید یا فیلترها را پاک کنید."
                : "با ثبت اولین درخواست، اینجا نمایش داده می‌شود."}
          </p>
        </div>
        {(hasSearch || hasFilter) && (
          <Button variant="outline" size="sm" onClick={onReset}>
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
            دریافت لیست مربی‌ها ناموفق بود
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
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" />
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

export default function AdminCoachesPage() {
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<AdminCoachItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const searchId = useId();
  const resultCountId = useId();

  const updateMutation = useUpdateCoachByAdmin();

  // Debounced search → API param.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) {
        setSearch(next);
        setPage(1);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const filters = useMemo(
    () => ({
      status: filter,
      page,
      limit: pageSize,
      order: "desc" as const,
      search: search || undefined,
    }),
    [filter, page, pageSize, search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminCoaches(filters);

  const items = data?.data ?? [];
  const total = data?.pagination.total ?? items.length;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasSearch = !!search;
  const hasFilter = filter !== "ALL";
  const hasActiveFilters = hasSearch || hasFilter;

  // Clamp page when total shrinks after an action.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = useCallback(() => {
    setFilter("PENDING");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, []);

  /* --------------------------- Row busy tracking --------------------------- */

  const inFlight = updateMutation.variables;
  const isRowBusy = useCallback(
    (item: AdminCoachItem) => {
      if (!updateMutation.isPending || !inFlight) return false;
      const pathId = item.coachId || item.id;
      return inFlight.coachId === pathId;
    },
    [updateMutation.isPending, inFlight],
  );

  /* ------------------------------- Actions ------------------------------- */

  const handleApprove = useCallback(
    async (item: AdminCoachItem) => {
      const pathId = item.coachId || item.id;
      if (!pathId) return;
      try {
        await updateMutation.mutateAsync({
          coachId: pathId,
          userId: item.userId ?? null,
          payload: { status: "APPROVED" },
        });
      } catch {
        // Hook's onError already toasts.
      }
    },
    [updateMutation],
  );

  const openReject = useCallback((item: AdminCoachItem) => {
    setSelected(item);
    setRejectReason("");
    setRejectOpen(true);
  }, []);

  const closeReject = useCallback(() => {
    if (updateMutation.isPending) return;
    setRejectOpen(false);
    setSelected(null);
    setRejectReason("");
  }, [updateMutation.isPending]);

  const trimmedReason = rejectReason.trim();
  const canSubmitReject = trimmedReason.length > 0 && !updateMutation.isPending;

  const confirmReject = useCallback(async () => {
    if (!selected) return;
    if (!trimmedReason) {
      toast.error("دلیل رد را وارد کنید");
      return;
    }
    const pathId = selected.coachId || selected.id;
    if (!pathId) return;
    try {
      await updateMutation.mutateAsync({
        coachId: pathId,
        userId: selected.userId ?? null,
        payload: { status: "REJECTED", rejectionReason: trimmedReason },
      });
      setRejectOpen(false);
      setSelected(null);
      setRejectReason("");
    } catch {
      // Hook's onError already toasts; keep dialog open for retry.
    }
  }, [selected, trimmedReason, updateMutation]);

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
            <UserCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              مدیریت مربی‌ها
            </h1>
            <p className="text-xs text-muted-foreground">
              تأیید یا رد درخواست‌های مربیگری
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5 self-start sm:self-auto"
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

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="-mx-1 flex flex-wrap items-center gap-2 px-1"
            role="group"
            aria-label="فیلتر وضعیت"
          >
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <Button
                  key={f.id}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="h-8 text-xs"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(f.id);
                    setPage(1);
                  }}
                >
                  {f.label}
                </Button>
              );
            })}
          </div>

          <div className="relative w-full sm:ms-auto sm:max-w-xs">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی مربی
            </label>
            <Input
              id={searchId}
              placeholder="جستجوی نام، ایمیل یا موبایل…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchInput) {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }
              }}
              className="h-9 ps-9 pe-9"
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
              : `${total.toLocaleString("fa-IR")} مربی یافت شد${
                  hasActiveFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section
        aria-label="لیست مربی‌ها"
        aria-busy={isLoading || isFetching}
        className="space-y-3"
      >
        {isLoading ? (
          <>
            <span className="sr-only">در حال بارگذاری مربی‌ها…</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <CoachCardSkeleton key={i} />
            ))}
          </>
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            hasSearch={hasSearch}
            hasFilter={hasFilter}
            onReset={resetFilters}
          />
        ) : (
          items.map((item) => {
            const pathId = item.coachId || item.id;
            const badge = getStatusBadge(item.coachStatus);
            const busy = isRowBusy(item);
            const isApproved = item.coachStatus === "APPROVED";
            const isRejected = item.coachStatus === "REJECTED";
            const approveBusy = busy && inFlight?.payload.status === "APPROVED";
            const noOwner = !item.userId;

            return (
              <Card
                key={`${item.userId ?? "no-user"}-${pathId}`}
                className={cn(
                  "border-border/60 transition-colors duration-150",
                  busy && "border-primary/30 bg-primary/5",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <CoachAvatar item={item} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 gap-1.5 text-[10px] font-medium",
                            badge.className,
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              badge.dot,
                            )}
                            aria-hidden="true"
                          />
                          {badge.label}
                        </Badge>
                      </div>
                      {item.headline ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.headline}
                        </p>
                      ) : null}
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[item.phone, item.email].filter(Boolean).join(" · ") ||
                          "بدون تماس"}
                      </p>
                      {item.bio ? (
                        <p className="line-clamp-2 text-xs text-foreground/80">
                          {item.bio}
                        </p>
                      ) : null}
                      {item.rejectionReason ? (
                        <div className="flex items-start gap-1.5 rounded-md border border-rose-500/15 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-700 dark:text-rose-400">
                          <MessageSquareQuote
                            className="mt-0.5 h-3 w-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-2 wrap-break-word">
                            {item.rejectionReason}
                          </span>
                        </div>
                      ) : null}
                      {noOwner && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          userId نامشخص — همگام‌سازی نقش انجام نمی‌شود
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:flex-col md:flex-row">
                    <Button
                      size="sm"
                      className="h-9 flex-1 gap-1.5"
                      disabled={busy || isApproved || !pathId}
                      onClick={() => void handleApprove(item)}
                    >
                      {approveBusy ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {isApproved ? "تأیید شده" : "تأیید"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 flex-1 gap-1.5 text-destructive hover:text-destructive"
                      disabled={busy || isRejected || !pathId}
                      onClick={() => openReject(item)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {isRejected ? "رد شده" : "رد"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
                htmlFor="coaches-page-size"
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
                  id="coaches-page-size"
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

      {/* --------------------------- Reject dialog --------------------------- */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!open) closeReject();
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-start">رد درخواست مربی</DialogTitle>
            <DialogDescription className="text-start">
              {selected?.name
                ? `درخواست «${selected.name}» رد شود؟ دلیل رد برای کاربر ذخیره می‌شود.`
                : "درخواست رد شود؟"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="coach-reject-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              دلیل رد <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="coach-reject-reason"
              rows={4}
              placeholder="مثلاً: مدارک مربیگری ناقص است..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              className="resize-none"
              autoFocus
              aria-invalid={rejectReason.length > 0 && !trimmedReason}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>حداکثر ۵۰۰ کاراکتر</span>
              <span className="tabular-nums">
                {rejectReason.length.toLocaleString("fa-IR")}/۵۰۰
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={closeReject}
              disabled={updateMutation.isPending}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={!canSubmitReject}
              onClick={() => void confirmReject()}
            >
              {updateMutation.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquareQuote className="me-2 h-4 w-4" />
              )}
              تأیید رد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
