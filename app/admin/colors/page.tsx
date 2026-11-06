"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Palette,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

import {
  useColorsAdmin,
  useCreateColor,
  useUpdateColor,
  useDeleteColor,
} from "@/features/catalog/colors/hooks";
import type { ColorAdmin } from "@/features/catalog/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { ColorFormSheet } from "@/components/admin/colors/color-form-sheet";
import { ColorSwatch } from "@/components/admin/colors/color-swatch";

const PAGE_SIZE = 20;

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

export default function AdminColorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ColorAdmin | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ColorAdmin | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      order: "desc" as const,
      search: search || undefined,
    }),
    [page, search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useColorsAdmin(filters);
  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor();
  const deleteMutation = useDeleteColor();

  const colors = data?.colors ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formPending = createMutation.isPending || updateMutation.isPending;

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((color: ColorAdmin) => {
    setEditing(color);
    setSheetOpen(true);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Palette className="size-5 text-primary" />
            رنگ‌ها
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مدیریت رنگ‌های واریانت محصول
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
            رنگ جدید
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="جستجوی نام رنگ…"
            className="h-10 ps-9"
            aria-label="جستجوی رنگ‌ها"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="پاک کردن جستجو"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button className="h-10 shrink-0" onClick={handleSearch}>
          جستجو
        </Button>
        {!!search && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
          >
            <X className="me-1 size-3.5" />
            پاک کردن
          </Button>
        )}
      </section>

      <section
        aria-busy={isLoading || isFetching}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle
              className="size-8 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "خطا در دریافت رنگ‌ها"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="me-2 size-4" />
              تلاش دوباره
            </Button>
          </div>
        ) : colors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Palette
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {search ? "رنگی با این جستجو یافت نشد" : "رنگی یافت نشد"}
            </p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="me-2 size-4" />
              ایجاد اولین رنگ
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {colors.map((c) => (
                <article
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <ColorSwatch hex={c.hexCode} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {c.slug} · {c.hexCode}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-[10px] tabular-nums"
                    >
                      {fa(c.productVariantCount)} واریانت
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        aria-label={`گزینه‌های ${c.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <Pencil className="me-2 size-4" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete(c)}
                      >
                        <Trash2 className="me-2 size-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">رنگ</TableHead>
                    <TableHead className="text-start">اسلاگ</TableHead>
                    <TableHead className="text-start">HEX</TableHead>
                    <TableHead className="text-start">واریانت‌ها</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colors.map((c) => (
                    <TableRow
                      key={c.id}
                      className="transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ColorSwatch hex={c.hexCode} />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.slug}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs tabular-nums">
                          {c.hexCode}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {fa(c.productVariantCount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label={`گزینه‌های ${c.name}`}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="me-2 size-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(c)}
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

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
                {fa(total)} رنگ
                {isFetching && (
                  <span className="ms-1 inline-flex items-center gap-1">
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                    در حال به‌روزرسانی…
                  </span>
                )}
              </p>
              <div className="order-1 flex items-center justify-center gap-2 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 flex-1 sm:flex-none"
                >
                  <ChevronRight
                    className="me-1 size-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronLeft
                    className="me-1 hidden size-4 sm:inline"
                    aria-hidden="true"
                  />
                  قبلی
                </Button>
                <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                  {fa(page)} / {fa(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-9 flex-1 sm:flex-none"
                >
                  بعدی
                  <ChevronLeft
                    className="ms-1 size-4 sm:hidden"
                    aria-hidden="true"
                  />
                  <ChevronRight
                    className="ms-1 hidden size-4 sm:inline"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <ColorFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        isPending={formPending}
        onCreate={(payload) =>
          createMutation.mutate(payload, {
            onSuccess: () => setSheetOpen(false),
          })
        }
        onUpdate={(id, payload) =>
          updateMutation.mutate(
            { id, payload },
            { onSuccess: () => setSheetOpen(false) },
          )
        }
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
            <AlertDialogTitle>حذف رنگ</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.name}» حذف شود؟ اگر واریانتی به این رنگ وصل باشد
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
