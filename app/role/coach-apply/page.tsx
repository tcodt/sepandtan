"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  RefreshCw,
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
  fetchSpecialtySelector,
  yearToExperienceIso,
} from "@/features/role/api";
import { canRequestProfessionalRole } from "@/lib/role-lock";
import { cn } from "@/lib/utils";
import { setRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const BIO_MIN = 20;
const BIO_MAX = 500;
const HEADLINE_MAX = 80;
const MIN_START_YEAR = 1970;
const MAX_START_YEAR = new Date().getFullYear();
const STALE_MS = 30 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/** پشتیبانی سال شمسی (~۱۳۰۰–۱۵۰۰) و میلادی */
function normalizeStartYear(raw: string | number): number {
  const n =
    typeof raw === "number" ? raw : Number(toLatinDigits(String(raw)).trim());
  if (!Number.isFinite(n)) return MAX_START_YEAR;
  if (n >= 1300 && n <= 1500) return n + 621;
  return Math.max(MIN_START_YEAR, Math.min(MAX_START_YEAR, Math.floor(n)));
}

function normalizeInstagram(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const m = v.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  if (m?.[1]) return m[1];
  return v.replace(/^@+/, "").replace(/[^A-Za-z0-9_.]/g, "");
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const requiredIntString = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} الزامی است`)
    .transform(toLatinDigits)
    .refine((v) => /^\d+$/.test(v), "فقط عدد")
    .transform(Number)
    .refine((n) => Number.isFinite(n) && n >= min && n <= max, {
      message: `بین ${min} تا ${max}`,
    });

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
  ).refine((n) => {
    const g = normalizeStartYear(n);
    return g >= MIN_START_YEAR && g <= MAX_START_YEAR;
  }, "سال نامعتبر است"),
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
  specialtyIds: z.array(z.string()).min(1, "حداقل یک تخصص انتخاب کنید"),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

/* -------------------------------------------------------------------------- */
/* UI pieces                                                                  */
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

function SuccessState({ name, onBack }: { name: string; onBack: () => void }) {
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
              درخواست مربیگری «{name}» ثبت شد. پس از بررسی ادمین، نتیجه از طریق
              اعلان‌ها اعلام می‌شود.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full gap-1.5 sm:flex-1"
              onClick={onBack}
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

function SectionTitle({
  icon: Icon,
  children,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {children}
      </p>
      {hint ? (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

function CoachApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const provinceSelectId = useId();
  const citySelectId = useId();

  const fieldDomId: Record<string, string> = {
    title: titleId,
    headline: headlineId,
    bio: bioId,
    experienceStartYear: experienceId,
    instagram: instagramId,
    nationalId: nationalIdId,
    maxClients: maxClientsId,
    provinceId: provinceSelectId,
    cityId: citySelectId,
    specialtyIds: "coach-specialty-ids",
  };

  const provincesQuery = useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    staleTime: STALE_MS,
  });

  const specialtiesQuery = useQuery({
    queryKey: ["specialty-selector"],
    queryFn: () => fetchSpecialtySelector(),
    staleTime: STALE_MS,
  });

  useEffect(() => {
    setRoleFlowIntent("coach-apply");
  }, []);

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
      specialtyIds: [],
    }),
    [user?.name],
  );

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const specialtyIds = useWatch({
    control: form.control,
    name: "specialtyIds",
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

  const selectedSpecialtyIds = specialtyIds ?? [];
  const isDirty = form.formState.isDirty;

  const citiesQuery = useQuery({
    queryKey: ["cities", provinceValue],
    queryFn: () => fetchCities(provinceValue || undefined),
    enabled: Boolean(provinceValue),
    staleTime: STALE_MS,
  });

  const specialtyList = useMemo(
    () => specialtiesQuery.data ?? [],
    [specialtiesQuery.data],
  );
  const specialtyTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of specialtyList) map.set(s.id, s.title);
    return map;
  }, [specialtyList]);

  const derivedYears = useMemo(() => {
    const g = normalizeStartYear(experienceStartYearValue ?? "");
    if (g < MIN_START_YEAR) return null;
    return Math.max(0, MAX_START_YEAR - g);
  }, [experienceStartYearValue]);

  const navigateBack = useCallback(
    (skipDirtyGuard = false) => {
      if (!skipDirtyGuard && isDirty) {
        const ok = window.confirm(
          "تغییرات ذخیره‌نشده دارید. بازگشت بدون ذخیره؟",
        );
        if (!ok) return;
      }

      const from = searchParams.get("from");
      if (from === "account") {
        router.push("/account");
        return;
      }
      if (from === "role-selection") {
        router.push("/role-selection");
        return;
      }
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push("/role-selection");
    },
    [isDirty, router, searchParams],
  );

  const toggleSpecialty = useCallback(
    (id: string) => {
      const current = form.getValues("specialtyIds") ?? [];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      form.setValue("specialtyIds", next, {
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
      const gregorianYear = normalizeStartYear(data.experienceStartYear);
      const experienceIso = yearToExperienceIso(gregorianYear);

      const specialtyTitles = data.specialtyIds
        .map((id) => specialtyTitleById.get(id))
        .filter((t): t is string => Boolean(t));

      // CreateCoachDto فیلد specialty ندارد؛ عنوان‌ها در bio برای بررسی ادمین
      const specialtyNote =
        specialtyTitles.length > 0
          ? `\n\nتخصص‌ها: ${specialtyTitles.join("، ")}`
          : "";

      coachMutation.mutate(
        {
          title: data.title.trim(),
          headline: data.headline.trim(),
          bio: `${data.bio.trim()}${specialtyNote}`,
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
      if (!first) return;
      const id = fieldDomId[first];
      if (!id) return;
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement | null)?.focus?.();
      toast.error("لطفاً فیلدهای الزامی را تکمیل کنید");
    },
  );

  if (isLoading || !isAuthenticated) {
    return <PageLoadingState />;
  }

  if (submitted) {
    return (
      <SuccessState
        name={form.getValues("title") || user?.name || "شما"}
        onBack={() => navigateBack(true)}
      />
    );
  }

  const pending = coachMutation.isPending;
  const bioLength = (bioValue ?? "").trim().length;
  const headlineLength = (headlineValue ?? "").trim().length;
  const provinceList = provincesQuery.data ?? [];
  const cityList = citiesQuery.data ?? [];
  const selectedCount = selectedSpecialtyIds.length;

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-start justify-center px-4 py-6 sm:py-10"
    >
      <Card className="w-full max-w-xl border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ms-2 gap-1 text-muted-foreground"
            onClick={() => navigateBack(false)}
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

        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-xl">اطلاعات مربیگری</CardTitle>
          <CardDescription>
            این اطلاعات برای بررسی ادمین ثبت می‌شود. پس از تأیید، پنل مربی فعال
            می‌گردد.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-24 sm:pb-6">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* —— هویت —— */}
            <section className="space-y-3">
              <SectionTitle icon={User}>هویت حرفه‌ای</SectionTitle>

              <div className="space-y-2">
                <Label htmlFor={titleId}>نام نمایشی</Label>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={headlineId}
                    className="flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
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
            </section>

            {/* —— تخصص‌ها (API) —— */}
            <section className="space-y-3">
              <SectionTitle
                icon={Briefcase}
                hint={
                  selectedCount > 0
                    ? `${selectedCount.toLocaleString("fa-IR")} انتخاب‌شده`
                    : undefined
                }
              >
                تخصص‌ها
              </SectionTitle>

              {specialtiesQuery.isLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              ) : specialtiesQuery.isError ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <p className="text-xs text-destructive">
                    دریافت تخصص‌ها ناموفق بود.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => void specialtiesQuery.refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تلاش دوباره
                  </Button>
                </div>
              ) : specialtyList.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                  تخصصی برای انتخاب تعریف نشده است. بعداً دوباره تلاش کنید.
                </p>
              ) : (
                <div
                  id="coach-specialty-ids"
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="انتخاب تخصص‌ها"
                >
                  {specialtyList.map((item) => {
                    const active = selectedSpecialtyIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSpecialty(item.id)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {active && (
                          <CheckCircle2
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        )}
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {form.formState.errors.specialtyIds && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.specialtyIds.message}
                </p>
              )}
            </section>

            {/* —— تجربه و ظرفیت —— */}
            <section className="space-y-3">
              <SectionTitle icon={Clock}>تجربه و ظرفیت</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={experienceId}>سال شروع فعالیت</Label>
                  <Input
                    id={experienceId}
                    type="text"
                    inputMode="numeric"
                    className="h-11 tabular-nums"
                    placeholder="۲۰۱۹ یا ۱۳۹۸"
                    {...form.register("experienceStartYear")}
                    aria-invalid={!!form.formState.errors.experienceStartYear}
                  />
                  {form.formState.errors.experienceStartYear && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.experienceStartYear.message}
                    </p>
                  )}
                  {derivedYears !== null && (
                    <p className="text-[10px] text-muted-foreground">
                      حدود {derivedYears.toLocaleString("fa-IR")} سال سابقه
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={maxClientsId}
                    className="flex items-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    ظرفیت شاگرد
                  </Label>
                  <Input
                    id={maxClientsId}
                    type="text"
                    inputMode="numeric"
                    className="h-11 tabular-nums"
                    {...form.register("maxClients")}
                    aria-invalid={!!form.formState.errors.maxClients}
                  />
                  {form.formState.errors.maxClients && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.maxClients.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* —— بیو —— */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={bioId} className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
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
                </span>
              </div>
              <Textarea
                id={bioId}
                rows={4}
                className="resize-none"
                placeholder="درباره خودتان، سبک تمرین و رویکردتان با شاگردها…"
                {...form.register("bio")}
                aria-invalid={!!form.formState.errors.bio}
              />
              {form.formState.errors.bio && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </section>

            {/* —— تماس —— */}
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={instagramId}
                  className="flex items-center gap-1.5"
                >
                  <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
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
                  <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
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
            </section>

            {/* —— موقعیت —— */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon={MapPin}>موقعیت (اختیاری)</SectionTitle>
                {provinceValue ? (
                  <button
                    type="button"
                    onClick={clearProvince}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    پاک کردن
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor={provinceSelectId}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    استان
                  </Label>
                  <Select
                    value={provinceValue || undefined}
                    onValueChange={onProvinceChange}
                    disabled={provincesQuery.isLoading}
                  >
                    <SelectTrigger
                      id={provinceSelectId}
                      className="h-11 w-full"
                    >
                      <SelectValue
                        placeholder={
                          provincesQuery.isLoading
                            ? "در حال بارگذاری…"
                            : "انتخاب استان"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
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
                    htmlFor={citySelectId}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <MapPinned className="h-3 w-3 text-muted-foreground" />
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
                    disabled={!provinceValue || citiesQuery.isLoading}
                  >
                    <SelectTrigger id={citySelectId} className="h-11 w-full">
                      <SelectValue
                        placeholder={
                          !provinceValue
                            ? "ابتدا استان"
                            : citiesQuery.isLoading
                              ? "در حال بارگذاری…"
                              : "انتخاب شهر"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {cityList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* —— پذیرش شاگرد —— */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
              <div className="min-w-0">
                <Label
                  htmlFor="coach-isAcceptingClients"
                  className="cursor-pointer text-sm"
                >
                  پذیرش شاگرد جدید
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  در صورت غیرفعال بودن، درخواست جدید دریافت نمی‌کنید.
                </p>
              </div>
              <Switch
                id="coach-isAcceptingClients"
                checked={!!isAcceptingClientsValue}
                onCheckedChange={(v) =>
                  form.setValue("isAcceptingClients", v, { shouldDirty: true })
                }
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                پس از ارسال
              </p>
              <ol className="ms-5 mt-1.5 list-decimal space-y-1 text-[11px] text-muted-foreground">
                <li>درخواست به صف بررسی ادمین می‌رود.</li>
                <li>نتیجه از طریق اعلان‌ها اعلام می‌شود.</li>
                <li>پس از تأیید، پنل مربی فعال می‌شود.</li>
              </ol>
            </div>

            {/* Desktop actions */}
            <div className="hidden flex-col-reverse gap-2 pt-1 sm:flex sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={() => navigateBack(false)}
                disabled={pending}
              >
                <X className="me-1.5 h-4 w-4" aria-hidden="true" />
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 w-full flex-1 gap-2"
                disabled={pending || specialtiesQuery.isLoading}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ثبت درخواست
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        {/* Sticky mobile CTA */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:hidden">
          <div className="mx-auto flex max-w-xl gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              onClick={() => navigateBack(false)}
              disabled={pending}
            >
              انصراف
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 gap-2"
              disabled={pending || specialtiesQuery.isLoading}
              onClick={() => void onSubmit()}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال ثبت…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  ثبت درخواست
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CoachApplyPage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <CoachApplyContent />
    </Suspense>
  );
}
