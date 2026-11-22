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
  ClipboardList,
  Eye,
  Trash2,
  Inbox,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User as UserIcon,
  Dumbbell as CoachIcon,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  XCircle,
  Ban,
  Clock,
  FileText,
  StickyNote,
  MessageSquareWarning,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import {
  useAdminPlanRequests,
  useDeleteAdminPlanRequest,
  useUpdateAdminPlanRequest,
} from "@/features/admin/plan-requests/hooks/use-admin-plan-requests";
import type {
  PlanRequestAdminItem,
  PlanRequestStatus,
} from "@/features/admin/plan-requests/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

/* -------------------------------------------------------------------------- */
/* Status taxonomy                                                            */
/* -------------------------------------------------------------------------- */

type StatusTone = "amber" | "sky" | "emerald" | "violet" | "rose" | "zinc";

const STATUS_META: Record<
  PlanRequestStatus,
  {
    label: string;
    tone: StatusTone;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
    nextHint: string;
  }
> = {
  PENDING: {
    label: "در انتظار",
    tone: "amber",
    Icon: Clock,
    description: "درخواست ثبت شده و در انتظار بررسی مربی یا ادمین است.",
    nextHint: "منتظر پذیرش مربی",
  },
  ACCEPTED: {
    label: "پذیرفته",
    tone: "sky",
    Icon: CheckCircle2,
    description: "مربی درخواست را پذیرفته؛ منتظر پرداخت کاربر.",
    nextHint: "منتظر پرداخت کاربر",
  },
  PAID: {
    label: "پرداخت‌شده",
    tone: "violet",
    Icon: CreditCard,
    description: "پرداخت تکمیل شده؛ منتظر تحویل برنامه.",
    nextHint: "منتظر تحویل برنامه",
  },
  DELIVERED: {
    label: "تحویل‌شده",
    tone: "emerald",
    Icon: PackageCheck,
    description: "برنامه تحویل داده شده و چرخه کامل شده است.",
    nextHint: "چرخه تکمیل شده",
  },
  REJECTED: {
    label: "رد شده",
    tone: "rose",
    Icon: XCircle,
    description: "درخواست رد شده؛ دلیل رد باید ثبت شده باشد.",
    nextHint: "بدون اقدام بعدی",
  },
  CANCELLED: {
    label: "لغو شده",
    tone: "zinc",
    Icon: Ban,
    description: "درخواست توسط کاربر یا سیستم لغو شده است.",
    nextHint: "بدون اقدام بعدی",
  },
};

const TONE_RING: Record<StatusTone, string> = {
  amber: "ring-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  sky: "ring-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  emerald:
    "ring-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  violet:
    "ring-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  rose: "ring-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  zinc: "ring-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

const TONE_DOT: Record<StatusTone, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  zinc: "bg-zinc-500",
};

const TONE_BORDER: Record<StatusTone, string> = {
  amber: "border-s-amber-500/60",
  sky: "border-s-sky-500/60",
  emerald: "border-s-emerald-500/60",
  violet: "border-s-violet-500/60",
  rose: "border-s-rose-500/60",
  zinc: "border-s-zinc-500/60",
};

const STATUS_OPTIONS: { value: PlanRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار" },
  { value: "ACCEPTED", label: "پذیرفته" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "DELIVERED", label: "تحویل‌شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "CANCELLED", label: "لغو شده" },
];

const EDITABLE_STATUSES: PlanRequestStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PAID",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
];

/** Terminal states that shouldn't be offered when already at them. */
function isDestructiveTarget(s: PlanRequestStatus): boolean {
  return s === "REJECTED" || s === "CANCELLED";
}

