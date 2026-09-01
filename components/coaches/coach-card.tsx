"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Star,
  BadgeCheck,
  MapPin,
  ChevronLeft,
  User,
  CameraOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Coach } from "@/lib/types/coach";

type Props = {
  coach: Coach;
  className?: string;
};

function formatPrice(n: number) {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m.toLocaleString("fa-IR") : m.toFixed(1).replace(".", "٫")} میلیون`;
  }
  return `${n.toLocaleString("fa-IR")} تومان`;
}

// Generate a consistent gradient based on name
function getGradientByName(name: string) {
  const colors = [
    "from-blue-500/20 to-blue-600/10",
    "from-purple-500/20 to-purple-600/10",
    "from-pink-500/20 to-pink-600/10",
    "from-green-500/20 to-green-600/10",
    "from-orange-500/20 to-orange-600/10",
    "from-red-500/20 to-red-600/10",
    "from-teal-500/20 to-teal-600/10",
    "from-indigo-500/20 to-indigo-600/10",
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

export function CoachCard({ coach, className }: Props) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <Link
      href={`/coaches/${coach.id}`}
      className={cn("block h-full group focus-visible:outline-none", className)}
    >
      <Card
        className={cn(
          "h-full border-border/50 bg-muted/50 backdrop-blur-md overflow-hidden",
          "transition-all duration-300 ease-out",
          "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
          "active:scale-[0.98] active:translate-y-0",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {/* Image */}
        <div className="relative aspect-4/3 sm:aspect-5/4 w-full bg-muted overflow-hidden">
          {coach.avatarUrl && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                  <User className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <Image
                src={coach.avatarUrl}
                alt={coach.name}
                fill
                className={cn(
                  "object-cover transition-all duration-700",
                  "group-hover:scale-105",
                  imageLoading
                    ? "scale-110 opacity-0"
                    : "scale-100 opacity-100",
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoading(false)}
              />
            </>
          ) : (
            // Fallback UI - Beautiful gradient with initials
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center",
                "bg-linear-to-br",
                getGradientByName(coach.name),
              )}
            >
              <div
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center",
                  "shadow-lg shadow-black/10 ring-4 ring-white/20",
                  getAvatarColor(coach.name),
                )}
              >
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {coach.name.charAt(0)}
                </span>
              </div>
              {imageError && (
                <div className="absolute bottom-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white/70">
                    <CameraOff className="w-3 h-3" />
                    تصویر در دسترس نیست
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {coach.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
                <BadgeCheck className="w-3 h-3" />
                تأییدشده
              </span>
            )}
          </div>

          {/* Rating pill */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-semibold shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {coach.rating.toLocaleString("fa-IR")}
              <span className="text-muted-foreground font-normal text-[10px]">
                ({coach.reviewCount.toLocaleString("fa-IR")})
              </span>
            </span>
          </div>
        </div>

        <CardContent className="p-3.5 sm:p-4 space-y-2.5">
          {/* Name + city */}
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                {coach.name}
              </h3>
              <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
              {coach.city && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {coach.city}
                </span>
              )}
              <span>·</span>
              <span>
                {coach.experienceYears.toLocaleString("fa-IR")} سال تجربه
              </span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
            {coach.bio}
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {coach.specialties.slice(0, 3).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] sm:text-[11px] font-normal px-2 py-0.5 rounded-full bg-muted/80"
              >
                {s}
              </Badge>
            ))}
            {coach.specialties.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] font-normal px-1.5 py-0.5 rounded-full"
              >
                +{(coach.specialties.length - 3).toLocaleString("fa-IR")}
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="pt-1 border-t border-border/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">شروع از</p>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatPrice(coach.pricePerPlan)}
              </p>
            </div>
            <span className="text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              مشاهده پروفایل
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
