/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  Wallet,
  RefreshCw,
  Check,
  X,
  Search,
  AlertTriangle,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Receipt,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Hash,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import {
  useAdminWallets,
  useAdminTransactions,
  useCompleteTransaction,
  useFailTransaction,
  useApproveWithdraw,
  useRejectWithdraw,
} from "@/features/admin/wallet/hooks/use-admin-wallet";
import type {
  AdminWalletItem,
  AdminWalletTransaction,
} from "@/features/admin/wallet/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type Tab = "transactions" | "wallets";

const TX_STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  COMPLETED: "تکمیل‌شده",
  FAILED: "ناموفق",
  CANCELLED: "لغو‌شده",
};

const TX_STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  COMPLETED:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  FAILED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  CANCELLED:
    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
};

const TX_STATUS_DOT: Record<string, string> = {
  PENDING: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
  FAILED: "bg-rose-500",
  CANCELLED: "bg-zinc-400",
};

const TX_TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "واریز",
  WITHDRAW: "برداشت",
  PAYMENT: "پرداخت",
  REFUND: "بازگشت وجه",
  COMMISSION: "کمیسیون",
};

const TX_TYPE_STYLES: Record<string, string> = {
  DEPOSIT:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  WITHDRAW:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  PAYMENT: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  REFUND:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  COMMISSION:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
};

const TX_TYPE_ICON: Record<string, typeof ArrowUpRight> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAW: ArrowUpRight,
  PAYMENT: CreditCard,
  REFUND: Coins,
  COMMISSION: Receipt,
};

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "ALL", label: "همه" },
  { id: "PENDING", label: "در انتظار" },
  { id: "COMPLETED", label: "تکمیل‌شده" },
  { id: "FAILED", label: "ناموفق" },
  { id: "CANCELLED", label: "لغو‌شده" },
];

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: "ALL", label: "همه انواع" },
  { id: "DEPOSIT", label: "واریز" },
  { id: "WITHDRAW", label: "برداشت" },
  { id: "PAYMENT", label: "پرداخت" },
  { id: "REFUND", label: "بازگشت وجه" },
  { id: "COMMISSION", label: "کمیسیون" },
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

/**
 * Formats a money string safely. Uses BigInt-aware rendering for huge values
 * (JSON may return a string to avoid float precision loss).
 */
function formatMoney(v: string): string {
  const s = v.trim();
  if (!s) return "۰";
  if (/^-?\d+$/.test(s)) {
    try {
      // Simple thousands grouping on the raw digits — avoids Number overflow
      const negative = s.startsWith("-");
      const digits = negative ? s.slice(1) : s;
      const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const localized = grouped.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
      return negative ? `-${localized}` : localized;
    } catch {
      return s;
    }
  }
  return s;
}

function normalizeStatus(s: string | undefined | null): string {
  return (s ?? "PENDING").toUpperCase();
}

function normalizeType(t: string | undefined | null): string {
  return (t ?? "PAYMENT").toUpperCase();
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

function TxStatusBadge({ status }: { status: string }) {
  const key = normalizeStatus(status);
  const label = TX_STATUS_LABEL[key] ?? key;
  const style = TX_STATUS_STYLES[key] ?? TX_STATUS_STYLES.CANCELLED;
  const dot = TX_STATUS_DOT[key] ?? "bg-zinc-400";
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

function TxTypeBadge({ type }: { type: string }) {
  const key = normalizeType(type);
  const label = TX_TYPE_LABEL[key] ?? key;
  const style = TX_TYPE_STYLES[key] ?? TX_TYPE_STYLES.PAYMENT;
  const Icon = TX_TYPE_ICON[key] ?? CreditCard;
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

function PlatformBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-violet-500/25 bg-violet-500/10 text-[10px] font-medium text-violet-700 dark:text-violet-400"
    >
      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
      پلتفرم
    </Badge>
  );
}

function WalletCard({ wallet }: { wallet: AdminWalletItem }) {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {wallet.userName || wallet.userId}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {wallet.userPhone || "—"}
            </p>
          </div>
          {wallet.isPlatform && <PlatformBadge />}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">موجودی</p>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {formatMoney(wallet.balance)}
              <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                ریال
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">قابل برداشت</p>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(wallet.withdrawBalance)}
              <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                ریال
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">معلق</p>
            <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {formatMoney(wallet.pendingBalance)}
              <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                ریال
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">مسدود</p>
            <p className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatMoney(wallet.frozenBalance)}
              <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                ریال
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  tab,
  hasFilters,
  onClear,
}: {
  tab: Tab;
  hasFilters: boolean;
  onClear: () => void;
}) {
  const noun = tab === "wallets" ? "کیف‌پول" : "تراکنش";
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasFilters
              ? `${noun}ی با این فیلترها یافت نشد`
              : `هنوز ${noun}ی ثبت نشده است`}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "عبارت جستجو یا فیلترها را تغییر دهید."
              : "به‌محض ثبت اولین مورد، اینجا نمایش داده می‌شود."}
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
            دریافت اطلاعات ناموفق بود
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
/* Confirm dialog state                                                       */
/* -------------------------------------------------------------------------- */

