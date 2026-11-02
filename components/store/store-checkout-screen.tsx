/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  Truck,
  Tag,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { useCart } from "@/features/cart/hooks";
import { useAddresses } from "@/features/addresses/hooks/use-addresses";
import type { Address } from "@/features/addresses/types";
import { useShippingForOrder } from "@/features/shipping/hooks";
import type { ShippingOption } from "@/features/shipping/types";
import { useValidateDiscount } from "@/features/discounts/hooks";
import { useCreateCheckout, usePayCheckout } from "@/features/orders/hooks";
import type { CheckoutOrderLine, PaymentMethod } from "@/features/orders/types";

type ShippingSelection = Record<
  string,
  {
    option: ShippingOption;
    note: string;
  }
>;

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  hint: string;
}> = [
  {
    value: "zarinpal",
    label: "درگاه زرین‌پال",
    hint: "پرداخت آنلاین",
  },
  {
    value: "cod",
    label: "پرداخت در محل",
    hint: "پس از تحویل",
  },
  {
    value: "card",
    label: "کارت به کارت",
    hint: "هماهنگی پشتیبانی",
  },
  // wallet عمداً در UI پیشنهاد نمی‌شود مگر بک‌اند کامل باشد
];

function formatToman(n: number) {
  return `${n.toLocaleString("fa-IR")} تومان`;
}

function formatMoneyString(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return formatToman(n);
}

