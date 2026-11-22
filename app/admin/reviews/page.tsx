/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Inbox,
  Check,
  X,
  Trash2,
  Star,
  ShieldCheck,
  MessageCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Apple,
  ClipboardList,
  User as UserIcon,
  Quote,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useAdminCoachReviews,
  useAdminProductReviews,
  useAnswerProductReview,
  useApproveCoachReview,
  useDeleteCoachReview,
  useDeleteProductReview,
  useModerateProductReview,
  useUpdateCoachReviewStatus,
} from "@/features/admin/reviews/hooks/use-admin-reviews";
import type {
  AdminCoachReviewItem,
  AdminProductReviewItem,
  CoachReviewStatus,
} from "@/features/admin/reviews/types";

const PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/* Taxonomies                                                                 */
/* -------------------------------------------------------------------------- */

type ModerationState = "pending" | "approved" | "rejected";

const MODERATION_META: Record<
  ModerationState,
  {
    label: string;
    tone: "amber" | "emerald" | "rose";
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "در انتظار بررسی",
    tone: "amber",
    Icon: Clock,
  },
  approved: {
    label: "تأیید شده",
    tone: "emerald",
    Icon: Check,
  },
  rejected: {
    label: "رد شده",
    tone: "rose",
    Icon: X,
  },
};

const COACH_STATUS_META: Record<
  CoachReviewStatus,
  {
    label: string;
    tone: "amber" | "emerald" | "rose";
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "در انتظار",
    tone: "amber",
    Icon: Clock,
  },
  APPROVED: {
    label: "تأیید شده",
    tone: "emerald",
    Icon: Check,
  },
  REJECTED: {
    label: "رد شده",
    tone: "rose",
    Icon: X,
  },
};

const TONE_RING: Record<"amber" | "emerald" | "rose", string> = {
  amber: "ring-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald:
    "ring-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "ring-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const TONE_DOT: Record<"amber" | "emerald" | "rose", string> = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

const TONE_BORDER: Record<"amber" | "emerald" | "rose", string> = {
  amber: "border-s-amber-500/60",
  emerald: "border-s-emerald-500/60",
  rose: "border-s-rose-500/60",
};

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

function moderationStateOf(item: AdminProductReviewItem): ModerationState {
  if (item.isApproved === true) return "approved";
  if (item.isApproved === false) return "rejected";
  return "pending";
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function RowSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stars({
  value,
  size = "md",
  showValue = false,
}: {
  value: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const n = Math.max(0, Math.min(5, Math.round(value)));
  const dim = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`امتیاز ${n} از ۵`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            dim,
            i < n
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
          aria-hidden="true"
        />
      ))}
      {showValue && (
        <span className="ms-1 text-[11px] font-medium tabular-nums text-muted-foreground">
          {n.toLocaleString("fa-IR")} / ۵
        </span>
      )}
    </span>
  );
}

function StatusBadge({
  tone,
  Icon,
  label,
}: {
  tone: "amber" | "emerald" | "rose";
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2 py-0 text-[10px] font-medium ring-1 ring-inset",
        TONE_RING[tone],
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** Expandable long body — clamped to 3 lines by default. */
function ExpandableBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 240;
  return (
    <div className="space-y-1">
      <p
        className={cn(
          "whitespace-pre-line text-xs leading-relaxed text-muted-foreground",
          !expanded && isLong && "line-clamp-3",
        )}
      >
        {body || "—"}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
              نمایش کمتر
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
              نمایش کامل
            </>
          )}
        </button>
      )}
    </div>
  );
}

