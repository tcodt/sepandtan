"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Sparkles,
  Clock,
  ImageIcon,
  Hash,
  Zap,
  Users,
  UserCheck,
  Store,
  Check,
  Percent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useAdminSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
} from "@/features/admin/subscription-plans/hooks/use-admin-subscription-plans";
import type {
  PlanAudienceType,
  SubscriptionPlanAdmin,
} from "@/features/admin/subscription-plans/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 50;

const AUDIENCE_LABEL: Record<PlanAudienceType, string> = {
  USER: "کاربر",
  COACH: "مربی",
  STORE: "فروشنده",
};

const AUDIENCE_ICON: Record<PlanAudienceType, typeof Users> = {
  USER: Users,
  COACH: UserCheck,
  STORE: Store,
};

const AUDIENCE_STYLES: Record<PlanAudienceType, string> = {
  USER: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
  COACH:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
  STORE:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[]): string {
  return (arr ?? []).join("\n");
}

const priceFormatter = new Intl.NumberFormat("fa-IR");
function formatPrice(n: number) {
  return priceFormatter.format(n);
}

/* -------------------------------------------------------------------------- */
/* Debounce hook                                                              */
/* -------------------------------------------------------------------------- */

function useDebounced(
  input: string,
  current: string,
  commit: (v: string) => void,
  delay: number,
) {
  const lastRef = useRef(input);
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === current) return;
    if (lastRef.current === input) return;
    lastRef.current = input;
    const t = setTimeout(() => {
      commit(trimmed);
    }, delay);
    return () => clearTimeout(t);
  }, [input, current, commit, delay]);
}

/* -------------------------------------------------------------------------- */
/* Schema — Zod v4 compatible                                                 */
/* -------------------------------------------------------------------------- */

const numericString = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d+$/.test(v), "فقط عدد صحیح غیرمنفی")
  .transform((v) => (v ? Number(v) : null));

