"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/addresses/hooks/use-addresses";
import type { Address } from "@/features/addresses/types";
import {
  useProvinces,
  useCities,
} from "@/features/location/hooks/use-location";
import { useRequireAuth } from "@/hooks/use-require-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const addressSchema = z.object({
  title: z.string().optional(),
  fullName: z.string().min(2, "نام گیرنده الزامی است"),
  phone: z
    .string()
    .min(10, "شماره موبایل معتبر نیست")
    .regex(/^09\d{9}$/, "فرمت موبایل: 09xxxxxxxxx"),
  provinceId: z.string().min(1, "استان را انتخاب کنید"),
  cityId: z.string().min(1, "شهر را انتخاب کنید"),
  address: z.string().min(5, "آدرس کامل را وارد کنید"),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });

  const {
    data: addresses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAddresses();
  const { data: provinces = [], isLoading: provincesLoading } = useProvinces();

  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const defaultMutation = useSetDefaultAddress();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      fullName: "",
      phone: "",
      provinceId: "",
      cityId: "",
      address: "",
      postalCode: "",
      isDefault: false,
    },
  });

  const provinceId = form.watch("provinceId");
  const { data: cities = [], isLoading: citiesLoading } = useCities(
    provinceId || undefined,
  );

  // وقتی استان عوض شد شهر را ریست کن (مگر در حالت edit اولیه)
  useEffect(() => {
    if (!editing) {
      form.setValue("cityId", "");
    }
  }, [provinceId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    form.reset({
      title: "",
      fullName: "",
      phone: "",
      provinceId: "",
      cityId: "",
      address: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setFormOpen(true);
  }

  function openEdit(addr: Address) {
    setEditing(addr);
    form.reset({
      title: addr.title ?? "",
      fullName: addr.fullName,
      phone: addr.phone,
      provinceId: addr.provinceId,
      cityId: addr.cityId,
      address: addr.address,
      postalCode: addr.postalCode ?? "",
      isDefault: addr.isDefault,
    });
    setFormOpen(true);
  }

  async function onSubmit(values: AddressFormValues) {
    const payload = {
      title: values.title?.trim() || undefined,
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      provinceId: values.provinceId,
      cityId: values.cityId,
      address: values.address.trim(),
      postalCode: values.postalCode?.trim() || undefined,
      isDefault: values.isDefault ?? false,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            آدرس‌های من
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت آدرس‌های ارسال سفارش
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          آدرس جدید
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 py-12 text-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "خطا در دریافت آدرس‌ها"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            تلاش دوباره
          </Button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            هنوز آدرسی ثبت نکرده‌اید
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            افزودن اولین آدرس
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-sm transition-colors",
                addr.isDefault && "border-primary/40 ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {addr.title || addr.fullName}
                    </span>
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        پیش‌فرض
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {addr.phone}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {[addr.provinceName, addr.cityName, addr.address]
                      .filter(Boolean)
                      .join("، ") || addr.address}
                  </p>
                  {addr.postalCode && (
                    <p className="text-xs text-muted-foreground">
                      کد پستی: {addr.postalCode}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(addr)}
                    aria-label="ویرایش"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={defaultMutation.isPending}
                      onClick={() => defaultMutation.mutate(addr.id)}
                      aria-label="پیش‌فرض"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleting(addr)}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش آدرس" : "آدرس جدید"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">عنوان (اختیاری)</Label>
              <Input
                id="title"
                placeholder="خانه، محل کار..."
                {...form.register("title")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">نام گیرنده</Label>
              <Input id="fullName" {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">موبایل</Label>
              <Input
                id="phone"
                dir="ltr"
                placeholder="0912..."
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>استان</Label>
                <Select
                  value={form.watch("provinceId") || undefined}
                  onValueChange={(v) => {
                    form.setValue("provinceId", v, { shouldValidate: true });
                    form.setValue("cityId", "");
                  }}
                  disabled={provincesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب استان" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.provinceId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.provinceId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>شهر</Label>
                <Select
                  value={form.watch("cityId") || undefined}
                  onValueChange={(v) =>
                    form.setValue("cityId", v, { shouldValidate: true })
                  }
                  disabled={!provinceId || citiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.cityId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.cityId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">آدرس کامل</Label>
              <Input id="address" {...form.register("address")} />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postalCode">کد پستی (اختیاری)</Label>
              <Input
                id="postalCode"
                dir="ltr"
                {...form.register("postalCode")}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border"
                {...form.register("isDefault")}
              />
              تنظیم به‌عنوان آدرس پیش‌فرض
            </label>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "ذخیره تغییرات" : "ثبت آدرس"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف آدرس</AlertDialogTitle>
            <AlertDialogDescription>
              آدرس «{deleting?.title || deleting?.fullName}» حذف شود؟ این عمل
              قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleting) return;
                deleteMutation.mutate(deleting.id, {
                  onSettled: () => setDeleting(null),
                });
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
