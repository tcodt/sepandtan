"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { getMyProfile } from "@/lib/api/auth";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { getAccessToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import {
  clearClientSession,
  loginPathForReason,
  resolveSessionAction,
} from "@/features/auth/session-gate";
import { PROFILE_QUERY_KEY } from "@/features/auth/hooks/use-auth";

const POLL_MS = 8_000;

export function useSellerAccessGuard(enabled: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const prevRoleRef = useRef<string | null>("seller");
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      if (cancelled || busy.current) return;
      if (!getAccessToken()) return;
      busy.current = true;
      try {
        const raw = await getMyProfile();
        if (cancelled) return;
        const mapped = mapProfileResponseToUser(raw);
        const action = resolveSessionAction({
          user: mapped,
          previousRole: prevRoleRef.current,
          pathname: "/seller",
        });
        prevRoleRef.current = mapped.role;

        if (action.type === "logout") {
          clearClientSession();
          queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
          router.replace(loginPathForReason(action.reason));
          return;
        }

        setAuthFromBackend(mapped);
        queryClient.setQueryData(PROFILE_QUERY_KEY, raw);

        if (action.type === "redirect") {
          router.replace(action.href);
        }
      } catch {
        if (!cancelled) {
          clearClientSession();
          router.replace(loginPathForReason("session"));
        }
      } finally {
        busy.current = false;
      }
    };

    void run();
    const id = window.setInterval(run, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [enabled, router, queryClient, setAuthFromBackend]);
}
