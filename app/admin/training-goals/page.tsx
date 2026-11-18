"use client";

import { useMemo, useState, useCallback, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Target,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  ImageIcon,
  GripVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  useAdminTrainingGoals,
  useCreateTrainingGoal,
  useUpdateTrainingGoal,
  useDeleteTrainingGoal,
} from "@/features/admin/training-goals/hooks/use-admin-training-goals";
import type { TrainingGoalAdmin } from "@/features/admin/training-goals/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 50;

/* -------------------------------------------------------------------------- */
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "حداقل ۲ کاراکتر")
    .max(80, "حداکثر ۸۰ کاراکتر"),
  description: z
    .string()
    .max(2000, "حداکثر ۲۰۰۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  logo: z
    .string()
    .trim()
    .url("آدرس معتبر وارد کن")
    .or(z.literal(""))
    .optional(),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), "فقط عدد صحیح غیرمنفی")
    .transform((v) => (v ? Number(v) : 0))
    .refine((n) => n >= 0 && n <= 9999, "بین ۰ و ۹۹۹۹"),
});

/** What the form fields hold — all strings. */
type FormInput = z.input<typeof formSchema>;
/** What onSubmit receives — sortOrder already a number. */
type FormOutput = z.output<typeof formSchema>;

const EMPTY_FORM: FormInput = {
  title: "",
  description: "",
  logo: "",
  sortOrder: "0",
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function GoalsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری اهداف…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-start gap-3 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GoalLogo({ goal }: { goal: TrainingGoalAdmin }) {
  const [failed, setFailed] = useState(false);
  if (goal.logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={goal.logo}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  );
}

function EmptyState({
  hasSearch,
  onCreate,
  onClearSearch,
}: {
  hasSearch: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Target
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasSearch
              ? "هدفی با این جستجو یافت نشد"
              : "هنوز هدفی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasSearch
              ? "عبارت جستجو را تغییر دهید یا پاک کنید."
              : "اولین هدف تمرینی را برای استفاده در onboarding و کاتالوگ بسازید."}
          </p>
        </div>
        {hasSearch ? (
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن جستجو
          </Button>
        ) : (
          <Button size="sm" onClick={onCreate}>
            <Plus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            ایجاد اولین هدف
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
            دریافت اهداف ناموفق بود
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
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminTrainingGoalsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingGoalAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingGoalAdmin | null>(
    null,
  );

  const searchId = useId();
  const resultCountId = useId();

  // Debounced search → API param.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) setSearch(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const filters = useMemo(
    () => ({ search: search || undefined, limit: PAGE_SIZE }),
    [search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminTrainingGoals(filters);
  const createMutation = useCreateTrainingGoal();
  const updateMutation = useUpdateTrainingGoal();
  const deleteMutation = useDeleteTrainingGoal();

  const items = data?.data ?? [];
  const total = data?.pagination.total ?? items.length;
  const hasSearch = !!search;

  const saving = createMutation.isPending || updateMutation.isPending;

  // React Hook Form — three generics: input type, context, output type.
  // This is the RHF v7 + Zod v4 pattern for transformed fields.
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  const isDirty = form.formState.isDirty;

  /* ---------------------------- Open handlers ---------------------------- */

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset(EMPTY_FORM);
    setEditorOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: TrainingGoalAdmin) => {
      setEditing(item);
      form.reset({
        title: item.title,
        description: item.description ?? "",
        logo: item.logo ?? "",
        sortOrder: String(item.sortOrder ?? 0),
      });
      setEditorOpen(true);
    },
    [form],
  );

  const closeEditor = useCallback(
    (next: boolean) => {
      if (next) return;
      if (saving) return;
      if (isDirty) {
        const ok = window.confirm(
          editing
            ? "تغییرات ذخیره‌نشده دارید. بستن بدون ذخیره؟"
            : "فرم ناقص است. بستن بدون ذخیره؟",
        );
        if (!ok) return;
      }
      setEditorOpen(false);
      setEditing(null);
    },
    [saving, isDirty, editing],
  );

  /* ------------------------------ Submit ------------------------------ */

  const onSubmit = form.handleSubmit(async (values) => {
    // values.sortOrder is already a number here (transformed by zod).
    const input = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      logo: values.logo?.trim() || null,
      sortOrder: values.sortOrder ?? 0,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      setEditorOpen(false);
      setEditing(null);
    } catch {
      // Hook's onError toasts; keep form open for retry.
    }
  });

  /* ----------------------------- Delete ----------------------------- */

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Hook's onError toasts; keep dialog open for retry.
    }
  }, [deleteTarget, deleteMutation]);

  /* ------------------------------- Render ------------------------------- */

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-4xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              اهداف تمرینی
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت اهداف onboarding و کاتالوگ
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              aria-hidden="true"
            />
            بروزرسانی
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            هدف جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="جستجو" className="space-y-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor={searchId} className="sr-only">
            جستجوی هدف تمرینی
          </label>
          <Input
            id={searchId}
            placeholder="جستجوی عنوان یا توضیحات…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && searchInput) {
                setSearchInput("");
                setSearch("");
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
              : `${total.toLocaleString("fa-IR")} هدف${
                  hasSearch ? " (با جستجو)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست اهداف" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <GoalsSkeleton />
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            hasSearch={hasSearch}
            onCreate={openCreate}
            onClearSearch={() => {
              setSearchInput("");
              setSearch("");
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    <GoalLogo goal={item} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <GripVertical
                          className="h-2.5 w-2.5"
                          aria-hidden="true"
                        />
                        ترتیب:{" "}
                        <span className="tabular-nums">
                          {item.sortOrder.toLocaleString("fa-IR")}
                        </span>
                      </span>
                    </div>
                    {item.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                      aria-label={`ویرایش ${item.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`حذف ${item.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------- Editor ----------------------------- */}
      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-start p-3">
              {editing ? "ویرایش هدف تمرینی" : "هدف تمرینی جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "عنوان، توضیحات، لوگو و ترتیب نمایش را ویرایش کنید."
                : "هدف جدید را برای استفاده در onboarding و کاتالوگ تعریف کنید."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">عنوان</Label>
              <Input
                id="goal-title"
                className="h-11"
                autoFocus
                {...form.register("title")}
                aria-invalid={!!form.formState.errors.title}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-description">توضیحات</Label>
              <Textarea
                id="goal-description"
                rows={3}
                className="resize-none"
                {...form.register("description")}
                aria-invalid={!!form.formState.errors.description}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-logo">آدرس لوگو (اختیاری)</Label>
              <Input
                id="goal-logo"
                dir="ltr"
                className="h-11 font-mono text-sm"
                placeholder="https://example.com/logo.png"
                {...form.register("logo")}
                aria-invalid={!!form.formState.errors.logo}
              />
              {form.formState.errors.logo && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.logo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-sort-order">ترتیب نمایش</Label>
              <Input
                id="goal-sort-order"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-11 tabular-nums"
                {...form.register("sortOrder")}
                aria-invalid={!!form.formState.errors.sortOrder}
              />
              {form.formState.errors.sortOrder && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.sortOrder.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                اعداد کمتر اول نمایش داده می‌شوند.
              </p>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeEditor(false)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-1.5 sm:w-auto"
              >
                {saving ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {editing ? "ذخیره" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ----------------------------- Delete ----------------------------- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-start">
                  حذف هدف تمرینی
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{deleteTarget?.title}» حذف می‌شود. اگر در پروفایل کاربران
                  استفاده شده باشد ممکن است بک‌اند خطا بدهد.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={deleteMutation.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2
                    className="me-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  در حال حذف…
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
