"use client";

import { useMemo, useState, useCallback, useEffect, useId } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Store,
  AlertTriangle,
  RefreshCw,
  X,
  Mail,
  Phone,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  Search,
  Ban,
  Archive,
} from "lucide-react";

import {
  useAdminStores,
  useUpdateStoreByAdmin,
} from "@/features/admin/stores/hooks/use-admin-stores";
import type {
  AdminStoreItem,
  AdminStoresFilters,
  StoreRequestStatus,
} from "@/features/admin/stores/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const SEARCH_DEBOUNCE_MS = 350;

const STATUS_LABEL: Record<StoreRequestStatus, string> = {
  PENDING: "در انتظار",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  SUSPENDED: "معلق",
  DELETED: "حذف‌شده",
};

const STATUS_STYLES: Record<StoreRequestStatus, string> = {
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

// const STATUS_DOT: Record<StoreRequestStatus, string> = {
//   PENDING: "bg-amber-500",
//   APPROVED: "bg-emerald-500",
//   REJECTED: "bg-rose-500",
//   SUSPENDED: "bg-orange-500",
//   DELETED: "bg-zinc-400",
// };

const STATUS_ICON: Record<StoreRequestStatus, typeof Store> = {
  PENDING: Store,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  SUSPENDED: Ban,
  DELETED: Archive,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isStoreStatus(value: unknown): value is StoreRequestStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(STATUS_LABEL, value)
  );
}

function statusLabel(status?: string | null): string {
  return isStoreStatus(status) ? STATUS_LABEL[status] : status || "—";
}

function statusStyle(status?: string | null): string {
  return isStoreStatus(status) ? STATUS_STYLES[status] : "";
}

type PendingAction =
  | { kind: "approve"; store: AdminStoreItem }
  | { kind: "reject"; store: AdminStoreItem }
  | null;

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status?: string | null }) {
  const key: StoreRequestStatus | null = isStoreStatus(status) ? status : null;
  const Icon = key ? STATUS_ICON[key] : null;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-medium", statusStyle(status))}
    >
      {Icon ? (
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <span
          className="h-1.5 w-1.5 rounded-full bg-zinc-400"
          aria-hidden="true"
        />
      )}
      {statusLabel(status)}
    </Badge>
  );
}

function StoreIdentity({ store }: { store: AdminStoreItem }) {
  const primary = store.name || "—";
  const secondary = store.slug || store.ownerName || null;

  return (
    <div className="min-w-0">
      <div
        className="truncate text-sm font-medium text-foreground"
        title={primary}
      >
        {primary}
      </div>
      {secondary && (
        <div
          className="truncate text-xs text-muted-foreground"
          title={secondary}
        >
          {secondary}
        </div>
      )}
      {!store.ownerId && (
        <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
          مالک نامشخص — همگام‌سازی نقش انجام نمی‌شود
        </div>
      )}
    </div>
  );
}

function StoreContact({ store }: { store: AdminStoreItem }) {
  return (
    <div className="min-w-0 space-y-0.5 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate" title={store.email || "—"}>
          {store.email || "—"}
        </span>
      </div>
      <div className="flex items-center gap-1.5" dir="ltr">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate text-xs">{store.phone || "—"}</span>
      </div>
    </div>
  );
}

function RejectionReason({
  reason,
  className,
}: {
  reason?: string | null;
  className?: string;
}) {
  if (!reason) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
  }
  return (
    <div
      className={cn(
        "flex items-start gap-1.5 rounded-md border border-rose-500/15 bg-rose-500/5 px-2 py-1 text-xs text-rose-700 dark:text-rose-400",
        className,
      )}
    >
      <MessageSquareQuote
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      />
      <span className="line-clamp-2 wrap-break-word" title={reason}>
        {reason}
      </span>
    </div>
  );
}

