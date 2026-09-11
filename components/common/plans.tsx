"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, Sparkles, Zap, Crown } from "lucide-react";
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
  isMobile = false,
}: {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
  isMobile?: boolean;
}) {
  const isFeatured = plan.featured;

  return (
    <Card
      className={`
        transition-all duration-300 flex flex-col h-full
        ${
          isFeatured
            ? "border-2 border-primary shadow-xl relative bg-linear-to-b from-accent/50 to-background hover:shadow-2xl hover:scale-[1.02]"
            : "border border-border hover:shadow-xl hover:border-primary/50 bg-muted/50 hover:scale-[1.01]"
        }
        ${isMobile ? "mx-1" : ""}
      `}
    >
      {isFeatured && plan.badge && (
        <div className="absolute -top-3 right-4 bg-linear-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
          <span className="animate-pulse">★</span>
          {plan.badge}
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div
            className={`
            p-3 rounded-full
            ${
              isFeatured
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }
          `}
          >
            {isFeatured && plan.badge?.includes("محبوب") ? (
              <Zap className="w-6 h-6" />
            ) : isFeatured ? (
              <Crown className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
        </div>
        <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
        <div className="mt-4">
          <span className="text-3xl md:text-4xl font-bold text-primary">
            {formatPrice(plan.price)}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground block mt-1">
            تومان {plan.periodLabel}
          </span>
        </div>
        {isFeatured && (
          <div className="mt-2 inline-block bg-primary/5 text-primary text-xs px-3 py-1 rounded-full">
            بهترین ارزش
          </div>
        )}
      </CardHeader>

      <CardContent className="grow">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm md:text-base"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="shrink-0 mt-0.5 text-primary font-bold bg-primary/10 p-0.5 rounded-full">
                <Check className="w-4 h-4" />
              </span>
              <span className="text-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          variant={isFeatured ? "default" : "secondary"}
          size="lg"
          className={`
            w-full transition-all duration-300
            ${
              isFeatured
                ? "bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25"
                : "hover:bg-primary hover:text-primary-foreground"
            }
          `}
          onClick={() => onSelect(plan)}
        >
          {plan.ctaLabel || "انتخاب پلن"}
          {isFeatured && <Sparkles className="w-4 h-4 ml-2" />}
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
    setSelectedPlanId(plan.id);

    saveSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
    });

    // Small delay for visual feedback
    setTimeout(() => {
      if (!hasHydrated) return;

      if (!isAuthenticated || !user) {
        router.push(`/register?next=/checkout&plan=${plan.id}`);
        return;
      }

      router.push(`/checkout?plan=${plan.id}`);
    }, 300);
  };

  // Sort plans: featured first, then by price
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.price - b.price;
  });

  return (
    <section
      className="w-full scroll-mt-24 bg-linear-to-b from-background to-muted/30"
      id="plans"
    >
      <div className="px-4 md:px-8 py-8 md:py-16 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            پلن‌های اشتراک
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            پلن مناسب خودت رو انتخاب کن و تحول رو شروع کن
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            هر پلن دسترسی کامل به هوش مصنوعی، برنامه تمرینی شخصی، ویدیو/گیف
            حرکات و رژیم غذایی شما را می‌دهد؛ فقط سطح پشتیبانی و امکانات اضافی
            متفاوت است.
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-16 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              در حال بارگذاری پلن‌ها...
            </p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4 py-16">
            <div className="text-4xl mb-2">😕</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
          </div>
        ) : sortedPlans.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            پلنی برای نمایش وجود ندارد.
          </p>
        ) : (
          <>
            {/* Mobile Carousel */}
            <div className="block lg:hidden -mx-2">
              <Swiper
                modules={[Autoplay]}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: true,
                }}
                loop={sortedPlans.length > 1}
                slidesPerView={1}
                spaceBetween={16}
                className="plans-swiper pb-12"
              >
                {sortedPlans.map((plan) => (
                  <SwiperSlide key={plan.id} className="h-auto py-2">
                    <PlanCard
                      plan={plan}
                      onSelect={handleSelect}
                      isMobile={true}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop Grid */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {sortedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
              ))}
            </div>

            {/* Tablet Grid (2 cols) */}
            <div className="hidden md:grid lg:hidden grid-cols-1 sm:grid-cols-2 gap-5">
              {sortedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-muted/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-border">
            <p className="text-sm text-muted-foreground">
              هنوز مطمئن نیستی؟{" "}
              <Link
                href="/register"
                className="text-primary font-medium underline-offset-4 hover:underline transition-all"
              >
                ثبت‌نام رایگان
              </Link>{" "}
              کن و اول برنامه شخصیت را ببین.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .plans-swiper :global(.swiper-pagination-bullet) {
          background: hsl(var(--primary));
          opacity: 0.3;
        }
        .plans-swiper :global(.swiper-pagination-bullet-active) {
          opacity: 1;
          width: 24px;
          border-radius: 999px;
        }
        .plans-swiper :global(.swiper-pagination) {
          bottom: 0 !important;
        }
      `}</style>
    </section>
  );
}
