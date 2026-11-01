"use client";

import { useAuthHydration } from "@/features/auth/hooks/use-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthHydration();
  return <>{children}</>;
}
