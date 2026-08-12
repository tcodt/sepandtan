"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const contactSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  subject: z.string().min(3, "موضوع را وارد کنید"),
  message: z.string().min(10, "پیام باید حداقل ۱۰ کاراکتر باشد"),
});

type ContactForm = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Phone,
    label: "تلفن",
    value: "۰۹۹۸۲۵۰۹۳۹۳",
    href: "tel:09982509393",
  },
  {
    icon: Mail,
    label: "ایمیل",
    value: "sepandtan@gmail.com",
    href: "mailto:sepandtan@gmail.com",
  },
  {
    icon: MapPin,
    label: "آدرس",
    value: "گیلان، بندر کیاشهر",
    href: null,
  },
  {
    icon: Instagram,
    label: "اینستاگرام",
    value: "@sepandtan",
    href: "https://instagram.com/sepandtan",
  },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    setIsLoading(true);
    console.log(data);

    // ==================== MOCK ====================
    // وقتی بک‌اند آماده شد:
    // await fetch("/api/contact", {
    //   method: "POST",
    //   body: JSON.stringify(data),
    // });
    // ==============================================

    await new Promise((resolve) => setTimeout(resolve, 1200));

    toast.success("پیامت با موفقیت ارسال شد. به زودی پاسخ می‌دهیم.");
    reset();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -right-24 w-72 h-72 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            <MessageSquare className="w-4 h-4" />
            تماس با ما
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            در کنارت هستیم
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            سوال، پیشنهاد یا مشکلی داری؟ فرم زیر را پر کن یا از طریق راه‌های
            ارتباطی مستقیم با ما در تماس باش.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              const content = (
                <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm transition-colors hover:border-primary/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );

              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="block"
                >
                  {content}
                </a>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-3"
          >
            <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">ارسال پیام</CardTitle>
                <CardDescription>
                  معمولاً کمتر از ۲۴ ساعت پاسخ می‌دهیم
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">نام و نام خانوادگی</Label>
                      <Input
                        id="name"
                        placeholder="علی رضایی"
                        className="h-11"
                        {...register("name")}
                        disabled={isLoading}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        dir="ltr"
                        className="h-11 text-left"
                        {...register("email")}
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">موضوع</Label>
                    <Input
                      id="subject"
                      placeholder="مثلاً سوال درباره اشتراک"
                      className="h-11"
                      {...register("subject")}
                      disabled={isLoading}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">پیام</Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="پیام خود را بنویس..."
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      {...register("message")}
                      disabled={isLoading}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        ارسال پیام
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
