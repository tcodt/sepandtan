"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Apple,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useAdminFoods,
  useCreateFood,
  useUpdateFood,
  useDeleteFood,
} from "@/features/admin/food/hooks/use-admin-food";
import type { FoodAdmin } from "@/features/admin/food/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 30;
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;

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
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Parses a string from the input into a number. Accepts "", "12", "12.5".
 * Returns 0 for empty, NaN never escapes.
 */
const numericField = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\d+(?:\.\d+)?$/.test(v),
      `${label} باید عدد غیرمنفی باشد`,
    )
    .transform((v) => (v ? Number(v) : 0));

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "حداقل ۲ کاراکتر")
    .max(120, "حداکثر ۱۲۰ کاراکتر"),
  caloriesPer100g: numericField("کالری").refine(
    (n) => n > 0,
    "کالری باید بزرگ‌تر از صفر باشد",
  ),
  proteinPer100g: numericField("پروتئین"),
  carbsPer100g: numericField("کربوهیدرات"),
  fatPer100g: numericField("چربی"),
  isActive: z.boolean(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const EMPTY_FORM: FormInput = {
  name: "",
  caloriesPer100g: "",
  proteinPer100g: "",
  carbsPer100g: "",
  fatPer100g: "",
  isActive: true,
};

/* -------------------------------------------------------------------------- */
/* Macro math                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Calories per gram: protein 4, carbs 4, fat 9.
 * Returns percentages that sum to ~100 when caloric total is > 0.
 */
function macroSplit(item: {
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}) {
  const pCal = item.proteinPer100g * 4;
  const cCal = item.carbsPer100g * 4;
  const fCal = item.fatPer100g * 9;
  const total = pCal + cCal + fCal;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((pCal / total) * 100),
    carbs: Math.round((cCal / total) * 100),
    fat: Math.round((fCal / total) * 100),
  };
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 text-[10px] font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-zinc-400",
        )}
        aria-hidden="true"
      />
      {active ? "فعال" : "غیرفعال"}
    </Badge>
  );
}

function MacroBar({
  item,
}: {
  item: Pick<FoodAdmin, "proteinPer100g" | "carbsPer100g" | "fatPer100g">;
}) {
  const split = macroSplit(item);
  const hasMacros = split.protein + split.carbs + split.fat > 0;
  if (!hasMacros) return null;
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`پروتئین ${split.protein}٪، کربوهیدرات ${split.carbs}٪، چربی ${split.fat}٪`}
    >
      <div
        className="bg-rose-500"
        style={{ width: `${split.protein}%` }}
        title={`پروتئین ${split.protein}٪`}
      />
      <div
        className="bg-amber-500"
        style={{ width: `${split.carbs}%` }}
        title={`کربوهیدرات ${split.carbs}٪`}
      />
      <div
        className="bg-sky-500"
        style={{ width: `${split.fat}%` }}
        title={`چربی ${split.fat}٪`}
      />
    </div>
  );
}

function MacroLine({ item }: { item: FoodAdmin }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Flame className="h-3 w-3 text-orange-500" aria-hidden="true" />
        <span className="tabular-nums text-foreground">
          {item.caloriesPer100g.toLocaleString("fa-IR")}
        </span>
        کالری
      </span>
      <span className="inline-flex items-center gap-1">
        <Beef className="h-3 w-3 text-rose-500" aria-hidden="true" />
        <span className="tabular-nums">
          {item.proteinPer100g.toLocaleString("fa-IR")}g
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Wheat className="h-3 w-3 text-amber-500" aria-hidden="true" />
        <span className="tabular-nums">
          {item.carbsPer100g.toLocaleString("fa-IR")}g
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Droplet className="h-3 w-3 text-sky-500" aria-hidden="true" />
        <span className="tabular-nums">
          {item.fatPer100g.toLocaleString("fa-IR")}g
        </span>
      </span>
      <span className="text-muted-foreground/70">/ ۱۰۰g</span>
    </div>
  );
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری غذاها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-1.5 w-32 rounded-full" />
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
          <Apple className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasSearch
              ? "غذایی با این جستجو یافت نشد"
              : "هنوز غذایی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasSearch
              ? "عبارت جستجو را تغییر دهید یا پاک کنید."
              : "اولین غذا را برای بانک غذایی رژیم بسازید."}
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
            ایجاد اولین غذا
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
            دریافت غذاها ناموفق بود
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

