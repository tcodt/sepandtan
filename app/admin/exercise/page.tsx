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
  Activity,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Film,
  Timer,
  Flame,
  Dumbbell,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useAdminExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from "@/features/admin/exercise/hooks/use-admin-exercise";
import { useAdminMuscleGroups } from "@/features/admin/muscle-group/hooks/use-admin-muscle-group";
import type {
  ExerciseAdmin,
  ExerciseLevel,
} from "@/features/admin/exercise/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const LEVEL_LABEL: Record<ExerciseLevel, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

const LEVEL_STYLES: Record<ExerciseLevel, string> = {
  BEGINNER:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  INTERMEDIATE:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  ADVANCED:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
};

const LEVEL_DOT: Record<ExerciseLevel, string> = {
  BEGINNER: "bg-emerald-500",
  INTERMEDIATE: "bg-amber-500",
  ADVANCED: "bg-rose-500",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[]): string {
  return (arr ?? []).join("\n");
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
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

const numericString = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d+$/.test(v), "فقط عدد صحیح غیرمنفی")
  .transform((v) => (v ? Number(v) : null));

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    "آدرس باید با http:// یا https:// شروع شود",
  );

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "حداقل ۲ کاراکتر")
    .max(120, "حداکثر ۱۲۰ کاراکتر"),
  slug: z
    .string()
    .trim()
    .min(2, "slug الزامی است")
    .max(120, "حداکثر ۱۲۰ کاراکتر")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "فقط حروف کوچک انگلیسی، عدد و خط تیره",
    ),
  description: z
    .string()
    .max(2000, "حداکثر ۲۰۰۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  noticText: z.string().optional().or(z.literal("")),
  stepActionText: z.string().optional().or(z.literal("")),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  isActive: z.boolean(),
  durationMin: numericString,
  caloriesMin: numericString,
  caloriesMax: numericString,
  coverImg: urlOrEmpty,
  gif: urlOrEmpty,
  video: urlOrEmpty,
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const EMPTY_FORM: FormInput = {
  title: "",
  slug: "",
  description: "",
  noticText: "",
  stepActionText: "",
  level: "BEGINNER",
  isActive: true,
  durationMin: "",
  caloriesMin: "",
  caloriesMax: "",
  coverImg: "",
  gif: "",
  video: "",
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function LevelBadge({ level }: { level: ExerciseLevel }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[10px] font-medium", LEVEL_STYLES[level])}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", LEVEL_DOT[level])}
        aria-hidden="true"
      />
      {LEVEL_LABEL[level]}
    </Badge>
  );
}

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

