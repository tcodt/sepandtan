"use client";

import { CartScreen } from "@/components/cart/cart-screen";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function CartClient() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <CartScreen />;
}
