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
  CreditCard,
  Inbox,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Ban,
  User as UserIcon,
  Calendar,
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
import { cn } from "@/lib/utils";
import {
  useAdminSubscriptions,
  useUpdateAdminSubscriptionStatus,
} from "@/features/admin/subscriptions/hooks/use-admin-subscriptions";
import type {
  AdminSubscriptionItem,
  AdminSubscriptionStatus,
} from "@/features/admin/subscriptions/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const DAY_MS = 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Status taxonomy                                                            */
/* -------------------------------------------------------------------------- */

type StatusTone = "emerald" | "sky" | "amber" | "rose" | "zinc";

const STATUS_META: Record<
  AdminSubscriptionStatus,
  {
    label: string;
    tone: StatusTone;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  PENDING: {
    label: "در انتظار",
    tone: "amber",
    Icon: Clock,
    description: "پرداخت یا فعال‌سازی تکمیل نشده است.",
  },
  ACTIVE: {
    label: "فعال",
    tone: "emerald",
    Icon: CheckCircle2,
    description: "دسترسی کاربر کامل و بدون محدودیت است.",
  },
  TRIALING: {
    label: "دوره آزمایشی",
    tone: "sky",
    Icon: Timer,
    description: "در حال استفاده از دوره آزمایشی رایگان.",
  },
  EXPIRED: {
    label: "منقضی",
    tone: "rose",
    Icon: XCircle,
    description: "دوره اشتراک پایان یافته و دسترسی قطع شده است.",
  },
  CANCELLED: {
    label: "لغو شده",
    tone: "zinc",
    Icon: Ban,
    description: "اشتراک به‌صورت دستی یا توسط کاربر لغو شده است.",
  },
};

const TONE_RING: Record<StatusTone, string> = {
  emerald:
    "ring-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "ring-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "ring-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "ring-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  zinc: "ring-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

const TONE_DOT: Record<StatusTone, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  zinc: "bg-zinc-500",
};

const TONE_BORDER: Record<StatusTone, string> = {
  emerald: "border-s-emerald-500/60",
  sky: "border-s-sky-500/60",
  amber: "border-s-amber-500/60",
  rose: "border-s-rose-500/60",
  zinc: "border-s-zinc-500/60",
};

const STATUS_OPTIONS: {
  value: AdminSubscriptionStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار" },
  { value: "ACTIVE", label: "فعال" },
  { value: "TRIALING", label: "دوره آزمایشی" },
  { value: "EXPIRED", label: "منقضی" },
  { value: "CANCELLED", label: "لغو شده" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const dateFmt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" });

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

/** Human-readable remaining/elapsed time — the single most useful derived signal. */
function computeDuration(endsAt: string | null): {
  label: string;
  tone: StatusTone;
} | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;
  const days = daysBetween(end, new Date());
  if (days < 0) {
    const past = Math.abs(days);
    if (past === 0) return { label: "امروز منقضی شده", tone: "rose" };
    return {
      label: `${past.toLocaleString("fa-IR")} روز گذشته`,
      tone: "rose",
    };
  }
  if (days === 0) return { label: "امروز منقضی می‌شود", tone: "amber" };
  if (days <= 3)
    return {
      label: `${days.toLocaleString("fa-IR")} روز مانده`,
      tone: "amber",
    };
  return {
    label: `${days.toLocaleString("fa-IR")} روز مانده`,
    tone: "emerald",
  };
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? "") + (parts[1][0] ?? "");
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
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md sm:h-8 sm:w-24" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: AdminSubscriptionStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2 py-0 text-[10px] font-medium ring-1 ring-inset",
        TONE_RING[meta.tone],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[meta.tone])}
        aria-hidden="true"
      />
      {meta.label}
    </Badge>
  );
}

