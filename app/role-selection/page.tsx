"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Users, Store, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  useRequestCoachRole,
  useRequestStoreRole,
} from "@/features/role/hooks/use-role-request";
import { canRequestProfessionalRole, lockFromRole } from "@/lib/role-lock";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "trainee" as const,
    title: "ورزشکار / کارآموز",
    description:
      "می‌خوام برنامه تمرینی و غذایی شخصی‌سازی‌شده بگیرم و پیشرفت کنم",
    icon: Dumbbell,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "coach" as const,
    title: "مربی",
    description: "می‌خوام به عنوان مربی برنامه بفروشم و شاگرد داشته باشم",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "seller" as const,
    title: "فروشنده",
    description: "می‌خوام محصولات و مکمل‌های ورزشی بفروشم",
    icon: Store,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

type SelectableRole = "trainee" | "coach" | "seller";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    blockPending: false,
  });

  const setRole = useUserStore((s) => s.setRole);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const coachMutation = useRequestCoachRole();
  const storeMutation = useRequestStoreRole();

  const [selected, setSelected] = useState<SelectableRole | null>(null);

  const isSubmitting = coachMutation.isPending || storeMutation.isPending;

  const lock = user?.professionalRoleLock ?? lockFromRole(user?.role) ?? null;
  const coachGate = canRequestProfessionalRole(user, "coach");
  const sellerGate = canRequestProfessionalRole(user, "seller");

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (user.role === "coach" || user.role === "seller") {
      if (user.roleStatus === "approved") {
        router.replace(user.role === "coach" ? "/coach" : "/seller");
      } else {
        router.replace("/role-pending");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleContinue = async () => {
    if (!selected || !user) return;

    try {
      if (selected === "trainee") {
        setRole("trainee", "approved");
        updateProfile({
          role: "trainee",
          roleStatus: "approved",
          roles: ["trainee"],
          onboardingStatus: "not_started",
          currentOnboardingStep: 1,
        });
        toast.success("عالی! حالا برنامه شخصیت رو می‌سازیم");
        router.replace("/onboarding");
        return;
      }

      if (selected === "coach") {
        if (!coachGate.ok) {
          toast.error(coachGate.message);
          return;
        }
        coachMutation.mutate({
          isAcceptingClients: true,
          headline: "مربی فیتنس",
        });
        return;
      }

      if (selected === "seller") {
        if (!sellerGate.ok) {
          toast.error(sellerGate.message);
          return;
        }
        storeMutation.mutate({});
        return;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطایی رخ داد. دوباره تلاش کن.";
      toast.error(message);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">مسیر خودت را انتخاب کن</CardTitle>
            <CardDescription>
              مربی و فروشنده یک‌بار برای همیشه انتخاب می‌شوند و قابل تعویض
              نیستند
            </CardDescription>
            {lock && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                قفل فعلی: {lock === "coach" ? "مربی" : "فروشنده"}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selected === role.id;

              let disabled = isSubmitting;
              let hint: string | null = null;

              if (role.id === "coach" && !coachGate.ok) {
                disabled = true;
                hint = coachGate.message;
              }
              if (role.id === "seller" && !sellerGate.ok) {
                disabled = true;
                hint = sellerGate.message;
              }

              return (
                <button
                  key={role.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(role.id)}
                  className={cn(
                    "w-full text-start rounded-xl border p-4 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        role.color,
                      )}
                    >
                      {disabled && role.id !== "trainee" ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{role.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                      {hint && (
                        <p className="text-[11px] text-destructive mt-1">
                          {hint}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            <Button
              className="w-full mt-2"
              disabled={!selected || isSubmitting}
              onClick={() => void handleContinue()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                "ادامه"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
