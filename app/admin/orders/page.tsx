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
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Package,
  Inbox,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Cog,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  CreditCard,
  Wallet,
  Banknote,
  Globe2,
  Filter,
  Receipt,
  Store as StoreIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useAdminCheckouts,
  useAdminStoreOrders,
  useUpdateAdminStoreOrder,
} from "@/features/admin/orders/hooks/use-admin-orders";
import type {
  AdminCheckoutItem,
  AdminStoreOrderItem,
  OrderPaymentStatus,
  PaymentMethod,
  StoreOrderStatus,
} from "@/features/admin/orders/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

/* -------------------------------------------------------------------------- */
/* Status taxonomy                                                            */
/* -------------------------------------------------------------------------- */

type OrderStatusTone =
  | "amber"
  | "sky"
  | "violet"
  | "blue"
  | "emerald"
  | "rose"
  | "zinc";

const ORDER_STATUS_META: Record<
  StoreOrderStatus,
  {
    label: string;
    tone: OrderStatusTone;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
    isTerminal: boolean;
  }
> = {
  PENDING: {
    label: "در انتظار",
    tone: "amber",
    Icon: Clock,
    description: "سفارش ثبت شده و منتظر تأیید است.",
    isTerminal: false,
  },
  CONFIRMED: {
    label: "تأیید شده",
    tone: "sky",
    Icon: CheckCircle2,
    description: "سفارش تأیید شده و آماده ورود به آماده‌سازی.",
    isTerminal: false,
  },
  PROCESSING: {
    label: "آماده‌سازی",
    tone: "violet",
    Icon: Cog,
    description: "اقلام در حال بسته‌بندی و آماده‌سازی هستند.",
    isTerminal: false,
  },
  SHIPPED: {
    label: "ارسال‌شده",
    tone: "blue",
    Icon: Truck,
    description: "سفارش تحویل پست/پیک شده است.",
    isTerminal: false,
  },
  DELIVERED: {
    label: "تحویل‌شده",
    tone: "emerald",
    Icon: PackageCheck,
    description: "سفارش به دست مشتری رسیده است.",
    isTerminal: true,
  },
  CANCELLED: {
    label: "لغو شده",
    tone: "rose",
    Icon: XCircle,
    description: "سفارش لغو شده و مبلغ باید بازگردانده شود.",
    isTerminal: true,
  },
  RETURNED: {
    label: "مرجوعی",
    tone: "zinc",
    Icon: RotateCcw,
    description: "سفارش مرجوع شده و مبلغ باید بازگردانده شود.",
    isTerminal: true,
  },
};

const PAYMENT_STATUS_META: Record<
  OrderPaymentStatus,
  { label: string; tone: OrderStatusTone }
> = {
  PENDING: { label: "در انتظار پرداخت", tone: "amber" },
  PAID: { label: "پرداخت‌شده", tone: "emerald" },
  REFUNDED: { label: "بازگشت وجه", tone: "sky" },
  FAILED: { label: "ناموفق", tone: "rose" },
};

const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  CARD: { label: "کارت بانکی", Icon: CreditCard },
  WALLET: { label: "کیف پول", Icon: Wallet },
  COD: { label: "پرداخت در محل", Icon: Banknote },
  ZARINPAL: { label: "زرین‌پال", Icon: Globe2 },
};

const TONE_RING: Record<OrderStatusTone, string> = {
  amber: "ring-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  sky: "ring-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet:
    "ring-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  blue: "ring-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  emerald:
    "ring-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "ring-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  zinc: "ring-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

const TONE_DOT: Record<OrderStatusTone, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  zinc: "bg-zinc-500",
};

const TONE_BORDER: Record<OrderStatusTone, string> = {
  amber: "border-s-amber-500/60",
  sky: "border-s-sky-500/60",
  violet: "border-s-violet-500/60",
  blue: "border-s-blue-500/60",
  emerald: "border-s-emerald-500/60",
  rose: "border-s-rose-500/60",
  zinc: "border-s-zinc-500/60",
};

const ORDER_STATUS_OPTIONS: {
  value: StoreOrderStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار" },
  { value: "CONFIRMED", label: "تأیید شده" },
  { value: "PROCESSING", label: "آماده‌سازی" },
  { value: "SHIPPED", label: "ارسال‌شده" },
  { value: "DELIVERED", label: "تحویل‌شده" },
  { value: "CANCELLED", label: "لغو شده" },
  { value: "RETURNED", label: "مرجوعی" },
];

