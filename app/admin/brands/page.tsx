"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  useBrandsAdmin,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "@/features/catalog/brands/hooks";
import type { BrandAdmin, BrandInput } from "@/features/catalog/types";
import { toSlug } from "@/features/catalog/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

const brandSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  slug: z
    .string()
    .min(2, "اسلاگ لازم است")
    .regex(/^[a-z0-9-]+$/, "فقط حروف لاتین، عدد و -"),
  description: z.string().optional(),
  logo: z.string().optional(),
  sortOrder: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

/* -------------------------------------------------------------------------- */
/* Logo field: preview + URL + upload                                         */
/* -------------------------------------------------------------------------- */

function LogoField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    // Reset the "broken preview" state whenever the URL changes.
    setPreviewError(false);
  }, [value]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("حجم تصویر باید کمتر از ۲ مگابایت باشد");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      // TODO: swap for your real upload endpoint
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = (await res.json()) as { url?: string };
      if (!json?.url) throw new Error("پاسخ سرور فاقد url است");
      onChange(json.url);
      toast.success("لوگو آپلود شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "آپلود لوگو ناموفق بود");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const hasPreview = !!value && !previewError;

  return (
    <div className="space-y-2">
      <Label htmlFor="brand-logo">لوگو (اختیاری)</Label>

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border",
            hasPreview ? "bg-muted/30" : "bg-muted/40 text-muted-foreground",
          )}
        >
          {hasPreview ? (
            // Use plain <img> for arbitrary external URLs (next/image needs config)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="پیش‌نمایش لوگو"
              className="h-full w-full object-contain"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        {/* URL input + actions */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              id="brand-logo"
              dir="ltr"
              className="font-mono text-sm"
              placeholder="https://… یا /path"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || uploading}
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => onChange("")}
                aria-label="پاک کردن لوگو"
                disabled={disabled || uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0"
              onClick={handlePick}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="me-2 h-4 w-4" />
              )}
              آپلود
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            می‌توانید آدرس تصویر را وارد کنید یا فایل را آپلود کنید. حداکثر ۲
            مگابایت.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Brand Form Sheet                                                           */
/* -------------------------------------------------------------------------- */

