/* eslint-disable @next/next/no-html-link-for-pages */

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, Search, AlertCircle } from "lucide-react";
import "./globals.css";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container max-w-2xl">
        {/* آیکون و هدر */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-8xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ۴۰۴
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            صفحه‌ای که به دنبال آن بودید پیدا نشد!
          </h2>
        </div>

        {/* کارت اصلی */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              اوه! صفحه گم شده
            </CardTitle>
            <CardDescription className="text-center text-base">
              متأسفیم، صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
              ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه جابه‌جا شده باشد.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* باکس پیشنهادات */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-right">
                راه‌های پیشنهادی:
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-right">
                <li className="flex items-center gap-2 justify-start">
                  <span className="text-blue-500">•</span>
                  <span>آدرس صفحه را بررسی کنید</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <span className="text-blue-500">•</span>
                  <span>از منوی اصلی به صفحه مورد نظر بروید</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <span className="text-blue-500">•</span>
                  <span>با پشتیبانی تماس بگیرید</span>
                </li>
              </ul>
            </div>

            {/* دکمه‌های اقدام */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild variant="default" className="gap-2">
                <a href="/">
                  <Home className="w-4 h-4" />
                  بازگشت به صفحه اصلی
                </a>
              </Button>

              <Link
                href="/search"
                className={buttonVariants({ variant: "outline" })}
              >
                <Search className="w-4 h-4" />
                جستجو در سایت
              </Link>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-6 flex justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              اگر فکر می‌کنید این یک خطاست، لطفاً با تیم پشتیبانی تماس بگیرید
            </p>
          </CardFooter>
        </Card>

        {/* لینک‌های پرکاربرد */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              صفحه اصلی
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link
              href="/about"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              درباره ما
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link
              href="/contact"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              تماس با ما
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link
              href="/blog"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              وبلاگ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