function ExerciseThumb({ exercise }: { exercise: ExerciseAdmin }) {
  const [failed, setFailed] = useState(false);
  if (exercise.coverImg && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={exercise.coverImg}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  );
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری تمرین‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-start gap-3 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full max-w-md" />
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
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Activity
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasFilters
              ? "تمرینی با این فیلترها یافت نشد"
              : "هنوز تمرینی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید."
              : "اولین حرکت را برای بانک تمرین‌ها بسازید."}
          </p>
        </div>
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        ) : (
          <Button size="sm" onClick={onCreate}>
            <Plus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            ایجاد اولین تمرین
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
            دریافت تمرین‌ها ناموفق بود
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

export default function AdminExercisePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<ExerciseLevel | "ALL">("ALL");
  const [activeFilter, setActiveFilter] = useState<boolean | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseAdmin | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [muscleIds, setMuscleIds] = useState<string[]>([]);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const filters = useMemo(
    () => ({
      search: search || undefined,
      page,
      limit: pageSize,
      level: levelFilter,
      isActive: activeFilter,
    }),
    [search, page, pageSize, levelFilter, activeFilter],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminExercises(filters);
  const { data: musclesData } = useAdminMuscleGroups({ limit: 100 });
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const items = data?.data ?? [];
  const muscles = useMemo(() => musclesData?.data ?? [], [musclesData?.data]);
  const total = data?.pagination.total ?? items.length;
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasFilters =
    !!search || levelFilter !== "ALL" || activeFilter !== "ALL";
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

  // Hook-based watches — no React Compiler skip.
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const levelValue = useWatch({ control: form.control, name: "level" });
  const isActiveValue = useWatch({ control: form.control, name: "isActive" });
  const coverImgValue = useWatch({ control: form.control, name: "coverImg" });
  const isDirty = form.formState.isDirty;

  /* --------------------------- Auto-slug handler -------------------------- */

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!slugTouched) {
        const latin = toSlug(next);
        if (latin.length >= 2) {
          form.setValue("slug", latin, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    },
    [form, slugTouched],
  );

  /* ---------------------------- Open handlers ---------------------------- */

  const openCreate = useCallback(() => {
    setEditing(null);
    setSlugTouched(false);
    setMuscleIds([]);
    form.reset(EMPTY_FORM);
    setEditorOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: ExerciseAdmin) => {
      setEditing(item);
      setSlugTouched(true);
      setMuscleIds(item.muscleIds ?? []);
      form.reset({
        title: item.title,
        slug: item.slug,
        description: item.description ?? "",
        noticText: arrayToLines(item.notic),
        stepActionText: arrayToLines(item.stepAction),
        level: item.level,
        isActive: item.isActive,
        durationMin: item.durationMin != null ? String(item.durationMin) : "",
        caloriesMin: item.caloriesMin != null ? String(item.caloriesMin) : "",
        caloriesMax: item.caloriesMax != null ? String(item.caloriesMax) : "",
        coverImg: item.coverImg ?? "",
        gif: item.gif ?? "",
        video: item.video ?? "",
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

  /* ---------------------------- Muscle pills ---------------------------- */

  const toggleMuscle = useCallback((id: string) => {
    setMuscleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clearMuscles = useCallback(() => setMuscleIds([]), []);

  const selectAllMuscles = useCallback(() => {
    setMuscleIds(muscles.map((m) => m.id));
  }, [muscles]);

  /* ------------------------------ Submit ------------------------------ */

  const onSubmit = form.handleSubmit(
    async (values) => {
      const input = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || null,
        notic: linesToArray(values.noticText ?? ""),
        stepAction: linesToArray(values.stepActionText ?? ""),
        level: values.level,
        isActive: values.isActive,
        durationMin: values.durationMin,
        caloriesMin: values.caloriesMin,
        caloriesMax: values.caloriesMax,
        coverImg: values.coverImg?.trim() || null,
        gif: values.gif?.trim() || null,
        video: values.video?.trim() || null,
        muscleIds,
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
      // Scroll first errored field into view — 15-field form needs this.
      const first = Object.keys(errors)[0];
      if (first) {
        const el = document.getElementById(`exercise-${first}`);
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
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              تمرین‌ها
            </h1>
            <p className="text-xs text-muted-foreground">
              بانک حرکات و تمرینات
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
            تمرین جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی تمرین
            </label>
            <Input
              id={searchId}
              placeholder="جستجوی عنوان یا slug…"
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

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v as ExerciseLevel | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10 w-full sm:w-36"
                aria-label="فیلتر سطح"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ALL">همه سطوح</SelectItem>
                <SelectItem value="BEGINNER">مبتدی</SelectItem>
                <SelectItem value="INTERMEDIATE">متوسط</SelectItem>
                <SelectItem value="ADVANCED">پیشرفته</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                activeFilter === "ALL"
                  ? "ALL"
                  : activeFilter
                    ? "ACTIVE"
                    : "INACTIVE"
              }
              onValueChange={(v) => {
                setActiveFilter(
                  v === "ALL" ? "ALL" : v === "ACTIVE" ? true : false,
                );
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10 w-full sm:w-32"
                aria-label="فیلتر وضعیت"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="ALL">همه</SelectItem>
                <SelectItem value="ACTIVE">فعال</SelectItem>
                <SelectItem value="INACTIVE">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 self-start text-muted-foreground sm:self-auto"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setLevelFilter("ALL");
                setActiveFilter("ALL");
                setPage(1);
              }}
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
            : isError
              ? "—"
              : `${total.toLocaleString("fa-IR")} تمرین${
                  hasFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست تمرین‌ها" aria-busy={isLoading || isFetching}>
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
            hasFilters={hasFilters}
            onCreate={openCreate}
            onClear={() => {
              setSearchInput("");
              setSearch("");
              setLevelFilter("ALL");
              setActiveFilter("ALL");
              setPage(1);
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    <ExerciseThumb exercise={item} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <LevelBadge level={item.level} />
                      <ActiveBadge active={item.isActive} />
                    </div>
                    <p
                      dir="ltr"
                      className="truncate text-start font-mono text-[11px] text-muted-foreground"
                    >
                      {item.slug}
                    </p>
                    {item.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    {(item.durationMin ||
                      item.caloriesMin ||
                      item.caloriesMax) && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {item.durationMin != null && (
                          <span className="inline-flex items-center gap-1">
                            <Timer className="h-3 w-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {item.durationMin.toLocaleString("fa-IR")} دقیقه
                            </span>
                          </span>
                        )}
                        {(item.caloriesMin != null ||
                          item.caloriesMax != null) && (
                          <span className="inline-flex items-center gap-1">
                            <Flame className="h-3 w-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {item.caloriesMin != null
                                ? item.caloriesMin.toLocaleString("fa-IR")
                                : "?"}
                              {" – "}
                              {item.caloriesMax != null
                                ? item.caloriesMax.toLocaleString("fa-IR")
                                : "?"}{" "}
                              کالری
                            </span>
                          </span>
                        )}
                        {item.muscleIds.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" aria-hidden="true" />
                            {item.muscleIds.length.toLocaleString("fa-IR")} عضله
                          </span>
                        )}
                      </div>
                    )}
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
                htmlFor="exercise-page-size"
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
                  id="exercise-page-size"
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
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader className="p-3">
            <DialogTitle className="text-start">
              {editing ? "ویرایش تمرین" : "تمرین جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "اطلاعات تمرین را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود."
                : "تمرین جدید را با عنوان، سطح و رسانه تعریف کنید."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* --- Section: basics --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                اطلاعات اصلی
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="exercise-title">عنوان</Label>
                  <Input
                    id="exercise-title"
                    className="h-11"
                    autoFocus
                    {...form.register("title", {
                      onChange: handleTitleChange,
                    })}
                    aria-invalid={!!form.formState.errors.title}
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exercise-slug">slug (یکتا)</Label>
                    {slugValue && (
                      <span
                        dir="ltr"
                        className="font-mono text-[10px] text-muted-foreground"
                      >
                        {slugValue}
                      </span>
                    )}
                  </div>
                  <Input
                    id="exercise-slug"
                    dir="ltr"
                    className="h-11 font-mono text-sm"
                    {...form.register("slug", {
                      onChange: () => setSlugTouched(true),
                    })}
                    aria-invalid={!!form.formState.errors.slug}
                  />
                  {form.formState.errors.slug && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise-level">سطح</Label>
                  <Select
                    value={levelValue}
                    onValueChange={(v) =>
                      form.setValue("level", v as ExerciseLevel, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="exercise-level" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="BEGINNER">مبتدی</SelectItem>
                      <SelectItem value="INTERMEDIATE">متوسط</SelectItem>
                      <SelectItem value="ADVANCED">پیشرفته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Label htmlFor="exercise-active" className="cursor-pointer">
                    فعال باشد
                  </Label>
                  <Switch
                    id="exercise-active"
                    checked={isActiveValue}
                    onCheckedChange={(v) =>
                      form.setValue("isActive", v, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </div>
            </fieldset>

            {/* --- Section: text --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                توضیحات و دستورالعمل
              </legend>

              <div className="space-y-2">
                <Label htmlFor="exercise-description">توضیحات</Label>
                <Textarea
                  id="exercise-description"
                  rows={3}
                  className="resize-none"
                  {...form.register("description")}
                  aria-invalid={!!form.formState.errors.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-notic">نکات (هر خط یک مورد)</Label>
                <Textarea
                  id="exercise-notic"
                  rows={3}
                  className="resize-none"
                  placeholder={"کمر صاف باشد\nنفس را حبس نکنید"}
                  {...form.register("noticText")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-steps">
                  مراحل انجام (هر خط یک مرحله)
                </Label>
                <Textarea
                  id="exercise-steps"
                  rows={3}
                  className="resize-none"
                  {...form.register("stepActionText")}
                />
              </div>
            </fieldset>

            {/* --- Section: muscles --- */}
            {muscles.length > 0 ? (
              <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                  <legend className="text-xs font-semibold text-muted-foreground">
                    گروه‌های عضلانی
                    {muscleIds.length > 0 && (
                      <span className="ms-1.5 text-[10px] text-primary">
                        ({muscleIds.length.toLocaleString("fa-IR")} انتخاب شده)
                      </span>
                    )}
                  </legend>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={selectAllMuscles}
                      disabled={muscleIds.length === muscles.length}
                    >
                      انتخاب همه
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={clearMuscles}
                      disabled={muscleIds.length === 0}
                    >
                      پاک کردن
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {muscles.map((m) => {
                    const active = muscleIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMuscle(m.id)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {active && (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        )}
                        {m.title}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {/* --- Section: metrics --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                معیارها (اختیاری)
              </legend>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="exercise-duration"
                    className="text-xs text-muted-foreground"
                  >
                    مدت (دقیقه)
                  </Label>
                  <Input
                    id="exercise-duration"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-10 tabular-nums"
                    {...form.register("durationMin")}
                    aria-invalid={!!form.formState.errors.durationMin}
                  />
                  {form.formState.errors.durationMin && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.durationMin.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="exercise-calories-min"
                    className="text-xs text-muted-foreground"
                  >
                    کالری min
                  </Label>
                  <Input
                    id="exercise-calories-min"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-10 tabular-nums"
                    {...form.register("caloriesMin")}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="exercise-calories-max"
                    className="text-xs text-muted-foreground"
                  >
                    کالری max
                  </Label>
                  <Input
                    id="exercise-calories-max"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-10 tabular-nums"
                    {...form.register("caloriesMax")}
                  />
                </div>
              </div>
            </fieldset>

            {/* --- Section: media --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                رسانه (اختیاری)
              </legend>

              <div className="space-y-2">
                <Label htmlFor="exercise-cover">کاور (URL)</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {coverImgValue ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImgValue}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <Input
                    id="exercise-cover"
                    dir="ltr"
                    className="h-10 flex-1 font-mono text-xs"
                    placeholder="https://"
                    {...form.register("coverImg")}
                    aria-invalid={!!form.formState.errors.coverImg}
                  />
                </div>
                {form.formState.errors.coverImg && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.coverImg.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-gif">GIF (URL)</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    <Film
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <Input
                    id="exercise-gif"
                    dir="ltr"
                    className="h-10 flex-1 font-mono text-xs"
                    placeholder="https://"
                    {...form.register("gif")}
                    aria-invalid={!!form.formState.errors.gif}
                  />
                </div>
                {form.formState.errors.gif && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.gif.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-video">ویدیو (URL)</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    <Film
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <Input
                    id="exercise-video"
                    dir="ltr"
                    className="h-10 flex-1 font-mono text-xs"
                    placeholder="https://"
                    {...form.register("video")}
                    aria-invalid={!!form.formState.errors.video}
                  />
                </div>
                {form.formState.errors.video && (
                  <p className="text-[10px] text-destructive" role="alert">
                    {form.formState.errors.video.message}
                  </p>
                )}
              </div>
            </fieldset>

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
                  حذف تمرین
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{deleteTarget?.title}» حذف می‌شود. این عملیات قابل بازگشت
                  نیست.
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
