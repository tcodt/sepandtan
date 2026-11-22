"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Send,
  CheckCircle2,
  Store,
  Hash,
  Phone,
  Mail,
  Building2,
  User,
  Info,
  X,
  Shield,
  MessageSquare,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useRequestStoreRole } from "@/features/role/hooks/use-role-request";
import { canRequestProfessionalRole } from "@/lib/role-lock";
import { cn } from "@/lib/utils";
import { setRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DESCRIPTION_MAX = 500;

const BUSINESS_TYPES = [
  { value: "INDIVIDUAL", label: "حقیقی", icon: User },
  { value: "LEGAL", label: "حقوقی", icon: Building2 },
] as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Latin slug — returns "" when source has no Latin chars. */
function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert Persian/Arabic digits to Latin and strip non-digit chars (except leading +). */
function normalizePhone(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const map: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  const latin = v.replace(/[۰-۹٠-٩]/g, (d) => map[d] ?? d);
  const hasPlus = latin.startsWith("+");
  const digits = latin.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/* -------------------------------------------------------------------------- */
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

const emailOrEmpty = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "ایمیل نامعتبر است",
  );

const phoneOrEmpty = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^\+?\d{8,15}$/.test(normalizePhone(v)),
    "شماره تلفن نامعتبر است",
  );

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام فروشگاه حداقل ۲ کاراکتر")
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
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `حداکثر ${DESCRIPTION_MAX} کاراکتر`)
    .optional()
    .or(z.literal("")),
  phone: phoneOrEmpty,
  email: emailOrEmpty,
  businessType: z.enum(["INDIVIDUAL", "LEGAL"]),
});

