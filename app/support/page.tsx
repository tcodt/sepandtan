"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Phone,
  Mail,
  Instagram,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowRight,
  Headphones,
  Copy,
  Check,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toFaDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/**
 * Renders a value that should always display LTR + isolated from the
 * surrounding RTL context. Prevents the Persian Bidi algorithm from
 * reordering grouped numbers like "0998 250 9393" → "9393 250 0998".
 */
const LtrValue: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <span
    dir="ltr"
    style={{ unicodeBidi: "isolate" }}
    className={`inline-block whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/* Contact data                                                               */
/* -------------------------------------------------------------------------- */

const contactItems = [
  {
    key: "phone",
    icon: Phone,
    title: "تماس تلفنی",
    value: "0998 250 9393",
    href: "tel:+989982509393",
    display: (v: string) => toFaDigits(v),
    copyable: true,
    external: false,
    description: "پاسخگویی در ساعات کاری",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "email",
    icon: Mail,
    title: "ایمیل",
    value: "sepandtan@gmail.com",
    href: "mailto:sepandtan@gmail.com",
    display: (v: string) => v,
    copyable: true,
    external: false,
    description: "پاسخ حداکثر تا ۲۴ ساعت",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "instagram",
    icon: Instagram,
    title: "اینستاگرام",
    value: "@sepandtan",
    href: "https://ig.me/m/sepandtan",
    display: (v: string) => v,
    copyable: false,
    external: true,
    description: "پیام مستقیم در دایرکت",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    key: "address",
    icon: MapPin,
    title: "آدرس",
    value: "گیلان، بندر کیاشهر",
    href: null,
    display: (v: string) => v,
    copyable: false,
    external: false,
    description: "دفتر مرکزی سپندتن",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Copy button                                                                */
/* -------------------------------------------------------------------------- */

const CopyButton: React.FC<{ text: string; label: string }> = ({
  text,
  label,
}) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard not available — silent fail is fine here
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "کپی شد" : `کپی ${label}`}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        copied
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground"
      }`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Contact card                                                               */
/* -------------------------------------------------------------------------- */

interface ContactCardProps {
  item: (typeof contactItems)[number];
}

const ContactCard: React.FC<ContactCardProps> = ({ item }) => {
  const Icon = item.icon;
  const actionable = !!item.href;

  const inner = (
    <div
      className={`group flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-200 ${
        actionable
          ? "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md motion-reduce:transform-none"
          : ""
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {item.title}
          </p>

          <div className="flex items-center gap-1">
            {item.copyable && (
              <CopyButton text={item.value} label={item.title} />
            )}
            {actionable && (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100"
                aria-hidden
              >
                {item.external ? (
                  <ExternalLink className="h-3.5 w-3.5" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </div>

        <LtrValue className="mt-0.5 text-sm font-semibold text-foreground">
          {item.display(item.value)}
        </LtrValue>

        <p className="mt-1 text-[11px] text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );

  if (!item.href) return inner;

  return (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      aria-label={`${item.title}: ${item.value}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {inner}
    </a>
  );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SupportPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const reduceMotion = useReducedMotion();

  const isPending =
    user?.roleStatus === "pending" ||
    user?.roleStatus === "rejected" ||
    user?.roleStatus === "suspended";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Header */}
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Headphones className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              پشتیبانی سپندتن
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {isPending
                ? "درخواست شما در حال بررسی است. در صورت نیاز با ما در ارتباط باشید."
                : "هر سوالی داری، ما اینجاییم."}
            </p>
          </header>

          {/* Pending banner — subtler than before */}
          {isPending && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium text-foreground">
                  وضعیت درخواست: در حال بررسی
                </p>
                <p className="mt-1 text-muted-foreground">
                  معمولاً بین ۱ تا ۳ روز کاری طول می‌کشد. بعد از تأیید از طریق
                  اعلان داخل اپ و ایمیل به شما خبر می‌دهیم.
                </p>
              </div>
            </div>
          )}

          {/* Contact grid */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => (
              <ContactCard key={item.key} item={item} />
            ))}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                اقدامات سریع
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                یکی از گزینه‌های زیر را انتخاب کنید
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="group w-full justify-between"
                onClick={() => router.push("/dashboard")}
              >
                بازگشت به داشبورد
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </Button>

              {isPending && (
                <Button
                  variant="outline"
                  className="group w-full justify-between"
                  onClick={() =>
                    router.push(`/role-pending?type=${user?.role || "coach"}`)
                  }
                >
                  مشاهده وضعیت درخواست
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                خروج از حساب کاربری
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Footer — no emoji */}
          <footer className="mt-8 space-y-1 text-center text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-1.5">
              <Clock className="h-3 w-3" />
              ساعات پاسخگویی تلفنی: شنبه تا چهارشنبه، ۹ تا ۱۷
            </p>
            <p>تیم پشتیبانی سپندتن همیشه در کنار شماست.</p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