type ConfirmIntent = "success" | "danger" | "warning";

type ConfirmState = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  intent: ConfirmIntent;
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
  success: CheckCircle2,
  danger: XCircle,
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
  const Icon = INTENT_ICON[intent];

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

export default function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const walletFilters = useMemo(
    () => ({ page, limit: pageSize, search: search || undefined }),
    [page, pageSize, search],
  );
  const txFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      type: typeFilter === "ALL" ? undefined : typeFilter,
      trackingCode: search || undefined,
    }),
    [page, pageSize, statusFilter, typeFilter, search],
  );

  const walletsQ = useAdminWallets(walletFilters);
  const txsQ = useAdminTransactions(txFilters);

  const completeMut = useCompleteTransaction();
  const failMut = useFailTransaction();
  const approveMut = useApproveWithdraw();
  const rejectMut = useRejectWithdraw();

  const activeQ = tab === "wallets" ? walletsQ : txsQ;
  const isLoading = activeQ.isLoading;
  const isFetching = activeQ.isFetching;
  const error = activeQ.error;
  const total = activeQ.data?.pagination.total ?? 0;
  const totalPages = activeQ.data?.pagination.totalPages ?? 1;

  const anyMutationPending =
    completeMut.isPending ||
    failMut.isPending ||
    approveMut.isPending ||
    rejectMut.isPending;

  const hasFilters =
    !!search ||
    (tab === "transactions" &&
      (statusFilter !== "ALL" || typeFilter !== "ALL"));

  /* --------------------------- Debounced search --------------------------- */

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* ------------------------------ Handlers ------------------------------ */

  const refetch = useCallback(() => {
    if (tab === "wallets") void walletsQ.refetch();
    else void txsQ.refetch();
  }, [tab, walletsQ, txsQ]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPage(1);
  }, []);

  // Clamp page when total shrinks after action.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Reset search when switching tabs (search semantics differ per tab).
  useEffect(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, [tab]);

  /* ------------------------- Money-move handlers ------------------------- */

  const onApproveWithdraw = useCallback(
    (tx: AdminWalletTransaction) => {
      setConfirm({
        title: "تأیید برداشت",
        description: (
          <span className="block space-y-2">
            <span className="block">
              مبلغ{" "}
              <strong className="text-foreground">
                {formatMoney(tx.amount)} ریال
              </strong>{" "}
              برای{" "}
              <strong className="text-foreground">
                {tx.userName || tx.userId || "این کاربر"}
              </strong>{" "}
              تأیید شود؟
            </span>
            <span className="block rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-100">
              این عملیات قابل بازگشت نیست. مطمئن شوید مبلغ به حساب کاربر منتقل
              شده است.
            </span>
          </span>
        ),
        confirmLabel: "تأیید برداشت",
        intent: "success",
        onConfirm: async () => {
          try {
            await approveMut.mutateAsync(tx.id);
            setConfirm(null);
          } catch {
            /* Hook toasts */
          }
        },
      });
    },
    [approveMut],
  );

  const onRejectWithdraw = useCallback(
    (tx: AdminWalletTransaction) => {
      setConfirm({
        title: "رد برداشت",
        description: (
          <span className="block space-y-2">
            <span className="block">
              درخواست برداشت{" "}
              <strong className="text-foreground">
                {formatMoney(tx.amount)} ریال
              </strong>{" "}
              برای{" "}
              <strong className="text-foreground">
                {tx.userName || tx.userId || "این کاربر"}
              </strong>{" "}
              رد شود؟
            </span>
            <span className="block rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              مبلغ به موجودی کاربر باز می‌گردد.
            </span>
          </span>
        ),
        confirmLabel: "رد برداشت",
        intent: "danger",
        onConfirm: async () => {
          try {
            await rejectMut.mutateAsync(tx.id);
            setConfirm(null);
          } catch {
            /* Hook toasts */
          }
        },
      });
    },
    [rejectMut],
  );

  const onCompleteTx = useCallback(
    (tx: AdminWalletTransaction) => {
      setConfirm({
        title: "تکمیل تراکنش",
        description: (
          <span className="block space-y-2">
            <span className="block">
              تراکنش{" "}
              <strong className="text-foreground">
                {formatMoney(tx.amount)} ریال
              </strong>{" "}
              برای{" "}
              <strong className="text-foreground">
                {tx.userName || tx.userId || "این کاربر"}
              </strong>{" "}
              تکمیل شود؟
            </span>
            <span className="block text-xs text-muted-foreground">
              وضعیت به «تکمیل‌شده» تغییر می‌کند. مطمئن شوید پرداخت واقعاً انجام
              شده است.
            </span>
          </span>
        ),
        confirmLabel: "تکمیل",
        intent: "success",
        onConfirm: async () => {
          try {
            await completeMut.mutateAsync(tx.id);
            setConfirm(null);
          } catch {
            /* Hook toasts */
          }
        },
      });
    },
    [completeMut],
  );

  const onFailTx = useCallback(
    (tx: AdminWalletTransaction) => {
      setConfirm({
        title: "ناموفق کردن تراکنش",
        description: (
          <span className="block space-y-2">
            <span className="block">
              تراکنش{" "}
              <strong className="text-foreground">
                {formatMoney(tx.amount)} ریال
              </strong>{" "}
              برای{" "}
              <strong className="text-foreground">
                {tx.userName || tx.userId || "این کاربر"}
              </strong>{" "}
              ناموفق علامت‌گذاری شود؟
            </span>
            <span className="block rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              اگر پرداخت درگاه ناموفق بوده، این کار موجودی کاربر را
              بازمی‌گرداند.
            </span>
          </span>
        ),
        confirmLabel: "ناموفق",
        intent: "danger",
        onConfirm: async () => {
          try {
            await failMut.mutateAsync(tx.id);
            setConfirm(null);
          } catch {
            /* Hook toasts */
          }
        },
      });
    },
    [failMut],
  );

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
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              کیف پول
            </h1>
            <p className="text-xs text-muted-foreground">
              موجودی‌ها، تراکنش‌ها و درخواست‌های برداشت
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 self-start sm:self-auto"
          onClick={refetch}
          disabled={isFetching}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            aria-hidden="true"
          />
          بروزرسانی
        </Button>
      </header>

      {/* ------------------------------ Tabs ------------------------------ */}
      <div
        role="tablist"
        aria-label="بخش کیف پول"
        className="inline-flex rounded-xl border border-border bg-muted/40 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "transactions"}
          onClick={() => setTab("transactions")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tab === "transactions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          تراکنش‌ها
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "wallets"}
          onClick={() => setTab("wallets")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tab === "wallets"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          کیف‌پول‌ها
        </button>
      </div>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              {tab === "wallets" ? "جستجوی کیف‌پول" : "جستجو با کد پیگیری"}
            </label>
            <Input
              id={searchId}
              placeholder={
                tab === "wallets"
                  ? "جستجوی نام، موبایل یا شناسه کاربر…"
                  : "جستجو با کد پیگیری…"
              }
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

          {tab === "transactions" && (
            <>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-10 w-full sm:w-40"
                  aria-label="فیلتر نوع تراکنش"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {TYPE_FILTERS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-10 w-full sm:w-40"
                  aria-label="فیلتر وضعیت تراکنش"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

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

        <p
          id={resultCountId}
          className="text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "در حال بارگذاری…"
            : error
              ? "—"
              : `${total.toLocaleString("fa-IR")} ${
                  tab === "wallets" ? "کیف‌پول" : "تراکنش"
                }${hasFilters ? " (با فیلتر فعال)" : ""}`}
        </p>
      </section>

      {/* ------------------------------ Content ------------------------------ */}
      <div
        role="tabpanel"
        aria-live="polite"
        aria-busy={isLoading || isFetching}
      >
        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState
            message={displayError}
            onRetry={refetch}
            isRetrying={isFetching}
          />
        ) : tab === "wallets" ? (
          (walletsQ.data?.data ?? []).length === 0 ? (
            <EmptyState
              tab="wallets"
              hasFilters={hasFilters}
              onClear={clearFilters}
            />
          ) : (
            <div className="space-y-2">
              {(walletsQ.data?.data ?? []).map((w) => (
                <WalletCard key={w.id} wallet={w} />
              ))}
            </div>
          )
        ) : (txsQ.data?.data ?? []).length === 0 ? (
          <EmptyState
            tab="transactions"
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <div className="space-y-2">
            {(txsQ.data?.data ?? []).map((tx) => {
              const pending = normalizeStatus(tx.status) === "PENDING";
              return (
                <Card key={tx.id} className="border-border/60">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          <span className="tabular-nums">
                            {formatMoney(tx.amount)}
                          </span>
                          <span className="ms-1 text-[11px] font-normal text-muted-foreground">
                            ریال
                          </span>
                        </p>
                        <TxTypeBadge type={tx.type} />
                        <TxStatusBadge status={tx.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="text-foreground">
                          {tx.userName || tx.userId || "—"}
                        </span>
                        {tx.trackingCode && (
                          <span
                            className="inline-flex items-center gap-1"
                            dir="ltr"
                          >
                            <Hash className="h-3 w-3" aria-hidden="true" />
                            <span className="font-mono tabular-nums">
                              {tx.trackingCode}
                            </span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>

                      {tx.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {tx.description}
                        </p>
                      )}
                    </div>

                    {pending && (
                      <div className="flex shrink-0 gap-2">
                        {tx.isWithdraw ? (
                          <>
                            <Button
                              size="sm"
                              className="h-9 gap-1"
                              disabled={anyMutationPending}
                              onClick={() => onApproveWithdraw(tx)}
                              aria-label={`تأیید برداشت ${formatMoney(tx.amount)} ریال`}
                            >
                              <Check
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              تأیید برداشت
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-1 text-destructive hover:text-destructive"
                              disabled={anyMutationPending}
                              onClick={() => onRejectWithdraw(tx)}
                              aria-label={`رد برداشت ${formatMoney(tx.amount)} ریال`}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              رد
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="h-9 gap-1"
                              disabled={anyMutationPending}
                              onClick={() => onCompleteTx(tx)}
                              aria-label={`تکمیل تراکنش ${formatMoney(tx.amount)} ریال`}
                            >
                              <Check
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              تکمیل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-1 text-destructive hover:text-destructive"
                              disabled={anyMutationPending}
                              onClick={() => onFailTx(tx)}
                              aria-label={`ناموفق کردن تراکنش ${formatMoney(tx.amount)} ریال`}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              ناموفق
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------- Pagination ----------------------------- */}
      {!isLoading && !error && totalPages > 1 && (
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
                htmlFor="wallet-page-size"
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
                  id="wallet-page-size"
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

      {/* --------------------------- Confirm dialog --------------------------- */}
      <ConfirmDialog
        state={confirm}
        onClose={() => setConfirm(null)}
        isBusy={anyMutationPending}
      />
    </div>
  );
}