export function StoreCheckoutScreen() {
  const router = useRouter();

  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();

  const [addressId, setAddressId] = useState<string>("");
  const [shippingByStore, setShippingByStore] = useState<ShippingSelection>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("zarinpal");
  const [discountCode, setDiscountCode] = useState("");
  const [discountId, setDiscountId] = useState<string | null>(null);
  const [discountPreview, setDiscountPreview] = useState<string | null>(null);

  const selectedAddress: Address | undefined = useMemo(
    () => addresses.find((a) => a.id === addressId),
    [addresses, addressId],
  );

  const provinceId = selectedAddress?.provinceId;

  const {
    data: shippingOptions = [],
    isLoading: shippingLoading,
    isError: shippingError,
  } = useShippingForOrder(provinceId);

  const validateDiscount = useValidateDiscount();
  const createCheckout = useCreateCheckout();
  const payCheckout = usePayCheckout();

  // پیش‌فرض: آدرس default
  useEffect(() => {
    if (addressId || addresses.length === 0) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def) setAddressId(def.id);
  }, [addresses, addressId]);

  // گزینه‌های ارسال را بر اساس store گروه‌بندی کن
  const shippingByStoreId = useMemo(() => {
    const map = new Map<string, ShippingOption[]>();
    for (const opt of shippingOptions) {
      const list = map.get(opt.storeId) ?? [];
      list.push(opt);
      map.set(opt.storeId, list);
    }
    return map;
  }, [shippingOptions]);

  // وقتی گزینه‌ها عوض شد، انتخاب‌های نامعتبر را پاک کن و در صورت تک‌گزینه، انتخاب خودکار
  useEffect(() => {
    if (!cart) return;
    setShippingByStore((prev) => {
      const next: ShippingSelection = {};
      for (const store of cart.stores) {
        const options = shippingByStoreId.get(store.storeId) ?? [];
        const current = prev[store.storeId];
        if (current && options.some((o) => o.id === current.option.id)) {
          next[store.storeId] = current;
        } else if (options.length === 1) {
          next[store.storeId] = { option: options[0], note: "" };
        }
      }
      return next;
    });
  }, [cart, shippingByStoreId]);

  const stores = cart?.stores ?? [];
  const isEmpty = !cart || cart.totalItems === 0 || stores.length === 0;

  const shippingTotal = useMemo(() => {
    return stores.reduce((sum, s) => {
      const sel = shippingByStore[s.storeId];
      return sum + (sel?.option.defaultPrice ?? 0);
    }, 0);
  }, [stores, shippingByStore]);

  const grandTotal = (cart?.totalPrice ?? 0) + shippingTotal;

  const allStoresHaveShipping = stores.every((s) =>
    Boolean(shippingByStore[s.storeId]?.option.id),
  );

  const canSubmit =
    Boolean(addressId) &&
    allStoresHaveShipping &&
    Boolean(paymentMethod) &&
    !createCheckout.isPending &&
    !payCheckout.isPending;

  async function handleValidateDiscount() {
    if (!cart || !discountCode.trim()) {
      toast.error("کد تخفیف را وارد کنید");
      return;
    }
    try {
      const result = await validateDiscount.mutateAsync({
        code: discountCode.trim(),
        cart,
      });
      // بک‌اند ممکن است شکل‌های مختلف برگرداند
      const r = (result ?? {}) as Record<string, unknown>;
      const id =
        (typeof r.discountId === "string" && r.discountId) ||
        (typeof r.id === "string" && r.id) ||
        null;
      setDiscountId(id);
      setDiscountPreview(
        typeof r.message === "string" ? r.message : "کد تخفیف معتبر است",
      );
      toast.success("کد تخفیف اعمال شد");
    } catch {
      setDiscountId(null);
      setDiscountPreview(null);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !cart) return;

    const orders: CheckoutOrderLine[] = stores.map((store) => {
      const sel = shippingByStore[store.storeId];
      const opt = sel!.option;
      const days = opt.maxDays || opt.minDays || 0;
      return {
        storeId: store.storeId,
        shippingId: opt.id,
        shippingName:
          opt.methodName || opt.phrase || opt.description || "ارسال",
        shippingCost: String(opt.defaultPrice),
        shippingTime: days,
        note: sel!.note || "—",
      };
    });

    try {
      const created = await createCheckout.mutateAsync({
        addressId,
        orders,
        discountId,
        paymentMethod,
      });

      const checkoutId =
        created && typeof created === "object" && "id" in created
          ? String((created as { id: string }).id)
          : null;

      if (!checkoutId) {
        toast.success("سفارش ثبت شد");
        router.push("/account/orders");
        return;
      }

      // پرداخت (PATCH) — برای COD ممکن است فقط ثبت وضعیت باشد
      if (paymentMethod === "zarinpal" || paymentMethod === "card") {
        try {
          await payCheckout.mutateAsync(checkoutId);
        } catch {
          // سفارش ثبت شده؛ کاربر می‌تواند بعداً پرداخت کند
          toast.message("سفارش ثبت شد؛ پرداخت کامل نشد");
        }
      }

      router.push(`/store/orders/${checkoutId}`);
    } catch {
      // toast در hook
    }
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">سبد خرید خالی است</p>
        <Button asChild>
          <Link href="/store">بازگشت به فروشگاه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">تسویه حساب</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {cart.totalItems.toLocaleString("fa-IR")} قلم در{" "}
              {stores.length.toLocaleString("fa-IR")} فروشگاه
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/cart">بازگشت به سبد</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ستون اصلی */}
          <div className="lg:col-span-2 space-y-5">
            {/* آدرس */}
            <section className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">آدرس تحویل</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>آدرسی ثبت نشده است.</p>
                  <Button asChild size="sm">
                    <Link href="/account/addresses">ثبت آدرس</Link>
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={addressId}
                  onValueChange={setAddressId}
                  className="space-y-2"
                >
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                        addressId === a.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <RadioGroupItem value={a.id} className="mt-1" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">
                          {a.title || a.fullName}
                          {a.isDefault ? (
                            <span className="ms-2 text-[10px] text-primary">
                              پیش‌فرض
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[a.provinceName, a.cityName, a.address]
                            .filter(Boolean)
                            .join("، ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.fullName} · {a.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </section>

            {/* ارسال هر فروشگاه */}
            <section className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">روش ارسال</h2>
              </div>

              {!provinceId ? (
                <p className="text-sm text-muted-foreground">
                  ابتدا آدرس را انتخاب کنید.
                </p>
              ) : shippingLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : shippingError ? (
                <p className="text-sm text-destructive">
                  خطا در دریافت روش‌های ارسال
                </p>
              ) : (
                stores.map((store) => {
                  const options = shippingByStoreId.get(store.storeId) ?? [];
                  const selected = shippingByStore[store.storeId];
                  return (
                    <div key={store.storeId} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{store.storeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.items.length.toLocaleString("fa-IR")} قلم
                        </p>
                      </div>

                      {options.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          برای این استان روش ارسالی از این فروشگاه تعریف نشده
                          است.
                        </p>
                      ) : (
                        <RadioGroup
                          value={selected?.option.id ?? ""}
                          onValueChange={(id) => {
                            const opt = options.find((o) => o.id === id);
                            if (!opt) return;
                            setShippingByStore((prev) => ({
                              ...prev,
                              [store.storeId]: {
                                option: opt,
                                note: prev[store.storeId]?.note ?? "",
                              },
                            }));
                          }}
                          className="space-y-2"
                        >
                          {options.map((opt) => (
                            <label
                              key={opt.id}
                              className={cn(
                                "flex gap-3 rounded-xl border p-3 cursor-pointer",
                                selected?.option.id === opt.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border",
                              )}
                            >
                              <RadioGroupItem value={opt.id} className="mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium">
                                    {opt.methodName ||
                                      opt.phrase ||
                                      "روش ارسال"}
                                  </p>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {opt.defaultPrice === 0
                                      ? "رایگان"
                                      : formatToman(opt.defaultPrice)}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {[opt.description, opt.phrase]
                                    .filter(Boolean)
                                    .join(" · ")}
                                  {(opt.minDays || opt.maxDays) > 0 && (
                                    <>
                                      {" "}
                                      · {opt.minDays} تا {opt.maxDays} روز
                                    </>
                                  )}
                                </p>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">یادداشت برای فروشنده</Label>
                        <Textarea
                          rows={2}
                          value={selected?.note ?? ""}
                          onChange={(e) =>
                            setShippingByStore((prev) => ({
                              ...prev,
                              [store.storeId]: {
                                option:
                                  prev[store.storeId]?.option ?? options[0],
                                note: e.target.value,
                              },
                            }))
                          }
                          placeholder="توضیحات اختیاری..."
                          className="resize-none text-sm"
                          disabled={!selected}
                        />
                      </div>

                      <Separator />
                    </div>
                  );
                })
              )}
            </section>

            {/* تخفیف */}
            <section className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">کد تخفیف</h2>
              </div>
              <div className="flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="مثلاً SUMMER"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={validateDiscount.isPending}
                  onClick={handleValidateDiscount}
                >
                  {validateDiscount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "اعمال"
                  )}
                </Button>
              </div>
              {discountPreview && (
                <p className="text-xs text-primary">{discountPreview}</p>
              )}
            </section>

            {/* پرداخت */}
            <section className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">روش پرداخت</h2>
              </div>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid sm:grid-cols-3 gap-2"
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "rounded-xl border p-3 cursor-pointer",
                      paymentMethod === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value={opt.value} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {opt.hint}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </section>
          </div>

          {/* خلاصه */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-4">
              <h2 className="font-semibold text-sm">خلاصه سفارش</h2>

              <div className="space-y-2 text-sm">
                {stores.map((store) => (
                  <div key={store.storeId} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {store.storeName}
                    </p>
                    {store.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-2 text-xs"
                      >
                        <span className="line-clamp-1">
                          {item.product.title} × {item.quantity}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {formatToman(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">جمع کالا</span>
                  <span className="tabular-nums">
                    {formatToman(cart.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ارسال</span>
                  <span className="tabular-nums">
                    {shippingTotal === 0 ? "—" : formatToman(shippingTotal)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="tabular-nums">
                    {formatToman(grandTotal)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full h-11"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {createCheckout.isPending || payCheckout.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    در حال ثبت...
                  </>
                ) : (
                  "ثبت سفارش"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                با ثبت سفارش، آدرس و روش ارسال هر فروشگاه نهایی می‌شود. مسیر{" "}
                <code className="text-[10px]">/checkout</code> مربوط به پلن
                اشتراک است و جدا نگه داشته شده.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
