"use client";

import { Loader2 } from "lucide-react";
import { OrdersScreen } from "@/components/account/orders-screen";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function AccountOrdersPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });

  if (isLoading) {
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

  return <OrdersScreen />;
}
