"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlans } from "@/lib/api/subscription-plans";
import { saveSelectedPlan } from "@/lib/checkout/selected-plan";
import type { SubscriptionPlan } from "@/lib/types/plan";

function formatPrice(price: number) {
  return price.toLocaleString("fa-IR");
}

function PlanCard({
  plan,
  onSelect,
}: {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  return (
    <Card
      className={`transition-all duration-300 flex flex-col h-full ${
        plan.featured
          ? "border-2 border-primary shadow-lg relative bg-accent"
          : "border border-border hover:shadow-lg hover:border-primary bg-muted"
      }`}
    >
      {plan.featured && plan.badge ? (
        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
          {plan.badge}
        </div>
      ) : null}

      <CardHeader>
        <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
        <p className="text-2xl md:text-3xl font-bold mt-3">
          <span className="text-primary">{formatPrice(plan.price)}</span>
          <span className="text-xs md:text-sm text-muted-foreground block mt-1">
            تومان {plan.periodLabel}
          </span>
        </p>
      </CardHeader>

      <CardContent className="grow">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-xs md:text-sm"
            >
              <span className="shrink-0 mt-0.5 text-primary font-bold">✓</span>
              <span className="text-foreground leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          variant={plan.featured ? "default" : "outline"}
          size="lg"
          className="w-full"
          onClick={() => onSelect(plan)}
        >
          {plan.ctaLabel || "انتخاب"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Plans() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSubscriptionPlans()
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("بارگذاری پلن‌ها ناموفق بود");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (plan: SubscriptionPlan) => {
    saveSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
    });

    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.push(`/register?next=/checkout&plan=${plan.id}`);
      return;
    }

    router.push(`/checkout?plan=${plan.id}`);
  };

  return (
    <section className="w-full scroll-mt-24" id="plans">
      <div className="px-4 md:px-8 py-8 md:py-12 mt-16 md:mt-24 max-w-6xl mx-auto">
        <h4 className="text-xl md:text-2xl lg:text-3xl text-popover-foreground font-semibold mb-4">
          پلن مناسب خودت رو انتخاب کن و تحول رو شروع کن
        </h4>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          هر پلن دسترسی کامل به هوش مصنوعی، برنامه تمرینی شخصی، ویدیو/گیف حرکات
          و رژیم غذایی شما را می‌دهد؛ فقط سطح پشتیبانی و امکانات اضافی متفاوت
          است.
        </p>
      </div>

      <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center space-y-3 py-10">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            پلنی برای نمایش وجود ندارد.
          </p>
        ) : (
          <>
            <div className="block lg:hidden">
              <Swiper
                modules={[Autoplay]}
                autoplay
                loop={plans.length > 1}
                slidesPerView={1}
                spaceBetween={20}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 15 },
                }}
                className="plans-swiper"
              >
                {plans.map((plan) => (
                  <SwiperSlide key={plan.id} className="h-auto">
                    <PlanCard plan={plan} onSelect={handleSelect} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          هنوز مطمئن نیستی؟{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-2 hover:underline"
          >
            ثبت‌نام رایگان
          </Link>{" "}
          کن و اول برنامه شخصیت را ببین.
        </p>
      </div>
    </section>
  );
}