function Avatar({
  seed,
  label,
  name,
}: {
  seed: string;
  label: string;
  name: string | null | undefined;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset ring-white/10",
        avatarTone(seed),
      )}
      aria-hidden="true"
      title={label}
    >
      {initials(name)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product review card                                                        */
/* -------------------------------------------------------------------------- */

function ProductReviewCard({
  item,
  onAnswer,
  onDelete,
  isModerating,
  onModerate,
}: {
  item: AdminProductReviewItem;
  onAnswer: () => void;
  onDelete: () => void;
  isModerating: boolean;
  onModerate: (isApproved: boolean) => void;
}) {
  const state = moderationStateOf(item);
  const meta = MODERATION_META[state];

  return (
    <Card
      className={cn(
        "border-border/60 border-s-2 transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-border hover:shadow-sm",
        "motion-reduce:transition-none",
        TONE_BORDER[meta.tone],
      )}
    >
      <CardContent className="space-y-2.5 p-4">
        {/* Line 1: stars + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={item.rating} showValue />
          <StatusBadge tone={meta.tone} Icon={meta.Icon} label={meta.label} />
          {item.verifiedPurchase && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full px-2 py-0 text-[10px] font-medium ring-1 ring-inset ring-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
              خرید تأییدشده
            </Badge>
          )}
        </div>

        {/* Line 2: title (if any) */}
        {item.title && (
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
        )}

        {/* Line 3: body (expandable) */}
        <ExpandableBody body={item.body} />

        {/* Line 4: author + product + date */}
        <div className="flex items-center gap-2 pt-1">
          <Avatar
            seed={item.userId ?? item.userName ?? item.id}
            name={item.userName}
            label={item.userName ?? "کاربر"}
          />
          <div className="min-w-0 flex-1 text-[11px] text-muted-foreground">
            <p className="truncate font-medium text-foreground/80">
              {item.userName || "کاربر"}
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5 truncate">
              <span className="truncate">{item.productName || "—"}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="tabular-nums">{formatDate(item.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Answer block */}
        {item.answer && (
          <div className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[11px]">
            <Quote
              className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-muted-foreground">
              <span className="font-medium text-foreground">پاسخ:</span>{" "}
              <span className="whitespace-pre-line">{item.answer}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {state !== "approved" && (
            <Button
              size="sm"
              className="h-8 gap-1"
              disabled={isModerating}
              onClick={() => onModerate(true)}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              تأیید
            </Button>
          )}
          {state !== "rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              disabled={isModerating}
              onClick={() => onModerate(false)}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              رد
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={onAnswer}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {item.answer ? "ویرایش پاسخ" : "پاسخ"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 text-muted-foreground transition-colors",
              "hover:bg-destructive/10 hover:text-destructive",
              "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
            )}
            onClick={onDelete}
            aria-label={`حذف نظر ${item.userName || "کاربر"}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Coach review card                                                          */
/* -------------------------------------------------------------------------- */

function RatingCell({
  label,
  Icon,
  value,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  value: number | null;
}) {
  if (value == null || value === 0) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1">
      <Icon
        className="h-3 w-3 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="ms-auto text-[11px] font-medium tabular-nums text-foreground">
        {Math.round(value).toLocaleString("fa-IR")}
        <span className="text-muted-foreground">/۵</span>
      </span>
    </div>
  );
}

function CoachReviewCard({
  item,
  onApprove,
  onReject,
  onDelete,
  isBusy,
}: {
  item: AdminCoachReviewItem;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const meta = COACH_STATUS_META[item.status];
  const authorDisplay = item.isAnonymous
    ? "ناشناس"
    : item.authorName || "کاربر";

  return (
    <Card
      className={cn(
        "border-border/60 border-s-2 transition-all duration-150 ease-out",
        "hover:-translate-y-px hover:border-border hover:shadow-sm",
        "motion-reduce:transition-none",
        TONE_BORDER[meta.tone],
      )}
    >
      <CardContent className="space-y-2.5 p-4">
        {/* Line 1: status badge + primary rating */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={meta.tone} Icon={meta.Icon} label={meta.label} />
          {item.coachRating != null && item.coachRating > 0 && (
            <Stars value={item.coachRating} showValue />
          )}
        </div>

        {/* Line 2: body */}
        <ExpandableBody body={item.body ?? ""} />

        {/* Line 3: dimensional ratings (only show available ones) */}
        {(item.planRating != null && item.planRating > 0) ||
        (item.dietRating != null && item.dietRating > 0) ? (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            <RatingCell
              label="برنامه"
              Icon={ClipboardList}
              value={item.planRating}
            />
            <RatingCell label="تغذیه" Icon={Apple} value={item.dietRating} />
            <RatingCell label="مربی" Icon={Dumbbell} value={item.coachRating} />
          </div>
        ) : null}

        {/* Line 4: author + coach + date */}
        <div className="flex items-center gap-2 pt-1">
          <Avatar
            seed={item.authorName ?? item.id}
            name={item.isAnonymous ? null : item.authorName}
            label={authorDisplay}
          />
          <div className="min-w-0 flex-1 text-[11px] text-muted-foreground">
            <p className="truncate font-medium text-foreground/80">
              {authorDisplay}
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5 truncate">
              <UserIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.coachName || "—"}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="tabular-nums">{formatDate(item.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Coach answer block */}
        {item.answerReview && (
          <div className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[11px]">
            <Quote
              className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-muted-foreground">
              <span className="font-medium text-foreground">پاسخ مربی:</span>{" "}
              <span className="whitespace-pre-line">{item.answerReview}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.status !== "APPROVED" && (
            <Button
              size="sm"
              className="h-8 gap-1"
              disabled={isBusy}
              onClick={onApprove}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              تأیید
            </Button>
          )}
          {item.status !== "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              disabled={isBusy}
              onClick={onReject}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              رد
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 text-muted-foreground transition-colors",
              "hover:bg-destructive/10 hover:text-destructive",
              "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
            )}
            onClick={onDelete}
            aria-label={`حذف نظر ${authorDisplay}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
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
  variant: "no-data" | "filtered" | "searched";
  onReset: () => void;
}) {
  const isFiltered = variant !== "no-data";
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
            {variant === "searched"
              ? "نظری با این جستجو یافت نشد"
              : isFiltered
                ? "نظری با این فیلتر یافت نشد"
                : "هنوز نظری ثبت نشده است"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {isFiltered
              ? "می‌توانید فیلترها یا عبارت جستجو را تغییر دهید."
              : "نظرات کاربران پس از ثبت، اینجا نمایش داده می‌شوند."}
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
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<"product" | "coach">("product");
  const [page, setPage] = useState(1);

  // Product filters
  const [productApproval, setProductApproval] = useState<
    "ALL" | "true" | "false"
  >("ALL");

  // Coach filters
  const [coachStatus, setCoachStatus] = useState<CoachReviewStatus | "ALL">(
    "ALL",
  );

  // Client-side search (over current page)
  const [searchInput, setSearchInput] = useState("");

  // Dialogs
  const [answerTarget, setAnswerTarget] =
    useState<AdminProductReviewItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<AdminProductReviewItem | null>(null);
  const [deleteCoachTarget, setDeleteCoachTarget] =
    useState<AdminCoachReviewItem | null>(null);

  const searchId = useId();

  const productFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc" as const,
      isApproved:
        productApproval === "ALL"
          ? ("ALL" as const)
          : productApproval === "true",
    }),
    [page, productApproval],
  );

  const coachFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc" as const,
      status: coachStatus,
    }),
    [page, coachStatus],
  );

  const productQuery = useAdminProductReviews(productFilters);
  const coachQuery = useAdminCoachReviews(coachFilters);

  const moderateMutation = useModerateProductReview();
  const answerMutation = useAnswerProductReview();
  const deleteProductMutation = useDeleteProductReview();
  const updateCoachStatusMutation = useUpdateCoachReviewStatus();
  const approveCoachMutation = useApproveCoachReview();
  const deleteCoachMutation = useDeleteCoachReview();

  const activeQuery = tab === "product" ? productQuery : coachQuery;
  const total = activeQuery.data?.pagination.total ?? 0;
  const totalPages = activeQuery.data?.pagination.totalPages ?? 1;

  const productItems = productQuery.data?.data ?? [];
  const coachItems = coachQuery.data?.data ?? [];

  const productTabCount = productQuery.data?.pagination.total;
  const coachTabCount = coachQuery.data?.pagination.total;

  const search = searchInput.trim().toLowerCase();

  const filteredProductItems = useMemo(() => {
    const productItems = productQuery.data?.data ?? [];

    if (!search) return productItems;

    return productItems.filter(
      (it) =>
        it.title?.toLowerCase().includes(search) ||
        it.body.toLowerCase().includes(search) ||
        it.userName?.toLowerCase().includes(search) ||
        it.productName?.toLowerCase().includes(search),
    );
  }, [productQuery.data?.data, search]);

  const filteredCoachItems = useMemo(() => {
    const coachItems = coachQuery.data?.data ?? [];

    if (!search) return coachItems;

    return coachItems.filter(
      (it) =>
        it.body?.toLowerCase().includes(search) ||
        it.authorName?.toLowerCase().includes(search) ||
        it.coachName?.toLowerCase().includes(search),
    );
  }, [coachQuery.data?.data, search]);

  const hasFilter =
    (tab === "product" && (productApproval !== "ALL" || !!search)) ||
    (tab === "coach" && (coachStatus !== "ALL" || !!search));

  const clearAllFilters = useCallback(() => {
    setProductApproval("ALL");
    setCoachStatus("ALL");
    setSearchInput("");
    setPage(1);
  }, []);

  const saveAnswer = async () => {
    if (!answerTarget || !answerText.trim()) return;
    try {
      await answerMutation.mutateAsync({
        id: answerTarget.id,
        answer: answerText.trim(),
      });
      setAnswerTarget(null);
      setAnswerText("");
    } catch {
      /* */
    }
  };

  const displayError =
    activeQuery.error instanceof Error
      ? activeQuery.error.message
      : "خطای ناشناخته";
  const isLoading = activeQuery.isLoading;
  const isFetching = activeQuery.isFetching;
  const isError = activeQuery.isError;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-4">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              نظرات
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت نظرات محصول و مربی
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
          setTab(v as "product" | "coach");
          setPage(1);
          setSearchInput("");
        }}
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="product" className="gap-1.5">
            محصول
            {productTabCount != null && (
              <span className="min-w-4 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {productTabCount.toLocaleString("fa-IR")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="coach" className="gap-1.5">
            مربی
            {coachTabCount != null && (
              <span className="min-w-4 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {coachTabCount.toLocaleString("fa-IR")}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------- Filters ------------------------------- */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={tab === "product" ? productApproval : coachStatus}
              onValueChange={(v) => {
                if (tab === "product") {
                  setProductApproval(v as "ALL" | "true" | "false");
                } else {
                  setCoachStatus(v as CoachReviewStatus | "ALL");
                }
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10 w-full sm:w-44"
                aria-label={
                  tab === "product" ? "فیلتر وضعیت تأیید" : "فیلتر وضعیت نظر"
                }
              >
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ALL">همه</SelectItem>
                {tab === "product" ? (
                  <>
                    <SelectItem value="true">تأیید شده</SelectItem>
                    <SelectItem value="false">رد شده / در انتظار</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="PENDING">در انتظار</SelectItem>
                    <SelectItem value="APPROVED">تأیید شده</SelectItem>
                    <SelectItem value="REJECTED">رد شده</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:max-w-xs">
              <MessageCircle
                className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor={searchId} className="sr-only">
                جستجوی نظرات
              </label>
              <input
                id={searchId}
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در متن، نویسنده…"
                className="h-10 w-full rounded-md border border-input bg-background ps-9 pe-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 inset-e-2 my-auto rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="پاک کردن جستجو"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {hasFilter && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                فیلترها:
              </span>
              {tab === "product" && productApproval !== "ALL" && (
                <ActiveFilterChip
                  label={`وضعیت: ${productApproval === "true" ? "تأیید شده" : "رد شده / در انتظار"}`}
                  onClear={() => {
                    setProductApproval("ALL");
                    setPage(1);
                  }}
                />
              )}
              {tab === "coach" && coachStatus !== "ALL" && (
                <ActiveFilterChip
                  label={`وضعیت: ${COACH_STATUS_META[coachStatus].label}`}
                  onClear={() => {
                    setCoachStatus("ALL");
                    setPage(1);
                  }}
                />
              )}
              {search && (
                <ActiveFilterChip
                  label={`جستجو: ${searchInput}`}
                  onClear={() => setSearchInput("")}
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
          className="mt-2 text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "در حال بارگذاری…"
            : isError
              ? "—"
              : total === 0
                ? "بدون نتیجه"
                : `${rangeStart.toLocaleString("fa-IR")}–${rangeEnd.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} نظر`}
        </p>

        {/* ------------------------------- Product tab ------------------------------- */}
        <TabsContent
          value="product"
          className="mt-3 space-y-3"
          aria-busy={productQuery.isLoading || productQuery.isFetching}
        >
          {productQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : productQuery.isError ? (
            <ErrorState
              label="نظرات محصول"
              message={
                productQuery.error instanceof Error
                  ? productQuery.error.message
                  : "خطای ناشناخته"
              }
              onRetry={() => void productQuery.refetch()}
              isRetrying={productQuery.isFetching}
              hasFilter={hasFilter}
              onClearFilters={clearAllFilters}
            />
          ) : filteredProductItems.length === 0 ? (
            <EmptyState
              variant={search ? "searched" : hasFilter ? "filtered" : "no-data"}
              onReset={clearAllFilters}
            />
          ) : (
            filteredProductItems.map((item) => (
              <ProductReviewCard
                key={item.id}
                item={item}
                onModerate={(isApproved) =>
                  void moderateMutation.mutateAsync({ id: item.id, isApproved })
                }
                onAnswer={() => {
                  setAnswerTarget(item);
                  setAnswerText(item.answer ?? "");
                }}
                onDelete={() => setDeleteProductTarget(item)}
                isModerating={moderateMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* ------------------------------- Coach tab ------------------------------- */}
        <TabsContent
          value="coach"
          className="mt-3 space-y-3"
          aria-busy={coachQuery.isLoading || coachQuery.isFetching}
        >
          {coachQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : coachQuery.isError ? (
            <ErrorState
              label="نظرات مربی"
              message={
                coachQuery.error instanceof Error
                  ? coachQuery.error.message
                  : "خطای ناشناخته"
              }
              onRetry={() => void coachQuery.refetch()}
              isRetrying={coachQuery.isFetching}
              hasFilter={hasFilter}
              onClearFilters={clearAllFilters}
            />
          ) : filteredCoachItems.length === 0 ? (
            <EmptyState
              variant={search ? "searched" : hasFilter ? "filtered" : "no-data"}
              onReset={clearAllFilters}
            />
          ) : (
            filteredCoachItems.map((item) => (
              <CoachReviewCard
                key={item.id}
                item={item}
                isBusy={
                  approveCoachMutation.isPending ||
                  updateCoachStatusMutation.isPending
                }
                onApprove={() =>
                  void approveCoachMutation.mutateAsync({
                    id: item.id,
                    // Preserve the existing answer unless the admin
                    // explicitly writes one. Do NOT pass "" — that would
                    // clear an existing answer.
                    answerReview: item.answerReview ?? undefined,
                  })
                }
                onReject={() =>
                  void updateCoachStatusMutation.mutateAsync({
                    id: item.id,
                    status: "REJECTED",
                  })
                }
                onDelete={() => setDeleteCoachTarget(item)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ------------------------------- Pagination ------------------------------- */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی نظرات"
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

      {/* ------------------------------- Answer dialog ------------------------------- */}
      <Dialog
        open={!!answerTarget}
        onOpenChange={(o) => {
          if (!o && !answerMutation.isPending) {
            setAnswerTarget(null);
            setAnswerText("");
          }
        }}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </span>
              پاسخ به نظر
            </DialogTitle>
            <DialogDescription>
              {answerTarget?.productName || "محصول"}
            </DialogDescription>
          </DialogHeader>

          {answerTarget && (
            <div className="space-y-3">
              {/* Original review context */}
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <Stars value={answerTarget.rating} size="sm" />
                  <span className="text-muted-foreground">
                    {answerTarget.userName || "کاربر"}
                  </span>
                </div>
                {answerTarget.title && (
                  <p className="mt-1 text-xs font-medium text-foreground">
                    {answerTarget.title}
                  </p>
                )}
                <p className="mt-1 whitespace-pre-line text-muted-foreground line-clamp-4">
                  {answerTarget.body}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-answer">
                  {answerTarget.answer ? "ویرایش پاسخ" : "متن پاسخ"}
                </Label>
                <Textarea
                  id="review-answer"
                  rows={3}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="resize-none"
                  placeholder="پاسخ شما به این نظر…"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setAnswerTarget(null);
                setAnswerText("");
              }}
              disabled={answerMutation.isPending}
            >
              انصراف
            </Button>
            <Button
              disabled={!answerText.trim() || answerMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void saveAnswer();
              }}
            >
              {answerMutation.isPending ? (
                <Loader2
                  className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : null}
              ثبت پاسخ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------- Delete product review ------------------------------- */}
      <AlertDialog
        open={!!deleteProductTarget}
        onOpenChange={(o) => {
          if (!o && !deleteProductMutation.isPending) {
            setDeleteProductTarget(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              حذف نظر محصول
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                این نظر برای همیشه حذف می‌شود و قابل بازگشت نیست.
              </span>
              {deleteProductTarget && (
                <span className="block rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
                  کاربر:{" "}
                  <span className="font-medium text-foreground">
                    {deleteProductTarget.userName || "—"}
                  </span>
                  {" · "}
                  محصول:{" "}
                  <span className="font-medium text-foreground">
                    {deleteProductTarget.productName || "—"}
                  </span>
                  {" · "}
                  امتیاز:{" "}
                  <span className="font-medium text-foreground">
                    {deleteProductTarget.rating.toLocaleString("fa-IR")} / ۵
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!deleteProductTarget) return;
                void deleteProductMutation
                  .mutateAsync(deleteProductTarget.id)
                  .then(() => setDeleteProductTarget(null));
              }}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
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

      {/* ------------------------------- Delete coach review ------------------------------- */}
      <AlertDialog
        open={!!deleteCoachTarget}
        onOpenChange={(o) => {
          if (!o && !deleteCoachMutation.isPending) {
            setDeleteCoachTarget(null);
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              حذف نظر مربی
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                این نظر برای همیشه حذف می‌شود و قابل بازگشت نیست.
              </span>
              {deleteCoachTarget && (
                <span className="block rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
                  نویسنده:{" "}
                  <span className="font-medium text-foreground">
                    {deleteCoachTarget.isAnonymous
                      ? "ناشناس"
                      : deleteCoachTarget.authorName || "—"}
                  </span>
                  {" · "}
                  مربی:{" "}
                  <span className="font-medium text-foreground">
                    {deleteCoachTarget.coachName || "—"}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel disabled={deleteCoachMutation.isPending}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!deleteCoachTarget) return;
                void deleteCoachMutation
                  .mutateAsync(deleteCoachTarget.id)
                  .then(() => setDeleteCoachTarget(null));
              }}
              disabled={deleteCoachMutation.isPending}
            >
              {deleteCoachMutation.isPending ? (
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