function BrandFormSheet({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: BrandAdmin | null;
  onSubmit: (payload: BrandInput) => void;
  isPending: boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo: "",
      sortOrder: "0",
    },
  });

  const {
    formState: { errors },
  } = form;

  const [slugTouched, setSlugTouched] = useState(false);
  const name = useWatch({ control: form.control, name: "name" });
  const logo = useWatch({ control: form.control, name: "logo" });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        slug: editing.slug,
        description: editing.description ?? "",
        logo: editing.logo ?? "",
        sortOrder: String(editing.sortOrder ?? 0),
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlugTouched(true);
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        logo: "",
        sortOrder: "0",
      });
      setSlugTouched(false);
    }
  }, [editing, open, form]);

  useEffect(() => {
    if (slugTouched || editing) return;
    if (!name?.trim()) return;
    form.setValue("slug", toSlug(name), { shouldValidate: true });
  }, [name, slugTouched, editing, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const sortOrder = Number(values.sortOrder ?? "0");
    onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description?.trim() || null,
      logo: values.logo?.trim() || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        dir="rtl"
        className={cn(
          "flex flex-col overflow-hidden p-3",
          isMobile
            ? "h-[85vh] max-h-[85vh] w-full rounded-t-2xl"
            : "w-full sm:max-w-md",
        )}
      >
        {isMobile && (
          <div
            className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            aria-hidden="true"
          />
        )}

        <SheetHeader className={cn(isMobile ? "px-4 pt-3" : "p-6 pb-2")}>
          <SheetTitle>{editing ? "ویرایش برند" : "برند جدید"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "اطلاعات برند را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود."
              : "برای ساخت یک برند جدید، اطلاعات زیر را تکمیل کنید."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isMobile ? "px-4" : "px-6",
          )}
        >
          {/* Scrollable body — transparent scrollbar */}
          <div
            className={cn(
              "min-h-0 flex-1 space-y-4 overflow-y-auto",
              isMobile ? "pb-4" : "pb-4",
              // Transparent scrollbar (Firefox)
              "[scrollbar-width:thin] [scrollbar-color:transparent_transparent]",
              "hover:[scrollbar-color:rgba(148,163,184,0.35)_transparent]",
              // Transparent scrollbar (WebKit)
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent",
              "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400/30",
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="brand-name">نام</Label>
              <Input id="brand-name" {...form.register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-slug">اسلاگ (انگلیسی)</Label>
              <Input
                id="brand-slug"
                dir="ltr"
                className="font-mono text-sm"
                {...form.register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  form.setValue("slug", e.target.value, {
                    shouldValidate: true,
                  });
                }}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-desc">توضیحات</Label>
              <Textarea
                id="brand-desc"
                rows={3}
                {...form.register("description")}
              />
            </div>

            <LogoField
              value={logo ?? ""}
              onChange={(v) =>
                form.setValue("logo", v, { shouldValidate: true })
              }
              disabled={isPending}
            />

            <div className="space-y-2">
              <Label htmlFor="brand-sort">ترتیب نمایش</Label>
              <Input
                id="brand-sort"
                type="number"
                dir="ltr"
                {...form.register("sortOrder")}
              />
            </div>
          </div>

          {/* Pinned footer */}
          <SheetFooter
            className={cn(
              "flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
              isMobile &&
                "border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  در حال ذخیره…
                </>
              ) : editing ? (
                "ذخیره تغییرات"
              ) : (
                "ایجاد برند"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminBrandsPage() {
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BrandAdmin | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BrandAdmin | null>(null);

  const filters = useMemo(
    () => ({ page, limit: PAGE_SIZE, order: "desc" as const }),
    [page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useBrandsAdmin(filters);
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const brands = data?.brands ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formPending = createMutation.isPending || updateMutation.isPending;

  const openCreate = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((brand: BrandAdmin) => {
    setEditing(brand);
    setSheetOpen(true);
  }, []);

  const handleSubmit = useCallback(
    (payload: BrandInput) => {
      if (editing) {
        updateMutation.mutate(
          { id: editing.id, payload },
          { onSuccess: () => setSheetOpen(false) },
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => setSheetOpen(false),
        });
      }
    },
    [editing, createMutation, updateMutation],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Award className="size-5 text-primary" />
            برندها
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مدیریت برندهای فروشگاه — ایجاد، ویرایش و حذف
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="به‌روزرسانی"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button className="h-10" onClick={openCreate}>
            <Plus className="me-2 size-4" />
            برند جدید
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "خطا در دریافت برندها"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Award className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">برندی ثبت نشده</p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="me-2 size-4" />
              ایجاد اولین برند
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-3 p-3 md:hidden">
              {brands.map((b) => (
                <article
                  key={b.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.logo}
                            alt={b.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Award
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {b.name}
                        </h3>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {b.slug}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(b)}>
                          <Pencil className="me-2 size-4" />
                          ویرایش
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPendingDelete(b)}
                        >
                          <Trash2 className="me-2 size-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] tabular-nums"
                    >
                      {fa(b.productCount)} محصول
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] tabular-nums"
                    >
                      ترتیب {fa(b.sortOrder)}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">نام</TableHead>
                    <TableHead className="text-start">اسلاگ</TableHead>
                    <TableHead className="text-start">محصولات</TableHead>
                    <TableHead className="text-start">ترتیب</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                            {b.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Award
                                className="h-4 w-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <span className="font-medium">{b.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {b.slug}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {fa(b.productCount)}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {fa(b.sortOrder)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(b)}>
                              <Pencil className="me-2 size-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(b)}
                            >
                              <Trash2 className="me-2 size-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {fa(total)} برند
                {isFetching ? " · در حال به‌روزرسانی…" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="me-1 size-4" />
                  قبلی
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {fa(page)} / {fa(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                  <ChevronLeft className="ms-1 size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <BrandFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={formPending}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>حذف برند</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.name}» حذف شود؟ اگر محصولی به این برند وصل باشد
              ممکن است سرور خطا بدهد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
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
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="me-2 size-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