function StoreActions({
  store,
  onApprove,
  onReject,
  busy,
  isRowBusy,
}: {
  store: AdminStoreItem;
  onApprove: (s: AdminStoreItem) => void;
  onReject: (s: AdminStoreItem) => void;
  busy: boolean;
  isRowBusy: boolean;
}) {
  const hasId = Boolean(store.id?.trim());
  const canApprove = hasId && store.status !== "APPROVED";
  const canReject = hasId && store.status !== "REJECTED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 data-[state=open]:bg-muted"
          aria-label={`گزینه‌های ${store.name || "فروشگاه"}`}
          disabled={busy}
        >
          {isRowBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          اقدامات
        </DropdownMenuLabel>

        {!hasId && (
          <p className="px-2 py-1.5 text-[11px] text-destructive">
            شناسه فروشگاه نامعتبر است — تأیید ممکن نیست
          </p>
        )}

        <DropdownMenuItem
          disabled={!canApprove || busy}
          onClick={() => onApprove(store)}
          className="text-emerald-700 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-400"
        >
          <CheckCircle2 className="me-2 h-4 w-4" />
          تأیید درخواست
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canReject || busy}
          className="text-destructive focus:text-destructive"
          onClick={() => onReject(store)}
        >
          <XCircle className="me-2 h-4 w-4" />
          رد کردن
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StoreCard({
  store,
  onApprove,
  onReject,
  busy,
  isRowBusy,
}: {
  store: AdminStoreItem;
  onApprove: (s: AdminStoreItem) => void;
  onReject: (s: AdminStoreItem) => void;
  busy: boolean;
  isRowBusy: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-colors duration-150",
        isRowBusy
          ? "border-primary/30 bg-primary/5"
          : "border-border hover:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <StoreIdentity store={store} />
        <StoreActions
          store={store}
          onApprove={onApprove}
          onReject={onReject}
          busy={busy}
          isRowBusy={isRowBusy}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={store.status} />
        <Badge variant="secondary" className="text-[10px]">
          {store.source === "store" ? "فروشگاه" : "درخواست نقش"}
        </Badge>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <StoreContact store={store} />
      </div>

      {store.statusReason && (
        <div className="mt-3 border-t border-border pt-3">
          <RejectionReason reason={store.statusReason} />
        </div>
      )}
    </article>
  );
}

function MobileSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-3" aria-busy="true">
      <span className="sr-only">در حال بارگذاری درخواست‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Skeleton className="mt-2 h-5 w-16 rounded-full" />
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-busy="true">
      <span className="sr-only">در حال بارگذاری درخواست‌ها…</span>
      <div className="grid grid-cols-[1.5fr_1.4fr_1fr_1.3fr_2rem] gap-4 px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid grid-cols-[1.5fr_1.4fr_1fr_1.3fr_2rem] items-center gap-4 px-4 py-4"
          style={{ opacity: 1 - row * 0.07 }}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <Store className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters
            ? "درخواستی با این فیلترها یافت نشد"
            : "هنوز درخواست فروشندگی وجود ندارد"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "وضعیت دیگری را انتخاب کنید یا فیلترها را پاک کنید."
            : "به‌محض ارسال اولین درخواست فروشندگی، اینجا نمایش داده می‌شود."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset}>
          <X className="me-1.5 h-3.5 w-3.5" />
          پاک کردن فیلترها
        </Button>
      )}
    </div>
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
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
        <AlertTriangle
          className="h-7 w-7 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          دریافت درخواست‌ها ناموفق بود
        </h3>
        <p className="mx-auto max-w-md wrap-break-word text-sm text-muted-foreground">
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
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  id,
}: {
  value: StoreRequestStatus | "ALL";
  onChange: (v: StoreRequestStatus | "ALL") => void;
  id?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as StoreRequestStatus | "ALL")}
    >
      <SelectTrigger id={id} className="h-10 w-full" aria-label="فیلتر وضعیت">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
        <SelectItem value="PENDING">در انتظار</SelectItem>
        <SelectItem value="APPROVED">تأیید شده</SelectItem>
        <SelectItem value="REJECTED">رد شده</SelectItem>
        <SelectItem value="SUSPENDED">معلق</SelectItem>
        <SelectItem value="DELETED">حذف‌شده</SelectItem>
      </SelectContent>
    </Select>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminStoresPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<StoreRequestStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const searchId = useId();
  const statusId = useId();
  const resultCountId = useId();

  const updateMutation = useUpdateStoreByAdmin();

  // Debounced search.
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

  const filters: AdminStoresFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      order: "desc",
      status,
      search: search || undefined,
    }),
    [page, pageSize, status, search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminStores(filters);

  const stores: AdminStoreItem[] = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilters = status !== "ALL" || !!search;

  const resetFilters = useCallback(() => {
    setStatus("ALL");
    setSearch("");
    setSearchInput("");
    setPage(1);
  }, []);

  const closePending = useCallback(() => {
    setPending(null);
    setRejectReason("");
  }, []);

  const handleUpdate = useCallback(
    (
      store: AdminStoreItem,
      nextStatus: StoreRequestStatus,
      statusReason?: string,
    ) => {
      if (!store.id?.trim()) {
        toast.error("شناسه فروشگاه نامعتبر است — تأیید/رد ممکن نیست");
        closePending();
        return;
      }

      setActiveRowId(store.id);

      updateMutation.mutate(
        {
          storeId: store.id,
          source: store.source,
          ownerId: store.ownerId ?? null,
          payload: { status: nextStatus, statusReason: statusReason ?? null },
        },
        {
          onSuccess: () => {
            // Keep the current filter — the list invalidates and refetches.
            closePending();
          },
          onSettled: () => setActiveRowId(null),
        },
      );
    },
    [updateMutation, closePending],
  );

  const confirmPending = useCallback(() => {
    if (!pending || updateMutation.isPending) return;

    if (pending.kind === "reject") {
      handleUpdate(pending.store, "REJECTED", rejectReason.trim() || undefined);
      return;
    }

    if (!pending.store.ownerId) {
      toast.warning(
        "شناسه مالک (ownerId) در این ردیف نیست؛ نقش کاربر به‌روزرسانی نخواهد شد.",
      );
    }
    handleUpdate(pending.store, "APPROVED");
  }, [pending, rejectReason, handleUpdate, updateMutation.isPending]);

  const isRejectDialog = pending?.kind === "reject";
  const pendingBusy = updateMutation.isPending;

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          درخواست‌های فروشنده
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          مشاهده، تأیید و رد درخواست‌های فروشگاهی
        </p>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی فروشنده
            </label>
            <Input
              id={searchId}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchInput) {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }
              }}
              placeholder="جستجوی نام، ایمیل، موبایل یا اسلاگ…"
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
              <Loader2 className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Desktop status + page size */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="w-44">
              <StatusSelect
                id={statusId}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-muted-foreground"
                onClick={resetFilters}
              >
                <X className="me-1.5 h-3.5 w-3.5" /> پاک کردن
              </Button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <div className="sm:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 w-full justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    فیلتر وضعیت
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    {status === "ALL" ? "همه" : statusLabel(status)}
                    {hasActiveFilters && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="sm:hidden">
                <SheetHeader>
                  <SheetTitle>فیلترها</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${statusId}-mobile`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      وضعیت
                    </label>
                    <StatusSelect
                      id={`${statusId}-mobile`}
                      value={status}
                      onChange={(v) => {
                        setStatus(v);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStatus("ALL");
                        setPage(1);
                      }}
                    >
                      بازنشانی
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      بستن
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Result count / live region */}
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
              : `${total.toLocaleString("fa-IR")} مورد یافت شد${
                  hasActiveFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ Table ------------------------------ */}
      <section
        aria-label="لیست درخواست‌های فروشنده"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="md:hidden">
              <MobileSkeleton />
            </div>
            <div className="hidden md:block">
              <DesktopSkeleton />
            </div>
          </>
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : stores.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  busy={pendingBusy}
                  isRowBusy={activeRowId === store.id}
                  onApprove={(s) => setPending({ kind: "approve", store: s })}
                  onReject={(s) => {
                    setRejectReason("");
                    setPending({ kind: "reject", store: s });
                  }}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/75">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">نام / فروشگاه</TableHead>
                    <TableHead className="text-start">تماس</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">دلیل رد</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => {
                    const isRowBusy = activeRowId === store.id;
                    return (
                      <TableRow
                        key={store.id}
                        className={cn(
                          "transition-colors duration-150",
                          isRowBusy ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <TableCell>
                          <StoreIdentity store={store} />
                        </TableCell>
                        <TableCell>
                          <StoreContact store={store} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={store.status} />
                            <span className="text-[10px] text-muted-foreground">
                              {store.source === "store"
                                ? "فروشگاه"
                                : "درخواست نقش"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[16rem]">
                          <RejectionReason reason={store.statusReason} />
                        </TableCell>
                        <TableCell>
                          <StoreActions
                            store={store}
                            busy={pendingBusy}
                            isRowBusy={isRowBusy}
                            onApprove={(s) =>
                              setPending({ kind: "approve", store: s })
                            }
                            onReject={(s) => {
                              setRejectReason("");
                              setPending({ kind: "reject", store: s });
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                    htmlFor="stores-page-size"
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
                      id="stores-page-size"
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
                  className="h-9 flex-1 sm:flex-none"
                  aria-label="صفحه قبلی"
                >
                  <ChevronRight className="me-1 h-4 w-4 sm:hidden" />
                  <ChevronRight className="me-1 hidden h-4 w-4 sm:inline" />
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
                  className="h-9 flex-1 sm:flex-none"
                  aria-label="صفحه بعدی"
                >
                  بعدی
                  <ChevronLeft className="ms-1 h-4 w-4 sm:hidden" />
                  <ChevronLeft className="ms-1 hidden h-4 w-4 sm:inline" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* --------------------------- Approve dialog --------------------------- */}
      <AlertDialog
        open={!!pending && !isRejectDialog}
        onOpenChange={(open) => !open && !pendingBusy && closePending()}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید درخواست فروشندگی</AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              درخواست «{pending?.store.name || "این فروشگاه"}» تأیید شود؟ پس از
              تأیید، نقش این کاربر به فروشنده تغییر می‌کند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={pendingBusy}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmPending();
              }}
              disabled={pendingBusy}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90 sm:w-auto"
            >
              {pendingBusy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" />
              )}
              تأیید
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --------------------------- Reject dialog --------------------------- */}
      <Dialog
        open={isRejectDialog}
        onOpenChange={(open) => !open && !pendingBusy && closePending()}
      >
        <DialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-start">
              رد درخواست فروشندگی
            </DialogTitle>
            <DialogDescription className="text-start">
              درخواست «{pending?.store.name || "این فروشگاه"}» رد شود؟ در صورت
              تمایل، دلیل رد را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="reject-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              دلیل رد (اختیاری)
            </label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثلاً: مدارک فروشگاه ناقص است..."
              rows={3}
              maxLength={500}
              className="resize-none"
              autoFocus
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
              onClick={closePending}
              disabled={pendingBusy}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={confirmPending}
              disabled={pendingBusy}
            >
              {pendingBusy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="me-2 h-4 w-4" />
              )}
              رد کردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
