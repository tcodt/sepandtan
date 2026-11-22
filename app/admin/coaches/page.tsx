"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  UserRound,
  UserCheck,
  Instagram,
  MapPin,
  Calendar,
  Users,
  Eye,
  Search,
  AlertTriangle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Shield,
  MessageSquareQuote,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  SUSPENDED: "معلق",
  DELETED: "حذف‌شده",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  APPROVED:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  REJECTED:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  SUSPENDED:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25",
  DELETED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
};

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  SUSPENDED: "bg-orange-500",
  DELETED: "bg-zinc-400",
};

type StatusFilter = CoachRequestStatus | "ALL";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "PENDING", label: "در انتظار" },
  { id: "APPROVED", label: "تأیید شده" },
  { id: "REJECTED", label: "رد شده" },
  { id: "SUSPENDED", label: "معلق" },
  { id: "ALL", label: "همه" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const yearFormatter = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
});

function formatExperienceYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return yearFormatter.format(d);
  } catch {
    return "—";
  }
}

function normalizeStatus(s: string | null | undefined): string {
  return (s ?? "PENDING").toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Debounce                                                                   */
/* -------------------------------------------------------------------------- */

function useDebouncedValue(
  input: string,
  onCommit: (value: string) => void,
  delay: number,
) {
  useEffect(() => {
    const t = setTimeout(() => {
      onCommit(input.trim());
    }, delay);
    return () => clearTimeout(t);
  }, [input, onCommit, delay]);
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = normalizeStatus(status);
  const label = STATUS_LABEL[key] ?? key;
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.DELETED;
  const dot = STATUS_DOT[key] ?? "bg-zinc-400";
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

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: React.ReactNode;
  dir?: "ltr" | "rtl";
}) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="wrap-break-word font-medium" dir={dir}>
        {hasValue ? value : <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <span className="sr-only">در حال بارگذاری مربی‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
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
              ? "مربی‌ای با این فیلترها یافت نشد"
              : "هنوز درخواست مربیگری ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید."
              : "به‌محض ثبت اولین درخواست، اینجا نمایش داده می‌شود."}
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

function CoachAvatar({
  src,
  size = 12,
}: {
  src: string | null;
  size?: 10 | 12 | 14;
}) {
  const dim =
    size === 10 ? "h-10 w-10" : size === 14 ? "h-14 w-14" : "h-12 w-12";
  const iconClass =
    size === 14 ? "h-6 w-6" : size === 10 ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        dim,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size * 4}
          height={size * 4}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound
          className={cn("text-muted-foreground", iconClass)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog                                                             */
/* -------------------------------------------------------------------------- */

type ConfirmIntent = "success" | "danger" | "warning";

type ConfirmState = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  intent: ConfirmIntent;
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm: () => void | Promise<void>;
} | null;

const INTENT_STYLES: Record<ConfirmIntent, string> = {
  success: "bg-emerald-600 text-white hover:bg-emerald-600/90",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  warning: "bg-amber-600 text-white hover:bg-amber-600/90",
};

