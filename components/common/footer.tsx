import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Instagram,
  X,
  Youtube,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Heart,
  Brain,
  Shield,
  Award,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { InstallPrompt } from "../pwa/install-prompt";

export default function Footer() {
  return (
    <footer className="bg-linear-to-b from-gray-900 to-black text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative bg-white rounded-full w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                {/* <Dumbbell className="h-8 w-8 text-primary relative z-10" /> */}
                <Image
                  src="/images/main-logo-removebg-preview.png"
                  alt="Logo Footer"
                  width={80}
                  height={80}
                  className="rounded-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  سپندتن
                </h2>
                <p className="text-sm text-gray-400">فیتنس با هوش مصنوعی</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              سپندتن اولین پلتفرم هوش مصنوعی فارسی برای تناسب اندام و سلامت.
              برنامه‌های شخصی‌سازی شده تغذیه و تمرین برای رسیدن به بهترین حالت
              جسمانی.
            </p>

            {/* App Download Buttons */}
            {/* App install – PWA، نه فروشگاه‌های native */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300">
                نصب اپلیکیشن
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                سپندتن را روی صفحه اصلی گوشی اضافه کن تا سریع‌تر به تمرین و رژیم
                دسترسی داشته باشی.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <InstallPrompt variant="footer" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              دسترسی سریع
            </h3>
            <ul className="space-y-3">
              {[
                { name: "خانه", href: "/" },
                { name: "فروشگاه", href: "/store" },
                { name: "حرکات", href: "/workouts" },
                { name: "هوش مصنوعی", href: "/ai" },
                { name: "درباره ما", href: "/about" },
                { name: "تماس با ما", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              ویژگی‌های منحصربفرد
            </h3>
            <ul className="space-y-4">
              {[
                {
                  icon: <Brain className="h-4 w-4 text-primary" />,
                  text: "مربی هوش مصنوعی فارسی",
                },
                {
                  icon: <Shield className="h-4 w-4 text-primary" />,
                  text: "تضمین بازگشت وجه",
                },
                {
                  icon: <Users className="h-4 w-4 text-primary" />,
                  text: "جامعه‌ی فعال ورزشی",
                },
                {
                  icon: <Clock className="h-4 w-4 text-primary" />,
                  text: "پشتیبانی ۲۴ ساعته",
                },
                {
                  icon: <Heart className="h-4 w-4 text-primary" />,
                  text: "برنامه سلامت قلب",
                },
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1">{feature.icon}</div>
                  <span className="text-gray-300 text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              عضویت در خبرنامه
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              برای دریافت جدیدترین نکات سلامت و تخفیف‌های ویژه، ایمیل خود را
              وارد کنید.
            </p>

            <div className="mb-8">
              <form className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="ایمیل شما"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  dir="ltr"
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  عضویت
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                با عضویت، با{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  قوانین حریم خصوصی
                </Link>{" "}
                موافقت می‌کنید.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">09982509393</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">
                  sepandtan@gmail.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">
                  گیلان، بندر کیاشهر
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Media */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">ما را دنبال کنید:</p>
            <div className="flex gap-3">
              {[
                {
                  icon: <Instagram className="h-5 w-5" />,
                  href: "https://instagram.com/sepandtan",
                  label: "اینستاگرام",
                },
                {
                  icon: <Facebook className="h-5 w-5" />,
                  href: "#",
                  label: "فیس‌بوک",
                },
                {
                  icon: <X className="h-5 w-5" />,
                  href: "#",
                  label: "توییتر",
                },
                {
                  icon: <Youtube className="h-5 w-5" />,
                  href: "#",
                  label: "یوتیوب",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 bg-gray-800 hover:bg-primary rounded-full transition-colors duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright & Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span>© {new Date().getFullYear()}</span>
              <span className="font-semibold text-primary">سپندتن</span>
              <span>همه حقوق محفوظ است.</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                حریم خصوصی
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                قوانین و مقررات
              </Link>
              <Link
                href="/faq"
                className="hover:text-primary transition-colors"
              >
                سوالات متداول
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-900/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">امنیت بالا</div>
                <div className="text-xs text-gray-400">
                  اطلاعات شما محفوظ است
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Award className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">تضمین کیفیت</div>
                <div className="text-xs text-gray-400">رضایت ۹۸٪ کاربران</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">جامعه بزرگ</div>
                <div className="text-xs text-gray-400">۵۰,۰۰۰+ کاربر فعال</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">پشتیبانی دائمی</div>
                <div className="text-xs text-gray-400">۲۴/۷ همراه شما</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
