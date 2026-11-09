"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Quote,
  RefreshCw,
} from "lucide-react";

import { useCreateReview, useProductReviews } from "@/features/reviews/hooks";
import { useAuth } from "@/features/auth/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  rating: z.number().min(1, "امتیاز الزامی است").max(5),
  title: z.string().max(120).optional(),
  body: z
    .string()
    .min(10, "متن نظر حداقل ۱۰ کاراکتر")
    .max(2000, "حداکثر ۲۰۰۰ کاراکتر"),
});

type FormValues = z.infer<typeof formSchema>;

/* -------------------------------------------------------------------------- */
/* Rating labels                                                              */
/* -------------------------------------------------------------------------- */

const RATING_LABEL: Record<number, string> = {
  1: "خیلی ضعیف",
  2: "ضعیف",
  3: "متوسط",
  4: "خوب",
  5: "عالی",
};

/* -------------------------------------------------------------------------- */
/* Stars                                                                      */
/* -------------------------------------------------------------------------- */

function Stars({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";

  return (
    <div
      className="flex items-center gap-0.5"
      dir="ltr"
      role="group"
      aria-label={`امتیاز ${value} از ۵`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            aria-label={`${n} ستاره`}
            aria-pressed={active}
            className={cn(
              "rounded-md p-0.5 transition-transform",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              readOnly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 active:scale-95",
            )}
          >
            <Star
              className={cn(
                cls,
                active
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type Props = { productId: string };

export function ProductReviewsSection({ productId }: Props) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useProductReviews(
    productId,
    page,
    Boolean(productId),
  );
  const createMutation = useCreateReview();

  // ✅ Stable reference — fixes "reviews may change every render" warning
  const reviews = useMemo(() => data?.reviews ?? [], [data?.reviews]);

  const total = data?.pagination.total ?? 0;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rating: 5, title: "", body: "" },
  });

  // ✅ Destructure errors so we don't hit the compiler warning
  const {
    formState: { errors },
  } = form;

  // ✅ useWatch replaces form.watch("rating")
  const ratingWatch = useWatch({ control: form.control, name: "rating" });

  const bodyWatch = useWatch({ control: form.control, name: "body" });

  const avgHint = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const loginHref = useMemo(() => {
    const path =
      typeof window !== "undefined" ? window.location.pathname : "/store";
    return `/login?next=${encodeURIComponent(path)}`;
  }, []);

  const onSubmit = form.handleSubmit((values) => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }

    createMutation.mutate(
      {
        productId,
        rating: values.rating,
        body: values.body.trim(),
        title: values.title?.trim() || undefined,
      },
      {
        onSuccess: () => {
          form.reset({ rating: 5, title: "", body: "" });
        },
      },
    );
  });

  return (
    <section
      className="space-y-6 border-t border-border pt-8"
      dir="rtl"
      aria-labelledby="reviews-heading"
    >
      {/* ---------------------------- Header ---------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 id="reviews-heading" className="text-base font-bold sm:text-lg">
            نظرات کاربران
          </h2>
          {total > 0 && (
            <Badge
              variant="secondary"
              className="h-6 rounded-full px-2 text-xs tabular-nums"
            >
              {total.toLocaleString("fa-IR")}
            </Badge>
          )}
        </div>

        {avgHint && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Star
              className="h-4 w-4 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span className="font-medium tabular-nums text-foreground">
              {Number(avgHint).toLocaleString("fa-IR", {
                maximumFractionDigits: 1,
              })}
            </span>
            <span className="text-[11px]">میانگین این صفحه</span>
          </div>
        )}
      </div>

      {/* ---------------------------- Form ---------------------------- */}
      <Card className="border-border bg-card/60">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">ثبت نظر</h3>

          {!isReady ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  برای ثبت نظر وارد حساب کاربری شوید
                </p>
                <p className="text-[11px] text-muted-foreground">
                  نظرات پس از تأیید فروشنده/مدیریت نمایش داده می‌شوند.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(loginHref)}
                className="shrink-0"
              >
                ورود به حساب
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>امتیاز</Label>
                  <span className="text-xs text-muted-foreground">
                    {RATING_LABEL[ratingWatch] ?? ""}
                  </span>
                </div>
                <Stars
                  value={ratingWatch}
                  onChange={(n) =>
                    form.setValue("rating", n, { shouldValidate: true })
                  }
                />
                {errors.rating && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-title">عنوان (اختیاری)</Label>
                <Input
                  id="review-title"
                  placeholder="مثلاً کیفیت عالی"
                  {...form.register("title")}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="review-body">متن نظر</Label>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {(bodyWatch?.length ?? 0).toLocaleString("fa-IR")} / ۲۰۰۰
                  </span>
                </div>
                <Textarea
                  id="review-body"
                  rows={4}
                  placeholder="تجربه‌تان از این محصول را بنویسید…"
                  {...form.register("body")}
                />
                {errors.body && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.body.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-muted-foreground">
                  نظر پس از تأیید مدیریت/فروشنده نمایش داده می‌شود.
                </p>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      در حال ارسال…
                    </>
                  ) : (
                    "ارسال نظر"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------- List ---------------------------- */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border bg-card/40">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : isError ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <AlertTriangle
                className="h-7 w-7 text-destructive"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  بارگذاری نظرات ناموفق بود
                </p>
                <p className="text-xs text-muted-foreground">
                  اتصال خود را بررسی کنید.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                تلاش دوباره
              </Button>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
              <MessageSquare
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                هنوز نظر تأییدشده‌ای ثبت نشده
              </p>
              <p className="text-xs text-muted-foreground">
                اولین نظر را شما ثبت کنید.
              </p>
            </div>
          </div>
        ) : (
          reviews.map((rev, idx) => (
            <article
              key={`${rev.user.id}-${rev.updatedAt}-${idx}`}
              className="rounded-2xl border border-border bg-card/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {initials(rev.user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {rev.user.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Stars value={rev.rating} readOnly size="sm" />
                      <time className="text-[11px] text-muted-foreground">
                        · {formatDate(rev.updatedAt)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {rev.body}
              </p>

              {rev.answerReview && (
                <div className="mt-3 flex gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                  <Quote
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[11px] font-medium text-primary">
                      پاسخ فروشنده/پشتیبانی
                    </p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {rev.answerReview}
                    </p>
                  </div>
                </div>
              )}
            </article>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {totalPages.toLocaleString("fa-IR")}
            </p>
            <div className="order-1 flex gap-2 sm:order-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 flex-1 sm:flex-none"
              >
                <ChevronRight
                  className="me-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronLeft
                  className="me-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 flex-1 sm:flex-none"
              >
                بعدی
                <ChevronLeft
                  className="ms-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronRight
                  className="ms-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
