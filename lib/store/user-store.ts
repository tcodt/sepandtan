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
  ProfessionalRoleLock,
} from "@/lib/types/plan";
import {
  canRequestProfessionalRole,
  lockFromRole,
  mergeProfessionalLock,
} from "@/lib/role-lock";
import { setAccessToken } from "@/lib/api/client";

export type { BodyInfo, Equipment, Goal, UserProfile };

type UserState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  /** قفل‌ها بعد از logout هم می‌مانند */
  professionalLocksByUserId: Record<string, ProfessionalRoleLock>;

  setHasHydrated: (value: boolean) => void;
  setUser: (user: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  setAuthFromBackend: (user: UserProfile) => void;
  logout: () => void;
  setRole: (role: UserRole, status?: RoleStatus) => void;
  requestRole: (role: "coach" | "seller") => void;
  updateOnboardingStep: (step: number) => void;
  completeOnboarding: (data: {
    bodyInfo: BodyInfo;
    equipment: Equipment;
    goal: Goal;
    currentPlanId: string;
    targetWeight?: number;
  }) => void;
};

function withLock(
  user: UserProfile,
  locks: Record<string, ProfessionalRoleLock>,
): {
  user: UserProfile;
  professionalLocksByUserId: Record<string, ProfessionalRoleLock>;
} {
  const fromMemory = locks[user.id];
  const fromUser = user.professionalRoleLock;
  const fromRole = lockFromRole(user.role);
  const lock = mergeProfessionalLock(
    fromMemory,
    mergeProfessionalLock(fromUser, fromRole),
  );

  const professionalLocksByUserId = lock
    ? { ...locks, [user.id]: lock }
    : { ...locks };

  return {
    user: { ...user, professionalRoleLock: lock },
    professionalLocksByUserId,
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      professionalLocksByUserId: {},

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUser: (user) => {
        const merged = withLock(user, get().professionalLocksByUserId);
        set({
          user: merged.user,
          isAuthenticated: true,
          professionalLocksByUserId: merged.professionalLocksByUserId,
        });
      },

      updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        const next: UserProfile = {
          ...current,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        const merged = withLock(next, get().professionalLocksByUserId);
        set({
          user: merged.user,
          professionalLocksByUserId: merged.professionalLocksByUserId,
        });
      },

      setAuthFromBackend: (incoming) => {
        const merged = withLock(incoming, get().professionalLocksByUserId);
        set({
          user: merged.user,
          isAuthenticated: true,
          professionalLocksByUserId: merged.professionalLocksByUserId,
        });
      },

      logout: () => {
        setAccessToken(null);
        set({
          user: null,
          isAuthenticated: false,
          // professionalLocksByUserId حفظ می‌شود
        });
      },

      setRole: (role, status = "approved") => {
        const current = get().user;
        if (!current) return;
        const next: UserProfile = {
          ...current,
          role,
          roleStatus: status,
          roles: [role],
          professionalRoleLock: mergeProfessionalLock(
            current.professionalRoleLock,
            lockFromRole(role),
          ),
          updatedAt: new Date().toISOString(),
        };
        const merged = withLock(next, get().professionalLocksByUserId);
        set({
          user: merged.user,
          professionalLocksByUserId: merged.professionalLocksByUserId,
        });
      },

      requestRole: (role) => {
        const current = get().user;
        if (!current) return;

        const gate = canRequestProfessionalRole(current, role);
        if (!gate.ok) return;

        const next: UserProfile = {
          ...current,
          role,
          roleStatus: "pending",
          roles: [role],
          professionalRoleLock: mergeProfessionalLock(
            current.professionalRoleLock,
            role,
          ),
          updatedAt: new Date().toISOString(),
        };
        const merged = withLock(next, get().professionalLocksByUserId);
        set({
          user: merged.user,
          professionalLocksByUserId: merged.professionalLocksByUserId,
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
              step > 1 ? "in_progress" : current.onboardingStatus,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      completeOnboarding: (data) => {
        const current = get().user;
        if (!current) return;
        set({
          user: {
            ...current,
            bodyInfo: data.bodyInfo,
            equipment: data.equipment,
            goal: data.goal,
            currentPlanId: data.currentPlanId || null,
            targetWeight: data.targetWeight,
            onboardingCompleted: true,
            onboardingStatus: "completed",
            currentOnboardingStep: 0,
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
        professionalLocksByUserId: state.professionalLocksByUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
