"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";

const loginSchema = z.object({
  contact: z.string().min(1, "این فیلد الزامی است"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const plan = searchParams.get("plan");

  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      contact: "",
      password: "",
    },
  });

  const handleContactTypeChange = (value: string) => {
    setContactType(value as "email" | "phone");
    setValue("contact", "");
    clearErrors("contact");
  };

  const onSubmit = (data: LoginForm) => {
    const contact = data.contact.trim();
    const password = data.password;

    // بک‌اند فعلی فقط login با email را پشتیبانی می‌کند
    if (contactType === "phone") {
      toast.error("ورود با موبایل هنوز فعال نیست. از ایمیل استفاده کنید.");
      return;
    }

    const emailSchema = z.string().email("ایمیل معتبر وارد کنید");
    const parsed = emailSchema.safeParse(contact);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ایمیل معتبر وارد کنید");
      return;
    }

    loginMutation.mutate(
      {
        email: contact,
        password,
      },
      {
        // هدایت سفارشی در صورت نیاز (اختیاری)
        onSuccess: () => {
          // منطق پیش‌فرض در خود mutation هست؛
          // اگر next داشتید می‌توانید اینجا override کنید
          if (next === "/checkout") {
            const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : "";
            window.location.href = `/checkout${planQuery}`;
          }
        },
      },
    );
  };

  const isLoading = loginMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-border bg-muted/50 backdrop-blur-md shadow-xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20"
          >
            <LogIn className="h-7 w-7 text-primary" />
          </motion.div>

          <CardTitle className="text-xl font-bold text-foreground sm:text-2xl">
            ورود به سپندتن
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground sm:text-base">
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
                <TabsList className="grid h-10 w-full grid-cols-2">
                  <TabsTrigger value="email" className="gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    ایمیل
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5" />
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
                    className={`h-11 bg-background ${
                      contactType === "email" ? "text-left" : ""
                    }`}
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

              {contactType === "phone" && (
                <p className="text-xs text-muted-foreground">
                  ورود با موبایل (OTP) به‌زودی فعال می‌شود. فعلاً از ایمیل
                  استفاده کنید.
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
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  فراموشی رمز؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="h-11 bg-background pl-10"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
              className="h-11 w-full text-base font-medium"
              disabled={isLoading || contactType === "phone"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              ثبت‌نام کن
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
