"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { getRoleMismatchRedirect } from "@/features/onboarding/utils";

export function OnboardingRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const href = getRoleMismatchRedirect(user, "/onboarding");
    if (href) router.replace(href);
  }, [user, router]);

  if (user && user.role !== "trainee") return null;
  if (user?.professionalRoleLock === "seller") return null;

  return <>{children}</>;
}
