"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { updateUser } from "@/lib/api/users";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import {
  clearSelectedPlan,
  readSelectedPlan,
} from "@/lib/checkout/selected-plan";
import type { SubscriptionPlan } from "@/lib/types/plan";

function formatPrice(price: number) {
  return price.toLocaleString("fa-IR");
}

export function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

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

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedPlanId]);

  const handleConfirm = async () => {
    if (!user?.id || !plan) return;

    setSubmitting(true);
    try {
      // بدون درگاه: فقط فعال‌سازی پلن
      const updated = await updateUser(user.id, {
        selectedPlanId: plan.id,
        subscriptionStatus: "ai_plan",
      });

      updateProfile({
        selectedPlanId: plan.id,
        subscriptionStatus: updated.subscriptionStatus || "ai_plan",
      });

      clearSelectedPlan();
      toast.success(`پلن «${plan.name}» فعال شد`);

      if (!user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    } catch (e) {
      console.error(e);
      toast.error("فعال‌سازی پلن ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-muted-foreground">
          {error || "پلن در دسترس نیست"}
        </p>
        <Button asChild variant="outline">
          <Link href="/#plans">بازگشت به پلن‌ها</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">تأیید پلن</h1>
            <p className="text-sm text-muted-foreground mt-1">
              بدون درگاه پرداخت — فقط فعال‌سازی آزمایشی
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowRight className="w-4 h-4 ml-1" />
              بازگشت
            </Link>
          </Button>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatPrice(plan.price)}
              <span className="text-sm text-muted-foreground font-normal mr-2">
                تومان {plan.periodLabel}
              </span>
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">امکانات این پلن:</p>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full h-11"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال فعال‌سازی...
                </>
              ) : (
                "تأیید و فعال‌سازی پلن"
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              این مرحله آزمایشی است و پرداخت واقعی انجام نمی‌شود. بعداً درگاه
              زرین‌پال/پی‌پینگ به همین صفحه وصل می‌شود.
            </p>
          </CardFooter>
        </Card>

        {user && (
          <p className="text-xs text-muted-foreground text-center">
            حساب: {user.name}
            {user.email ? ` · ${user.email}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