export default function AdminFoodPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FoodAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodAdmin | null>(null);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const filters = useMemo(
    () => ({ search: search || undefined, page, limit: pageSize }),
    [search, page, pageSize],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminFoods(filters);
  const createMutation = useCreateFood();
  const updateMutation = useUpdateFood();
  const deleteMutation = useDeleteFood();

  const items = data?.data ?? [];
  const total = data?.pagination.total ?? items.length;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasSearch = !!search;
  const saving = createMutation.isPending || updateMutation.isPending;

  /* --------------------------- Debounced search --------------------------- */

  const commitSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  // Clamp page when total shrinks after delete.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ------------------------------ Form setup ------------------------------ */

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  // Hook-based watch — no React Compiler skip.
  const isActiveValue = useWatch({ control: form.control, name: "isActive" });
  const isDirty = form.formState.isDirty;

  /* ---------------------------- Open handlers ---------------------------- */

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset(EMPTY_FORM);
    setEditorOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: FoodAdmin) => {
      setEditing(item);
      form.reset({
        name: item.name,
        caloriesPer100g: String(item.caloriesPer100g),
        proteinPer100g: String(item.proteinPer100g),
        carbsPer100g: String(item.carbsPer100g),
        fatPer100g: String(item.fatPer100g),
        isActive: item.isActive,
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

  const onSubmit = form.handleSubmit(
    async (values) => {
      const input = {
        name: values.name.trim(),
        caloriesPer100g: values.caloriesPer100g,
        proteinPer100g: values.proteinPer100g,
        carbsPer100g: values.carbsPer100g,
        fatPer100g: values.fatPer100g,
        isActive: values.isActive,
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
    },
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) {
        const el = document.getElementById(`food-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | null)?.focus?.();
      }
    },
  );

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
            <Apple className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              غذاها
            </h1>
            <p className="text-xs text-muted-foreground">
              بانک غذایی رژیم — مقادیر در هر ۱۰۰ گرم
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
            غذای جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="جستجو" className="space-y-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor={searchId} className="sr-only">
            جستجوی غذا
          </label>
          <Input
            id={searchId}
            placeholder="جستجوی نام غذا…"
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
              : `${total.toLocaleString("fa-IR")} غذا${
                  hasSearch ? " (با جستجو)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست غذاها" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ListSkeleton />
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
              setPage(1);
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <ActiveBadge active={item.isActive} />
                    </div>
                    <MacroLine item={item} />
                    <MacroBar item={item} />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                      aria-label={`ویرایش ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`حذف ${item.name}`}
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

      {/* ----------------------------- Pagination ----------------------------- */}
      {items.length > 0 && !isError && (
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
                htmlFor="food-page-size"
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
                  id="food-page-size"
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

      {/* ----------------------------- Editor ----------------------------- */}
      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md"
        >
          <DialogHeader className="p-3">
            <DialogTitle className="text-start">
              {editing ? "ویرایش غذا" : "غذای جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "نام و مقادیر غذایی را ویرایش کنید. مقادیر در هر ۱۰۰ گرم است."
                : "غذای جدید را با مقادیر در هر ۱۰۰ گرم تعریف کنید."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="food-name">نام</Label>
              <Input
                id="food-name"
                className="h-11"
                autoFocus
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="food-caloriesPer100g" className="text-xs">
                  کالری / ۱۰۰g
                </Label>
                <Input
                  id="food-caloriesPer100g"
                  type="text"
                  inputMode="decimal"
                  className="h-10 tabular-nums"
                  {...form.register("caloriesPer100g")}
                  aria-invalid={!!form.formState.errors.caloriesPer100g}
                />
                {form.formState.errors.caloriesPer100g && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.caloriesPer100g.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-proteinPer100g" className="text-xs">
                  پروتئین (g)
                </Label>
                <Input
                  id="food-proteinPer100g"
                  type="text"
                  inputMode="decimal"
                  className="h-10 tabular-nums"
                  {...form.register("proteinPer100g")}
                  aria-invalid={!!form.formState.errors.proteinPer100g}
                />
                {form.formState.errors.proteinPer100g && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.proteinPer100g.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-carbsPer100g" className="text-xs">
                  کربوهیدرات (g)
                </Label>
                <Input
                  id="food-carbsPer100g"
                  type="text"
                  inputMode="decimal"
                  className="h-10 tabular-nums"
                  {...form.register("carbsPer100g")}
                  aria-invalid={!!form.formState.errors.carbsPer100g}
                />
                {form.formState.errors.carbsPer100g && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.carbsPer100g.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-fatPer100g" className="text-xs">
                  چربی (g)
                </Label>
                <Input
                  id="food-fatPer100g"
                  type="text"
                  inputMode="decimal"
                  className="h-10 tabular-nums"
                  {...form.register("fatPer100g")}
                  aria-invalid={!!form.formState.errors.fatPer100g}
                />
                {form.formState.errors.fatPer100g && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.fatPer100g.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <Label htmlFor="food-active" className="cursor-pointer">
                فعال باشد
              </Label>
              <Switch
                id="food-active"
                checked={isActiveValue}
                onCheckedChange={(v) =>
                  form.setValue("isActive", v, { shouldDirty: true })
                }
              />
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
                  حذف غذا
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{deleteTarget?.name}» حذف می‌شود. اگر در رژیم‌ها استفاده شده
                  باشد ممکن است بک‌اند خطا بدهد.
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