const requiredIntString = (label: string, min = 0) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} الزامی است`)
    .refine((v) => /^\d+$/.test(v), "فقط عدد صحیح غیرمنفی")
    .transform(Number)
    .refine((n) => n >= min, `حداقل ${min}`);

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    "آدرس باید با http:// یا https:// شروع شود",
  );

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "حداقل ۲ کاراکتر")
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
  type: z.enum(["USER", "COACH", "STORE"]),
  description: z
    .string()
    .max(2000, "حداکثر ۲۰۰۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  featuresText: z.string().min(1, "حداقل یک ویژگی"),
  price: requiredIntString("قیمت", 0),
  originalPrice: numericString,
  durationDays: requiredIntString("مدت", 1),
  trialDays: numericString,
  aiPlanLimitPerMonth: numericString,
  aiChatLimitPerDay: numericString,
  canRequestCoach: z.boolean(),
  canTrackProgress: z.boolean(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  sortOrder: numericString,
  coverImg: urlOrEmpty,
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const EMPTY_FORM: FormInput = {
  title: "",
  slug: "",
  type: "USER",
  description: "",
  featuresText: "",
  price: "",
  originalPrice: "",
  durationDays: "30",
  trialDays: "",
  aiPlanLimitPerMonth: "",
  aiChatLimitPerDay: "",
  canRequestCoach: false,
  canTrackProgress: true,
  isPopular: false,
  isActive: true,
  sortOrder: "",
  coverImg: "",
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function AudienceBadge({ type }: { type: PlanAudienceType | null }) {
  if (!type) return null;
  const Icon = AUDIENCE_ICON[type];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] font-medium", AUDIENCE_STYLES[type])}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {AUDIENCE_LABEL[type]}
    </Badge>
  );
}

function PopularBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] font-medium text-amber-700 dark:text-amber-400"
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
      محبوب
    </Badge>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 text-[10px] font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-zinc-400",
        )}
        aria-hidden="true"
      />
      {active ? "فعال" : "غیرفعال"}
    </Badge>
  );
}

function CoverThumb({ plan }: { plan: SubscriptionPlanAdmin }) {
  const [failed, setFailed] = useState(false);
  if (plan.coverImg && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={plan.coverImg}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال بارگذاری پلن‌ها…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Card
          key={i}
          className="border-border/60"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <CardContent className="flex items-start gap-3 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <CreditCard
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasFilters
              ? "پلنی با این فیلترها یافت نشد"
              : "هنوز پلنی ثبت نشده است"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید."
              : "اولین پلن اشتراک را برای کاربر/مربی/فروشنده بسازید."}
          </p>
        </div>
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        ) : (
          <Button size="sm" onClick={onCreate}>
            <Plus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
            ایجاد اولین پلن
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle
            className="h-6 w-6 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            دریافت پلن‌ها ناموفق بود
          </p>
          <p className="mx-auto max-w-md wrap-break-word text-xs text-muted-foreground">
            {message}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          )}
          تلاش دوباره
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminSubscriptionPlansPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PlanAudienceType | "ALL">("ALL");
  const [activeOnly, setActiveOnly] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlanAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SubscriptionPlanAdmin | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const searchId = useId();
  const resultCountId = useId();

  /* ----------------------------- Query state ----------------------------- */

  const filters = useMemo(
    () => ({ search: search || undefined, limit: PAGE_SIZE }),
    [search],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminSubscriptionPlans(filters);
  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();
  const deleteMutation = useDeleteSubscriptionPlan();

  // Client-side filters for type + active (backend filters only support search).
  const items = useMemo(() => {
    let result = data?.data ?? [];
    if (typeFilter !== "ALL") {
      result = result.filter((p) => p.type === typeFilter);
    }
    if (activeOnly) {
      result = result.filter((p) => p.isActive);
    }
    return result;
  }, [data?.data, typeFilter, activeOnly]);

  const total = items.length;
  const hasFilters = !!search || typeFilter !== "ALL" || activeOnly;
  const saving = createMutation.isPending || updateMutation.isPending;

  /* --------------------------- Debounced search --------------------------- */

  const commitSearch = useCallback((v: string) => setSearch(v), []);
  useDebounced(searchInput, search, commitSearch, SEARCH_DEBOUNCE_MS);

  /* ------------------------------ Form setup ------------------------------ */

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  // Hook-based watches — no React Compiler skip.
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const typeValue = useWatch({ control: form.control, name: "type" });
  const coverImgValue = useWatch({ control: form.control, name: "coverImg" });
  const priceValue = useWatch({ control: form.control, name: "price" });
  const originalPriceValue = useWatch({
    control: form.control,
    name: "originalPrice",
  });
  const durationDaysValue = useWatch({
    control: form.control,
    name: "durationDays",
  });
  const featuresTextValue = useWatch({
    control: form.control,
    name: "featuresText",
  });
  const canRequestCoachValue = useWatch({
    control: form.control,
    name: "canRequestCoach",
  });
  const canTrackProgressValue = useWatch({
    control: form.control,
    name: "canTrackProgress",
  });
  const isPopularValue = useWatch({ control: form.control, name: "isPopular" });
  const isActiveValue = useWatch({ control: form.control, name: "isActive" });
  const isDirty = form.formState.isDirty;

  /* --------------------------- Auto-slug handler -------------------------- */

  const handleTitleChange = useCallback(
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

  /* ---------------------------- Open handlers ---------------------------- */

  const openCreate = useCallback(() => {
    setEditing(null);
    setSlugTouched(false);
    form.reset(EMPTY_FORM);
    setEditorOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: SubscriptionPlanAdmin) => {
      setEditing(item);
      setSlugTouched(true);
      form.reset({
        title: item.title,
        slug: item.slug,
        type: item.type ?? "USER",
        description: item.description ?? "",
        featuresText: arrayToLines(item.features),
        price: String(item.price),
        originalPrice:
          item.originalPrice != null ? String(item.originalPrice) : "",
        durationDays: String(item.durationDays),
        trialDays: item.trialDays > 0 ? String(item.trialDays) : "",
        aiPlanLimitPerMonth:
          item.aiPlanLimitPerMonth != null
            ? String(item.aiPlanLimitPerMonth)
            : "",
        aiChatLimitPerDay:
          item.aiChatLimitPerDay != null ? String(item.aiChatLimitPerDay) : "",
        canRequestCoach: item.canRequestCoach,
        canTrackProgress: item.canTrackProgress,
        isPopular: item.isPopular,
        isActive: item.isActive,
        sortOrder: item.sortOrder > 0 ? String(item.sortOrder) : "",
        coverImg: item.coverImg ?? "",
      });
      setEditorOpen(true);
    },
    [form],
  );

  const closeEditor = useCallback(
    (next: boolean) => {
      if (next) return;
      if (saving) return;
      if (isDirty) {
        const ok = window.confirm(
          editing
            ? "تغییرات ذخیره‌نشده دارید. بستن بدون ذخیره؟"
            : "فرم ناقص است. بستن بدون ذخیره؟",
        );
        if (!ok) return;
      }
      setEditorOpen(false);
      setEditing(null);
    },
    [saving, isDirty, editing],
  );

  /* ------------------------------ Submit ------------------------------ */

  const onSubmit = form.handleSubmit(
    async (values) => {
      const features = linesToArray(values.featuresText);
      if (!features.length) {
        form.setError("featuresText", { message: "حداقل یک ویژگی" });
        return;
      }

      const input = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        type: values.type as PlanAudienceType,
        description: values.description?.trim() || null,
        features,
        price: values.price,
        originalPrice: values.originalPrice,
        durationDays: values.durationDays,
        trialDays: values.trialDays ?? 0,
        aiPlanLimitPerMonth: values.aiPlanLimitPerMonth,
        aiChatLimitPerDay: values.aiChatLimitPerDay,
        canRequestCoach: values.canRequestCoach,
        canTrackProgress: values.canTrackProgress,
        isPopular: values.isPopular,
        isActive: values.isActive,
        sortOrder: values.sortOrder ?? 0,
        coverImg: values.coverImg?.trim() || null,
      };

      try {
        if (editing) {
          await updateMutation.mutateAsync({ id: editing.id, input });
        } else {
          await createMutation.mutateAsync(input);
        }
        setEditorOpen(false);
        setEditing(null);
      } catch {
        // Hook's onError toasts; keep form open for retry.
      }
    },
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) {
        const el = document.getElementById(`plan-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement | null)?.focus?.();
      }
    },
  );

  /* ----------------------------- Delete ----------------------------- */

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Hook's onError toasts; keep dialog open for retry.
    }
  }, [deleteTarget, deleteMutation]);

  /* ------------------------------- Render ------------------------------- */

  const displayError = error instanceof Error ? error.message : "خطای ناشناخته";

  // Preview: discount percentage when originalPrice > price.
  const previewDiscount = (() => {
    const price = Number(priceValue || 0);
    const original = Number(originalPriceValue || 0);
    if (original > price && original > 0) {
      return Math.round(((original - price) / original) * 100);
    }
    return 0;
  })();

  const featureCount = linesToArray(featuresTextValue ?? "").length;

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6"
    >
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              پلن‌های اشتراک
            </h1>
            <p className="text-xs text-muted-foreground">
              مدیریت پلن‌های کاربر، مربی و فروشنده
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              aria-hidden="true"
            />
            بروزرسانی
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            پلن جدید
          </Button>
        </div>
      </header>

      {/* ----------------------------- Filters ----------------------------- */}
      <section aria-label="فیلترها" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchId} className="sr-only">
              جستجوی پلن
            </label>
            <Input
              id={searchId}
              placeholder="جستجوی عنوان یا slug…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchInput) {
                  setSearchInput("");
                  setSearch("");
                }
              }}
              className="h-10 ps-10 pe-10"
              aria-describedby={resultCountId}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute inset-e-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {isFetching && !isLoading && (
              <Loader2 className="pointer-events-none absolute inset-e-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as PlanAudienceType | "ALL")}
          >
            <SelectTrigger
              className="h-10 w-full sm:w-40"
              aria-label="فیلتر نوع مخاطب"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="ALL">همه مخاطب‌ها</SelectItem>
              <SelectItem value="USER">کاربر</SelectItem>
              <SelectItem value="COACH">مربی</SelectItem>
              <SelectItem value="STORE">فروشنده</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
            <Switch
              id="plans-active-only"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
            />
            <Label
              htmlFor="plans-active-only"
              className="cursor-pointer text-xs"
            >
              فقط فعال
            </Label>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 self-start text-muted-foreground sm:self-auto"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setTypeFilter("ALL");
                setActiveOnly(false);
              }}
            >
              <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              پاک کردن
            </Button>
          )}
        </div>

        <p
          id={resultCountId}
          className="text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "در حال بارگذاری…"
            : isError
              ? "—"
              : `${total.toLocaleString("fa-IR")} پلن${
                  hasFilters ? " (با فیلتر فعال)" : ""
                }`}
        </p>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section aria-label="لیست پلن‌ها" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState
            message={displayError}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onCreate={openCreate}
            onClear={() => {
              setSearchInput("");
              setSearch("");
              setTypeFilter("ALL");
              setActiveOnly(false);
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const hasDiscount =
                item.originalPrice != null &&
                item.originalPrice > item.price &&
                item.originalPrice > 0;
              const discountPercent = hasDiscount
                ? Math.round(
                    ((item.originalPrice! - item.price) / item.originalPrice!) *
                      100,
                  )
                : 0;

              return (
                <Card key={item.id} className="border-border/60">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      <CoverThumb plan={item} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <AudienceBadge type={item.type} />
                        {item.isPopular && <PopularBadge />}
                        <ActiveBadge active={item.isActive} />
                      </div>
                      <p
                        dir="ltr"
                        className="truncate text-start font-mono text-[11px] text-muted-foreground"
                      >
                        {item.slug}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CreditCard
                            className="h-3 w-3 text-emerald-500"
                            aria-hidden="true"
                          />
                          <span className="tabular-nums text-foreground">
                            {formatPrice(item.price)}
                          </span>
                          ریال
                        </span>
                        {hasDiscount && (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Percent className="h-3 w-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {discountPercent.toLocaleString("fa-IR")}٪ تخفیف
                            </span>
                            <span className="text-muted-foreground line-through">
                              {formatPrice(item.originalPrice!)}
                            </span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <span className="tabular-nums">
                            {item.durationDays.toLocaleString("fa-IR")}
                          </span>
                          روز
                        </span>
                        {item.trialDays > 0 && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {item.trialDays.toLocaleString("fa-IR")}
                            </span>
                            روز آزمایشی
                          </span>
                        )}
                        {(item.aiPlanLimitPerMonth != null ||
                          item.aiChatLimitPerDay != null) && (
                          <span className="inline-flex items-center gap-1">
                            <Zap
                              className="h-3 w-3 text-violet-500"
                              aria-hidden="true"
                            />
                            {item.aiPlanLimitPerMonth != null
                              ? `${item.aiPlanLimitPerMonth.toLocaleString("fa-IR")} پلن AI/ماه`
                              : "AI نامحدود"}
                          </span>
                        )}
                      </div>

                      {item.features.length > 0 && (
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          <Check
                            className="me-0.5 inline h-2.5 w-2.5 text-emerald-500"
                            aria-hidden="true"
                          />
                          {item.features.join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                        aria-label={`ویرایش ${item.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`حذف ${item.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------------- Editor ----------------------------- */}
      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader className="p-3">
            <DialogTitle className="text-start">
              {editing ? "ویرایش پلن" : "پلن جدید"}
            </DialogTitle>
            <DialogDescription className="text-start">
              {editing
                ? "اطلاعات پلن را ویرایش کنید. تغییرات پس از ذخیره اعمال می‌شود."
                : "پلن جدید را با عنوان، قیمت و ویژگی‌ها تعریف کنید."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* --- Section: basics --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                اطلاعات اصلی
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-title">عنوان</Label>
                  <Input
                    id="plan-title"
                    className="h-11"
                    autoFocus
                    {...form.register("title", {
                      onChange: handleTitleChange,
                    })}
                    aria-invalid={!!form.formState.errors.title}
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="plan-slug">slug (یکتا)</Label>
                    {slugValue && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                        <span dir="ltr" className="font-mono">
                          {slugValue}
                        </span>
                      </span>
                    )}
                  </div>
                  <Input
                    id="plan-slug"
                    dir="ltr"
                    className="h-11 font-mono text-sm"
                    placeholder="pro-monthly"
                    {...form.register("slug", {
                      onChange: () => setSlugTouched(true),
                    })}
                    aria-invalid={!!form.formState.errors.slug}
                  />
                  {form.formState.errors.slug && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-type">نوع مخاطب</Label>
                  <Select
                    value={typeValue}
                    onValueChange={(v) =>
                      form.setValue("type", v as PlanAudienceType, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="plan-type" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="USER">کاربر</SelectItem>
                      <SelectItem value="COACH">مربی</SelectItem>
                      <SelectItem value="STORE">فروشنده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Label htmlFor="plan-active" className="cursor-pointer">
                    فعال باشد
                  </Label>
                  <Switch
                    id="plan-active"
                    checked={isActiveValue}
                    onCheckedChange={(v) =>
                      form.setValue("isActive", v, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-description">توضیحات</Label>
                  <Textarea
                    id="plan-description"
                    rows={2}
                    className="resize-none"
                    {...form.register("description")}
                    aria-invalid={!!form.formState.errors.description}
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* --- Section: pricing --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                قیمت و مدت
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="plan-price" className="text-xs">
                    قیمت (ریال)
                  </Label>
                  <Input
                    id="plan-price"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    placeholder="890000"
                    {...form.register("price")}
                    aria-invalid={!!form.formState.errors.price}
                  />
                  {form.formState.errors.price && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plan-originalPrice" className="text-xs">
                    قیمت قبل تخفیف (اختیاری)
                  </Label>
                  <Input
                    id="plan-originalPrice"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    {...form.register("originalPrice")}
                    aria-invalid={!!form.formState.errors.originalPrice}
                  />
                  {form.formState.errors.originalPrice && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.originalPrice.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plan-durationDays" className="text-xs">
                    مدت (روز)
                  </Label>
                  <Input
                    id="plan-durationDays"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    {...form.register("durationDays")}
                    aria-invalid={!!form.formState.errors.durationDays}
                  />
                  {form.formState.errors.durationDays && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.durationDays.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plan-trialDays" className="text-xs">
                    آزمایشی (روز، اختیاری)
                  </Label>
                  <Input
                    id="plan-trialDays"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    placeholder="۰ = ندارد"
                    {...form.register("trialDays")}
                    aria-invalid={!!form.formState.errors.trialDays}
                  />
                  {form.formState.errors.trialDays && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.trialDays.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Price preview */}
              {(priceValue || originalPriceValue) && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">پیش‌نمایش:</span>
                  <span className="inline-flex items-baseline gap-1">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatPrice(Number(priceValue || 0))}
                    </span>
                    <span className="text-muted-foreground">ریال</span>
                  </span>
                  {originalPriceValue &&
                    Number(originalPriceValue) > Number(priceValue || 0) && (
                      <>
                        <span className="text-muted-foreground line-through tabular-nums">
                          {formatPrice(Number(originalPriceValue))}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-rose-500/25 bg-rose-500/10 text-[10px] font-medium text-rose-700 dark:text-rose-400"
                        >
                          <Percent
                            className="me-0.5 h-2.5 w-2.5"
                            aria-hidden="true"
                          />
                          <span className="tabular-nums">
                            {previewDiscount.toLocaleString("fa-IR")}٪
                          </span>
                        </Badge>
                      </>
                    )}
                  {durationDaysValue && (
                    <span className="text-muted-foreground">
                      ·{" "}
                      <span className="tabular-nums text-foreground">
                        {Number(durationDaysValue).toLocaleString("fa-IR")}
                      </span>{" "}
                      روز
                    </span>
                  )}
                </div>
              )}
            </fieldset>

            {/* --- Section: features --- */}
            <fieldset className="space-y-3">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold text-muted-foreground">
                  ویژگی‌ها (هر خط یک مورد)
                </legend>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {featureCount.toLocaleString("fa-IR")} ویژگی
                </span>
              </div>
              <Textarea
                id="plan-featuresText"
                rows={5}
                className="resize-none font-mono text-sm"
                placeholder={"مربی اختصاصی\nAI نامحدود\nپیگیری هفتگی"}
                {...form.register("featuresText")}
                aria-invalid={!!form.formState.errors.featuresText}
              />
              {form.formState.errors.featuresText && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.featuresText.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                هر ویژگی در یک خط. این‌ها در کارت پلن نمایش داده می‌شوند.
              </p>
            </fieldset>

            {/* --- Section: AI limits --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                محدودیت AI (خالی = نامحدود)
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="plan-aiPlanLimitPerMonth" className="text-xs">
                    سقف پلن AI / ماه
                  </Label>
                  <Input
                    id="plan-aiPlanLimitPerMonth"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    placeholder="∞"
                    {...form.register("aiPlanLimitPerMonth")}
                    aria-invalid={!!form.formState.errors.aiPlanLimitPerMonth}
                  />
                  {form.formState.errors.aiPlanLimitPerMonth && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.aiPlanLimitPerMonth.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plan-aiChatLimitPerDay" className="text-xs">
                    سقف چت AI / روز
                  </Label>
                  <Input
                    id="plan-aiChatLimitPerDay"
                    type="text"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    placeholder="∞"
                    {...form.register("aiChatLimitPerDay")}
                    aria-invalid={!!form.formState.errors.aiChatLimitPerDay}
                  />
                  {form.formState.errors.aiChatLimitPerDay && (
                    <p className="text-[10px] text-destructive" role="alert">
                      {form.formState.errors.aiChatLimitPerDay.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* --- Section: capabilities --- */}
            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                دسترسی‌ها و وضعیت
              </legend>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="min-w-0">
                    <Label
                      htmlFor="plan-canRequestCoach"
                      className="cursor-pointer text-sm"
                    >
                      درخواست مربی
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      کاربر بتواند درخواست مربی اختصاصی بدهد.
                    </p>
                  </div>
                  <Switch
                    id="plan-canRequestCoach"
                    checked={canRequestCoachValue}
                    onCheckedChange={(v) =>
                      form.setValue("canRequestCoach", v, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="min-w-0">
                    <Label
                      htmlFor="plan-canTrackProgress"
                      className="cursor-pointer text-sm"
                    >
                      ثبت پیشرفت
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      نمودار و پیگیری پیشرفت تمرین و وزن.
                    </p>
                  </div>
                  <Switch
                    id="plan-canTrackProgress"
                    checked={canTrackProgressValue}
                    onCheckedChange={(v) =>
                      form.setValue("canTrackProgress", v, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="min-w-0">
                    <Label
                      htmlFor="plan-isPopular"
                      className="cursor-pointer text-sm"
                    >
                      پلن محبوب
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      با نشان «محبوب» در صفحه پلن‌ها نمایش داده می‌شود.
                    </p>
                  </div>
                  <Switch
                    id="plan-isPopular"
                    checked={isPopularValue}
                    onCheckedChange={(v) =>
                      form.setValue("isPopular", v, { shouldDirty: true })
                    }
                  />
                </div>
              </div>
            </fieldset>

            {/* --- Section: media + order --- */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">
                رسانه و ترتیب
              </legend>

              <div className="space-y-2">
                <Label htmlFor="plan-coverImg">کاور (URL، اختیاری)</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {coverImgValue ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImgValue}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <Input
                    id="plan-coverImg"
                    dir="ltr"
                    className="h-10 flex-1 font-mono text-xs"
                    placeholder="https://"
                    {...form.register("coverImg")}
                    aria-invalid={!!form.formState.errors.coverImg}
                  />
                </div>
                {form.formState.errors.coverImg && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.coverImg.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan-sortOrder" className="text-xs">
                  ترتیب نمایش (کوچک‌تر = بالاتر)
                </Label>
                <Input
                  id="plan-sortOrder"
                  type="text"
                  inputMode="numeric"
                  className="h-10 tabular-nums"
                  placeholder="۰"
                  {...form.register("sortOrder")}
                  aria-invalid={!!form.formState.errors.sortOrder}
                />
                {form.formState.errors.sortOrder && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.sortOrder.message}
                  </p>
                )}
              </div>
            </fieldset>

            <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeEditor(false)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-1.5 sm:w-auto"
              >
                {saving ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {editing ? "ذخیره" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ----------------------------- Delete ----------------------------- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-start">
                  حذف پلن
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{deleteTarget?.title}» حذف می‌شود. اگر اشتراک فعال داشته باشد
                  ممکن است بک‌اند خطا بدهد.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={deleteMutation.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2
                    className="me-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  در حال حذف…
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
