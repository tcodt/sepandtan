"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Icons
import {
  TrendingDown,
  TrendingUp,
  Dumbbell,
  Heart,
  Scale,
  Target,
  Apple,
  CheckCircle,
} from "lucide-react";

const users = [
  {
    name: "سارا، ۲۸ ساله",
    quote: "از ۷۵ به ۶۸ کیلو در ۴۵ روز — رژیم ایرانی و تمرین خانه عالی بود!",
    stat: "-۷ کیلو | ۴۵ روز",
    iconBefore: <Scale className="h-10 w-10 text-red-500" />,
    iconAfter: <TrendingDown className="h-10 w-10 text-green-500" />,
  },
  {
    name: "علی، ۳۵ ساله",
    quote: "عضله ساختم بدون باشگاه — برنامه روزانه هوشمند بود.",
    stat: "+۵ کیلو عضله",
    iconBefore: <Dumbbell className="h-10 w-10 text-yellow-500" />,
    iconAfter: <TrendingUp className="h-10 w-10 text-green-500" />,
  },
  {
    name: "مینا، ۳۲ ساله",
    quote: "انرژی‌ام برگشت، خوابم بهتر شد — پیگیری روزانه معجزه کرد.",
    stat: "تناسب اندام",
    iconBefore: <Heart className="h-10 w-10 text-red-500" />,
    iconAfter: <CheckCircle className="h-10 w-10 text-green-500" />,
  },
  {
    name: "رضا، ۴۰ ساله",
    quote: "لاغری بدون گرسنگی — جایگزین‌های رژیم عالی!",
    stat: "-۱۰ کیلو",
    iconBefore: <Apple className="h-10 w-10 text-red-500" />,
    iconAfter: <Target className="h-10 w-10 text-green-500" />,
  },
  {
    name: "نازنین، ۳۰ ساله",
    quote: "بدن خشک و عضلانی بدون دارو — تغذیه برنامه فوق‌العاده بود.",
    stat: "+۸% عضله خشک",
    iconBefore: <Scale className="h-10 w-10 text-gray-500" />,
    iconAfter: <Dumbbell className="h-10 w-10 text-green-500" />,
  },
  {
    name: "محمد، ۴۵ ساله",
    quote: "در ۳ ماه ۱۵ کیلو چربی سوزاندم و عضله ساختم.",
    stat: "-۱۵ کیلو | +۶ کیلو عضله",
    iconBefore: <Heart className="h-10 w-10 text-red-500" />,
    iconAfter: <Target className="h-10 w-10 text-green-500" />,
  },
];

export default function UserResult() {
  return (
    <section className="py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div className="md:max-w-xl">
            <h2 className="text-2xl md:text-3xl font-extrabold">
              نتایج واقعی کاربران سپندتن
            </h2>
            <h3 className="text-xl text-primary font-semibold mt-2">
              دگرگونی‌های چشمگیر در ۳ ماه
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mt-3">
              ببینید چگونه کاربران با برنامه‌های شخصی‌سازی شده هوش مصنوعی
              سپندتن، به اندامی ایده‌آل و سلامت کامل رسیدند. اکنون نوبت شماست!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="swiper-button-prev-custom"
            >
              ← قبلی
            </Button>
            <Button
              variant="default"
              size="sm"
              className="swiper-button-next-custom"
            >
              بعدی →
            </Button>
          </div>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              768: {
                slidesPerView: 2.1,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 2.8,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 3.2,
                spaceBetween: 24,
              },
              1536: {
                slidesPerView: 3.5,
                spaceBetween: 28,
              },
            }}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            pagination={{
              clickable: true,
              type: "bullets",
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            className="user-results-swiper pb-12"
            style={{
              paddingBottom: "3rem",
            }}
          >
            {users.map((u, idx) => (
              <SwiperSlide key={idx}>
                <div className="h-full">
                  <Card className="h-full flex flex-col border hover:border-primary/30 transition-all duration-300 bg-muted">
                    <CardHeader className="shrink-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarFallback className="bg-primary/10">
                            {u.name.split("،")[0].charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{u.name}</CardTitle>
                          <CardDescription className="text-sm font-medium text-primary mt-1">
                            {u.stat}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1">
                      {/* Icon sections instead of images */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Before section */}
                        <div className="relative rounded-lg border-2 border-dashed border-red-200 p-6 text-center h-40 flex flex-col items-center justify-center">
                          <div className="mb-3">{u.iconBefore}</div>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-red-700">
                              قبل
                            </div>
                            <div className="text-xs text-red-600">
                              وضعیت اولیه
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            شروع
                          </div>
                        </div>

                        {/* After section */}
                        <div className="relative rounded-lg border-2 border-dashed border-green-200 p-6 text-center h-40 flex flex-col items-center justify-center">
                          <div className="mb-3">{u.iconAfter}</div>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-green-700">
                              بعد
                            </div>
                            <div className="text-xs text-green-600">
                              نتیجه نهایی
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            موفقیت
                          </div>
                        </div>
                      </div>

                      {/* Quote with fixed height */}
                      <div className="min-h-20">
                        <div className="relative">
                          <div className="absolute right-0 top-0 text-3xl text-primary/20">
                            &quot;
                          </div>
                          <p className="text-sm text-foreground leading-relaxed pr-6">
                            {u.quote}
                          </p>
                          <div className="absolute left-0 bottom-0 text-3xl text-primary/20">
                            &quot;
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="shrink-0 pt-4 border-t">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          تغییر در ۳ ماه
                        </span>
                        <Button variant="outline" size="sm" className="text-xs">
                          داستان کامل →
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom pagination dots */}
          <div className="swiper-pagination mt-8 flex justify-center"></div>
        </div>
      </div>
    </section>
  );
}
