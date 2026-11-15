"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

import { CheckoutDetailScreen } from "@/components/store/checkout-detail-screen";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";

export default function StoreOrderDetailPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  // Missing ID → back to orders list (can happen with malformed URLs)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !id) {
      router.replace("/account/orders");
    }
  }, [authLoading, isAuthenticated, id, router]);

  if (authLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-muted/30 px-4 dark:bg-background"
      >
        <Loader2
          className="h-7 w-7 animate-spin text-primary sm:h-8 sm:w-8"
          aria-hidden="true"
        />
        <p className="text-center text-xs text-muted-foreground sm:text-sm">
          در حال بارگذاری…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
            <AlertTriangle
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            شناسه سفارش نامعتبر است.
          </p>
          <Button asChild variant="outline" className="mt-1">
            <a href="/account/orders">بازگشت به سفارش‌ها</a>
          </Button>
        </div>
      </div>
    );
  }

  return <CheckoutDetailScreen checkoutId={id} />;
}
