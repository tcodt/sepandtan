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
  Tags,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Hash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useAdminSpecialties,
  useCreateSpecialty,
  useUpdateSpecialty,
  useDeleteSpecialty,
} from "@/features/admin/specialty/hooks/use-admin-specialty";
import type { SpecialtyAdmin } from "@/features/admin/specialty/types";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 100;

/**
 * Latin slug generator. Returns "" when the source text has no Latin letters
 * (e.g. pure Persian), so the caller can decide not to overwrite the field.
 */
function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "حداقل ۲ کاراکتر")
    .max(80, "حداکثر ۸۰ کاراکتر"),
  slug: z
    .string()
    .trim()
    .min(2, "slug الزامی است")
    .max(80, "حداکثر ۸۰ کاراکتر")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "فقط حروف کوچک انگلیسی، عدد و خط تیره",
    ),
});

type FormValues = z.infer<typeof formSchema>;

const EMPTY_FORM: FormValues = { title: "", slug: "" };

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری تخصص‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
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
          <Tags className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasSearch
              ? "تخصصی با این جستجو یافت نشد"
              : "هنوز تخصصی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasSearch
              ? "عبارت جستجو را تغییر دهید یا پاک کنید."
              : "اولین تخصص را برای انتخاب مربی‌ها بسازید."}
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
            ایجاد اولین تخصص
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
            دریافت تخصص‌ها ناموفق بود
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

export default function AdminSpecialtyPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialtyAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpecialtyAdmin | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const filters = useMemo(
    () => ({ search: search || undefined, limit: PAGE_SIZE }),
    [search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminSpecialties(filters);
  const createMutation = useCreateSpecialty();
  const updateMutation = useUpdateSpecialty();
  const deleteMutation = useDeleteSpecialty();

  const items = data?.data ?? [];
  const total = data?.pagination.total ?? items.length;
  const hasSearch = !!search;
  const saving = createMutation.isPending || updateMutation.isPending;

  /* ----------------------------- Debounced search ---------------------------- */

  const commitSearch = useCallback((v: string) => setSearch(v), []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* ------------------------------ Form setup ------------------------------ */

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  // Hook-based, memoizable. Only `slug` is watched — `title` is handled
  // imperatively in `handleTitleChange` so no re-render per keystroke.
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const isDirty = form.formState.isDirty;

  /* ----------------------------- Auto-slug handler ----------------------------- */

  // Derive slug from title on change (event-driven, no effect). If the user
  // typed a manual slug, we stop overwriting. If the title contains no Latin
  // characters (pure Persian), we leave the slug blank so the user can type it.
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
    form.reset(EMPTY_FORM);
    setEditorOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: SpecialtyAdmin) => {
      setEditing(item);
      setSlugTouched(true);
      form.reset({ title: item.title, slug: item.slug });
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
    const input = {
      title: values.title.trim(),
      slug: values.slug.trim(),
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
      // Hook's onError already toasts; keep form open for retry.
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
            <Tags className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              تخصص‌های مربی
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت تخصص‌های قابل انتخاب مربی
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
            تخصص جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="جستجو" className="space-y-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor={searchId} className="sr-only">
            جستجوی تخصص
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
              : `${total.toLocaleString("fa-IR")} تخصص${
                  hasSearch ? " (با جستجو)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست تخصص‌ها" aria-busy={isLoading || isFetching}>
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
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p
                      dir="ltr"
                      className="truncate text-start font-mono text-[11px] text-muted-foreground"
                    >
                      {item.slug}
                    </p>
                    {item.createdAt ? (
                      <p className="text-[10px] tabular-nums text-muted-foreground">
                        {formatDate(item.createdAt)}
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
          <DialogHeader className="p-3">
            <DialogTitle className="text-start">
              {editing ? "ویرایش تخصص" : "تخصص جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "عنوان و slug را ویرایش کنید."
                : "تخصص جدید را با عنوان فارسی و slug انگلیسی یکتا بسازید."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialty-title">عنوان (فارسی)</Label>
              <Input
                id="specialty-title"
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="specialty-slug">slug (یکتا)</Label>
                {slugValue && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                    <span dir="ltr" className="font-mono">
                      {slugValue}
                    </span>
                  </span>
                )}
              </div>
              <Input
                id="specialty-slug"
                dir="ltr"
                className="h-11 font-mono text-sm"
                placeholder="weight-loss"
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
              <p className="text-[11px] text-muted-foreground">
                برای عنوان فارسی، slug را دستی انگلیسی وارد کنید. حروف کوچک، عدد
                و خط تیره مجاز است.
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
                  حذف تخصص
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{deleteTarget?.title}» حذف می‌شود. اگر به مربی‌ها وصل باشد
                  ممکن است بک‌اند خطا بدهد.
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
