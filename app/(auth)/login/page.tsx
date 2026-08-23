"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from "@/lib/store/user-store";
import { loginWithEmail, loginWithPhone } from "@/lib/api/users";

const loginSchema = z.object({
  contact: z.string().min(1, "این فیلد الزامی است"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const plan = searchParams.get("plan");

  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleContactTypeChange = (value: string) => {
    setContactType(value as "email" | "phone");
    setValue("contact", "");
    clearErrors("contact");
  };

  const onSubmit = async (data: { contact: string; password: string }) => {
    setIsLoading(true);

    try {
      const user =
        contactType === "email"
          ? await loginWithEmail(data.contact.trim(), data.password)
          : await loginWithPhone(data.contact.trim(), data.password);

      // رمز را در کلاینت نگه ندار
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _pw, ...safeUser } = user as typeof user & {
        password?: string;
      };

      setUser({
        ...safeUser,
        role: safeUser.role || "user",
        onboardingCompleted: !!safeUser.onboardingCompleted,
        subscriptionStatus: safeUser.subscriptionStatus || "free",
        createdAt: safeUser.createdAt || new Date().toISOString(),
      });

      toast.success(`خوش آمدی ${safeUser.name}!`);

      if (next === "/checkout") {
        const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : "";
        router.replace(`/checkout${planQuery}`);
        return;
      }

      if (safeUser.onboardingCompleted) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ورود ناموفق بود. دوباره تلاش کن.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
          >
            <LogIn className="w-7 h-7 text-primary" />
          </motion.div>

          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            ورود به سپندتن
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            دوباره خوش اومدی! برنامه‌ات منتظرته
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* انتخاب ایمیل یا موبایل */}
            <div className="space-y-2">
              <Label className="text-foreground">روش ورود</Label>
              <Tabs
                value={contactType}
                onValueChange={handleContactTypeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="email" className="gap-1.5 text-sm">
                    <Mail className="w-3.5 h-3.5" />
                    ایمیل
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-1.5 text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    موبایل
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <AnimatePresence mode="wait">
                <motion.div
                  key={contactType}
                  initial={{ opacity: 0, x: contactType === "email" ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: contactType === "email" ? 8 : -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="contact"
                    type={contactType === "email" ? "email" : "tel"}
                    placeholder={
                      contactType === "email"
                        ? "example@email.com"
                        : "09123456789"
                    }
                    dir={contactType === "email" ? "ltr" : "rtl"}
                    className={`h-11 ${contactType === "email" ? "text-left" : ""}`}
                    {...register("contact")}
                    disabled={isLoading}
                  />
                </motion.div>
              </AnimatePresence>

              {errors.contact && (
                <p className="text-sm text-destructive">
                  {errors.contact.message}
                </p>
              )}
            </div>

            {/* رمز عبور */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">
                  رمز عبور
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  فراموشی رمز؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="h-11 pl-10"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                "ورود"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            حساب کاربری نداری؟{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              ثبت‌نام کن
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
