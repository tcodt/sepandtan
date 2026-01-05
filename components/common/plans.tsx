"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function Plans() {
  const allFeatures = [
    "برنامه تمرینی شخصی‌سازی‌شده با هوش مصنوعی",
    "دسترسی به بیش از ۵۰۰ حرکت با گیف و ویدیو آموزشی",
    "رژیم غذایی روزانه بر اساس مواد ایرانی",
    "پیگیری وزن و پیشرفت هفتگی",
    "چت‌بات AI برای سؤالات روزمره",
    "تنظیم هوشمند برنامه (بر اساس عملکرد واقعی)",
    "گزارش پیشرفت دقیق + عکس قبل/بعد",
    "چالش‌های گروهی و انگیزشی",
    "پشتیبانی اولویت‌دار",
    "اهداف پیشرفته و تخصصی",
    "ویدیوهای آموزشی اختصاصی + مربی AI پیشرفته",
    "رژیم غذایی نامحدود با جایگزین‌ها",
    "گزارش ماهانه PDF حرفه‌ای",
    "مشاوره AI نامحدود",
    "اولویت طلایی پشتیبانی ۲۴/۷",
    "ویژگی‌های انحصاری و آپدیت‌های زودرس",
  ];

  const plans = [
    {
      id: 1,
      name: "پلن پایه – شروع هوشمند",
      price: "349,000",
      featured: false,
      includes: [
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
    },
    {
      id: 2,
      name: "پلن حرفه‌ای – رشد سریع",
      price: "499,000",
      featured: true,
      includes: [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
    },
    {
      id: 3,
      name: "پلن پیشرفته – تحول کامل",
      price: "699,000",
      featured: false,
      includes: [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ],
    },
  ];

  return (
    <section className="w-full">
      {/* Header Section */}
      <div className="px-4 md:px-8 py-8 md:py-12 mt-16 md:mt-24 max-w-6xl mx-auto">
        <h4 className="text-xl md:text-2xl lg:text-3xl text-popover-foreground font-semibold mb-4">
          پلن مناسب خودت رو انتخاب کن و تحول رو شروع کن
        </h4>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          هر پلن دسترسی کامل به هوش مصنوعی، برنامه تمرینی شخصی، ویدیو/گیف حرکات
          و رژیم غذایی شما رو می‌ده فقط سطح پشتیبانی و امکانات اضافی متفاوت است.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto w-full">
        {/* Mobile Carousel */}
        <div className="block lg:hidden">
          <Swiper
            modules={[Autoplay]}
            pagination={{ clickable: true }}
            autoplay
            loop
            slidesPerView={1}
            spaceBetween={20}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 15,
              },
            }}
            className="plans-swiper"
            onSlideChange={() => {
              // Update slide heights when slide changes
              setTimeout(() => {
                const slides = document.querySelectorAll(
                  ".plans-swiper .swiper-slide"
                );
                let maxHeight = 0;

                // Find the tallest slide
                slides.forEach((slide) => {
                  const slideHeight = slide.clientHeight;
                  if (slideHeight > maxHeight) {
                    maxHeight = slideHeight;
                  }
                });

                // Set all slides to the same height
                slides.forEach((slide) => {
                  (slide as HTMLElement).style.height = `${maxHeight}px`;
                });
              }, 100);
            }}
            onInit={(swiper) => {
              // Initial height adjustment
              setTimeout(() => {
                const slides = swiper.slides;
                let maxHeight = 0;

                slides.forEach((slide) => {
                  const slideHeight = slide.clientHeight;
                  if (slideHeight > maxHeight) {
                    maxHeight = slideHeight;
                  }
                });

                slides.forEach((slide) => {
                  (slide as HTMLElement).style.height = `${maxHeight}px`;
                });
              }, 100);
            }}
          >
            {plans.map((plan) => (
              <SwiperSlide key={plan.id} className="flex">
                <Card
                  className={`transition-all duration-300 flex flex-col h-full w-full ${
                    plan.featured
                      ? "border-2 border-primary shadow-lg relative bg-accent"
                      : "border border-border hover:shadow-lg hover:border-primary"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute md:-top-3 -top-1 right-4 bg-primary text-primary-foreground px-3 py-1 md:rounded-full rounded-t-none rounded-full text-xs font-bold">
                      محبوب ترین
                    </div>
                  )}

                  <CardHeader>
                    <h3 className="text-lg md:text-xl font-bold">
                      {plan.name}
                    </h3>
                    <p className="text-2xl md:text-3xl font-bold mt-3">
                      <span className="text-primary">{plan.price}</span>
                      <span className="text-xs md:text-sm text-muted-foreground block mt-1">
                        /ماه
                      </span>
                    </p>
                  </CardHeader>

                  <CardContent className="grow">
                    <ul className="space-y-2">
                      {allFeatures.map((feature, index) => {
                        const isIncluded = plan.includes[index];
                        if (!isIncluded) return null;
                        return (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-xs md:text-sm"
                          >
                            <span className="shrink-0 mt-0.5 text-primary font-bold">
                              ✓
                            </span>
                            <span className="text-foreground leading-snug">
                              {feature}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      variant={plan.featured ? "default" : "outline"}
                      size="lg"
                      className="w-full"
                    >
                      انتخاب
                    </Button>
                  </CardFooter>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`transition-all duration-300 flex flex-col h-full ${
                  plan.featured
                    ? "border-2 border-primary shadow-lg relative bg-accent"
                    : "border border-border hover:shadow-lg hover:border-primary"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                    محبوب ترین
                  </div>
                )}

                <CardHeader>
                  <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
                  <p className="text-2xl md:text-3xl font-bold mt-3">
                    <span className="text-primary">{plan.price}</span>
                    <span className="text-xs md:text-sm text-muted-foreground block mt-1">
                      /ماه
                    </span>
                  </p>
                </CardHeader>

                <CardContent className="grow">
                  <ul className="space-y-2">
                    {allFeatures.map((feature, index) => {
                      const isIncluded = plan.includes[index];
                      if (!isIncluded) return null;
                      return (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-xs md:text-sm"
                        >
                          <span className="shrink-0 mt-0.5 text-primary font-bold">
                            ✓
                          </span>
                          <span className="text-foreground leading-snug">
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={plan.featured ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    انتخاب
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
