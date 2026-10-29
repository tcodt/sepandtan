"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BodyInfo,
  Equipment,
  Goal,
  UserProfile,
  UserRole,
  RoleStatus,
} from "@/lib/types/plan";

export type { BodyInfo, Equipment, Goal, UserProfile };

type UserState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setUser: (user: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  setAuthFromBackend: (user: UserProfile) => void;
  logout: () => void;

  // Role
  setRole: (role: UserRole, status?: RoleStatus) => void;
  requestRole: (role: "coach" | "seller") => void;

  // Onboarding
  updateOnboardingStep: (step: number) => void;
  completeOnboarding: (data: {
    bodyInfo: BodyInfo;
    equipment: Equipment;
    goal: Goal;
    currentPlanId: string;
    targetWeight?: number;
  }) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        set({
          user: {
            ...current,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      setAuthFromBackend: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setRole: (role, status = "approved") => {
        const current = get().user;
        if (!current) return;

        set({
          user: {
            ...current,
            role,
            roleStatus: status,
            roles: [role],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      requestRole: (role) => {
        const current = get().user;
        if (!current) return;

        set({
          user: {
            ...current,
            role,
            roleStatus: "pending",
            roles: [role],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateOnboardingStep: (step) => {
        const current = get().user;
        if (!current) return;

        set({
          user: {
            ...current,
            currentOnboardingStep: step,
            onboardingStatus:
              step > 0 ? "in_progress" : current.onboardingStatus,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      /**
       * آنبوردینگ فقط Training Plan را ست می‌کند.
       * subscriptionStatus را تغییر نمی‌دهد (جداسازی قفل‌شده محصول).
       */
      completeOnboarding: (data) => {
        const current = get().user;
        if (!current) return;

        set({
          user: {
            ...current,
            bodyInfo: data.bodyInfo,
            equipment: data.equipment,
            goal: data.goal,
            currentPlanId: data.currentPlanId,
            targetWeight: data.targetWeight,
            onboardingCompleted: true,
            onboardingStatus: "completed",
            currentOnboardingStep: 0,
            // subscriptionStatus عمداً دست نخورده می‌ماند
            updatedAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: "sepandtan-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** صبر تا hydrate از localStorage تمام شود */
export function useAuthReady() {
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);

  return {
    ready: hasHydrated,
    isAuthenticated,
    user,
  };
}
