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
  FileText,
  Trash2,
  Inbox,
  Dumbbell,
  Apple,
  Layers,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
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
  useAdminUserPlans,
  useDeleteAdminUserPlan,
} from "@/features/admin/user-plans/hooks/use-admin-user-plans";
import type {
  AdminUserPlanItem,
  UserPlanStatus,
  UserPlanType,
} from "@/features/admin/user-plans/types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const STATUS_OPTIONS: { value: UserPlanStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "همه وضعیت‌ها" },
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "ACTIVE", label: "فعال" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "CANCELLED", label: "لغو شده" },
];

const STATUS_LABEL: Record<UserPlanStatus, string> = {
  DRAFT: "پیش‌نویس",
  ACTIVE: "فعال",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغو شده",
};

const STATUS_STYLE: Record<
  UserPlanStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  ACTIVE: {
    variant: "default",
    dot: "bg-emerald-500",
  },
  DRAFT: {
    variant: "secondary",
    dot: "bg-muted-foreground",
  },
  COMPLETED: {
    variant: "outline",
    dot: "bg-sky-500",
  },
  CANCELLED: {
    variant: "destructive",
    dot: "bg-destructive",
  },
};

const TYPE_META: Record<
  UserPlanType,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  WORKOUT: { label: "ورزشی", Icon: Dumbbell },
  DIET: { label: "غذایی", Icon: Apple },
  ALL: { label: "ترکیبی", Icon: Layers },
};

const dateFmt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" });

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
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? "") + (parts[1][0] ?? "");
}

/** Deterministic small palette so avatars don't all look the same. */
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
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardContent>
    </Card>
  );
}

function PlanRow({
  item,
  onDelete,
}: {
  item: AdminUserPlanItem;
  onDelete: () => void;
}) {
  const typeMeta = TYPE_META[item.type];
  const TypeIcon = typeMeta.Icon;
  const statusMeta = STATUS_STYLE[item.status];

  return (
    <Card className="group border-border/60 transition-all duration-150 ease-out hover:-translate-y-px hover:border-border hover:shadow-sm motion-reduce:transition-none">
      <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
        {/* Coach avatar */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset ring-white/10",
            avatarTone(item.coachId ?? item.coachName ?? item.id),
          )}
          aria-hidden="true"
        >
          {initials(item.coachName)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title + badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="max-w-full truncate text-sm font-semibold text-foreground">
              {item.title}
            </p>
            <Badge
              variant={statusMeta.variant}
              className="gap-1 rounded-full px-2 py-0 text-[10px] font-medium"
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)}
                aria-hidden="true"
              />
              {STATUS_LABEL[item.status]}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 rounded-full px-2 py-0 text-[10px] font-medium text-muted-foreground"
            >
              <TypeIcon className="h-2.5 w-2.5" aria-hidden="true" />
              {typeMeta.label}
            </Badge>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.userName || "بدون کاربر"}</span>
            </span>
            <span className="hidden text-muted-foreground/50 sm:inline">·</span>
            <span className="truncate">مربی: {item.coachName || "—"}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
            <span>{formatDate(item.startDate)}</span>
            <ChevronLeft
              className="h-3 w-3 text-muted-foreground/60 rtl:hidden"
              aria-hidden="true"
            />
            <ChevronRight
              className="hidden h-3 w-3 text-muted-foreground/60 rtl:inline"
              aria-hidden="true"
            />
            <span>{formatDate(item.endDate)}</span>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-8 w-8 shrink-0 text-muted-foreground",
            "transition-colors duration-150",
            "hover:bg-destructive/10 hover:text-destructive",
            "focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
          )}
          onClick={onDelete}
          aria-label={`حذف برنامه ${item.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
  variant,
  onClear,
}: {
  variant: "no-data" | "filtered";
  onClear: () => void;
}) {
  const isFiltered = variant === "filtered";
  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          {isFiltered ? (
            <Filter className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Inbox className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isFiltered
              ? "برنامه‌ای با این فیلترها یافت نشد"
              : "برنامه‌ای یافت نشد"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {isFiltered
              ? "می‌توانید فیلترها را تغییر دهید یا پاک کنید."
              : "هنوز هیچ برنامه کاربری در سیستم ثبت نشده است."}
          </p>
        </div>
        {isFiltered && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminUserPlansPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<UserPlanStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUserPlanItem | null>(
    null,
  );

  const searchId = useId();
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
    useAdminUserPlans(filters);
  const deleteMutation = useDeleteAdminUserPlan();

  const items = useMemo(() => {
    const list = data?.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.userName?.toLowerCase().includes(q) ||
        item.coachName?.toLowerCase().includes(q) ||
        item.id.includes(q),
    );
  }, [data?.data, search]);

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasFilters = search.length > 0 || status !== "ALL";

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* Cmd/Ctrl+K focuses search. */
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      /* hook toast */
    }
  };

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setPage(1);
  }, []);

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const isDebouncing = searchInput.trim() !== search;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-4">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              برنامه‌های کاربران
            </h1>
            <p className="text-xs text-muted-foreground">
              نظارت بر برنامه‌ها · حذف فقط در موارد اضطراری
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
      <section className="space-y-2" aria-label="فیلترها">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor={searchId} className="sr-only">
              جستجوی برنامه‌ها
            </label>
            <Input
              id={searchId}
              ref={searchRef}
              placeholder="عنوان، کاربر، مربی یا شناسه…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 ps-10 pe-16"
              type="search"
            />
            <div className="absolute inset-y-0 inset-e-2 my-auto flex items-center gap-1">
              {searchInput ? (
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
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
              setStatus(v as UserPlanStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-44"
              aria-label="فیلتر وضعیت"
            >
              <SelectValue />
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

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">فیلترها:</span>
            {status !== "ALL" && (
              <ActiveFilterChip
                label={`وضعیت: ${STATUS_LABEL[status as UserPlanStatus]}`}
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

      {/* ------------------------- Result count / live region ------------------------- */}
      <p
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
                : `${rangeStart.toLocaleString("fa-IR")}–${rangeEnd.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} برنامه`}
      </p>

      {/* ------------------------------- List ------------------------------- */}
      <section aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle
                  className="h-5 w-5 text-destructive"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm font-semibold text-foreground">
                دریافت برنامه‌ها ناموفق بود
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {displayError}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                >
                  تلاش دوباره
                </Button>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState
            variant={hasFilters ? "filtered" : "no-data"}
            onClear={clearAllFilters}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <PlanRow
                key={item.id}
                item={item}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------- Pagination ------------------------------- */}
      {!isLoading && !isError && totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی برنامه‌ها"
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
              حذف اضطراری برنامه
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                برنامه «{deleteTarget?.title}» برای همیشه حذف می‌شود. این عمل
                قابل بازگشت نیست.
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
                    {STATUS_LABEL[deleteTarget.status]}
                  </span>
                </span>
              )}
              <span className="block rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-[11px] text-destructive">
                این گزینه صرفاً برای موارد اضطراری است. پیش از حذف، از اطلاع
                کاربر و مربی مطمئن شوید.
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