type FormValues = z.infer<typeof formSchema>;

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function PageLoadingState() {
  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center px-4 py-6"
    >
      <Card className="w-full max-w-xl border-border shadow-lg">
        <CardHeader className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessState({
  storeName,
  onBackToRoleSelection,
}: {
  storeName: string;
  onBackToRoleSelection: () => void;
}) {
  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center px-4 py-6"
    >
      <Card className="w-full max-w-xl border-border shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <CheckCircle2
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              درخواست شما ثبت شد
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              درخواست فروشندگی «{storeName}» به صف بررسی ادمین ارسال شد. پس از
              تأیید، پنل فروشنده فعال می‌شود.
            </p>
          </div>
          <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-start">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              مرحله بعدی چیست؟
            </p>
            <ol className="ms-5 list-decimal space-y-1 text-xs text-muted-foreground">
              <li>ادمین اطلاعات فروشگاه شما را بررسی می‌کند.</li>
              <li>نتیجه از طریق اعلان‌ها و ایمیل به شما اطلاع داده می‌شود.</li>
              <li>
                در صورت تأیید، از داشبورد به پنل فروشنده منتقل می‌شوید و
                می‌توانید محصولات خود را اضافه کنید.
              </li>
            </ol>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full gap-1.5 sm:flex-1"
              onClick={onBackToRoleSelection}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              بازگشت
            </Button>
            <Button asChild className="w-full gap-1.5 sm:flex-1">
              <Link href="/role-pending?type=seller">
                <Clock className="h-4 w-4" aria-hidden="true" />
                وضعیت درخواست
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SellerApplyPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    blockPending: false,
  });

  const storeMutation = useRequestStoreRole();
  const [submitted, setSubmitted] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const nameId = useId();
  const slugId = useId();
  const businessTypeId = useId();
  const descriptionId = useId();
  const phoneId = useId();
  const emailId = useId();

  /* ----------------------------- Auth gate ----------------------------- */

  useEffect(() => {
    setRoleFlowIntent("seller-apply");
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === "seller" && user.roleStatus === "approved") {
      router.replace("/seller");
      return;
    }
    if (user.role === "seller" && user.roleStatus !== "approved") {
      router.replace("/role-pending?type=seller");
      return;
    }

    const gate = canRequestProfessionalRole(user, "seller");
    if (!gate.ok) {
      toast.error(gate.message);
      router.replace("/role-selection");
    }
  }, [isLoading, user, router]);

  /* ------------------------------ Form setup ------------------------------ */

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: user?.name ? `فروشگاه ${user.name}` : "",
      slug: "",
      description: "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      businessType: "INDIVIDUAL",
    }),
    [user?.name, user?.phone, user?.email],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Hook-based watches — no form.watch() in JSX.
  const nameValue = useWatch({ control: form.control, name: "name" });
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const businessTypeValue = useWatch({
    control: form.control,
    name: "businessType",
  });
  const descriptionValue = useWatch({
    control: form.control,
    name: "description",
  });

  /* --------------------------- Auto-slug handler -------------------------- */

  const handleNameChange = useCallback(
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

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugTouched(true);
      // RHF register will still fire — this only flips the touched flag.
      // We don't need to manually set the value because register does it.
      void e;
    },
    [],
  );

  const resetSlugFromName = useCallback(() => {
    const latin = toSlug(nameValue ?? "");
    setSlugTouched(false);
    form.setValue("slug", latin, { shouldValidate: true, shouldDirty: true });
  }, [form, nameValue]);

  /* ------------------------------ Submit ------------------------------ */

  const onSubmit = form.handleSubmit(
    (data) => {
      storeMutation.mutate(
        {
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description?.trim() || "",
          phone: normalizePhone(data.phone) || undefined,
          email: data.email?.trim() || undefined,
          businessType: data.businessType,
        },
        {
          onSuccess: () => setSubmitted(true),
        },
      );
    },
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) {
        const el = document.getElementById(`store-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | null)?.focus?.();
      }
    },
  );

  const handleBackToRoleSelection = useCallback(() => {
    router.push("/role-selection");
  }, [router]);

  /* ------------------------------- Render ------------------------------- */

  if (isLoading || !isAuthenticated) {
    return <PageLoadingState />;
  }

  if (submitted) {
    return (
      <SuccessState
        storeName={form.getValues("name") || "فروشگاه شما"}
        onBackToRoleSelection={handleBackToRoleSelection}
      />
    );
  }

  const pending = storeMutation.isPending;
  const descriptionLength = (descriptionValue ?? "").trim().length;
  const slugReady = (slugValue ?? "").length >= 2;

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-start justify-center px-4 py-6 sm:py-10"
    >
      <Card className="w-full max-w-xl border-border shadow-lg">
        {/* ------------------------------ Back nav ------------------------------ */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ms-2 gap-1 text-muted-foreground"
            onClick={handleBackToRoleSelection}
            disabled={pending}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            بازگشت
          </Button>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden="true" />
            درخواست فروشندگی
          </span>
        </div>

        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">اطلاعات فروشگاه</CardTitle>
          <CardDescription>
            مشخصات فروشگاه را وارد کنید. پس از تأیید ادمین، پنل فروشنده فعال
            می‌شود.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* -------------------------- Store name -------------------------- */}
            <div className="space-y-2">
              <Label htmlFor={nameId} className="flex items-center gap-1.5">
                <Store
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                نام فروشگاه
              </Label>
              <Input
                id={nameId}
                className="h-11"
                autoComplete="organization"
                {...form.register("name", {
                  onChange: handleNameChange,
                })}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* -------------------------- Slug -------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={slugId} className="flex items-center gap-1.5">
                  <Hash
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  نامک (slug)
                </Label>
                {slugTouched && nameValue && (
                  <button
                    type="button"
                    onClick={resetSlugFromName}
                    className="text-[10px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    بازسازی خودکار از نام
                  </button>
                )}
              </div>
              <div className="flex h-11 items-center rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                <span
                  dir="ltr"
                  className="select-none pe-1 font-mono text-xs text-muted-foreground"
                >
                  /
                </span>
                <input
                  id={slugId}
                  type="text"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-full flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="my-store"
                  {...form.register("slug", {
                    onChange: handleSlugChange,
                  })}
                  aria-invalid={!!form.formState.errors.slug}
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.slug.message}
                </p>
              )}
              {!form.formState.errors.slug && slugReady && (
                <p className="text-[10px] text-muted-foreground">
                  آدرس فروشگاه شما:{" "}
                  <span dir="ltr" className="font-mono">
                    /store/{slugValue}
                  </span>
                </p>
              )}
              {!form.formState.errors.slug && !slugReady && (
                <p className="text-[10px] text-muted-foreground">
                  به‌طور خودکار از نام فروشگاه ساخته می‌شود؛ می‌توانید تغییرش
                  دهید.
                </p>
              )}
            </div>

            {/* -------------------------- Business type -------------------------- */}
            <div className="space-y-2">
              <Label
                htmlFor={businessTypeId}
                className="flex items-center gap-1.5"
              >
                <Building2
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                نوع کسب‌وکار
              </Label>
              <Select
                value={businessTypeValue}
                onValueChange={(v) =>
                  form.setValue("businessType", v as "INDIVIDUAL" | "LEGAL", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id={businessTypeId} className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {BUSINESS_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                «حقیقی» برای فروش شخصی؛ «حقوقی» برای شرکت یا فروشگاه ثبت‌شده.
              </p>
            </div>

            {/* -------------------------- Description -------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={descriptionId}
                  className="flex items-center gap-1.5"
                >
                  <MessageSquare
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  توضیحات (اختیاری)
                </Label>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    descriptionLength > DESCRIPTION_MAX
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {descriptionLength.toLocaleString("fa-IR")} /{" "}
                  {DESCRIPTION_MAX.toLocaleString("fa-IR")}
                </span>
              </div>
              <Textarea
                id={descriptionId}
                rows={3}
                className="resize-none"
                placeholder="در مورد فروشگاه و محصولاتتان بنویسید…"
                {...form.register("description")}
                aria-invalid={!!form.formState.errors.description}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* -------------------------- Contact -------------------------- */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                اطلاعات تماس (برای هماهنگی تأیید — اختیاری)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor={phoneId}
                    className="flex items-center gap-1.5"
                  >
                    <Phone
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    تلفن
                  </Label>
                  <Input
                    id={phoneId}
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11 font-mono"
                    placeholder="09123456789"
                    {...form.register("phone")}
                    aria-invalid={!!form.formState.errors.phone}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={emailId}
                    className="flex items-center gap-1.5"
                  >
                    <Mail
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    ایمیل
                  </Label>
                  <Input
                    id={emailId}
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    className="h-11 font-mono text-sm"
                    placeholder="you@example.com"
                    {...form.register("email")}
                    aria-invalid={!!form.formState.errors.email}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* -------------------------- What happens next -------------------------- */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                پس از ارسال چه می‌شود؟
              </p>
              <ol className="ms-5 mt-1.5 list-decimal space-y-1 text-[11px] text-muted-foreground">
                <li>درخواست شما به صف بررسی ادمین می‌رود.</li>
                <li>معمولاً طی ۲۴ تا ۴۸ ساعت بررسی می‌شود.</li>
                <li>
                  در صورت تأیید، نقش فروشنده برای شما فعال و پنل{" "}
                  <span dir="ltr" className="font-mono">
                    /seller
                  </span>{" "}
                  باز می‌شود.
                </li>
              </ol>
            </div>

            {/* -------------------------- Submit -------------------------- */}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={handleBackToRoleSelection}
                disabled={pending}
              >
                <X className="me-1.5 h-4 w-4" aria-hidden="true" />
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 w-full flex-1 gap-2"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    در حال ثبت…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    ثبت درخواست
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
