"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Send,
  CheckCircle2,
  Instagram,
  User,
  Briefcase,
  Clock,
  Users,
  Sparkles,
  Info,
  MessageSquare,
  X,
  Shield,
  MapPin,
  IdCard,
  Building2,
  MapPinned,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useRequestCoachRole } from "@/features/role/hooks/use-role-request";
import {
  fetchCities,
  fetchProvinces,
  yearToExperienceIso,
} from "@/features/role/api";
import { canRequestProfessionalRole } from "@/lib/role-lock";
import { cn } from "@/lib/utils";
import { setRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SPECIALTIES = [
  "کاهش وزن",
  "افزایش حجم",
  "تناسب اندام",
  "قدرتی",
  "هوازی / استقامتی",
  "تغذیه ورزشی",
  "بازتوانی / آسیب",
  "بدنسازی بانوان",
  "آمادگی جسمانی عمومی",
] as const;

const BIO_MIN = 20;
const BIO_MAX = 500;
const HEADLINE_MAX = 80;

const MIN_START_YEAR = 1970;
const MAX_START_YEAR = new Date().getFullYear();

const LOCATION_STALE_MS = 30 * 60 * 1000; // 30 minutes

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Persian/Arabic digits → Latin digits. */
function toLatinDigits(raw: string): string {
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
  return raw.replace(/[۰-۹٠-٩]/g, (d) => map[d] ?? d);
}

/** Strip @ and URLs from Instagram handle. */
function normalizeInstagram(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const urlMatch = v.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  if (urlMatch) return urlMatch[1];
  return v.replace(/^@+/, "").replace(/[^A-Za-z0-9_.]/g, "");
}

/* -------------------------------------------------------------------------- */
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

const requiredIntString = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} الزامی است`)
    .transform(toLatinDigits)
    .refine((v) => /^\d+$/.test(v), "فقط عدد صحیح غیرمنفی")
    .transform(Number)
    .refine((n) => n >= min, `حداقل ${min}`)
    .refine((n) => n <= max, `حداکثر ${max}`);

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "نام نمایشی حداقل ۲ کاراکتر")
    .max(60, "حداکثر ۶۰ کاراکتر"),
  headline: z
    .string()
    .trim()
    .min(5, "تیتر حداقل ۵ کاراکتر")
    .max(HEADLINE_MAX, `حداکثر ${HEADLINE_MAX} کاراکتر`),
  bio: z
    .string()
    .trim()
    .min(BIO_MIN, `حداقل ${BIO_MIN} کاراکتر`)
    .max(BIO_MAX, `حداکثر ${BIO_MAX} کاراکتر`),
  experienceStartYear: requiredIntString(
    "سال شروع فعالیت",
    MIN_START_YEAR,
    MAX_START_YEAR,
  ),
  instagram: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^[A-Za-z0-9_.]{1,30}$/.test(normalizeInstagram(v)),
      "شناسه اینستاگرام نامعتبر است",
    ),
  maxClients: requiredIntString("ظرفیت شاگرد", 1, 200),
  isAcceptingClients: z.boolean(),
  nationalId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? toLatinDigits(v) : ""))
    .refine((v) => !v || /^\d{10}$/.test(v), "کد ملی باید ۱۰ رقم باشد"),
  provinceId: z.string().trim().optional().or(z.literal("")),
  cityId: z.string().trim().optional().or(z.literal("")),
  specialties: z.array(z.string()).min(1, "حداقل یک تخصص انتخاب کنید"),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

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
          {Array.from({ length: 5 }).map((_, i) => (
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
  name,
  onBackToRoleSelection,
}: {
  name: string;
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
              درخواست مربیگری «{name}» به صف بررسی ادمین ارسال شد. پس از تأیید،
              پنل مربی برای شما فعال می‌شود.
            </p>
          </div>
          <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-start">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              مرحله بعدی چیست؟
            </p>
            <ol className="ms-5 list-decimal space-y-1 text-xs text-muted-foreground">
              <li>ادمین اطلاعات شما را بررسی می‌کند.</li>
              <li>نتیجه از طریق اعلان‌ها و ایمیل به شما اطلاع داده می‌شود.</li>
              <li>در صورت تأیید، از داشبورد به پنل مربی منتقل می‌شوید.</li>
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
              <Link href="/role-pending?type=coach">
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

export default function CoachApplyPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    blockPending: false,
  });

  const coachMutation = useRequestCoachRole();
  const [submitted, setSubmitted] = useState(false);

  const titleId = useId();
  const headlineId = useId();
  const bioId = useId();
  const experienceId = useId();
  const instagramId = useId();
  const nationalIdId = useId();
  const maxClientsId = useId();
  const provinceId_ = useId();
  const cityId_ = useId();

  /* ----------------------------- Location queries ----------------------------- */

  const provincesQuery = useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    staleTime: LOCATION_STALE_MS,
  });

  /* ----------------------------- Auth gate ----------------------------- */

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === "coach" && user.roleStatus === "approved") {
      router.replace("/coach");
      return;
    }
    if (user.role === "coach" && user.roleStatus !== "approved") {
      router.replace("/role-pending?type=coach");
      return;
    }

    const gate = canRequestProfessionalRole(user, "coach");
    if (!gate.ok) {
      toast.error(gate.message);
      router.replace("/role-selection");
    }
  }, [isLoading, user, router]);

  /* ------------------------------ Form setup ------------------------------ */

  const defaultValues = useMemo<FormInput>(
    () => ({
      title: user?.name ?? "",
      headline: "",
      bio: "",
      experienceStartYear: String(Math.max(MIN_START_YEAR, MAX_START_YEAR - 3)),
      instagram: "",
      maxClients: "20",
      isAcceptingClients: true,
      nationalId: "",
      provinceId: "",
      cityId: "",
      specialties: [],
    }),
    [user?.name],
  );

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    setRoleFlowIntent("coach-apply");
  }, []);

  const specialtyValues = useWatch({
    control: form.control,
    name: "specialties",
  });
  const bioValue = useWatch({ control: form.control, name: "bio" });
  const headlineValue = useWatch({ control: form.control, name: "headline" });
  const experienceStartYearValue = useWatch({
    control: form.control,
    name: "experienceStartYear",
  });
  const provinceValue = useWatch({
    control: form.control,
    name: "provinceId",
  });
  const cityValue = useWatch({ control: form.control, name: "cityId" });
  const isAcceptingClientsValue = useWatch({
    control: form.control,
    name: "isAcceptingClients",
  });

  const selectedSpecialties = specialtyValues ?? [];
  const isDirty = form.formState.isDirty;

  const citiesQuery = useQuery({
    queryKey: ["cities", provinceValue],
    queryFn: () => fetchCities(provinceValue || undefined),
    enabled: Boolean(provinceValue),
    staleTime: LOCATION_STALE_MS,
  });

  // Derived "years of experience" for user reassurance.
  const derivedYears = useMemo(() => {
    const year = Number(toLatinDigits(experienceStartYearValue ?? ""));
    if (!Number.isFinite(year) || year < MIN_START_YEAR) return null;
    return Math.max(0, MAX_START_YEAR - year);
  }, [experienceStartYearValue]);

  /* ------------------------------ Handlers ------------------------------ */

  const toggleSpecialty = useCallback(
    (item: string) => {
      const current = form.getValues("specialties") ?? [];
      const next = current.includes(item)
        ? current.filter((s) => s !== item)
        : [...current, item];
      form.setValue("specialties", next, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form],
  );

  const onProvinceChange = useCallback(
    (next: string) => {
      form.setValue("provinceId", next, {
        shouldValidate: true,
        shouldDirty: true,
      });
      // Reset city when province changes.
      form.setValue("cityId", "", { shouldDirty: true });
    },
    [form],
  );

  const clearProvince = useCallback(() => {
    form.setValue("provinceId", "", { shouldDirty: true });
    form.setValue("cityId", "", { shouldDirty: true });
  }, [form]);

  const onSubmit = form.handleSubmit(
    (data) => {
      const instagram = normalizeInstagram(data.instagram);
      const experienceIso = yearToExperienceIso(data.experienceStartYear);

      coachMutation.mutate(
        {
          title: data.title.trim(),
          headline: data.headline.trim(),
          // ✅ Bio sent as-is; specialties NOT concatenated.
          bio: data.bio.trim(),
          experienceYears: experienceIso,
          instagram: instagram || undefined,
          maxClients: data.maxClients,
          isAcceptingClients: data.isAcceptingClients,
          nationalId: data.nationalId || undefined,
          provinceId: data.provinceId || undefined,
          cityId: data.cityId || undefined,
        },
        {
          onSuccess: () => setSubmitted(true),
        },
      );
    },
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) {
        const el = document.getElementById(`coach-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | null)?.focus?.();
      }
    },
  );

  const handleBackToRoleSelection = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm("تغییرات ذخیره‌نشده دارید. بازگشت بدون ذخیره؟");
      if (!ok) return;
    }
    router.push("/role-selection");
  }, [isDirty, router]);

  /* ------------------------------- Render ------------------------------- */

  if (isLoading || !isAuthenticated) {
    return <PageLoadingState />;
  }

  if (submitted) {
    return (
      <SuccessState
        name={user?.name || "شما"}
        onBackToRoleSelection={() => router.push("/role-selection")}
      />
    );
  }

  const pending = coachMutation.isPending;
  const bioLength = (bioValue ?? "").trim().length;
  const headlineLength = (headlineValue ?? "").trim().length;

  const provinceList = provincesQuery.data ?? [];
  const cityList = citiesQuery.data ?? [];

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
            درخواست مربیگری
          </span>
        </div>

        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">اطلاعات مربیگری</CardTitle>
          <CardDescription>
            این اطلاعات برای بررسی ادمین ثبت می‌شود. پس از تأیید، پنل مربی فعال
            می‌گردد.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* -------------------------- Title -------------------------- */}
            <div className="space-y-2">
              <Label htmlFor={titleId} className="flex items-center gap-1.5">
                <User
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                نام نمایشی
              </Label>
              <Input
                id={titleId}
                className="h-11"
                autoComplete="name"
                {...form.register("title")}
                aria-invalid={!!form.formState.errors.title}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* -------------------------- Headline -------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={headlineId}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  تیتر حرفه‌ای
                </Label>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    headlineLength > HEADLINE_MAX
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {headlineLength.toLocaleString("fa-IR")} /{" "}
                  {HEADLINE_MAX.toLocaleString("fa-IR")}
                </span>
              </div>
              <Input
                id={headlineId}
                placeholder="مثلاً مربی کاهش وزن و تغذیه"
                className="h-11"
                {...form.register("headline")}
                aria-invalid={!!form.formState.errors.headline}
              />
              {form.formState.errors.headline && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.headline.message}
                </p>
              )}
            </div>

            {/* -------------------------- Specialties -------------------------- */}
            <fieldset className="space-y-2">
              <legend className="flex items-center gap-1.5 text-sm font-medium">
                <Briefcase
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                تخصص‌ها
                <span className="text-xs text-muted-foreground">
                  (حداقل یکی)
                </span>
              </legend>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="انتخاب تخصص‌ها"
              >
                {SPECIALTIES.map((item) => {
                  const active = selectedSpecialties.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSpecialty(item)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {active && (
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.specialties && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.specialties.message}
                </p>
              )}
            </fieldset>

            {/* ------------------ Experience + Max clients ------------------ */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={experienceId}
                  className="flex items-center gap-1.5"
                >
                  <Clock
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  سال شروع فعالیت
                </Label>
                <Input
                  id={experienceId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="مثلاً 1398"
                  className="h-11 tabular-nums"
                  {...form.register("experienceStartYear")}
                  aria-invalid={!!form.formState.errors.experienceStartYear}
                />
                {form.formState.errors.experienceStartYear && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.experienceStartYear.message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  سالی که فعالیت مربیگری را شروع کرده‌اید.
                  {derivedYears !== null && (
                    <span className="ms-1 text-foreground">
                      (حدود {derivedYears.toLocaleString("fa-IR")} سال سابقه)
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={maxClientsId}
                  className="flex items-center gap-1.5"
                >
                  <Users
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  ظرفیت شاگرد
                </Label>
                <Input
                  id={maxClientsId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="h-11 tabular-nums"
                  {...form.register("maxClients")}
                  aria-invalid={!!form.formState.errors.maxClients}
                />
                {form.formState.errors.maxClients && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.maxClients.message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  حداکثر تعداد شاگردی که می‌توانید همزمان بپذیرید.
                </p>
              </div>
            </div>

            {/* -------------------------- Bio -------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={bioId} className="flex items-center gap-1.5">
                  <MessageSquare
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  بیو
                </Label>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    bioLength < BIO_MIN || bioLength > BIO_MAX
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {bioLength.toLocaleString("fa-IR")} /{" "}
                  {BIO_MAX.toLocaleString("fa-IR")}
                  {bioLength < BIO_MIN && (
                    <span className="ms-1">
                      (حداقل {BIO_MIN.toLocaleString("fa-IR")})
                    </span>
                  )}
                </span>
              </div>
              <Textarea
                id={bioId}
                rows={4}
                className="resize-none"
                placeholder="درباره خودتان، سبک تمرین و رویکردتان با شاگردها بنویسید…"
                {...form.register("bio")}
                aria-invalid={!!form.formState.errors.bio}
              />
              {form.formState.errors.bio && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>

            {/* -------------------------- Instagram + National ID -------------------------- */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={instagramId}
                  className="flex items-center gap-1.5"
                >
                  <Instagram
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  اینستاگرام (اختیاری)
                </Label>
                <div className="flex h-11 items-center rounded-md border border-input bg-background px-3">
                  <span
                    dir="ltr"
                    className="select-none pe-1 text-sm text-muted-foreground"
                  >
                    @
                  </span>
                  <input
                    id={instagramId}
                    type="text"
                    dir="ltr"
                    className="h-full flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="your_handle"
                    {...form.register("instagram")}
                    aria-invalid={!!form.formState.errors.instagram}
                  />
                </div>
                {form.formState.errors.instagram && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.instagram.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={nationalIdId}
                  className="flex items-center gap-1.5"
                >
                  <IdCard
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  کد ملی (اختیاری)
                </Label>
                <Input
                  id={nationalIdId}
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  className="h-11 font-mono tabular-nums"
                  placeholder="۱۰ رقم"
                  {...form.register("nationalId")}
                  aria-invalid={!!form.formState.errors.nationalId}
                />
                {form.formState.errors.nationalId && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.nationalId.message}
                  </p>
                )}
              </div>
            </div>

            {/* -------------------------- Location -------------------------- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  موقعیت (اختیاری)
                </p>
                {provinceValue && (
                  <button
                    type="button"
                    onClick={clearProvince}
                    className="text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    پاک کردن
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor={provinceId_}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Building2
                      className="h-3 w-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                    استان
                  </Label>
                  <Select
                    value={provinceValue || undefined}
                    onValueChange={onProvinceChange}
                    disabled={provincesQuery.isLoading}
                  >
                    <SelectTrigger id={provinceId_} className="h-11 w-full">
                      <SelectValue
                        placeholder={
                          provincesQuery.isLoading
                            ? "در حال بارگذاری…"
                            : "انتخاب استان"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {provinceList.length === 0 &&
                        !provincesQuery.isLoading && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            استانی یافت نشد
                          </div>
                        )}
                      {provinceList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={cityId_}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <MapPinned
                      className="h-3 w-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                    شهر
                  </Label>
                  <Select
                    value={cityValue || undefined}
                    onValueChange={(v) =>
                      form.setValue("cityId", v, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    disabled={
                      !provinceValue ||
                      citiesQuery.isLoading ||
                      citiesQuery.isFetching
                    }
                  >
                    <SelectTrigger id={cityId_} className="h-11 w-full">
                      <SelectValue
                        placeholder={
                          !provinceValue
                            ? "ابتدا استان را انتخاب کنید"
                            : citiesQuery.isLoading
                              ? "در حال بارگذاری…"
                              : "انتخاب شهر"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {cityList.length === 0 &&
                        !citiesQuery.isLoading &&
                        provinceValue && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            شهری یافت نشد
                          </div>
                        )}
                      {cityList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* -------------------------- Accepting toggle -------------------------- */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="min-w-0">
                <Label
                  htmlFor="coach-isAcceptingClients"
                  className="cursor-pointer text-sm"
                >
                  پذیرش شاگرد جدید
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  اگر فعال باشد، کاربران می‌توانند درخواست مربیگری بفرستند.
                </p>
              </div>
              <Switch
                id="coach-isAcceptingClients"
                checked={isAcceptingClientsValue}
                onCheckedChange={(v) =>
                  form.setValue("isAcceptingClients", v, {
                    shouldDirty: true,
                  })
                }
              />
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
                <li>نتیجه از طریق اعلان‌ها به شما اطلاع داده می‌شود.</li>
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
