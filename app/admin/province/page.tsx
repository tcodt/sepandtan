"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  MapPinned,
  Building2,
  AlertTriangle,
  ChevronLeft,
  Search,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  useAdminProvinces,
  useAdminCities,
  useCreateProvince,
  useUpdateProvince,
  useDeleteProvince,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from "@/features/admin/province/hooks/use-admin-province";
import type { CityAdmin, ProvinceAdmin } from "@/features/admin/province/types";

type EditorMode =
  | { kind: "province-create" }
  | { kind: "province-edit"; item: ProvinceAdmin }
  | { kind: "city-create"; provinceId: string }
  | { kind: "city-edit"; item: CityAdmin }
  | null;

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function RowSkeleton({ h = "h-14" }: { h?: string }) {
  return <Skeleton className={cn("w-full rounded-xl", h)} />;
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
      {value.toLocaleString("fa-IR")}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="max-w-xs text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-foreground">{message}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تلاش دوباره
        </Button>
      </CardContent>
    </Card>
  );
}

function ProvinceRow({
  item,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  item: ProvinceAdmin;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`انتخاب استان ${item.name}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ps-3",
        "transition-all duration-150 ease-out motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hover:-translate-y-px hover:shadow-sm",
        active
          ? "border-primary/30 bg-primary/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ring-1 ring-primary/20"
          : "border-border/60 bg-card",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80",
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {active ? "در حال مشاهده شهرها" : "برای دیدن شهرها کلیک کنید"}
        </p>
      </div>

      <div
        className="flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label={`ویرایش ${item.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`حذف ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ChevronLeft
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
          active && "-translate-x-0.5 text-primary",
        )}
        aria-hidden="true"
      />
    </div>
  );
}

function CityRow({
  item,
  onEdit,
  onDelete,
}: {
  item: CityAdmin;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border/60 bg-card p-2.5 ps-3 transition-all duration-150 ease-out hover:-translate-y-px hover:border-border hover:shadow-sm motion-reduce:transition-none">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {item.name}
      </p>
      <div className="flex items-center gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label={`ویرایش ${item.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`حذف ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminProvincePage() {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(
    null,
  );
  const [editor, setEditor] = useState<EditorMode>(null);
  const [nameInput, setNameInput] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [deleteProvinceTarget, setDeleteProvinceTarget] =
    useState<ProvinceAdmin | null>(null);
  const [deleteCityTarget, setDeleteCityTarget] = useState<CityAdmin | null>(
    null,
  );

  const provincesQuery = useAdminProvinces();
  const citiesQuery = useAdminCities(selectedProvinceId ?? undefined);

  const createProvince = useCreateProvince();
  const updateProvince = useUpdateProvince();
  const deleteProvince = useDeleteProvince();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const provinces = useMemo(
    () => provincesQuery.data ?? [],
    [provincesQuery.data],
  );
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.id === selectedProvinceId) ?? null,
    [provinces, selectedProvinceId],
  );

  const filteredProvinces = useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return provinces;
    return provinces.filter((p) => p.name.toLowerCase().includes(q));
  }, [provinces, provinceSearch]);

  const saving =
    createProvince.isPending ||
    updateProvince.isPending ||
    createCity.isPending ||
    updateCity.isPending;

  const nameError =
    nameTouched && nameInput.trim().length < 2
      ? "نام باید حداقل ۲ کاراکتر باشد."
      : null;

  /* ------------------------------ Handlers ------------------------------ */

  const openProvinceCreate = useCallback(() => {
    setNameInput("");
    setNameTouched(false);
    setEditor({ kind: "province-create" });
  }, []);

  const openProvinceEdit = useCallback((item: ProvinceAdmin) => {
    setNameInput(item.name);
    setNameTouched(false);
    setEditor({ kind: "province-edit", item });
  }, []);

  const openCityCreate = useCallback(() => {
    if (!selectedProvinceId) return;
    setNameInput("");
    setNameTouched(false);
    setEditor({ kind: "city-create", provinceId: selectedProvinceId });
  }, [selectedProvinceId]);

  const openCityEdit = useCallback((item: CityAdmin) => {
    setNameInput(item.name);
    setNameTouched(false);
    setEditor({ kind: "city-edit", item });
  }, []);

  const closeEditor = useCallback(() => {
    if (saving) return;
    setEditor(null);
    setNameInput("");
    setNameTouched(false);
  }, [saving]);

  const submitEditor = useCallback(async () => {
    const name = nameInput.trim();
    if (name.length < 2 || !editor) {
      setNameTouched(true);
      return;
    }

    try {
      if (editor.kind === "province-create") {
        await createProvince.mutateAsync({ name });
      } else if (editor.kind === "province-edit") {
        await updateProvince.mutateAsync({
          id: editor.item.id,
          input: { name },
        });
      } else if (editor.kind === "city-create") {
        await createCity.mutateAsync({
          name,
          provinceId: editor.provinceId,
        });
      } else if (editor.kind === "city-edit") {
        await updateCity.mutateAsync({
          id: editor.item.id,
          input: { name },
        });
      }
      closeEditor();
    } catch {
      /* toast in hook */
    }
  }, [
    nameInput,
    editor,
    createProvince,
    updateProvince,
    createCity,
    updateCity,
    closeEditor,
  ]);

  const confirmDeleteProvince = useCallback(async () => {
    if (!deleteProvinceTarget) return;
    try {
      await deleteProvince.mutateAsync(deleteProvinceTarget.id);
      if (selectedProvinceId === deleteProvinceTarget.id) {
        setSelectedProvinceId(null);
      }
      setDeleteProvinceTarget(null);
    } catch {
      /* */
    }
  }, [deleteProvince, deleteProvinceTarget, selectedProvinceId]);

  const confirmDeleteCity = useCallback(async () => {
    if (!deleteCityTarget) return;
    try {
      await deleteCity.mutateAsync(deleteCityTarget.id);
      setDeleteCityTarget(null);
    } catch {
      /* */
    }
  }, [deleteCity, deleteCityTarget]);

  const editorTitle =
    editor?.kind === "province-create"
      ? "استان جدید"
      : editor?.kind === "province-edit"
        ? "ویرایش استان"
        : editor?.kind === "city-create"
          ? "شهر جدید"
          : editor?.kind === "city-edit"
            ? "ویرایش شهر"
            : "";

  const editorContext =
    editor?.kind === "province-create"
      ? "یک استان جدید به فهرست اضافه کنید."
      : editor?.kind === "province-edit"
        ? "نام استان را ویرایش کنید. تغییر در همه فرم‌ها اعمال می‌شود."
        : editor?.kind === "city-create"
          ? `شهر جدید برای استان «${selectedProvince?.name ?? ""}».`
          : editor?.kind === "city-edit"
            ? "نام شهر را ویرایش کنید."
            : "";

  const provinceCount = provinces.length;
  const cityCount = cities.length;
  const selectedProvinceHasCities = cityCount > 0;

  /* ------------------------------- Render ------------------------------- */

  return (
    <div dir="rtl" className="mx-auto w-full max-w-5xl space-y-5">
      {/* ------------------------------- Header ------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              استان و شهر
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت جغرافیایی مورد استفاده در فرم‌ها، آدرس‌ها و پروفایل‌ها
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => void provincesQuery.refetch()}
            disabled={provincesQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 motion-reduce:animate-none",
                provincesQuery.isFetching && "animate-spin",
              )}
              aria-hidden="true"
            />
            بروزرسانی
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={openProvinceCreate}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            استان جدید
          </Button>
        </div>
      </header>

      {/* ------------------------------- Panes ------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------ Provinces ------------------------------ */}
        <section
          aria-labelledby="provinces-heading"
          className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2
                id="provinces-heading"
                className="text-sm font-semibold text-foreground"
              >
                استان‌ها
              </h2>
              {!provincesQuery.isLoading && (
                <CountBadge value={provinceCount} />
              )}
            </div>
            {provinces.length > 0 && (
              <div className="relative w-full max-w-40 sm:max-w-50">
                <Search
                  className="pointer-events-none absolute inset-y-0 inset-s-2.5 my-auto h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  placeholder="جستجوی استان…"
                  className="h-8 rounded-lg bg-background ps-8 text-xs"
                  aria-label="جستجوی استان"
                />
              </div>
            )}
          </div>

          {provincesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : provincesQuery.isError ? (
            <ErrorState
              message="دریافت استان‌ها ناموفق بود"
              onRetry={() => void provincesQuery.refetch()}
            />
          ) : provinces.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="هنوز استانی ثبت نشده است"
              description="اولین استان را اضافه کنید تا بتوانید شهرها را نیز مدیریت کنید."
              action={
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={openProvinceCreate}
                >
                  <Plus className="h-3.5 w-3.5" />
                  افزودن اولین استان
                </Button>
              }
            />
          ) : filteredProvinces.length === 0 ? (
            <EmptyState
              icon={Search}
              title="نتیجه‌ای یافت نشد"
              description={`هیچ استانی با «${provinceSearch}» مطابقت ندارد.`}
            />
          ) : (
            <div
              className="space-y-2"
              role="listbox"
              aria-label="فهرست استان‌ها"
            >
              {filteredProvinces.map((p) => (
                <ProvinceRow
                  key={p.id}
                  item={p}
                  active={p.id === selectedProvinceId}
                  onSelect={() => setSelectedProvinceId(p.id)}
                  onEdit={() => openProvinceEdit(p)}
                  onDelete={() => setDeleteProvinceTarget(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ------------------------------ Cities ------------------------------ */}
        <section
          aria-labelledby="cities-heading"
          className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h2
                id="cities-heading"
                className="text-sm font-semibold text-foreground"
              >
                شهرها
              </h2>
              {selectedProvince && (
                <span className="truncate text-xs text-muted-foreground">
                  · {selectedProvince.name}
                </span>
              )}
              {selectedProvinceId && !citiesQuery.isLoading && (
                <CountBadge value={cityCount} />
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              disabled={!selectedProvinceId || saving}
              onClick={openCityCreate}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              شهر جدید
            </Button>
          </div>

          {!selectedProvinceId ? (
            <EmptyState
              icon={Building2}
              title="یک استان را انتخاب کنید"
              description="با انتخاب یک استان از ستون کناری، شهرهای آن نمایش داده می‌شود."
            />
          ) : citiesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} h="h-12" />
              ))}
            </div>
          ) : citiesQuery.isError ? (
            <ErrorState
              message="دریافت شهرها ناموفق بود"
              onRetry={() => void citiesQuery.refetch()}
            />
          ) : cities.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="شهری ثبت نشده است"
              description={`برای استان «${selectedProvince?.name ?? ""}» هنوز شهری ثبت نشده است.`}
              action={
                <Button size="sm" className="gap-1.5" onClick={openCityCreate}>
                  <Plus className="h-3.5 w-3.5" />
                  افزودن اولین شهر
                </Button>
              }
            />
          ) : (
            <div className="space-y-2" role="list" aria-label="فهرست شهرها">
              {cities.map((c) => (
                <CityRow
                  key={c.id}
                  item={c}
                  onEdit={() => openCityEdit(c)}
                  onDelete={() => setDeleteCityTarget(c)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------ Editor dialog ------------------------------ */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && closeEditor()}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader className="p-3">
            <DialogTitle>{editorTitle}</DialogTitle>
            <DialogDescription>{editorContext}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="geo-name">نام</Label>
            <Input
              id="geo-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => setNameTouched(true)}
              className={cn(
                "h-11",
                nameError &&
                  "border-destructive focus-visible:ring-destructive/30",
              )}
              autoFocus
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "geo-name-error" : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitEditor();
                }
              }}
            />
            {nameError ? (
              <p
                id="geo-name-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {nameError}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                حداقل ۲ کاراکتر، به فارسی.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={closeEditor} disabled={saving}>
              انصراف
            </Button>
            <Button
              onClick={() => void submitEditor()}
              disabled={saving || nameInput.trim().length < 2}
            >
              {saving ? (
                <Loader2
                  className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : null}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ Delete province ------------------------------ */}
      <AlertDialog
        open={!!deleteProvinceTarget}
        onOpenChange={(o) => !o && setDeleteProvinceTarget(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </span>
              حذف استان
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                استان «{deleteProvinceTarget?.name}» حذف خواهد شد.
              </span>
              {deleteProvinceTarget &&
                selectedProvinceId === deleteProvinceTarget.id &&
                selectedProvinceHasCities && (
                  <span className="block rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
                    توجه: این استان شامل {cityCount.toLocaleString("fa-IR")} شهر
                    است. حذف استان ممکن است شهرهای مرتبط را نیز حذف کند.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteProvince()}
              disabled={deleteProvince.isPending}
            >
              {deleteProvince.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              حذف استان
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ------------------------------ Delete city ------------------------------ */}
      <AlertDialog
        open={!!deleteCityTarget}
        onOpenChange={(o) => !o && setDeleteCityTarget(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </span>
              حذف شهر
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              شهر «{deleteCityTarget?.name}» حذف شود؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteCity()}
              disabled={deleteCity.isPending}
            >
              {deleteCity.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              حذف شهر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
