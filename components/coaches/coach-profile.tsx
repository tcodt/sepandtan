"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  ChevronRight,
  MessageSquare,
  Sparkles,
  User,
  CameraOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Coach } from "@/lib/types/coach";
import { RequestCollaborationSheet } from "./request-collaboration-sheet";

type Props = {
  coach: Coach;
};

function formatPrice(n: number) {
  return `${n.toLocaleString("fa-IR")} تومان`;
}

// Generate a consistent gradient based on name
function getGradientByName(name: string) {
  const colors = [
    "from-blue-500/30 to-blue-600/10",
    "from-purple-500/30 to-purple-600/10",
    "from-pink-500/30 to-pink-600/10",
    "from-green-500/30 to-green-600/10",
    "from-orange-500/30 to-orange-600/10",
    "from-red-500/30 to-red-600/10",
    "from-teal-500/30 to-teal-600/10",
    "from-indigo-500/30 to-indigo-600/10",
  ];
  const index = name.length % colors.length;
  return colors[index];
}

// Generate a consistent color for the avatar
function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-indigo-500",
  ];
  const index = name.length % colors.length;
  return colors[index];
}

export function CoachProfile({ coach }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [avatarImageError, setAvatarImageError] = useState(false);
  const [heroImageLoading, setHeroImageLoading] = useState(true);
  const [avatarImageLoading, setAvatarImageLoading] = useState(true);

  return (
    <>
      <div className="min-h-screen bg-background pb-28">
        {/* Hero image */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[280px] sm:max-h-[320px] bg-muted overflow-hidden">
          {coach.avatarUrl && !heroImageError ? (
            <>
              {heroImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                  <User className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              <Image
                src={coach.avatarUrl}
                alt={coach.name}
                fill
                className={cn(
                  "object-cover transition-all duration-700",
                  heroImageLoading
                    ? "scale-110 opacity-0"
                    : "scale-100 opacity-100",
                )}
                sizes="100vw"
                priority
                onError={() => setHeroImageError(true)}
                onLoad={() => setHeroImageLoading(false)}
              />
            </>
          ) : (
            // Hero Fallback
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center",
                "bg-gradient-to-br",
                getGradientByName(coach.name),
              )}
            >
              <div
                className={cn(
                  "w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center",
                  "shadow-lg shadow-black/20 ring-4 ring-white/30",
                  getAvatarColor(coach.name),
                )}
              >
                <span className="text-4xl sm:text-6xl font-bold text-white">
                  {coach.name.charAt(0)}
                </span>
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90 font-medium">
                {coach.name}
              </p>
              {heroImageError && (
                <div className="absolute bottom-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs text-white/80">
                    <CameraOff className="w-3.5 h-3.5" />
                    تصویر در دسترس نیست
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Back button */}
          <Link
            href="/coaches"
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-foreground shadow-sm hover:bg-background transition-colors"
            aria-label="بازگشت به لیست مربیان"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="max-w-lg sm:max-w-2xl mx-auto px-4 sm:px-6 -mt-14 relative z-10 space-y-5">
          {/* Header card */}
          <Card className="border-border/50 bg-card/90 backdrop-blur-md shadow-lg">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 ring-2 ring-background shadow-md bg-muted">
                  {coach.avatarUrl && !avatarImageError ? (
                    <>
                      {avatarImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                          <User className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <Image
                        src={coach.avatarUrl}
                        alt={coach.name}
                        fill
                        className={cn(
                          "object-cover transition-all duration-500",
                          avatarImageLoading
                            ? "scale-110 opacity-0"
                            : "scale-100 opacity-100",
                        )}
                        sizes="80px"
                        onError={() => setAvatarImageError(true)}
                        onLoad={() => setAvatarImageLoading(false)}
                      />
                    </>
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center text-2xl font-bold text-white",
                        getAvatarColor(coach.name),
                      )}
                    >
                      {coach.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-foreground">
                      {coach.name}
                    </h1>
                    {coach.verified && (
                      <span className="inline-flex items-center gap-0.5 text-primary text-xs font-medium">
                        <BadgeCheck className="w-4 h-4" />
                        تأییدشده
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {coach.rating.toLocaleString("fa-IR")}
                      <span className="font-normal text-muted-foreground">
                        ({coach.reviewCount.toLocaleString("fa-IR")} نظر)
                      </span>
                    </span>
                    {coach.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {coach.city}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {coach.experienceYears.toLocaleString("fa-IR")} سال تجربه
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5">
                {coach.specialties.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="rounded-full text-xs font-normal px-2.5 py-0.5"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              درباره مربی
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {coach.bio}
            </p>
          </section>

          {/* Sample plans */}
          {coach.samplePlans && coach.samplePlans.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">
                نمونه برنامه‌ها
              </h2>
              <div className="flex flex-wrap gap-2">
                {coach.samplePlans.map((plan) => (
                  <span
                    key={plan}
                    className="inline-flex items-center rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs text-foreground"
                  >
                    {plan}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Pricing */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">قیمت‌ها</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    برنامه تمرینی / غذایی
                  </p>
                  <p className="text-base font-bold text-foreground tabular-nums">
                    {formatPrice(coach.pricePerPlan)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    مشاوره یک‌جلسه‌ای
                  </p>
                  <p className="text-base font-bold text-foreground tabular-nums">
                    {formatPrice(coach.pricePerConsultation)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-40",
          "border-t border-border/60 bg-background/90 backdrop-blur-lg",
          "px-4 py-3 sm:py-4",
          "safe-area-pb",
        )}
      >
        <div className="max-w-lg sm:max-w-2xl mx-auto flex gap-3">
          <Button
            size="lg"
            className="flex-1 h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
            onClick={() => setSheetOpen(true)}
          >
            <MessageSquare className="w-5 h-5" />
            درخواست همکاری
          </Button>
        </div>
      </div>

      <RequestCollaborationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        coach={coach}
      />
    </>
  );
}
