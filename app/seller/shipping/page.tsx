"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useCreateShippingRate,
  useCreateStoreShipping,
  useDeleteShippingRate,
  useDeleteStoreShipping,
  useProvinces,
  useShippingMethods,
  useShippingRates,
  useStoreShippingMethods,
  useUpdateShippingRate,
  useUpdateStoreShipping,
} from "@/features/shipping/hooks";
import type {
  ShippingRate,
  StoreShippingMethod,
} from "@/features/shipping/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const methodSchema = z
  .object({
    description: z.string().min(2, "توضیح حداقل ۲ کاراکتر"),
    phrase: z.string().optional(),
    /** روی create اجباری؛ روی edit در UI مخفی است */
    shippingMethodId: z.string().min(1, "روش پایه سیستم را انتخاب کنید"),
    minDays: z.string(),
    maxDays: z.string(),
    defaultPrice: z.string(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => {
      const min = Number(v.minDays);
      const max = Number(v.maxDays);
      return Number.isFinite(min) && Number.isFinite(max) && min <= max;
    },
    { message: "حداقل روز نباید از حداکثر بیشتر باشد", path: ["maxDays"] },
  );

type MethodFormValues = z.infer<typeof methodSchema>;

const rateSchema = z.object({
  provinceId: z.string().min(1, "استان را انتخاب کنید"),
  price: z.string().min(1, "قیمت لازم است"),
  deliveryMaxDays: z.string().min(1, "حداکثر روز لازم است"),
});

type RateFormValues = z.infer<typeof rateSchema>;

/* -------------------------------------------------------------------------- */
/* ResponsiveSheet — right on desktop, bottom on mobile                       */
/* -------------------------------------------------------------------------- */

function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitLabel,
  onSubmit,
  isPending,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: React.ReactNode;
  formId: string;
  submitLabel?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        dir="rtl"
        className={cn(
          "flex flex-col overflow-hidden p-0",
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
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <form
          id={formId}
          onSubmit={onSubmit}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isMobile ? "px-4" : "px-6",
          )}
        >
          <div
            className={cn(
              "min-h-0 flex-1 space-y-4 overflow-y-auto pb-4",
              "scrollbar-thin [scrollbar-color:transparent_transparent]",
              "hover:[scrollbar-color:rgba(148,163,184,0.35)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent",
              "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400/30",
            )}
          >
            {children}
          </div>

          <SheetFooter
            className={cn(
              "flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
              isMobile &&
                "border-t border-border bg-background/95 px-0 py-3 backdrop-blur",
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
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {submitLabel ?? "ذخیره"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Method sheet                                                               */
/* -------------------------------------------------------------------------- */

function MethodFormSheet({
  open,
  onOpenChange,
  editing,
  baseMethods,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: StoreShippingMethod | null;
  baseMethods: { id: string; name: string; isFreeMethod?: boolean }[];
  onSubmit: (payload: {
    description: string;
    phrase: string | null;
    minDays: number;
    maxDays: number;
    defaultPrice: number;
    isActive: boolean;
    shippingMethodId?: string;
  }) => void;
  isPending: boolean;
}) {
  const form = useForm<MethodFormValues>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      description: "",
      phrase: "",
      shippingMethodId: "",
      minDays: "1",
      maxDays: "3",
      defaultPrice: "0",
      isActive: true,
    },
  });

  const {
    formState: { errors },
  } = form;

  const shippingMethodId = useWatch({
    control: form.control,
    name: "shippingMethodId",
  });
  const isActive = useWatch({ control: form.control, name: "isActive" });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        description: editing.description,
        phrase: editing.phrase ?? "",
        shippingMethodId: editing.shippingMethodId ?? "",
        minDays: String(editing.minDays),
        maxDays: String(editing.maxDays),
        defaultPrice: String(editing.defaultPrice),
        isActive: editing.isActive,
      });
    } else {
      form.reset({
        description: "",
        phrase: "",
        shippingMethodId: baseMethods[0]?.id ?? "",
        minDays: "1",
        maxDays: "3",
        defaultPrice: "0",
        isActive: true,
      });
    }
  }, [editing, open, form, baseMethods]);

  const submit = form.handleSubmit((values) => {
    const description = values.description.trim();
    const phrase = values.phrase?.trim() || null;
    const minDays = Number(values.minDays) || 0;
    const maxDays = Number(values.maxDays) || 0;
    const defaultPrice = Number(values.defaultPrice) || 0;
    const isActive = values.isActive;

    if (editing) {
      // PUT /shipping/store/{id} — بدون shippingMethodId
      onSubmit({
        description,
        phrase,
        minDays,
        maxDays,
        defaultPrice,
        isActive,
      });
      return;
    }

    const shippingMethodId = values.shippingMethodId?.trim();
    if (!shippingMethodId) {
      form.setError("shippingMethodId", {
        message: "روش پایه سیستم را انتخاب کنید",
      });
      return;
    }

    // POST /shipping/store — shippingMethodId همیشه string غیرخالی
    onSubmit({
      description,
      phrase,
      minDays,
      maxDays,
      defaultPrice,
      isActive,
      shippingMethodId,
    });
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "ویرایش روش ارسال" : "روش ارسال جدید"}
      description="این همان چیزی است که مشتری در صفحه پرداخت می‌بیند."
      formId="method-form"
      submitLabel={editing ? "ذخیره تغییرات" : "ایجاد روش"}
      onSubmit={submit}
      isPending={isPending}
    >
      <div className="space-y-2">
        <Label htmlFor="method-desc" className="flex items-center gap-1">
          عنوان / توضیح
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="method-desc"
          {...form.register("description")}
          aria-invalid={!!errors.description}
          placeholder="مثلاً: ارسال سریع با پست پیشتاز"
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="method-phrase">شعار (اختیاری)</Label>
        <Input
          id="method-phrase"
          {...form.register("phrase")}
          placeholder="سریع و مطمئن"
        />
        <p className="text-[11px] text-muted-foreground">
          یک جمله کوتاه برای تشویق مشتری به انتخاب این روش.
        </p>
      </div>

      {!editing && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            روش پایه سیستم
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          {baseMethods.length === 0 ? (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              هیچ روش پایه‌ای از سرور نیامده. ابتدا ادمین باید در{" "}
              <span className="font-mono">POST /shipping</span> روش بسازد (پست،
              تیپاکس، …).
            </p>
          ) : (
            <Select
              value={shippingMethodId || undefined}
              onValueChange={(v) =>
                form.setValue("shippingMethodId", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger dir="rtl" aria-invalid={!!errors.shippingMethodId}>
                <SelectValue placeholder="انتخاب روش پایه…" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {baseMethods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                    {m.isFreeMethod ? " (رایگان)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.shippingMethodId && (
            <p className="text-xs text-destructive">
              {errors.shippingMethodId.message}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="method-min">حداقل روز</Label>
          <Input
            id="method-min"
            type="number"
            inputMode="numeric"
            min={0}
            dir="ltr"
            {...form.register("minDays")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="method-max">حداکثر روز</Label>
          <Input
            id="method-max"
            type="number"
            inputMode="numeric"
            min={0}
            dir="ltr"
            aria-invalid={!!errors.maxDays}
            {...form.register("maxDays")}
          />
        </div>
      </div>
      {errors.maxDays && (
        <p className="text-xs text-destructive">{errors.maxDays.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="method-price">قیمت پیش‌فرض (تومان)</Label>
        <Input
          id="method-price"
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          {...form.register("defaultPrice")}
        />
        <p className="text-[11px] text-muted-foreground">
          برای استان‌هایی که نرخ اختصاصی ندارند استفاده می‌شود.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="method-active" className="cursor-pointer">
            فعال
          </Label>
          <p className="text-[11px] text-muted-foreground">
            فقط روش‌های فعال در صفحه پرداخت نمایش داده می‌شوند.
          </p>
        </div>
        <Switch
          id="method-active"
          checked={isActive ?? false}
          onCheckedChange={(v) => form.setValue("isActive", v)}
        />
      </div>
    </ResponsiveSheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Rate sheet                                                                 */
/* -------------------------------------------------------------------------- */

function RateFormSheet({
  open,
  onOpenChange,
  editing,
  selectedMethod,
  availableProvinces,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ShippingRate | null;
  selectedMethod: StoreShippingMethod | null;
  availableProvinces: { id: string; name: string }[];
  onSubmit: (payload: {
    provinceId: string;
    price: number;
    deliveryMaxDays: number;
  }) => void;
  isPending: boolean;
}) {
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { provinceId: "", price: "", deliveryMaxDays: "3" },
  });

  const {
    formState: { errors },
  } = form;

  const provinceId = useWatch({ control: form.control, name: "provinceId" });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        provinceId: editing.provinceId,
        price: String(editing.price),
        deliveryMaxDays: String(editing.deliveryMaxDays),
      });
    } else {
      form.reset({ provinceId: "", price: "", deliveryMaxDays: "3" });
    }
  }, [editing, open, form]);

  const submit = form.handleSubmit((values) => {
    onSubmit({
      provinceId: values.provinceId,
      price: Number(values.price),
      deliveryMaxDays: Number(values.deliveryMaxDays),
    });
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "ویرایش نرخ استان" : "نرخ استان جدید"}
      description={
        selectedMethod
          ? `نرخ اختصاصی برای روش «${selectedMethod.description}»`
          : "نرخ اختصاصی این استان"
      }
      formId="rate-form"
      submitLabel={editing ? "ذخیره تغییرات" : "افزودن نرخ"}
      onSubmit={submit}
      isPending={isPending}
    >
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          استان
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Select
          value={provinceId || undefined}
          onValueChange={(v) =>
            form.setValue("provinceId", v, { shouldValidate: true })
          }
        >
          <SelectTrigger dir="rtl" aria-invalid={!!errors.provinceId}>
            <SelectValue placeholder="انتخاب استان…" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {availableProvinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.provinceId && (
          <p className="text-xs text-destructive">
            {errors.provinceId.message}
          </p>
        )}
        {availableProvinces.length === 0 && !editing && (
          <p className="text-[11px] text-muted-foreground">
            برای همه استان‌ها نرخ ثبت کرده‌اید.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate-price" className="flex items-center gap-1">
          هزینه ارسال (تومان)
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="rate-price"
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          aria-invalid={!!errors.price}
          {...form.register("price")}
        />
        {errors.price && (
          <p className="text-xs text-destructive">{errors.price.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate-days" className="flex items-center gap-1">
          حداکثر روز تحویل
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="rate-days"
          type="number"
          inputMode="numeric"
          min={0}
          dir="ltr"
          aria-invalid={!!errors.deliveryMaxDays}
          {...form.register("deliveryMaxDays")}
        />
        {errors.deliveryMaxDays && (
          <p className="text-xs text-destructive">
            {errors.deliveryMaxDays.message}
          </p>
        )}
      </div>
    </ResponsiveSheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SellerShippingPage() {
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<StoreShippingMethod | null>(null);
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [pendingDeleteMethod, setPendingDeleteMethod] =
    useState<StoreShippingMethod | null>(null);
  const [pendingDeleteRate, setPendingDeleteRate] =
    useState<ShippingRate | null>(null);

  const methodsQuery = useStoreShippingMethods();
  const baseMethodsQuery = useShippingMethods();
  const provincesQuery = useProvinces();
  const ratesQuery = useShippingRates(selectedMethodId);

  const createMethod = useCreateStoreShipping();
  const updateMethod = useUpdateStoreShipping();
  const deleteMethod = useDeleteStoreShipping();
  const createRate = useCreateShippingRate();
  const updateRate = useUpdateShippingRate();
  const deleteRate = useDeleteShippingRate();

  // Stable references so downstream deps don't re-fire
  const methods = useMemo(() => methodsQuery.data ?? [], [methodsQuery.data]);
  const rates = useMemo(() => ratesQuery.data ?? [], [ratesQuery.data]);
  const provinces = useMemo(
    () => provincesQuery.data ?? [],
    [provincesQuery.data],
  );
  const baseMethods = useMemo(
    () => baseMethodsQuery.data ?? [],
    [baseMethodsQuery.data],
  );

  const selected = useMemo(
    () => methods.find((m) => m.id === selectedMethodId) ?? null,
    [methods, selectedMethodId],
  );

  useEffect(() => {
    if (!selectedMethodId && methods.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMethodId(methods[0].id);
    }
  }, [methods, selectedMethodId]);

  const usedProvinceIds = useMemo(
    () => new Set(rates.map((r) => r.provinceId)),
    [rates],
  );

  const availableProvinces = useMemo(() => {
    if (editingRate) {
      return provinces.filter(
        (p) => p.id === editingRate.provinceId || !usedProvinceIds.has(p.id),
      );
    }
    return provinces.filter((p) => !usedProvinceIds.has(p.id));
  }, [provinces, usedProvinceIds, editingRate]);

  const openCreateMethod = () => {
    setEditingMethod(null);
    setMethodSheetOpen(true);
  };

  const openEditMethod = (m: StoreShippingMethod) => {
    setEditingMethod(m);
    setMethodSheetOpen(true);
  };

  const handleMethodSubmit = (payload: {
    description: string;
    phrase: string | null;
    minDays: number;
    maxDays: number;
    defaultPrice: number;
    isActive: boolean;
    shippingMethodId?: string;
  }) => {
    if (editingMethod) {
      updateMethod.mutate(
        {
          id: editingMethod.id,
          payload: {
            description: payload.description,
            phrase: payload.phrase,
            minDays: payload.minDays,
            maxDays: payload.maxDays,
            defaultPrice: payload.defaultPrice,
            isActive: payload.isActive,
          },
        },
        { onSuccess: () => setMethodSheetOpen(false) },
      );
      return;
    }

    const shippingMethodId = payload.shippingMethodId?.trim();
    if (!shippingMethodId) {
      // نباید به API برسد
      return;
    }

    createMethod.mutate(
      {
        description: payload.description,
        phrase: payload.phrase,
        minDays: payload.minDays,
        maxDays: payload.maxDays,
        defaultPrice: payload.defaultPrice,
        isActive: payload.isActive,
        shippingMethodId, // string غیرخالی
      },
      { onSuccess: () => setMethodSheetOpen(false) },
    );
  };

  const openCreateRate = () => {
    setEditingRate(null);
    setRateSheetOpen(true);
  };

  const openEditRate = (r: ShippingRate) => {
    setEditingRate(r);
    setRateSheetOpen(true);
  };

  const handleRateSubmit = (payload: {
    provinceId: string;
    price: number;
    deliveryMaxDays: number;
  }) => {
    if (!selectedMethodId) return;
    const final = { ...payload, storeShippingMethodId: selectedMethodId };
    if (editingRate) {
      updateRate.mutate(
        { id: editingRate.id, payload: final },
        { onSuccess: () => setRateSheetOpen(false) },
      );
    } else {
      createRate.mutate(final, {
        onSuccess: () => setRateSheetOpen(false),
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Truck className="size-5 text-primary" />
            روش‌های ارسال
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            تعریف روش ارسال فروشگاه و نرخ هر استان
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => methodsQuery.refetch()}
            disabled={methodsQuery.isFetching}
            aria-label="به‌روزرسانی"
          >
            {methodsQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button className="h-10" onClick={openCreateMethod}>
            <Plus className="me-2 size-4" />
            روش جدید
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        {/* Methods list */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            روش‌های شما
          </div>
          {methodsQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : methodsQuery.isError ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-xs text-muted-foreground">خطا در دریافت</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => methodsQuery.refetch()}
              >
                تلاش دوباره
              </Button>
            </div>
          ) : methods.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              هنوز روشی ثبت نشده
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {methods.map((m) => {
                const active = m.id === selectedMethodId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 px-4 py-3 text-start transition-colors",
                        active ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                      aria-pressed={active}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {m.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {m.minDays}–{m.maxDays} روز · از {fa(m.defaultPrice)}{" "}
                          ت
                        </p>
                      </div>
                      <Badge
                        variant={m.isActive ? "default" : "secondary"}
                        className="shrink-0 text-[10px]"
                      >
                        {m.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Rates panel */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          {!selected ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
              <MapPin className="size-8 opacity-50" />
              یک روش ارسال را انتخاب کنید یا بسازید
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {selected.description}
                  </h2>
                  {selected.phrase && (
                    <p className="text-xs text-muted-foreground">
                      {selected.phrase}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditMethod(selected)}
                  >
                    <Pencil className="me-1.5 size-3.5" />
                    ویرایش روش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDeleteMethod(selected)}
                  >
                    <Trash2 className="me-1.5 size-3.5" />
                    حذف
                  </Button>
                  <Button size="sm" onClick={openCreateRate}>
                    <Plus className="me-1.5 size-3.5" />
                    نرخ استان
                  </Button>
                </div>
              </div>

              {ratesQuery.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : ratesQuery.isError ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <AlertTriangle className="size-6 text-destructive" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ratesQuery.refetch()}
                  >
                    تلاش دوباره
                  </Button>
                </div>
              ) : rates.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  نرخی برای استان‌ها ثبت نشده — از قیمت پیش‌فرض روش استفاده
                  می‌شود
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {rates.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{r.provinceName}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {fa(r.price)} تومان · حداکثر {fa(r.deliveryMaxDays)}{" "}
                          روز
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label={`گزینه‌های ${r.provinceName}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditRate(r)}>
                            <Pencil className="me-2 size-4" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setPendingDeleteRate(r)}
                          >
                            <Trash2 className="me-2 size-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      {/* Method sheet */}
      <MethodFormSheet
        open={methodSheetOpen}
        onOpenChange={setMethodSheetOpen}
        editing={editingMethod}
        baseMethods={baseMethods}
        onSubmit={handleMethodSubmit}
        isPending={createMethod.isPending || updateMethod.isPending}
      />

      {/* Rate sheet */}
      <RateFormSheet
        open={rateSheetOpen}
        onOpenChange={setRateSheetOpen}
        editing={editingRate}
        selectedMethod={selected}
        availableProvinces={availableProvinces}
        onSubmit={handleRateSubmit}
        isPending={createRate.isPending || updateRate.isPending}
      />

      {/* Delete method */}
      <AlertDialog
        open={!!pendingDeleteMethod}
        onOpenChange={(o) => !o && setPendingDeleteMethod(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>حذف روش ارسال</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDeleteMethod?.description}» و نرخ‌های استان مرتبط حذف
              شود؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              disabled={deleteMethod.isPending}
              onClick={() => {
                if (!pendingDeleteMethod) return;
                deleteMethod.mutate(pendingDeleteMethod.id, {
                  onSuccess: () => {
                    if (selectedMethodId === pendingDeleteMethod.id) {
                      setSelectedMethodId(null);
                    }
                    setPendingDeleteMethod(null);
                  },
                });
              }}
            >
              {deleteMethod.isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="me-2 size-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete rate */}
      <AlertDialog
        open={!!pendingDeleteRate}
        onOpenChange={(o) => !o && setPendingDeleteRate(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نرخ استان</AlertDialogTitle>
            <AlertDialogDescription>
              نرخ «{pendingDeleteRate?.provinceName}» حذف شود؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              disabled={deleteRate.isPending}
              onClick={() => {
                if (!pendingDeleteRate || !selectedMethodId) return;
                deleteRate.mutate(
                  {
                    id: pendingDeleteRate.id,
                    storeShippingMethodId: selectedMethodId,
                  },
                  { onSettled: () => setPendingDeleteRate(null) },
                );
              }}
            >
              {deleteRate.isPending ? (
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
