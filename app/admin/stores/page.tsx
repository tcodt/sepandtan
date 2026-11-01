"use client";

import { useMemo, useState, useCallback } from "react";
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

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<StoreRequestStatus, string> = {
  PENDING: "در انتظار",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};

const STATUS_STYLES: Record<StoreRequestStatus, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  APPROVED:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  REJECTED:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
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
  return (
    <Badge variant="outline" className={cn("text-xs", statusStyle(status))}>
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
        <span className="truncate text-xs" dir="ltr">
          {store.phone || "—"}
        </span>
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
        "flex items-start gap-1.5 rounded-md border border-rose-500/15 bg-rose-500/5 px-2 py-1 text-xs text-rose-600 dark:text-rose-400",
        className,
      )}
    >
      <MessageSquareQuote
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      />
      <span className="line-clamp-2 break-words" title={reason}>
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
}: {
  store: AdminStoreItem;
  onApprove: (s: AdminStoreItem) => void;
  onReject: (s: AdminStoreItem) => void;
  busy: boolean;
}) {
  const canApprove = store.status !== "APPROVED";
  const canReject = store.status !== "REJECTED";

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
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          اقدامات
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!canApprove}
          onClick={() => onApprove(store)}
        >
          <CheckCircle2 className="me-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          تأیید درخواست
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canReject}
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
}: {
  store: AdminStoreItem;
  onApprove: (s: AdminStoreItem) => void;
  onReject: (s: AdminStoreItem) => void;
  busy: boolean;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors duration-150 hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <StoreIdentity store={store} />
        <StoreActions
          store={store}
          onApprove={onApprove}
          onReject={onReject}
          busy={busy}
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

function MobileSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
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

function DesktopSkeleton() {
  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-[1.5fr_1.4fr_1fr_1.3fr_2rem] gap-4 px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div
          key={row}
          className="grid grid-cols-[1.5fr_1.4fr_1fr_1.3fr_2rem] items-center gap-4 px-4 py-4"
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
            ? "درخواستی با این وضعیت یافت نشد"
            : "هنوز درخواست فروشندگی وجود ندارد"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "وضعیت دیگری را انتخاب کنید یا فیلتر را پاک کنید."
            : "به‌محض ارسال اولین درخواست فروشندگی، اینجا نمایش داده می‌شود."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset}>
          پاک کردن فیلتر
        </Button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
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
          خطا در دریافت لیست فروشندگان
        </h3>
        <p className="mx-auto max-w-md break-words text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        تلاش دوباره
      </Button>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: StoreRequestStatus | "ALL";
  onChange: (v: StoreRequestStatus | "ALL") => void;
}) {
  return (
    <div className="w-full space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">وضعیت</label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as StoreRequestStatus | "ALL")}
      >
        <SelectTrigger className="h-10 w-full" aria-label="فیلتر وضعیت">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">همه</SelectItem>
          <SelectItem value="PENDING">در انتظار</SelectItem>
          <SelectItem value="APPROVED">تأیید شده</SelectItem>
          <SelectItem value="REJECTED">رد شده</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminStoresPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StoreRequestStatus | "ALL">("ALL");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filters: AdminStoresFilters = useMemo(
    () => ({ page, limit: PAGE_SIZE, order: "desc", status }),
    [page, status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminStores(filters);
  const updateMutation = useUpdateStoreByAdmin();

  const stores: AdminStoreItem[] = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = status !== "ALL";

  const resetFilters = useCallback(() => {
    setStatus("ALL");
    setPage(1);
  }, []);

  const closePending = useCallback(() => {
    setPending(null);
    setRejectReason("");
  }, []);

  const handleUpdate = useCallback(
    (
      store: AdminStoreItem,
      newStatus: StoreRequestStatus,
      statusReason?: string,
    ) => {
      updateMutation.mutate(
        {
          storeId: store.id,
          payload: {
            status: newStatus,
            statusReason: statusReason ?? null,
          },
          source: store.source,
        },
        { onSettled: () => closePending() },
      );
    },
    [updateMutation, closePending],
  );

  const confirmPending = useCallback(() => {
    if (!pending) return;

    if (pending.kind === "reject") {
      handleUpdate(pending.store, "REJECTED", rejectReason.trim() || undefined);
    } else {
      handleUpdate(pending.store, "APPROVED");
    }
  }, [pending, rejectReason, handleUpdate]);

  const isRejectDialog = pending?.kind === "reject";
  const pendingBusy = updateMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          درخواست‌های فروشنده
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          تأیید یا رد درخواست‌های فروشگاهی
        </p>
      </header>

      <section aria-label="فیلتر درخواست‌ها">
        <div className="hidden items-end gap-3 lg:flex">
          <div className="w-full max-w-xs">
            <StatusSelect
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
              <X className="me-1.5 h-3.5 w-3.5" />
              پاک کردن
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  فیلتر وضعیت
                </span>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {statusLabel(status)}
                  {hasActiveFilters && (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="lg:hidden">
              <SheetHeader>
                <SheetTitle>فیلترها</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-4">
                <StatusSelect
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                />
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
                    اعمال
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <section
        aria-label="لیست درخواست‌های فروشنده"
        aria-busy={isLoading || isFetching}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
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
            message={error instanceof Error ? error.message : "خطای ناشناخته"}
            onRetry={() => refetch()}
          />
        ) : stores.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {stores.map((store) => (
                <StoreCard
                  key={`${store.source}-${store.id}`}
                  store={store}
                  busy={pendingBusy}
                  onApprove={(s) => setPending({ kind: "approve", store: s })}
                  onReject={(s) => {
                    setRejectReason("");
                    setPending({ kind: "reject", store: s });
                  }}
                />
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">نام / فروشگاه</TableHead>
                    <TableHead className="text-start">تماس</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">دلیل رد</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow
                      key={`${store.source}-${store.id}`}
                      className="transition-colors duration-150 hover:bg-muted/40"
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
              صفحه {page} از {totalPages}
              <span className="mx-1">·</span>
              {total.toLocaleString("fa-IR")} مورد
              {isFetching && (
                <span className="ms-1 inline-flex items-center gap-1">
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                  در حال به‌روزرسانی...
                </span>
              )}
            </p>
            <div className="order-1 flex gap-2 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 flex-1 sm:flex-none"
              >
                <ChevronRight
                  className="me-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronLeft
                  className="me-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 flex-1 sm:flex-none"
              >
                بعدی
                <ChevronLeft
                  className="ms-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronRight
                  className="ms-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Approve */}
      <AlertDialog
        open={!!pending && !isRejectDialog}
        onOpenChange={(open) => !open && !pendingBusy && closePending()}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید درخواست فروشندگی</AlertDialogTitle>
            <AlertDialogDescription>
              درخواست «{pending?.store.name || "این فروشگاه"}» تأیید شود؟ پس از
              تأیید، این کاربر به‌عنوان فروشنده فعال خواهد شد.
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
              onClick={confirmPending}
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

      {/* Reject */}
      <Dialog
        open={isRejectDialog}
        onOpenChange={(open) => !open && !pendingBusy && closePending()}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رد درخواست فروشندگی</DialogTitle>
            <DialogDescription>
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
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>حداکثر ۵۰۰ کاراکتر</span>
              <span>{rejectReason.length}/۵۰۰</span>
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
