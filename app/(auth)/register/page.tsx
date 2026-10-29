"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Flame, Mail, Phone, User } from "lucide-react";
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
import { useRegisterMutation } from "@/features/auth/hooks/use-auth-mutations";

const registerSchema = z
  .object({
    name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
    lastName: z.string().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد"),
    contact: z.string().min(1, "این فیلد الزامی است"),
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const plan = searchParams.get("plan");

  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      lastName: "",
      contact: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleContactTypeChange = (value: string) => {
    setContactType(value as "email" | "phone");
    setValue("contact", "");
    clearErrors("contact");
  };

  const onSubmit = (data: RegisterForm) => {
    const contact = data.contact.trim();
    const fullName = `${data.name.trim()} ${data.lastName.trim()}`.trim();

    if (contactType === "email") {
      const emailSchema = z.string().email("ایمیل معتبر وارد کنید");
      const parsed = emailSchema.safeParse(contact);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "ایمیل معتبر وارد کنید");
        return;
      }
    } else {
      // اعتبارسنجی ساده شماره ایران
      const phoneOk = /^09\d{9}$/.test(contact);
      if (!phoneOk) {
        toast.error("شماره موبایل معتبر وارد کنید (مثال: 09123456789)");
        return;
      }
    }

    registerMutation.mutate(
      {
        name: fullName,
        email: contactType === "email" ? contact : undefined,
        phone: contactType === "phone" ? contact : undefined,
        password: data.password,
      },
      {
        onSuccess: () => {
          if (next === "/checkout") {
            const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : "";
            router.replace(`/checkout${planQuery}`);
            return;
          }
          // هدایت پیش‌فرض در خود mutation به /role-selection است
        },
      },
    );
  };

  const isLoading = registerMutation.isPending;

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
            <Flame className="h-7 w-7 text-primary" />
          </motion.div>

          <CardTitle className="text-xl font-bold text-foreground sm:text-2xl">
            ثبت‌نام در سپندتن
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground sm:text-base">
            برنامه شخصی‌سازی‌شده‌ات فقط چند قدم فاصله داره
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* نام و نام خانوادگی */}
            <div className="flex items-start gap-4">
              <div className="w-full space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  نام
                </Label>
                <div className="relative">
                  <User className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="مثلاً امیر"
                    className="h-11 bg-background pr-10"
                    {...register("name")}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="lastName" className="text-foreground">
                  نام خانوادگی
                </Label>
                <div className="relative">
                  <User className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lastName"
                    placeholder="مثلاً خانجانی"
                    className="h-11 bg-background pr-10"
                    {...register("lastName")}
                    disabled={isLoading}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* انتخاب ایمیل یا موبایل */}
            <div className="space-y-2">
              <Label className="text-foreground">روش ثبت‌نام</Label>
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
            </div>

            {/* رمز عبور */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                رمز عبور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="حداقل ۶ کاراکتر"
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

            {/* تکرار رمز */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                تکرار رمز عبور
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className="h-11 bg-background pl-10"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                "ساخت حساب کاربری"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            قبلاً ثبت‌نام کردی؟{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              وارد شو
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