/** Statuses that imply "live" access. Downgrading from these cuts access. */
function isLiveStatus(s: PlanRequestStatus): boolean {
  return s === "ACCEPTED" || s === "PAID" || s === "DELIVERED";
}

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
        <div className="flex -space-x-2">
          <Skeleton className="h-8 w-8 rounded-full ring-2 ring-background" />
          <Skeleton className="h-8 w-8 rounded-full ring-2 ring-background" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: PlanRequestStatus }) {
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

function RequestRow({
  item,
  onOpen,
  onDelete,
}: {
  item: PlanRequestAdminItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[item.status];

  return (
    <Card
      className={cn(
        "group border-border/60 border-s-2 transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-border hover:shadow-sm",
        "motion-reduce:transition-none",
        TONE_BORDER[meta.tone],
      )}
    >
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        {/* User ↔ Coach avatar pair */}
        <div className="flex shrink-0 -space-x-2" aria-hidden="true">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-background",
              avatarTone(item.userId ?? item.userName ?? item.id),
            )}
            title={`کاربر: ${item.userName ?? "—"}`}
          >
            {initials(item.userName)}
          </div>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-background",
              avatarTone(item.coachId ?? item.coachName ?? "coach"),
            )}
            title={`مربی: ${item.coachName ?? "—"}`}
          >
            {initials(item.coachName)}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Line 1: users + status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="max-w-56 truncate text-sm font-semibold text-foreground">
              {item.userName || "کاربر بدون نام"}
            </p>
            <ArrowLeft
              className="h-3 w-3 shrink-0 text-muted-foreground/60"
              aria-hidden="true"
            />
            <p className="max-w-40 truncate text-xs text-muted-foreground">
              {item.coachName || "بدون مربی"}
            </p>
            <StatusBadge status={item.status} />
          </div>

          {/* Line 2: next hint + phone */}
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {meta.nextHint}
            </span>
            {item.userPhone && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span dir="ltr" className="tabular-nums">
                  {item.userPhone}
                </span>
              </>
            )}
          </p>

          {/* Line 3: note / rejection reason preview or date */}
          {item.rejectionReason ? (
            <p className="flex items-center gap-1 truncate text-[11px] text-rose-600 dark:text-rose-400">
              <MessageSquareWarning
                className="h-3 w-3 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">دلیل رد: {item.rejectionReason}</span>
            </p>
          ) : item.note ? (
            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.note}</span>
            </p>
          ) : (
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {formatDate(item.createdAt)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2 sm:px-3"
            onClick={onOpen}
            aria-label={`بررسی درخواست ${item.userName || "کاربر"}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">بررسی</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 text-muted-foreground transition-colors duration-150",
              "hover:bg-destructive/10 hover:text-destructive",
              "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
            )}
            onClick={onDelete}
            aria-label={`حذف درخواست ${item.userName || ""}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
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
              ? "درخواستی با این فیلتر یافت نشد"
              : "هنوز درخواستی ثبت نشده است"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {hasFilter
              ? "می‌توانید فیلترها را تغییر دهید یا پاک کنید."
              : "پس از ثبت درخواست توسط شاگردان، اینجا نمایش داده می‌شود."}
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
            دریافت درخواست‌ها ناموفق بود
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
/* Detail dialog                                                              */
/* -------------------------------------------------------------------------- */

function DetailDialog({
  target,
  editStatus,
  setEditStatus,
  rejectionReason,
  setRejectionReason,
  note,
  setNote,
  onSave,
  onClose,
  isSaving,
}: {
  target: PlanRequestAdminItem | null;
  editStatus: PlanRequestStatus;
  setEditStatus: (s: PlanRequestStatus) => void;
  rejectionReason: string;
  setRejectionReason: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const originalStatus = target?.status ?? "PENDING";
  const unchanged = target != null && editStatus === originalStatus;
  const isDowngrade =
    target != null &&
    isLiveStatus(originalStatus) &&
    isDestructiveTarget(editStatus);
  const rejectionMissing =
    editStatus === "REJECTED" && rejectionReason.trim().length < 3;

  const saveDisabled = isSaving || unchanged || rejectionMissing;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !isSaving && onClose()}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
            </span>
            بررسی درخواست
          </DialogTitle>
          <DialogDescription>
            وضعیت را بررسی و در صورت نیاز یادداشت یا دلیل رد ثبت کنید.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            {/* Context block */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <UserIcon
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">کاربر:</span>
                <span className="truncate font-medium text-foreground">
                  {target.userName || "—"}
                </span>
                {target.userPhone && (
                  <span
                    dir="ltr"
                    className="ms-auto tabular-nums text-muted-foreground"
                  >
                    {target.userPhone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CoachIcon
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">مربی:</span>
                <span className="truncate font-medium text-foreground">
                  {target.coachName || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="tabular-nums">
                  {formatDate(target.createdAt)}
                </span>
                <span className="ms-auto inline-flex items-center gap-1">
                  <StatusBadge status={target.status} />
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span dir="ltr" className="truncate font-mono text-[10px]">
                  ID: {target.id}
                </span>
              </div>
            </div>

            {/* Status picker */}
            <div className="space-y-2">
              <Label>وضعیت جدید</Label>
              <div
                role="radiogroup"
                aria-label="انتخاب وضعیت جدید"
                className="grid max-h-64 gap-1.5 overflow-y-auto pe-1"
              >
                {EDITABLE_STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  const active = editStatus === s;
                  const isCurrent = originalStatus === s;
                  const Icon = m.Icon;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setEditStatus(s)}
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

            {/* Rejection reason — required when REJECTED */}
            {editStatus === "REJECTED" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="rejection-reason"
                    className="text-destructive"
                  >
                    دلیل رد <span aria-hidden="true">*</span>
                  </Label>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      rejectionMissing
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {rejectionReason.trim().length.toLocaleString("fa-IR")} / ۳
                  </span>
                </div>
                <Textarea
                  id="rejection-reason"
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className={cn(
                    "resize-none",
                    rejectionMissing &&
                      "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder="توضیح دهید چرا این درخواست رد می‌شود (کاربر این را می‌بیند)."
                  aria-invalid={rejectionMissing}
                  aria-describedby={
                    rejectionMissing ? "rejection-help" : undefined
                  }
                />
                <p
                  id="rejection-help"
                  className={cn(
                    "text-[11px]",
                    rejectionMissing
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  حداقل ۳ کاراکتر. این متن برای کاربر نمایش داده می‌شود.
                </p>
              </div>
            )}

            {/* Downgrade warning */}
            {isDowngrade && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[11px] text-destructive">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  این تغییر وضعیت را از حالت فعال به حالت غیرفعال منتقل می‌کند.
                  دسترسی کاربر و برنامه تحویل‌شده ممکن است تحت تأثیر قرار گیرد.
                </span>
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="admin-note">یادداشت داخلی (اختیاری)</Label>
              <Textarea
                id="admin-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
                placeholder="این یادداشت فقط برای ادمین‌ها نمایش داده می‌شود."
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            بستن
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
            disabled={saveDisabled}
            className={cn(
              isDestructiveTarget(editStatus) &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {isSaving ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {isDestructiveTarget(editStatus)
              ? "ثبت تغییر نهایی"
              : "ذخیره تغییر"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminPlanRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PlanRequestStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<PlanRequestAdminItem | null>(null);
  const [editStatus, setEditStatus] = useState<PlanRequestStatus>("PENDING");
  const [rejectionReason, setRejectionReason] = useState("");
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlanRequestAdminItem | null>(
    null,
  );

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
    useAdminPlanRequests(filters);
  const updateMutation = useUpdateAdminPlanRequest();
  const deleteMutation = useDeleteAdminPlanRequest();

  const items = useMemo(() => {
    const list = data?.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.userName?.toLowerCase().includes(q) ||
        item.coachName?.toLowerCase().includes(q) ||
        item.userPhone?.includes(q) ||
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

  const openDetail = useCallback((item: PlanRequestAdminItem) => {
    setDetail(item);
    setEditStatus(item.status);
    setRejectionReason(item.rejectionReason ?? "");
    setNote(item.note ?? "");
  }, []);

  const closeDetail = useCallback(() => {
    if (updateMutation.isPending) return;
    setDetail(null);
  }, [updateMutation.isPending]);

  const saveDetail = useCallback(async () => {
    if (!detail) return;
    if (editStatus === "REJECTED" && rejectionReason.trim().length < 3) {
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: detail.id,
        payload: {
          status: editStatus,
          note: note.trim() || undefined,
          rejectionReason:
            editStatus === "REJECTED"
              ? rejectionReason.trim() || undefined
              : undefined,
        },
      });
      setDetail(null);
    } catch {
      /* toast in hook */
    }
  }, [detail, editStatus, rejectionReason, note, updateMutation]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (detail?.id === deleteTarget.id) setDetail(null);
    } catch {
      /* toast in hook */
    }
  }, [deleteTarget, deleteMutation, detail]);

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
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              درخواست‌های برنامه
            </h1>
            <p className="text-xs text-muted-foreground">
              نظارت، بررسی و ویرایش وضعیت درخواست شاگرد ↔ مربی
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 self-start"
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
      <section aria-label="فیلتر درخواست‌ها" className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor={searchId} className="sr-only">
              جستجو
            </label>
            <Input
              id={searchId}
              ref={searchRef}
              type="search"
              placeholder="نام کاربر، مربی، تلفن یا شناسه…"
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

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as PlanRequestStatus | "ALL");
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
                label={`وضعیت: ${STATUS_META[status as PlanRequestStatus].label}`}
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
                : `${rangeStart.toLocaleString("fa-IR")}–${rangeEnd.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} درخواست`}
      </p>

      {/* ------------------------------- List ------------------------------- */}
      <section aria-label="لیست درخواست‌ها" aria-busy={isLoading || isFetching}>
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
              <RequestRow
                key={item.id}
                item={item}
                onOpen={() => openDetail(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------- Pagination ------------------------------- */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی درخواست‌ها"
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

      {/* ------------------------------- Detail dialog ------------------------------- */}
      <DetailDialog
        target={detail}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        note={note}
        setNote={setNote}
        onSave={() => void saveDetail()}
        onClose={closeDetail}
        isSaving={updateMutation.isPending}
      />

      {/* ------------------------------- Delete dialog ------------------------------- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              حذف درخواست
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                درخواست مربوط به «{deleteTarget?.userName || "کاربر"}» برای
                همیشه حذف می‌شود. این عمل قابل بازگشت نیست.
              </span>
              {deleteTarget && (
                <span className="block rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
                  کاربر:{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.userName || "—"}
                  </span>
                  {" · "}
                  مربی:{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.coachName || "—"}
                  </span>
                  {" · "}
                  وضعیت:{" "}
                  <span className="font-medium text-foreground">
                    {STATUS_META[deleteTarget.status].label}
                  </span>
                </span>
              )}
              <span className="block rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
                اگر فقط می‌خواهید درخواست را رد یا لغو کنید، از گزینه «بررسی» و
                تغییر وضعیت استفاده کنید — نه حذف.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2
                  className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
              )}
              حذف قطعی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
