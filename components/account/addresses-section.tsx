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
  phone: z.string().regex(/^09\d{9}$/, "فرمت موبایل: 09xxxxxxxxx"),
  provinceId: z.string().min(1, "استان را انتخاب کنید"),
  cityId: z.string().min(1, "شهر را انتخاب کنید"),
  address: z.string().min(5, "آدرس کامل را وارد کنید"),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function AddressesSection() {
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

  useEffect(() => {
    if (!editing) form.setValue("cityId", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId]);

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

  function onSubmit(values: AddressFormValues) {
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

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm dark:bg-card/60 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
          <MapPin className="size-4 text-primary" />
          آدرس‌های ارسال
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          آدرس جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertTriangle className="size-6 text-destructive" />
          <p className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "خطا در دریافت آدرس‌ها"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            تلاش دوباره
          </Button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <MapPin className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">آدرسی ثبت نشده</p>
          <Button size="sm" variant="secondary" onClick={openCreate}>
            <Plus className="size-4" />
            افزودن آدرس
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className={cn(
                "rounded-xl border bg-background/60 p-3",
                addr.isDefault && "border-primary/40 ring-1 ring-primary/15",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {addr.title || addr.fullName}
                    </span>
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        پیش‌فرض
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {addr.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {addr.phone}
                  </p>
                  <p className="text-xs leading-relaxed">
                    {[addr.provinceName, addr.cityName, addr.address]
                      .filter(Boolean)
                      .join("، ") || addr.address}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(addr)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={defaultMutation.isPending}
                      onClick={() => defaultMutation.mutate(addr.id)}
                    >
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => setDeleting(addr)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش آدرس" : "آدرس جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>عنوان (اختیاری)</Label>
              <Input
                placeholder="خانه، محل کار..."
                {...form.register("title")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>نام گیرنده</Label>
              <Input {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>موبایل</Label>
              <Input
                dir="ltr"
                placeholder="09..."
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                    <SelectValue placeholder="استان" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectValue placeholder="شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>آدرس کامل</Label>
              <Input {...form.register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label>کد پستی (اختیاری)</Label>
              <Input dir="ltr" {...form.register("postalCode")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border"
                {...form.register("isDefault")}
              />
              آدرس پیش‌فرض
            </label>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editing ? "ذخیره" : "ثبت"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف آدرس</AlertDialogTitle>
            <AlertDialogDescription>
              آدرس «{deleting?.title || deleting?.fullName}» حذف شود؟
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
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
