"use client";

import { SellerShell } from "@/components/seller/seller-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    allowedRoles: ["seller", "admin"],
    requireOnboarding: false,
  });

  const accountStatus = user?.accountStatus ?? "ACTIVE";

  if (accountStatus === "SUSPENDED" || accountStatus === "DELETED") {
    // همان logout اجباری
    return null; // useRequireAuth باید redirect کند
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Seller must be approved before accessing the panel
  if (user.role === "seller" && user.roleStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-foreground">
            دسترسی فروشنده فعال نیست
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            وضعیت نقش شما:{" "}
            <span className="font-medium text-foreground">
              {user.roleStatus}
            </span>
            . پس از تأیید ادمین می‌توانید وارد پنل شوید.
          </p>
        </div>
      </div>
    );
  }

  return <SellerShell>{children}</SellerShell>;
}