const PAYMENT_STATUS_OPTIONS: {
  value: OrderPaymentStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "همه پرداخت‌ها" },
  { value: "PENDING", label: "در انتظار پرداخت" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "REFUNDED", label: "بازگشت وجه" },
  { value: "FAILED", label: "ناموفق" },
];

const ALL_ORDER_STATUSES: StoreOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const dateFmt = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatMoney(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("fa-IR");
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const AVATAR_TONES = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

function avatarTone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

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
    const t = setTimeout(() => commit(trimmed), delay);
    return () => clearTimeout(t);
  }, [input, current, commit, delay]);
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function RowSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: StoreOrderStatus }) {
  const m = ORDER_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2 py-0 text-[10px] font-medium ring-1 ring-inset",
        TONE_RING[m.tone],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[m.tone])}
        aria-hidden="true"
      />
      {m.label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: OrderPaymentStatus | null }) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full px-2 py-0 text-[10px] font-medium text-muted-foreground"
      >
        بدون پرداخت
      </Badge>
    );
  }
  const m = PAYMENT_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2 py-0 text-[10px] font-medium ring-1 ring-inset",
        TONE_RING[m.tone],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[m.tone])}
        aria-hidden="true"
      />
      {m.label}
    </Badge>
  );
}

function ActiveFilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`پاک کردن ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Store order row                                                            */
/* -------------------------------------------------------------------------- */

function StoreOrderRow({
  item,
  onEdit,
}: {
  item: AdminStoreOrderItem;
  onEdit: () => void;
}) {
  const m = ORDER_STATUS_META[item.status];
  const displayNumber = item.orderNumber || shortId(item.id);
  const storeSeed = item.storeId ?? item.storeName ?? "store";

  return (
    <Card
      className={cn(
        "group border-border/60 border-s-2 transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-border hover:shadow-sm",
        "motion-reduce:transition-none",
        TONE_BORDER[m.tone],
      )}
    >
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset ring-white/10",
            avatarTone(storeSeed),
          )}
          aria-hidden="true"
        >
          <StoreIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Line 1: order number + statuses */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              dir="ltr"
              className="truncate font-mono text-sm font-semibold tracking-tight text-foreground"
            >
              #{displayNumber}
            </span>
            <StatusBadge status={item.status} />
            {item.paymentStatus && <PaymentBadge status={item.paymentStatus} />}
          </div>

          {/* Line 2: store + user */}
          <p className="flex flex-wrap items-center gap-x-1.5 truncate text-xs text-muted-foreground">
            <StoreIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.storeName || "—"}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate">{item.userName || "—"}</span>
          </p>

          {/* Line 3: money + date + tracking */}
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatMoney(item.totalPrice)} تومان
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formatDate(item.createdAt)}</span>
            {item.trackingCode && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span dir="ltr" className="font-mono text-[10px]">
                  {item.trackingCode}
                </span>
              </>
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2 sm:px-3"
          onClick={onEdit}
          aria-label={`تغییر وضعیت سفارش ${displayNumber}`}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">تغییر وضعیت</span>
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkout row                                                               */
/* -------------------------------------------------------------------------- */

function CheckoutRow({ item }: { item: AdminCheckoutItem }) {
  const displayNumber = item.checkoutNumber || shortId(item.id);
  const method = item.paymentMethod
    ? PAYMENT_METHOD_META[item.paymentMethod]
    : null;
  const MethodIcon = method?.Icon;

  return (
    <Card className="border-border/60 transition-all duration-150 ease-out hover:-translate-y-px hover:border-border hover:shadow-sm motion-reduce:transition-none">
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-inset ring-white/10">
          <Receipt className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Line 1 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              dir="ltr"
              className="truncate font-mono text-sm font-semibold tracking-tight text-foreground"
            >
              #{displayNumber}
            </span>
            <PaymentBadge status={item.paymentStatus} />
            {method && MethodIcon && (
              <Badge
                variant="outline"
                className="gap-1 rounded-full px-2 py-0 text-[10px] font-medium text-muted-foreground"
              >
                <MethodIcon className="h-2.5 w-2.5" aria-hidden="true" />
                {method.label}
              </Badge>
            )}
          </div>

          {/* Line 2: user + payment ref */}
          <p className="flex flex-wrap items-center gap-x-1.5 truncate text-xs text-muted-foreground">
            <span className="truncate">{item.userName || "—"}</span>
            {item.paymentRef && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="truncate">مرجع: </span>
                <span dir="ltr" className="truncate font-mono text-[10px]">
                  {item.paymentRef}
                </span>
              </>
            )}
          </p>

          {/* Line 3: total + date */}
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatMoney(item.totalPrice)} تومان
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formatDate(item.createdAt)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / error                                                              */
/* -------------------------------------------------------------------------- */

function EmptyState({
  variant,
  onReset,
}: {
  variant:
    | "orders-no-data"
    | "orders-filtered"
    | "checkouts-no-data"
    | "checkouts-filtered";
  onReset: () => void;
}) {
  const isFiltered =
    variant === "orders-filtered" || variant === "checkouts-filtered";
  const isCheckouts = variant.startsWith("checkouts");
  const label = isCheckouts ? "تسویه‌حساب" : "سفارش";

  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          {isFiltered ? (
            <Filter
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <Inbox
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isFiltered
              ? `${label}ی با این فیلتر یافت نشد`
              : `هنوز ${label}ی ثبت نشده است`}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {isFiltered
              ? "می‌توانید فیلترها یا عبارت جستجو را تغییر دهید."
              : isCheckouts
                ? "پس از تسویه کاربران، اینجا نمایش داده می‌شود."
                : "پس از ثبت سفارش، اینجا نمایش داده می‌شود."}
          </p>
        </div>
        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onReset}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({
  label,
  message,
  onRetry,
  isRetrying,
  hasFilter,
  onClearFilters,
}: {
  label: string;
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
  hasFilter: boolean;
  onClearFilters: () => void;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle
            className="h-5 w-5 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            دریافت {label} ناموفق بود
          </p>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            {message}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            )}
            تلاش دوباره
          </Button>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Status change dialog                                                       */
/* -------------------------------------------------------------------------- */

function EditOrderStatusDialog({
  target,
  value,
  onChange,
  onSave,
  onClose,
  isSaving,
}: {
  target: AdminStoreOrderItem | null;
  value: StoreOrderStatus;
  onChange: (s: StoreOrderStatus) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const originalStatus = target?.status ?? "PENDING";
  const unchanged = target != null && value === originalStatus;

  const originalMeta = ORDER_STATUS_META[originalStatus];
  const targetMeta = ORDER_STATUS_META[value];

  /** Going from a non-terminal → terminal, and the terminal is destructive. */
  const isDestructive =
    !originalMeta.isTerminal && (value === "CANCELLED" || value === "RETURNED");

  /** Going from a terminal back to a pipeline state — unusual but sometimes intentional. */
  const isReopening = originalMeta.isTerminal && !targetMeta.isTerminal;

  const buttonLabel = isDestructive
    ? value === "CANCELLED"
      ? "تأیید و لغو سفارش"
      : "تأیید و ثبت مرجوعی"
    : "ذخیره تغییر";

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !isSaving && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            تغییر وضعیت سفارش
          </DialogTitle>
          <DialogDescription>
            وضعیت جدید را انتخاب کنید؛ بلافاصله اعمال می‌شود.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            {/* Context block */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-semibold text-foreground"
                >
                  #{target.orderNumber || shortId(target.id)}
                </span>
                <StatusBadge status={target.status} />
              </div>
              <div className="flex items-center gap-2">
                <StoreIcon
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate">{target.storeName || "—"}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="truncate">{target.userName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatMoney(target.totalPrice)} تومان
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>{formatDate(target.createdAt)}</span>
              </div>
            </div>

            {/* Status picker as vertical pipeline list */}
            <div className="space-y-2">
              <Label>وضعیت جدید</Label>
              <div
                role="radiogroup"
                aria-label="انتخاب وضعیت جدید"
                className="grid max-h-72 gap-1.5 overflow-y-auto pe-1"
              >
                {ALL_ORDER_STATUSES.map((s) => {
                  const m = ORDER_STATUS_META[s];
                  const active = value === s;
                  const isCurrent = originalStatus === s;
                  const Icon = m.Icon;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange(s)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-start transition-all duration-150 ease-out motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:bg-muted/40",
                        active
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/60 bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                          TONE_RING[m.tone],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">
                            {m.label}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full bg-muted px-1.5 py-0 text-[9px] font-medium text-muted-foreground">
                              فعلی
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {m.description}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                          active
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destructive callout */}
            {isDestructive && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[11px] text-destructive">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  این تغییر سفارش را به وضعیت نهایی {targetMeta.label} منتقل
                  می‌کند. اگر پرداخت انجام شده، بازگشت وجه باید جداگانه انجام
                  شود.
                </span>
              </div>
            )}

            {/* Reopening callout */}
            {isReopening && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  سفارش از وضعیت نهایی «{originalMeta.label}» به وضعیت فعال
                  بازمی‌گردد. مطمئن شوید این کار عمدی است.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            انصراف
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
            disabled={isSaving || unchanged}
            className={cn(
              isDestructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {isSaving ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<"orders" | "checkouts">("orders");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StoreOrderStatus | "ALL">("ALL");
  const [paymentStatus, setPaymentStatus] = useState<
    OrderPaymentStatus | "ALL"
  >("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [editTarget, setEditTarget] = useState<AdminStoreOrderItem | null>(
    null,
  );
  const [editStatus, setEditStatus] = useState<StoreOrderStatus>("PENDING");

  const searchId = useId();
  const resultCountId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * IMPORTANT: send `search` to exactly ONE field, based on tab.
   * The previous implementation sent it to orderNumber AND trackingCode AND
   * checkoutNumber, which silently AND-filters to near-zero results.
   */
  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc" as const,
      status,
      paymentStatus,
      ...(search
        ? tab === "orders"
          ? { orderNumber: search }
          : { checkoutNumber: search }
        : {}),
    }),
    [page, status, paymentStatus, search, tab],
  );

  const storeOrdersQuery = useAdminStoreOrders(filters);
  const checkoutsQuery = useAdminCheckouts(filters);
  const updateMutation = useUpdateAdminStoreOrder();

  const activeQuery = tab === "orders" ? storeOrdersQuery : checkoutsQuery;

  const storeOrders = storeOrdersQuery.data?.data ?? [];
  const checkouts = checkoutsQuery.data?.data ?? [];
  const total =
    tab === "orders"
      ? (storeOrdersQuery.data?.pagination.total ?? 0)
      : (checkoutsQuery.data?.pagination.total ?? 0);
  const totalPages =
    tab === "orders"
      ? (storeOrdersQuery.data?.pagination.totalPages ?? 1)
      : (checkoutsQuery.data?.pagination.totalPages ?? 1);

  const ordersTabCount = storeOrdersQuery.data?.pagination.total;
  const checkoutsTabCount = checkoutsQuery.data?.pagination.total;

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* Cmd/Ctrl+K focuses search */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openEdit = useCallback((item: AdminStoreOrderItem) => {
    setEditTarget(item);
    setEditStatus(item.status);
  }, []);

  const closeEdit = useCallback(() => {
    if (updateMutation.isPending) return;
    setEditTarget(null);
  }, [updateMutation.isPending]);

  const saveStatus = useCallback(async () => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: {
          status: editStatus,
          storeId: editTarget.storeId ?? undefined,
        },
      });
      setEditTarget(null);
    } catch {
      /* hook toast */
    }
  }, [editTarget, editStatus, updateMutation]);

  const clearAllFilters = useCallback(() => {
    setStatus("ALL");
    setPaymentStatus("ALL");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const isLoading = activeQuery.isLoading;
  const isFetching = activeQuery.isFetching;
  const isError = activeQuery.isError;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayError =
    activeQuery.error instanceof Error
      ? activeQuery.error.message
      : "خطای ناشناخته";

  const hasFilter = status !== "ALL" || paymentStatus !== "ALL" || !!search;
  const isDebouncing = searchInput.trim() !== search;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const searchPlaceholder =
    tab === "orders" ? "شماره سفارش…" : "شماره تسویه‌حساب…";

  return (
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-4">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              سفارش‌ها
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت سفارش‌های فروشگاهی و تسویه‌حساب‌ها
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 self-start"
          onClick={() => void activeQuery.refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 motion-reduce:animate-none",
              isFetching && "animate-spin",
            )}
            aria-hidden="true"
          />
          {isFetching ? "در حال بروزرسانی…" : "بروزرسانی"}
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "orders" | "checkouts");
          setPage(1);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="orders" className="gap-1.5">
            سفارش‌ها
            {ordersTabCount != null && (
              <span className="min-w-4 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {ordersTabCount.toLocaleString("fa-IR")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="gap-1.5">
            تسویه‌حساب‌ها
            {checkoutsTabCount != null && (
              <span className="min-w-4 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {checkoutsTabCount.toLocaleString("fa-IR")}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------- Filters ------------------------------- */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor={searchId} className="sr-only">
                {searchPlaceholder}
              </label>
              <Input
                id={searchId}
                ref={searchRef}
                type="search"
                placeholder={searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 ps-10 pe-16"
                aria-describedby={resultCountId}
              />
              <div className="absolute inset-y-0 inset-e-2 my-auto flex items-center gap-1">
                {isFetching && !isLoading ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-muted-foreground motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : null}
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="پاک کردن جستجو"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden select-none rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {tab === "orders" && (
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as StoreOrderStatus | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-10 w-full sm:w-44"
                  aria-label="فیلتر وضعیت سفارش"
                >
                  <SelectValue placeholder="وضعیت سفارش" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {ORDER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={paymentStatus}
              onValueChange={(v) => {
                setPaymentStatus(v as OrderPaymentStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10 w-full sm:w-44"
                aria-label="فیلتر وضعیت پرداخت"
              >
                <SelectValue placeholder="وضعیت پرداخت" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilter && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                فیلترها:
              </span>
              {tab === "orders" && status !== "ALL" && (
                <ActiveFilterChip
                  label={`وضعیت: ${ORDER_STATUS_META[status as StoreOrderStatus].label}`}
                  onClear={() => {
                    setStatus("ALL");
                    setPage(1);
                  }}
                />
              )}
              {paymentStatus !== "ALL" && (
                <ActiveFilterChip
                  label={`پرداخت: ${PAYMENT_STATUS_META[paymentStatus as OrderPaymentStatus].label}`}
                  onClear={() => {
                    setPaymentStatus("ALL");
                    setPage(1);
                  }}
                />
              )}
              {search && (
                <ActiveFilterChip
                  label={`جستجو: ${search}`}
                  onClear={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                />
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ms-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                پاک کردن همه
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------- Result count ------------------------------- */}
        <p
          id={resultCountId}
          className="mt-2 text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "در حال بارگذاری…"
            : isError
              ? "—"
              : isDebouncing
                ? "در حال جستجو…"
                : total === 0
                  ? "بدون نتیجه"
                  : `${rangeStart.toLocaleString("fa-IR")}–${rangeEnd.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} ${tab === "orders" ? "سفارش" : "تسویه‌حساب"}`}
        </p>

        {/* ------------------------------- Orders tab ------------------------------- */}
        <TabsContent
          value="orders"
          className="mt-3 space-y-2"
          aria-busy={storeOrdersQuery.isLoading || storeOrdersQuery.isFetching}
        >
          {storeOrdersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : storeOrdersQuery.isError ? (
            <ErrorState
              label="سفارش‌ها"
              message={
                storeOrdersQuery.error instanceof Error
                  ? storeOrdersQuery.error.message
                  : "خطای ناشناخته"
              }
              onRetry={() => void storeOrdersQuery.refetch()}
              isRetrying={storeOrdersQuery.isFetching}
              hasFilter={hasFilter}
              onClearFilters={clearAllFilters}
            />
          ) : storeOrders.length === 0 ? (
            <EmptyState
              variant={hasFilter ? "orders-filtered" : "orders-no-data"}
              onReset={clearAllFilters}
            />
          ) : (
            storeOrders.map((item) => (
              <StoreOrderRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
              />
            ))
          )}
        </TabsContent>

        {/* ------------------------------- Checkouts tab ------------------------------- */}
        <TabsContent
          value="checkouts"
          className="mt-3 space-y-2"
          aria-busy={checkoutsQuery.isLoading || checkoutsQuery.isFetching}
        >
          {checkoutsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : checkoutsQuery.isError ? (
            <ErrorState
              label="تسویه‌حساب‌ها"
              message={
                checkoutsQuery.error instanceof Error
                  ? checkoutsQuery.error.message
                  : "خطای ناشناخته"
              }
              onRetry={() => void checkoutsQuery.refetch()}
              isRetrying={checkoutsQuery.isFetching}
              hasFilter={hasFilter}
              onClearFilters={clearAllFilters}
            />
          ) : checkouts.length === 0 ? (
            <EmptyState
              variant={hasFilter ? "checkouts-filtered" : "checkouts-no-data"}
              onReset={clearAllFilters}
            />
          ) : (
            checkouts.map((item) => <CheckoutRow key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>

      {/* ------------------------------- Pagination ------------------------------- */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی سفارش‌ها"
          className="flex items-center justify-center gap-2 pt-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="صفحه قبل"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            قبلی
          </Button>
          <span
            className="min-w-20 rounded-md bg-muted/50 px-2 py-1 text-center text-xs font-medium tabular-nums text-foreground"
            aria-current="page"
          >
            {page.toLocaleString("fa-IR")} /{" "}
            {totalPages.toLocaleString("fa-IR")}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            aria-label="صفحه بعد"
          >
            بعدی
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}

      {/* ------------------------------- Edit dialog ------------------------------- */}
      <EditOrderStatusDialog
        target={editTarget}
        value={editStatus}
        onChange={setEditStatus}
        onSave={() => void saveStatus()}
        onClose={closeEdit}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