const INTENT_ICON_STYLES: Record<ConfirmIntent, string> = {
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const INTENT_ICON: Record<ConfirmIntent, typeof Check> = {
  success: UserCheck,
  danger: UserX,
  warning: AlertTriangle,
};

function ConfirmDialog({
  state,
  onClose,
  isBusy,
}: {
  state: ConfirmState;
  onClose: () => void;
  isBusy: boolean;
}) {
  const intent = state?.intent ?? "warning";
  const Icon = state?.icon ?? INTENT_ICON[intent];

  return (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose();
      }}
    >
      <AlertDialogContent
        dir="rtl"
        className="max-w-[calc(100vw-2rem)] sm:max-w-md"
      >
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                INTENT_ICON_STYLES[intent],
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-start">
                {state?.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-start">
                {state?.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={isBusy}>
            انصراف
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void state?.onConfirm();
            }}
            disabled={isBusy}
            className={cn("w-full sm:w-auto", INTENT_STYLES[intent])}
          >
            {isBusy ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Icon className="me-2 h-4 w-4" aria-hidden="true" />
            )}
            {state?.confirmLabel ?? "تأیید"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminCoachesPage() {
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminCoachItem | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminCoachItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const searchId = useId();
  const resultCountId = useId();

  const updateMutation = useUpdateCoachByAdmin();

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
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const hasFilters = filter !== "ALL" || !!search;

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  useDebouncedValue(searchInput, commitSearch, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (page > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const inFlight = updateMutation.variables;
  const isRowBusy = useCallback(
    (item: AdminCoachItem) => {
      if (!updateMutation.isPending || !inFlight) return false;
      const pathId = item.coachId || item.id;
      return inFlight.coachId === pathId;
    },
    [updateMutation.isPending, inFlight],
  );

  const resetFilters = useCallback(() => {
    setFilter("PENDING");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, []);

  const openDetail = useCallback((item: AdminCoachItem) => {
    setDetail(item);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetail(null);
  }, []);

  const requestApprove = useCallback(
    (item: AdminCoachItem) => {
      setConfirm({
        title: "تأیید درخواست مربیگری",
        description: (
          <span className="block space-y-2">
            <span className="block">
              درخواست «
              <strong className="text-foreground">
                {item.title || item.name}
              </strong>
              » تأیید شود؟
            </span>
            <span className="block rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-900 dark:text-emerald-100">
              پس از تأیید، نقش این کاربر به «مربی» تغییر می‌کند و می‌تواند شاگرد
              بپذیرد.
            </span>
          </span>
        ),
        confirmLabel: "تأیید مربی",
        intent: "success",
        onConfirm: async () => {
          try {
            await updateMutation.mutateAsync({
              coachId: item.coachId || item.id,
              userId: item.userId,
              payload: { status: "APPROVED" },
            });
            setConfirm(null);
            closeDetail();
          } catch {
            /* Hook toasts */
          }
        },
      });
    },
    [updateMutation, closeDetail],
  );

  const openReject = useCallback((item: AdminCoachItem) => {
    setRejectTarget(item);
    setRejectReason("");
    setRejectOpen(true);
  }, []);

  const closeReject = useCallback(() => {
    if (updateMutation.isPending) return;
    setRejectOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  }, [updateMutation.isPending]);

  const trimmedReason = rejectReason.trim();
  const canSubmitReject = trimmedReason.length > 0 && !updateMutation.isPending;

  const confirmReject = useCallback(async () => {
    if (!rejectTarget || !trimmedReason) return;
    try {
      await updateMutation.mutateAsync({
        coachId: rejectTarget.coachId || rejectTarget.id,
        userId: rejectTarget.userId,
        payload: {
          status: "REJECTED",
          rejectionReason: trimmedReason,
        },
      });
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
      closeDetail();
    } catch {
      /* Hook toasts; keep dialog open for retry */
    }
  }, [rejectTarget, trimmedReason, updateMutation, closeDetail]);

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6"
    >
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
              بررسی درخواست‌های مربیگری
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
              placeholder="جستجوی نام، ایمیل، اینستاگرام، کد ملی…"
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
            {searchInput ? (
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
            ) : null}
            {isFetching && !isLoading ? (
              <Loader2 className="pointer-events-none absolute inset-e-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
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
                  hasFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      <section aria-label="لیست مربی‌ها" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={resetFilters} />
        ) : (
          items.map((item) => {
            const pathId = item.coachId || item.id;
            const busy = isRowBusy(item);
            const status = normalizeStatus(item.coachStatus);
            const isApproved = status === "APPROVED";
            const isRejected = status === "REJECTED";
            const approveBusy = busy && inFlight?.payload.status === "APPROVED";
            const displayName = item.title || item.name;

            return (
              <Card
                key={`${item.userId ?? "no-user"}-${pathId}`}
                className={cn(
                  "mb-3 border-border/60 transition-colors duration-150",
                  busy && "border-primary/30 bg-primary/5",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <CoachAvatar src={item.avatarUrl} size={12} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        <StatusBadge status={item.coachStatus} />
                        {item.role === "COACH" && !isApproved ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px] text-muted-foreground"
                          >
                            <Shield
                              className="h-2.5 w-2.5"
                              aria-hidden="true"
                            />
                            نقش: مربی
                          </Badge>
                        ) : null}
                      </div>

                      {item.headline ? (
                        <p
                          className="line-clamp-1 text-xs text-muted-foreground"
                          title={item.headline}
                        >
                          {item.headline}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {item.instagram ? (
                          <span
                            className="inline-flex items-center gap-1"
                            dir="ltr"
                          >
                            <Instagram className="h-3 w-3" aria-hidden="true" />
                            {item.instagram}
                          </span>
                        ) : null}
                        {item.experienceYears ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            از {formatExperienceYear(item.experienceYears)}
                          </span>
                        ) : null}
                        {item.maxClients != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            حداکثر {item.maxClients.toLocaleString(
                              "fa-IR",
                            )}{" "}
                            شاگرد
                          </span>
                        ) : null}
                        {item.cityName || item.provinceName ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {[item.cityName, item.provinceName]
                              .filter(Boolean)
                              .join("، ")}
                          </span>
                        ) : null}
                      </div>

                      {item.bio ? (
                        <p
                          className="line-clamp-2 pt-0.5 text-xs text-foreground/80"
                          title={item.bio}
                        >
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

                      <div className="flex flex-wrap gap-x-3 pt-0.5 text-[11px] text-muted-foreground">
                        {item.email ? (
                          <span dir="ltr">{item.email}</span>
                        ) : null}
                        {item.phone ? (
                          <span dir="ltr">{item.phone}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5"
                      onClick={() => openDetail(item)}
                      aria-label={`جزئیات کامل ${displayName}`}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      جزئیات
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 flex-1 gap-1.5 sm:flex-none"
                      disabled={busy || isApproved || !pathId}
                      onClick={() => requestApprove(item)}
                      aria-label={`تأیید درخواست ${displayName}`}
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
                      className="h-9 flex-1 gap-1.5 text-destructive hover:text-destructive sm:flex-none"
                      disabled={busy || isRejected || !pathId}
                      onClick={() => openReject(item)}
                      aria-label={`رد درخواست ${displayName}`}
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

      {items.length > 0 && !isError ? (
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="order-2 flex items-center justify-between gap-3 sm:order-1 sm:justify-start">
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString("fa-IR")} مورد
              {isFetching ? (
                <span className="ms-1 inline-flex items-center gap-1">
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                  در حال به‌روزرسانی…
                </span>
              ) : null}
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
                  className="h-8 w-20 text-xs"
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
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader className="p-3">
            <DialogTitle className="text-start">
              جزئیات درخواست مربی
            </DialogTitle>
            <DialogDescription className="text-start">
              اطلاعات کامل درخواست برای بررسی و اقدام.
            </DialogDescription>
          </DialogHeader>

          {detail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CoachAvatar src={detail.avatarUrl} size={14} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {detail.title || detail.name}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={detail.coachStatus} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2.5">
                <InfoRow
                  label="نام نمایشی"
                  value={detail.title || detail.name}
                />
                <InfoRow label="تیتر" value={detail.headline} />
                <InfoRow label="Slug" value={detail.slug} dir="ltr" />
                <InfoRow label="بیو" value={detail.bio} />
                <InfoRow
                  label="سال شروع"
                  value={formatExperienceYear(detail.experienceYears)}
                />
                <InfoRow
                  label="اینستاگرام"
                  value={detail.instagram}
                  dir="ltr"
                />
                <InfoRow
                  label="حداکثر شاگرد"
                  value={
                    detail.maxClients != null
                      ? detail.maxClients.toLocaleString("fa-IR")
                      : null
                  }
                />
                <InfoRow
                  label="پذیرش شاگرد"
                  value={
                    detail.isAcceptingClients == null
                      ? null
                      : detail.isAcceptingClients
                        ? "بله"
                        : "خیر"
                  }
                />
                <InfoRow
                  label="کمیسیون"
                  value={
                    detail.commissionRate != null
                      ? `${detail.commissionRate.toLocaleString("fa-IR")}٪`
                      : null
                  }
                />
                <InfoRow label="کد ملی" value={detail.nationalId} dir="ltr" />
                <InfoRow
                  label="شهر / استان"
                  value={
                    [detail.cityName, detail.provinceName]
                      .filter(Boolean)
                      .join("، ") || null
                  }
                />
                <InfoRow label="ایمیل" value={detail.email} dir="ltr" />
                <InfoRow label="موبایل" value={detail.phone} dir="ltr" />
                <InfoRow label="نقش کاربر" value={detail.role} dir="ltr" />
                <InfoRow
                  label="وضعیت حساب"
                  value={detail.accountStatus}
                  dir="ltr"
                />
                <InfoRow label="User ID" value={detail.userId} dir="ltr" />
                <InfoRow label="Coach ID" value={detail.coachId} dir="ltr" />
                {detail.rejectionReason ? (
                  <InfoRow label="دلیل رد" value={detail.rejectionReason} />
                ) : null}
              </div>

              {(detail.banners?.length ?? 0) > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">بنرها</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(detail.banners ?? []).map((src) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-24 w-full rounded-md border object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={closeDetail}
                  disabled={updateMutation.isPending}
                >
                  بستن
                </Button>
                {normalizeStatus(detail.coachStatus) !== "REJECTED" ? (
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      const target = detail;
                      closeDetail();
                      openReject(target);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <X className="me-2 h-4 w-4" aria-hidden="true" />
                    رد درخواست
                  </Button>
                ) : null}
                {normalizeStatus(detail.coachStatus) !== "APPROVED" ? (
                  <Button
                    className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90 sm:w-auto"
                    onClick={() => requestApprove(detail)}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="me-2 h-4 w-4" aria-hidden="true" />
                    تأیید مربی
                  </Button>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
              {rejectTarget?.title || rejectTarget?.name
                ? `درخواست «${rejectTarget.title || rejectTarget.name}» رد شود؟`
                : "درخواست رد شود؟"}{" "}
              دلیل رد برای کاربر ذخیره می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label
              htmlFor="coach-reject-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              دلیل رد <span className="text-destructive">*</span>
            </Label>
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
                <X className="me-2 h-4 w-4" />
              )}
              تأیید رد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        state={confirm}
        onClose={() => setConfirm(null)}
        isBusy={updateMutation.isPending}
      />
    </div>
  );
}
