"use client";

import { useState } from "react";
import { Dumbbell, Heart, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Category from "./_components/category";

// --- Data with more variety ---
const coaches = [
  {
    id: 1,
    name: "سارا محمدی",
    specialty: "مربی فیتنس",
    color: "bg-orange-500",
    isActive: true,
    storyImage: "/images/athlete-5.jpg",
  },
  {
    id: 2,
    name: "امیر حسینی",
    specialty: "مربی بدنسازی",
    color: "bg-orange-600",
    isActive: true,
    storyImage: "/images/athlete-5.jpg",
  },
  {
    id: 3,
    name: "زهرا کریمی",
    specialty: "مربی یوگا",
    color: "bg-amber-500",
    isActive: false,
    storyImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  },
  {
    id: 4,
    name: "مهدی رضایی",
    specialty: "مربی دو",
    color: "bg-orange-400",
    isActive: true,
    storyImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
  {
    id: 5,
    name: "الناز احمدی",
    specialty: "مربی پیلاتس",
    color: "bg-amber-400",
    isActive: false,
    storyImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  },
  {
    id: 6,
    name: "رضا کاظمی",
    specialty: "مربی هوازی",
    color: "bg-orange-300",
    isActive: true,
    storyImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
  },
  {
    id: 7,
    name: "مریم نوروزی",
    specialty: "مربی کراس فیت",
    color: "bg-amber-600",
    isActive: true,
    storyImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  },
  {
    id: 8,
    name: "علی مرادی",
    specialty: "مربی تی آر ایکس",
    color: "bg-orange-700",
    isActive: false,
    storyImage: "https://images.unsplash.com/photo-1463453091185-61582044d556",
  },
];

const categories = [
  { id: "all", name: "همه", icon: Sparkles },
  { id: "strength", name: "قدرتی", icon: Dumbbell },
  { id: "cardio", name: "هوازی", icon: Heart },
  { id: "yoga", name: "یوگا", icon: Zap },
];

const workouts = [
  {
    id: 1,
    title: "چالش ۳۰ روزه فیتنس",
    category: "قدرتی",
    level: "متوسط",
    duration: "۲۵ دقیقه",
    calories: "۲۸۰",
    coach: coaches[0],
    rating: 4.8,
    participants: "۱۲.۵k",
    isPopular: true,
    equipment: "دمبل، کش مقاومتی",
    intensity: "بالا",
    schedule: "۳ جلسه در هفته",
    description:
      "ترکیبی از تمرینات وزن بدن و وزن آزاد برای سوزاندن کالری و تقویت عضلات.",
    image: "/images/athlete-5.jpg",
  },
  {
    id: 2,
    title: "یوگای صبحگاهی",
    category: "یوگا",
    level: "مبتدی",
    duration: "۱۵ دقیقه",
    calories: "۱۲۰",
    coach: coaches[2],
    rating: 4.9,
    participants: "۸.۲k",
    isPopular: false,
    equipment: "مت، بلوک یوگا",
    intensity: "کم",
    schedule: "۵ روز در هفته",
    description: "تمرکز روی تنفس و کشش برای شروع روز با آرامش و انرژی مثبت.",
    image: "/images/athlete-5.jpg",
  },
  {
    id: 3,
    title: "هیت چربی سوز",
    category: "هوازی",
    level: "پیشرفته",
    duration: "۳۰ دقیقه",
    calories: "۴۵۰",
    coach: coaches[1],
    rating: 4.7,
    participants: "۲۰k",
    isPopular: true,
    equipment: "بدن خود، طناب پرش",
    intensity: "بسیار بالا",
    schedule: "۴ جلسه در هفته",
    description:
      "تمرینات سرعتی و انفجاری برای افزایش سوخت و ساز و بهبود استقامت.",
    image: "/images/athlete-5.jpg",
  },
  {
    id: 4,
    title: "پیلاتس اصلاحی",
    category: "قدرتی",
    level: "متوسط",
    duration: "۴۰ دقیقه",
    calories: "۲۲۰",
    coach: coaches[4],
    rating: 4.6,
    participants: "۵.۴k",
    isPopular: false,
    equipment: "تخته پیلاتس، توپ تمرینی",
    intensity: "متوسط",
    schedule: "۲ جلسه در هفته",
    description: "تمریناتی برای بهبود تعادل، انعطاف‌پذیری و تثبیت عضلات مرکزی.",
    image: "/images/athlete-5.jpg",
  },
  {
    id: 5,
    title: "دوی اینتروال",
    category: "هوازی",
    level: "پیشرفته",
    duration: "۳۵ دقیقه",
    calories: "۳۹۰",
    coach: coaches[3],
    rating: 4.9,
    participants: "۱۵.۷k",
    isPopular: true,
    equipment: "کفش دو، مسیر باز",
    intensity: "بالا",
    schedule: "۳ جلسه در هفته",
    description:
      "دوهای سریع و استراحت‌های کوتاه برای افزایش توان هوازی و چربی‌سوزی.",
    image: "/images/athlete-5.jpg",
  },
  {
    id: 6,
    title: "کشش و ریکاوری",
    category: "یوگا",
    level: "مبتدی",
    duration: "۱۰ دقیقه",
    calories: "۵۰",
    coach: coaches[5],
    rating: 5.0,
    participants: "۳.۲k",
    isPopular: false,
    equipment: "مت، بند کشی",
    intensity: "کم",
    schedule: "هر روز",
    description:
      "فوکوس روی ریکاوری، انعطاف‌پذیری و تسکین عضلات پس از تمرینات سنگین.",
    image: "/images/athlete-5.jpg",
  },
];

export default function Workouts() {
  const [selected, setSelected] = useState<string>("all");

  // map category ids to the displayed Persian category names
  const categoryMap: Record<string, string> = {
    strength: "قدرتی",
    cardio: "هوازی",
    yoga: "یوگا",
  };

  const filteredWorkouts =
    selected === "all"
      ? workouts
      : workouts.filter((w) => w.category === categoryMap[selected]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-popover bg-popover/80 backdrop-blur-sm dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                تمرینات
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {workouts.length} تمرین آماده برای شما
              </p>
            </div>
            <Button className="gap-2 rounded-full bg-orange-500 text-white hover:bg-orange-600">
              <Sparkles className="h-4 w-4" />
              برنامه اختصاصی
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            {/* Tips */}
            <div className="rounded-3xl border border-muted bg-muted p-6 shadow-sm dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    بخش تمرینات
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    انتخاب برنامه مناسب
                  </h2>
                </div>
                <Badge className="rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                  تمرینات پیشنهادی
                </Badge>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                هر تمرین شامل جزئیات تکمیلی مانند تجهیزات، شدت، برنامه هفتگی و
                توصیف کوتاه است تا انتخاب راحت‌تر شود.
              </p>
            </div>

            {/* Categories UI */}
            <Category
              categories={categories}
              filteredWorkouts={filteredWorkouts.length}
              selected={selected}
              onCategoryChange={(categoryId) => setSelected(categoryId)}
            />

            {/* Workouts */}
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWorkouts.map((workout) => (
                <Card
                  key={workout.id}
                  className="overflow-hidden rounded-3xl bg-muted shadow-sm"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={workout.image}
                      alt={workout.title}
                      width={180}
                      height={180}
                      className="h-48 w-full object-cover transition-all duration-300 hover:scale-105"
                    />
                    {workout.isPopular && (
                      <Badge className="absolute left-3 top-3 rounded-full bg-orange-500 text-white">
                        محبوب
                      </Badge>
                    )}
                  </div>
                  <CardContent>
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {workout.category}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {workout.duration}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {workout.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300 line-clamp-1">
                      {workout.description}
                    </p>
                    <div className="mt-5 space-y-3 text-sm text-gray-500 dark:text-gray-400">
                      {/* <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {workout.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-4 w-4" /> {workout.calories} کالری
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" /> {workout.intensity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" /> سطح {workout.level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" /> {workout.participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-4 w-4" /> {workout.schedule}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          تجهیزات: {workout.equipment}
                        </span>
                      </div> */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-200 text-gray-600 dark:border-popover dark:text-gray-300">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-background border border-gray-200 dark:border-popover">
                            {workout.coach.name.split(" ")[0].slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {workout.coach.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {workout.coach.specialty}
                          </p>
                        </div>
                      </div>
                    </div>
                    <CardAction className="w-full mt-4">
                      <Button className="w-full" variant={"default"}>
                        جزئیات بیشتر
                      </Button>
                    </CardAction>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="rounded-3xl bg-linear-to-b from-orange-500 to-orange-400 shadow-sm dark:bg-gray-900 sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">مرور سریع</p>
                    <h3 className="text-xl font-semibold text-white dark:text-gray-100">
                      نکات برای انتخاب تمرین
                    </h3>
                  </div>
                </div>
                <div className="mt-4 space-y-4 text-sm text-white/70 dark:text-gray-300">
                  <p>
                    تمریناتی را انتخاب کنید که با هدف فیزیکی و زمان شما همخوانی
                    داشته باشند.
                  </p>
                  <p>
                    برای حفظ انگیزه، بین تمرین‌های شدید و ریکاوری هماهنگی ایجاد
                    کنید.
                  </p>
                  <p>
                    تمریناتی با تجهیزات ساده مانند کش و مت برای شروع مناسب
                    هستند.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
