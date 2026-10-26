"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Users, Store, Loader2, CheckCircle2 } from "lucide-react";
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
import { setUserRole, requestRoleUpgrade } from "@/lib/api/users";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
  const requestRole = useUserStore((s) => s.requestRole);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [selected, setSelected] = useState<SelectableRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ریدایرکت فقط در شرایط خاص
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    // Coach یا Seller
    if (user.role === "coach" || user.role === "seller") {
      if (user.roleStatus === "approved") {
        router.replace(user.role === "coach" ? "/coach" : "/dashboard");
      } else {
        router.replace(`/role-pending?type=${user.role}`);
      }
      return;
    }

    // Trainee که آنبوردینگ را شروع کرده یا تمام کرده
    if (user.role === "trainee") {
      if (user.onboardingStatus === "completed" || user.onboardingCompleted) {
        router.replace("/dashboard");
      } else if (user.onboardingStatus === "in_progress") {
        router.replace("/onboarding");
      }
      // اگر not_started باشد → هیچ ریدایرکتی انجام نشود
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleContinue = async () => {
    if (!selected || !user) return;

    setIsSubmitting(true);

    try {
      if (selected === "trainee") {
        await setUserRole(user.id, "trainee", "approved");
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
      } else {
        // selected اینجا قطعاً "coach" یا "seller" است
        await requestRoleUpgrade(user.id, selected);
        requestRole(selected);

        toast.success("درخواستت ثبت شد. منتظر تأیید ادمین باش");
        router.replace(`/role-pending?type=${selected}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطایی رخ داد. دوباره تلاش کن.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // حالت Loading اولیه
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // اگر باید ریدایرکت شود، spinner نشان بده (جلوگیری از فلش محتوا)
  const shouldRedirect =
    !!user &&
    (user.role === "coach" ||
      user.role === "seller" ||
      (user.role === "trainee" &&
        (user.onboardingStatus === "completed" ||
          user.onboardingCompleted ||
          user.onboardingStatus === "in_progress")));

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // صفحه اصلی Role Selection
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border bg-muted/40 backdrop-blur-md shadow-xl">
          <CardHeader className="text-center space-y-2 pb-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              نقش خودت رو انتخاب کن
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              این انتخاب مسیر تجربه‌ات در سپندتن را مشخص می‌کند
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selected === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelected(role.id)}
                    disabled={isSubmitting}
                    className={`
                      relative flex items-start gap-4 p-4 rounded-xl border text-right transition-all
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                      }
                    `}
                  >
                    <div
                      className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${role.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">
                        {role.title}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="absolute top-4 left-4 w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!selected || isSubmitting}
              className="w-full h-11 text-base font-medium mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                "ادامه"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-1">
              بعداً هم می‌تونی نقش اضافه کنی (مثلاً همزمان ورزشکار و فروشنده
              باشی)
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
