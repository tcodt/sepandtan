"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import {
  clearSelectedPlan,
  readSelectedPlan,
} from "@/lib/checkout/selected-plan";
import type { SubscriptionPlan } from "@/lib/types/plan";
import { subscribeToPlan } from "@/features/subscription/api";
import { subscriptionKeys } from "@/features/subscription/hooks";
import { getErrorMessage } from "@/lib/api/client";
import {
  paySubscription,
  quoteSubscription,
} from "@/features/service-order/api";

function formatPrice(price: number) {
  return price.toLocaleString("fa-IR");
}

export function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const queryClient = useQueryClient();

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planIdFromQuery = searchParams.get("plan");

  const resolvedPlanId = useMemo(() => {
    if (planIdFromQuery) return planIdFromQuery;
    const draft = readSelectedPlan();
    return draft?.id ?? null;
  }, [planIdFromQuery]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!resolvedPlanId) {
        setError("پلنی انتخاب نشده است");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getSubscriptionPlanById(resolvedPlanId);
        if (!cancelled) {
          if (!data) setError("پلن پیدا نشد");
          else setPlan(data);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("خطا در بارگذاری پلن");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [resolvedPlanId]);

  const handleConfirm = async () => {
    if (!user?.id || !plan) return;

    setSubmitting(true);
    try {
      // 1) Create PENDING/TRIALING subscription
      const subscription = await subscribeToPlan({ planId: plan.id });

      // 2) Quote amount
      await quoteSubscription({ subscriptionId: subscription.id });

      // 3) Pay via gateway
      const payment = await paySubscription({
        subscriptionId: subscription.id,
        method: "ZARINPAL",
      });

      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

      if (payment.paymentUrl) {
        clearSelectedPlan();
        toast.message("در حال انتقال به درگاه پرداخت...");
        window.location.assign(payment.paymentUrl);
        return;
      }

      // No redirect (wallet / free / already settled)
      updateProfile({
        currentPlanId: plan.id,
      });
      clearSelectedPlan();
      toast.success(`پرداخت «${plan.name}» ثبت شد`);

      if (!user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    } catch (e) {
      console.error(e);
      toast.error(getErrorMessage(e, "پرداخت یا فعال‌سازی پلن ناموفق بود"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {error || "پلن در دسترس نیست"}
        </p>
        <Button asChild variant="outline">
          <Link href="/#plans">
            <ChevronLeft className="w-4 h-4 ml-1" />
            بازگشت به پلن‌ها
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
            >
              <Link href="/">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                تأیید و پرداخت پلن
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                پرداخت امن از طریق درگاه بانکی
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="self-start sm:self-auto gap-1.5 px-3 py-1.5 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            پرداخت امن
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="border-border/60 bg-muted/50 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-linear-to-l from-primary via-primary/80 to-primary/40" />

              <CardHeader className="pb-4 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {plan.featured || plan.isPopular ? (
                        <Zap className="w-5 h-5 text-primary" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">
                        {plan.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.periodLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {formatPrice(plan.price)}
                      <span className="text-xs sm:text-sm text-muted-foreground font-normal mr-1.5">
                        تومان
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.periodLabel}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <Separator className="bg-border/60" />

              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    امکانات این پلن
                  </p>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-foreground/90"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="border-border/60 bg-muted/50 backdrop-blur-sm shadow-sm lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">خلاصه سفارش</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">پلن انتخابی</span>
                  <span className="font-medium text-foreground">
                    {plan.name}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">دوره</span>
                  <span className="font-medium text-foreground">
                    {plan.periodLabel}
                  </span>
                </div>

                <Separator className="bg-border/60" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    مبلغ قابل پرداخت
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(plan.price)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      تومان
                    </span>
                  </span>
                </div>

                {user && (
                  <div className="rounded-lg bg-muted/50 p-3 mt-2">
                    <p className="text-[11px] text-muted-foreground mb-1">
                      حساب کاربری
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full h-11 text-sm font-medium shadow-sm"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      در حال اتصال به درگاه...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 ml-2" />
                      پرداخت و فعال‌سازی
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 border border-primary/10">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    پرداخت از طریق درگاه امن زرین‌پال انجام می‌شود. پس از تأیید،
                    اشتراک شما فعال خواهد شد.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-8">
          با پرداخت و فعال‌سازی پلن،{" "}
          <Link href="/terms" className="text-primary hover:underline">
            قوانین و مقررات
          </Link>{" "}
          را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