function SubscriptionRow({
  item,
  onEdit,
}: {
  item: AdminSubscriptionItem;
  onEdit: () => void;
}) {
  const meta = STATUS_META[item.status];
  const duration = computeDuration(item.endsAt);

  return (
    <Card
      className={cn(
        "border-border/60 border-s-2 transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-border hover:shadow-sm",
        "motion-reduce:transition-none",
        TONE_BORDER[meta.tone],
      )}
    >
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset ring-white/10",
            avatarTone(item.userId ?? item.userName ?? item.id),
          )}
          aria-hidden="true"
        >
          {initials(item.userName)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Line 1: user + status badge */}
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="max-w-full truncate text-sm font-semibold text-foreground">
              {item.userName || "کاربر بدون نام"}
            </p>
            <StatusBadge status={item.status} />
          </div>

          {/* Line 2: plan */}
          <p className="truncate text-xs text-muted-foreground">
            پلن:{" "}
            <span className="font-medium text-foreground/80">
              {item.planTitle || "—"}
            </span>
          </p>

          {/* Line 3: date range + duration chip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDate(item.startsAt)}
              <ChevronLeft
                className="h-3 w-3 text-muted-foreground/50 rtl:hidden"
                aria-hidden="true"
              />
              <ChevronRight
                className="hidden h-3 w-3 text-muted-foreground/50 rtl:inline"
                aria-hidden="true"
              />
              {formatDate(item.endsAt)}
            </span>
            {duration && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium ring-1 ring-inset",
                  TONE_RING[duration.tone],
                )}
              >
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    TONE_DOT[duration.tone],
                  )}
                  aria-hidden="true"
                />
                {duration.label}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2 sm:px-3"
          onClick={onEdit}
          aria-label={`تغییر وضعیت اشتراک ${item.userName || "کاربر"}`}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">تغییر وضعیت</span>
        </Button>
      </CardContent>
    </Card>
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

function EmptyState({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}) {
  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          {hasFilter ? (
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
            {hasFilter
              ? "اشتراکی با این فیلتر یافت نشد"
              : "هنوز اشتراکی ثبت نشده است"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {hasFilter
              ? "می‌توانید فیلترها را تغییر دهید یا پاک کنید."
              : "پس از خرید اشتراک توسط کاربران، اینجا نمایش داده می‌شود."}
          </p>
        </div>
        {hasFilter && (
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
  message,
  onRetry,
  isRetrying,
  hasFilter,
  onClearFilters,
}: {
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
            دریافت اشتراک‌ها ناموفق بود
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
/* Edit dialog                                                                */
/* -------------------------------------------------------------------------- */

function EditStatusDialog({
  target,
  value,
  onChange,
  onSave,
  onClose,
  isSaving,
}: {
  target: AdminSubscriptionItem | null;
  value: AdminSubscriptionStatus;
  onChange: (v: AdminSubscriptionStatus) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const unchanged = target != null && value === target.status;

  /** Downgrade guard: going from a "live" state to a "dead" state. */
  const isDowngrade =
    target != null &&
    (target.status === "ACTIVE" || target.status === "TRIALING") &&
    (value === "CANCELLED" || value === "EXPIRED");

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !isSaving && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
            </span>
            تغییر وضعیت اشتراک
          </DialogTitle>
          <DialogDescription>
            وضعیت جدید را انتخاب کنید؛ تغییر بلافاصله اعمال می‌شود.
          </DialogDescription>
        </DialogHeader>

        {/* Context block */}
        {target && (
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <UserIcon
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">کاربر:</span>
              <span className="truncate font-medium text-foreground">
                {target.userName || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">پلن:</span>
              <span className="truncate font-medium text-foreground">
                {target.planTitle || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                {formatDate(target.startsAt)} — {formatDate(target.endsAt)}
              </span>
              <span className="ms-auto inline-flex items-center gap-1">
                <StatusBadge status={target.status} />
              </span>
            </div>
          </div>
        )}

        {/* Status picker as radio group of cards */}
        <div className="space-y-2">
          <Label>وضعیت جدید</Label>
          <div
            role="radiogroup"
            aria-label="انتخاب وضعیت جدید"
            className="grid gap-1.5"
          >
            {STATUS_OPTIONS.filter((o) => o.value !== "ALL").map((o) => {
              const key = o.value as AdminSubscriptionStatus;
              const m = STATUS_META[key];
              const active = value === key;
              const isCurrent = target?.status === key;
              const Icon = m.Icon;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(key)}
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
                  >
                    {active && (
                      <span className="block h-full w-full rounded-full ring-2 ring-background ring-inset" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Downgrade warning */}
        {isDowngrade && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[11px] text-destructive">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              با این تغییر، دسترسی کاربر به سرویس‌های اشتراک <b>قطع خواهد شد</b>
              . مطمئن شوید که این تغییر عمدی است.
            </span>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            انصراف
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || unchanged}
            className={cn(
              isDowngrade &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {isSaving ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {isDowngrade ? "تأیید و قطع دسترسی" : "ذخیره تغییر"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminSubscriptionStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<AdminSubscriptionItem | null>(
    null,
  );
  const [editStatus, setEditStatus] =
    useState<AdminSubscriptionStatus>("ACTIVE");

  const searchId = useId();
  const resultCountId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc" as const,
      status,
    }),
    [page, status],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminSubscriptions(filters);
  const updateMutation = useUpdateAdminSubscriptionStatus();

  const items = useMemo(() => {
    const list = data?.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.userName?.toLowerCase().includes(q) ||
        item.planTitle?.toLowerCase().includes(q) ||
        item.userId?.includes(q) ||
        item.id.includes(q),
    );
  }, [data?.data, search]);

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasFilter = status !== "ALL" || !!search;

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

  const openEdit = useCallback((item: AdminSubscriptionItem) => {
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
        status: editStatus,
      });
      setEditTarget(null);
    } catch {
      /* toast in hook */
    }
  }, [editTarget, editStatus, updateMutation]);

  const clearAllFilters = useCallback(() => {
    setStatus("ALL");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  const isDebouncing = searchInput.trim() !== search;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-4">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              اشتراک کاربران
            </h1>
            <p className="text-xs text-muted-foreground">
              نظارت و تغییر وضعیت اشتراک‌های خریداری‌شده
            </p>
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
            className={cn(
              "h-3.5 w-3.5 motion-reduce:animate-none",
              isFetching && "animate-spin",
            )}
            aria-hidden="true"
          />
          {isFetching ? "در حال بروزرسانی…" : "بروزرسانی"}
        </Button>
      </header>

      {/* ------------------------------- Filters ------------------------------- */}
      <section aria-label="فیلتر اشتراک‌ها" className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor={searchId} className="sr-only">
              جستجوی اشتراک
            </label>
            <Input
              id={searchId}
              ref={searchRef}
              type="search"
              placeholder="نام کاربر، عنوان پلن یا شناسه…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchInput) {
                  setSearchInput("");
                  setSearch("");
                }
              }}
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

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as AdminSubscriptionStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-44"
              aria-label="فیلتر وضعیت"
            >
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilter && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">فیلترها:</span>
            {status !== "ALL" && (
              <ActiveFilterChip
                label={`وضعیت: ${STATUS_META[status as AdminSubscriptionStatus].label}`}
                onClear={() => {
                  setStatus("ALL");
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
      </section>

      {/* ------------------------------- Result count ------------------------------- */}
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
            : isDebouncing
              ? "در حال جستجو…"
              : total === 0
                ? "بدون نتیجه"
                : `${rangeStart.toLocaleString("fa-IR")}–${rangeEnd.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} اشتراک`}
      </p>

      {/* ------------------------------- List ------------------------------- */}
      <section aria-label="لیست اشتراک‌ها" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            hasFilter={hasFilter}
            onClearFilters={clearAllFilters}
          />
        ) : items.length === 0 ? (
          <EmptyState hasFilter={hasFilter} onReset={clearAllFilters} />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <SubscriptionRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------- Pagination ------------------------------- */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی اشتراک‌ها"
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
      <EditStatusDialog
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
