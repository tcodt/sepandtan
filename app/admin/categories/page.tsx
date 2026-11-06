"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Tags,
  RefreshCw,
  FolderTree,
  Folder,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Hash,
} from "lucide-react";

import {
  useCategoriesAdmin,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategorySelector,
} from "@/features/catalog/categories/hooks";
import type { CategoryAdmin } from "@/features/catalog/types";
import { toSlug } from "@/features/catalog/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

const formSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  slug: z
    .string()
    .min(2, "اسلاگ لازم است")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "فقط حروف کوچک انگلیسی، عدد و خط تیره",
    ),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const EMPTY_DEFAULTS: FormInput = {
  name: "",
  slug: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
};

/* -------------------------------------------------------------------------- */
/*                                Sub-components                              */
/* -------------------------------------------------------------------------- */

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        isActive
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
      )}
    >
      {isActive ? "فعال" : "غیرفعال"}
    </Badge>
  );
}

function CategorySkeletonRow() {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </li>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <FolderTree
          className="h-7 w-7 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          هنوز دسته‌ای ایجاد نشده
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          دسته‌بندی‌ها ساختار فروشگاه شما را می‌سازند. با اولین دسته شروع کنید.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="me-1 h-4 w-4" />
        ساخت اولین دسته
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
        <AlertTriangle
          className="h-7 w-7 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          خطا در دریافت دسته‌بندی‌ها
        </h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          اتصال را بررسی کنید یا دوباره تلاش کنید.
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="me-1 h-4 w-4" />
        تلاش دوباره
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Page                                        */
/* -------------------------------------------------------------------------- */

export default function AdminCategoriesPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryAdmin | null>(
    null,
  );

  const filters = useMemo(
    () => ({ page, limit: PAGE_SIZE, order: "desc" as const }),
    [page],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useCategoriesAdmin(filters);
  const { data: selector = [] } = useCategorySelector(false);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = data?.categories ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const watchedParentId = useWatch({
    control: form.control,
    name: "parentId",
  });
  const watchedIsActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset(EMPTY_DEFAULTS);
    setDialogOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (cat: CategoryAdmin) => {
      setEditing(cat);
      form.reset({
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId ?? "",
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        metaTitle: cat.metaTitle ?? "",
        metaDescription: cat.metaDescription ?? "",
      });
      setDialogOpen(true);
    },
    [form],
  );

  const onSubmit = useCallback(
    async (values: FormOutput) => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        parentId: values.parentId || null,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        metaTitle: values.metaTitle?.trim() || undefined,
        metaDescription: values.metaDescription?.trim() || undefined,
      };

      try {
        if (editing) {
          await updateMutation.mutateAsync({ id: editing.id, payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        setDialogOpen(false);
        setEditing(null);
      } catch {
        // handled by hook (toast)
      }
    },
    [editing, createMutation, updateMutation],
  );

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      {/* ----------------------------- Header ----------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tags className="h-4 w-4" aria-hidden="true" />
            </span>
            دسته‌بندی‌ها
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مدیریت درخت دسته‌بندی فروشگاه
            {isFetching && (
              <span className="ms-1 inline-flex items-center gap-1">
                <Loader2 className="inline h-3 w-3 animate-spin" />
                در حال به‌روزرسانی...
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="بازخوانی"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="me-1 h-4 w-4" />
            دسته جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- List ------------------------------- */}
      <section
        aria-label="لیست دسته‌بندی‌ها"
        aria-busy={isLoading || isFetching}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategorySkeletonRow key={i} />
            ))}
          </ul>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : categories.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {cat.parentId ? (
                        <Folder className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <FolderTree
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <p
                      className="truncate text-sm font-semibold text-foreground"
                      title={cat.name}
                    >
                      {cat.name}
                    </p>
                    <StatusBadge isActive={cat.isActive} />
                    {cat.parentId && (
                      <Badge
                        variant="outline"
                        className="border-sky-500/20 bg-sky-500/10 text-[10px] text-sky-600 dark:text-sky-400"
                      >
                        زیردسته
                      </Badge>
                    )}
                  </div>

                  <p
                    dir="ltr"
                    className="truncate font-mono text-xs text-muted-foreground"
                    title={cat.slug}
                  >
                    /{cat.slug}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3 w-3" aria-hidden="true" />
                      {cat.productCount.toLocaleString("fa-IR")} محصول
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" aria-hidden="true" />
                      ترتیب {cat.sortOrder.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="me-1 h-3.5 w-3.5" aria-hidden="true" />
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingDelete(cat)}
                    aria-label={`حذف ${cat.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline ms-1">حذف</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* --------------------------- Pagination ------------------------- */}
        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {totalPages.toLocaleString("fa-IR")}
              <span className="mx-1">·</span>
              {total.toLocaleString("fa-IR")} دسته
            </p>
            <div className="order-1 flex gap-2 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 flex-1 sm:flex-none"
              >
                <ChevronRight
                  className="me-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronLeft
                  className="me-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 flex-1 sm:flex-none"
              >
                بعدی
                <ChevronLeft
                  className="ms-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronRight
                  className="ms-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------ Create / Edit dialog --------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md"
        >
          <DialogHeader className="ps-4">
            <DialogTitle className="text-start">
              {editing ? "ویرایش دسته‌بندی" : "دسته جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "اطلاعات دسته را به‌روزرسانی کنید."
                : "یک دسته جدید برای ساختار فروشگاه خود بسازید."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">نام</Label>
              <Input
                id="name"
                {...form.register("name")}
                onChange={(e) => {
                  form.setValue("name", e.target.value, {
                    shouldValidate: true,
                  });
                  if (!editing) {
                    form.setValue("slug", toSlug(e.target.value), {
                      shouldValidate: true,
                    });
                  }
                }}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">اسلاگ</Label>
              <Input
                id="slug"
                dir="ltr"
                className="font-mono text-sm"
                {...form.register("slug")}
                aria-invalid={!!form.formState.errors.slug}
                onChange={(e) => {
                  const name = e.target.value;
                  form.setValue("name", name, { shouldValidate: true });
                  if (!editing) {
                    const slug = toSlug(name);
                    // فقط وقتی حداقل یک کاراکتر لاتین در نتیجه هست یا fallback
                    form.setValue("slug", slug, { shouldValidate: true });
                  }
                }}
              />
              {form.formState.errors.slug ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  فقط حروف کوچک انگلیسی، عدد و خط تیره.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>دسته والد (اختیاری)</Label>
              <Select
                value={watchedParentId || "none"}
                onValueChange={(v) =>
                  form.setValue("parentId", v === "none" ? "" : v)
                }
              >
                <SelectTrigger aria-label="دسته والد">
                  <SelectValue placeholder="بدون والد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون والد (ریشه)</SelectItem>
                  {selector
                    .filter((s) => s.id !== editing?.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">ترتیب</Label>
              <Input
                id="sortOrder"
                type="number"
                inputMode="numeric"
                min={0}
                {...form.register("sortOrder")}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="min-w-0">
                <Label
                  htmlFor="isActive"
                  className="cursor-pointer text-sm font-medium"
                >
                  فعال
                </Label>
                <p className="text-xs text-muted-foreground">
                  فقط دسته‌های فعال در فروشگاه نمایش داده می‌شوند.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={watchedIsActive ?? false}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" {...form.register("metaTitle")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Input
                id="metaDescription"
                {...form.register("metaDescription")}
              />
            </div>

            <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ذخیره...
                  </>
                ) : editing ? (
                  "ذخیره تغییرات"
                ) : (
                  "ایجاد دسته"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ----------------------------- Delete ----------------------------- */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.name}» حذف شود؟ اگر محصولی زیر این دسته باشد،
              بک‌اند ممکن است خطا بدهد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={deleteMutation.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                deleteMutation.mutate(pendingDelete.id, {
                  onSettled: () => setPendingDelete(null),
                });
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  حذف...
                </>
              ) : (
                <>
                  <Trash2 className="me-2 h-4 w-4" />
                  حذف
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
