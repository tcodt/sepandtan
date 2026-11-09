"use client";

import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  useIsInWishlist,
  useToggleWishlist,
  useWishlistIds,
} from "@/features/wishlist/hooks";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

type WishlistToggleProps = {
  productId: string;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistToggle({
  productId,
  className,
  size = "sm",
}: WishlistToggleProps) {
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);

  // prefetch ids وقتی لاگین است
  useWishlistIds(isAuthenticated);

  const isInWishlist = useIsInWishlist(productId);
  const toggle = useToggleWishlist();

  const pending = toggle.isPending && toggle.variables?.productId === productId;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push(
        `/login?next=${encodeURIComponent(
          typeof window !== "undefined" ? window.location.pathname : "/store",
        )}`,
      );
      return;
    }

    toggle.mutate({ productId, isInWishlist });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={
        isInWishlist ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
      }
      aria-pressed={isInWishlist}
      disabled={pending}
      onClick={onClick}
      className={cn(
        "rounded-full bg-background/90 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/70",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
    >
      {pending ? (
        <Loader2
          className={cn(
            "animate-spin",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
      ) : (
        <Heart
          className={cn(
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
            isInWishlist
              ? "fill-rose-500 text-rose-500"
              : "text-muted-foreground",
          )}
        />
      )}
    </Button>
  );
}
