"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CoachCard } from "./coach-card";
import { EmptyState } from "@/components/common/empty-state";
import { getCoaches } from "@/lib/api/coaches";
import type { Coach } from "@/lib/types/coach";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const FILTERS = [
  { id: "all", label: "همه", icon: "🌟" },
  { id: "کاهش وزن", label: "کاهش وزن", icon: "⚖️" },
  { id: "عضله‌سازی", label: "عضله‌سازی", icon: "💪" },
  { id: "تناسب بانوان", label: "تناسب بانوان", icon: "👩" },
  { id: "تغذیه ورزشی", label: "تغذیه", icon: "🥗" },
  { id: "تمرین خانگی", label: "خانگی", icon: "🏠" },
  { id: "یوگا", label: "یوگا / پیلاتس", icon: "🧘" },
  { id: "قدرت", label: "قدرت", icon: "🏋️" },
] as const;

function CoachCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function CoachesList() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const filtersContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCoaches();
        if (!cancelled) setCoaches(data.filter((c) => c.isActive));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("نتونستیم لیست مربیان رو بیاریم.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = coaches;
    if (filter !== "all") {
      list = list.filter((c) =>
        c.specialties.some((s) => s.includes(filter) || filter.includes(s)),
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.specialties.some((s) => s.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => b.rating - a.rating);
  }, [coaches, filter, query]);

  // Check scroll position for arrows
  const checkScroll = () => {
    const container = filtersContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = filtersContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scrollFilters = (direction: "left" | "right") => {
    const container = filtersContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  //   const getActiveFilterLabel = () => {
  //     const active = FILTERS.find((f) => f.id === filter);
  //     return active ? active.label : "همه";
  //   };

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CoachCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Users className="w-6 h-6" />}
        title="یه مشکلی پیش اومد"
        description={error}
        actionLabel="تلاش مجدد"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام، تخصص یا شهر..."
            className={cn(
              "pr-10 h-10 sm:h-11 rounded-xl bg-card/80 border-border/60",
              "focus-visible:ring-primary/30 text-sm w-full",
              query && "pl-10",
            )}
            aria-label="جستجوی مربی"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="sm:hidden flex gap-2">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-10 px-3 rounded-xl border-border/60 bg-card/80"
              >
                <Filter className="w-4 h-4 ml-1.5" />
                <span className="text-sm">فیلتر</span>
                {filter !== "all" && (
                  <Badge
                    variant="default"
                    className="mr-1 h-5 px-1.5 text-xs bg-primary"
                  >
                    {FILTERS.find((f) => f.id === filter)?.label}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl h-[60vh]">
              <SheetHeader className="mb-4">
                <SheetTitle>انتخاب دسته‌بندی</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2">
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <Button
                      key={f.id}
                      variant={active ? "default" : "outline"}
                      className={cn(
                        "h-12 justify-start gap-2.5 rounded-xl",
                        active && "shadow-md shadow-primary/20",
                      )}
                      onClick={() => {
                        setFilter(f.id);
                        setIsFilterSheetOpen(false);
                      }}
                    >
                      <span className="text-xl">{f.icon}</span>
                      <span className="text-sm">{f.label}</span>
                      {active && (
                        <span className="mr-auto w-2 h-2 rounded-full bg-primary-foreground/50" />
                      )}
                    </Button>
                  );
                })}
              </div>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full text-muted-foreground"
                  onClick={() => {
                    setFilter("all");
                    setIsFilterSheetOpen(false);
                  }}
                >
                  <X className="w-3.5 h-3.5 ml-1.5" />
                  حذف فیلتر
                </Button>
              )}
            </SheetContent>
          </Sheet>

          {/* Results Count Mobile */}
          <div className="flex items-center px-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filtered.length}
            </span>
          </div>
        </div>

        {/* Results Count - Desktop */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length.toLocaleString("fa-IR")} مربی
          </span>
          {filter !== "all" && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {FILTERS.find((f) => f.id === filter)?.label}
            </span>
          )}
        </div>
      </div>

      {/* Desktop Filters with Scroll Arrows - Hidden on Mobile */}
      <div className="hidden sm:block relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scrollFilters("left")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-md hover:bg-background transition-all duration-200"
            aria-label="اسکرول به چپ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Filters Container */}
        <div
          ref={filtersContainerRef}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200",
                  "flex items-center gap-1.5 whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[0.97]"
                    : "bg-card/60 border border-border/60 hover:bg-muted/80 hover:scale-[0.98] text-foreground/80",
                )}
              >
                <span className="text-base sm:text-lg">{f.icon}</span>
                <span>{f.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scrollFilters("right")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-md hover:bg-background transition-all duration-200"
            aria-label="اسکرول به راست"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clear Filters - Desktop */}
      {(query || filter !== "all") && (
        <div className="hidden sm:flex justify-end">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            پاک کردن فیلترها
          </button>
        </div>
      )}

      {/* Mobile Active Filter Display */}
      {filter !== "all" && (
        <div className="sm:hidden flex items-center gap-2">
          <span className="text-xs text-muted-foreground">فیلتر فعال:</span>
          <Badge variant="default" className="gap-1.5 px-3 py-1.5">
            <span>{FILTERS.find((f) => f.id === filter)?.icon}</span>
            <span>{FILTERS.find((f) => f.id === filter)?.label}</span>
            <button
              onClick={() => setFilter("all")}
              className="mr-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="pt-8 sm:pt-12">
          <EmptyState
            icon={<Users className="w-8 h-8 sm:w-10 sm:h-10" />}
            title="مربی‌ای پیدا نشد"
            description="عبارت جستجو یا فیلتر را تغییر بده."
            actionLabel="پاک کردن فیلترها"
            onAction={() => {
              setQuery("");
              setFilter("all");
            }}
          />
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3 sm:gap-4 lg:gap-5",
            "grid-cols-1",
            "sm:grid-cols-2",
            "lg:grid-cols-3",
            "xl:grid-cols-3",
            "2xl:grid-cols-4",
          )}
        >
          {filtered.map((coach, i) => (
            <div
              key={coach.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
            >
              <CoachCard coach={coach} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
